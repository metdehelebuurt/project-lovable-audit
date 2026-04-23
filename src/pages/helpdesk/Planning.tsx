import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Clock, User, Calendar } from "lucide-react";
import { ServiceBezoekDialog } from "@/components/helpdesk/ServiceBezoekDialog";
import type { HelpdeskTicket } from "@/hooks/helpdesk/useTickets";

type OpenTicket = HelpdeskTicket & {
  klant_postcode?: string | null;
  klant_adres?: string | null;
  klant_plaats?: string | null;
  klant_naam?: string | null;
};

type Bezoek = {
  id: string;
  monteur_id: string | null;
  geplande_datum: string | null;
  geplande_tijd: string | null;
  geschatte_duur_minuten: number | null;
  ticket_id: string;
};

type Monteur = { id: string; voornaam: string; achternaam: string };

function regioVan(postcode: string | null | undefined): string {
  if (!postcode) return "??";
  const m = postcode.replace(/\s/g, "").match(/^(\d{2})/);
  return m ? m[1] : "??";
}

export default function HelpdeskPlanning() {
  const { profile } = useAuth();
  const partnerId = profile?.partner_id;
  const [datumFilter, setDatumFilter] = useState<"vandaag" | "morgen" | "week">("vandaag");
  const [regioFilter, setRegioFilter] = useState<string>("");
  const [prioFilter, setPrioFilter] = useState<string>("alle");

  const datumRange = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const eind = new Date(start);
    if (datumFilter === "morgen") {
      start.setDate(start.getDate() + 1);
      eind.setDate(eind.getDate() + 2);
    } else if (datumFilter === "week") {
      eind.setDate(eind.getDate() + 7);
    } else {
      eind.setDate(eind.getDate() + 1);
    }
    return { start: start.toISOString().slice(0, 10), eind: eind.toISOString().slice(0, 10) };
  }, [datumFilter]);

  const { data: openTickets = [] } = useQuery({
    queryKey: ["helpdesk-planning-tickets", partnerId, prioFilter],
    enabled: !!partnerId,
    queryFn: async () => {
      let q = supabase
        .from("helpdesk_tickets")
        .select("*, klanten:klant_id(voornaam, achternaam, postcode, adres, plaats)")
        .eq("partner_id", partnerId!)
        .in("status", ["nieuw", "in_behandeling", "wacht_op_intern", "wacht_op_onderdeel"])
        .order("prioriteit", { ascending: false })
        .order("created_at", { ascending: false });
      if (prioFilter !== "alle") q = q.eq("prioriteit", prioFilter as never);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((t) => {
        const k = (t as { klanten?: { voornaam?: string; achternaam?: string; postcode?: string; adres?: string; plaats?: string } | null }).klanten;
        return {
          ...(t as HelpdeskTicket),
          klant_postcode: k?.postcode ?? null,
          klant_adres: k?.adres ?? null,
          klant_plaats: k?.plaats ?? null,
          klant_naam: k ? `${k.voornaam ?? ""} ${k.achternaam ?? ""}`.trim() : null,
        } as OpenTicket;
      });
    },
  });

  const { data: monteurs = [] } = useQuery({
    queryKey: ["helpdesk-planning-monteurs", partnerId],
    enabled: !!partnerId,
    queryFn: async () => {
      const { data } = await supabase
        .from("users")
        .select("id, voornaam, achternaam")
        .eq("partner_id", partnerId!)
        .in("rol", ["installateur", "partner_staff"]);
      return (data ?? []) as Monteur[];
    },
  });

  const { data: bezoeken = [] } = useQuery({
    queryKey: ["helpdesk-planning-bezoeken", partnerId, datumRange],
    enabled: !!partnerId,
    queryFn: async () => {
      const { data } = await supabase
        .from("helpdesk_service_bezoeken")
        .select("id, monteur_id, geplande_datum, geplande_tijd, geschatte_duur_minuten, ticket_id")
        .eq("partner_id", partnerId!)
        .gte("geplande_datum", datumRange.start)
        .lt("geplande_datum", datumRange.eind);
      return (data ?? []) as Bezoek[];
    },
  });

  const ticketsPerRegio = useMemo(() => {
    const map: Record<string, OpenTicket[]> = {};
    for (const t of openTickets) {
      const r = regioVan(t.klant_postcode);
      if (regioFilter && r !== regioFilter) continue;
      (map[r] ??= []).push(t);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [openTickets, regioFilter]);

  const bezoekenPerMonteur = useMemo(() => {
    const map: Record<string, Bezoek[]> = {};
    for (const b of bezoeken) {
      if (!b.monteur_id) continue;
      (map[b.monteur_id] ??= []).push(b);
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => (a.geplande_tijd ?? "").localeCompare(b.geplande_tijd ?? ""));
    }
    return map;
  }, [bezoeken]);

  const prioKleur = (prio: string) => {
    if (prio === "urgent") return "bg-destructive/15 text-destructive border-destructive/30";
    if (prio === "hoog") return "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30";
    if (prio === "normaal") return "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Helpdesk planning</h1>
          <p className="text-sm text-muted-foreground">Open tickets per regio en monteurplanning naast elkaar</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={datumFilter} onValueChange={(v) => setDatumFilter(v as typeof datumFilter)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="vandaag">Vandaag</SelectItem>
              <SelectItem value="morgen">Morgen</SelectItem>
              <SelectItem value="week">Deze week</SelectItem>
            </SelectContent>
          </Select>
          <Select value={prioFilter} onValueChange={setPrioFilter}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle prioriteit</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="hoog">Hoog</SelectItem>
              <SelectItem value="normaal">Normaal</SelectItem>
              <SelectItem value="laag">Laag</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Regio (bijv. 36)"
            value={regioFilter}
            onChange={(e) => setRegioFilter(e.target.value.replace(/\D/g, "").slice(0, 2))}
            className="w-32"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Open tickets per regio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ticketsPerRegio.length === 0 && (
              <p className="text-sm text-muted-foreground">Geen open tickets gevonden.</p>
            )}
            {ticketsPerRegio.map(([regio, tickets]) => (
              <div key={regio}>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Regio {regio}xx · {tickets.length} ticket(s)</p>
                <ul className="space-y-2">
                  {tickets.map((t) => (
                    <li key={t.id} className="border rounded-lg p-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <Link to={`/helpdesk/tickets/${t.id}`} className="text-sm font-medium hover:underline truncate block">
                            {t.ticketnummer} · {t.titel}
                          </Link>
                          {t.klant_naam && (
                            <p className="text-xs text-muted-foreground mt-0.5">{t.klant_naam}</p>
                          )}
                          {(t.klant_adres || t.klant_postcode) && (
                            <p className="text-xs text-muted-foreground">
                              {[t.klant_adres, t.klant_postcode, t.klant_plaats].filter(Boolean).join(", ")}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <Badge variant="outline" className={prioKleur(t.prioriteit)}>{t.prioriteit}</Badge>
                            {t.geschatte_duur_minuten ? (
                              <Badge variant="outline" className="gap-1">
                                <Clock className="h-3 w-3" /> {t.geschatte_duur_minuten} min
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                        <ServiceBezoekDialog
                          ticket={t}
                          type="service_bezoek"
                          trigger={<Button size="sm" variant="outline">Inplannen</Button>}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Monteurplanning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {monteurs.length === 0 && (
              <p className="text-sm text-muted-foreground">Geen monteurs gevonden.</p>
            )}
            {monteurs.map((m) => {
              const lijst = bezoekenPerMonteur[m.id] ?? [];
              const totaalMin = lijst.reduce((s, b) => s + (b.geschatte_duur_minuten ?? 60), 0);
              return (
                <div key={m.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {m.voornaam} {m.achternaam}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {lijst.length} bezoek(en) · ~{Math.round(totaalMin / 60 * 10) / 10}u
                    </span>
                  </div>
                  {lijst.length === 0 ? (
                    <p className="text-xs text-muted-foreground mt-2 italic">Geen bezoeken gepland</p>
                  ) : (
                    <ul className="mt-2 space-y-1">
                      {lijst.map((b) => (
                        <li key={b.id} className="text-xs flex items-center gap-2">
                          <span className="font-mono text-muted-foreground">{b.geplande_tijd ?? "—"}</span>
                          <Link to={`/helpdesk/tickets/${b.ticket_id}`} className="hover:underline">Ticket</Link>
                          {b.geschatte_duur_minuten && <span className="text-muted-foreground">· {b.geschatte_duur_minuten} min</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}