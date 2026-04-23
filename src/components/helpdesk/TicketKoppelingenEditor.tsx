import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link as LinkIcon, X, User, Target, Wrench, Receipt, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateTicket, type HelpdeskTicket } from "@/hooks/helpdesk/useTickets";
import { toast } from "sonner";

type Koppeling = {
  veld: "klant_id" | "lead_id" | "opdracht_id" | "installatie_id" | "factuur_id";
  label: string;
  icon: typeof User;
  href: (id: string) => string;
};

const VELDEN: Koppeling[] = [
  { veld: "klant_id", label: "Klant", icon: User, href: (id) => `/klanten/${id}` },
  { veld: "lead_id", label: "Lead", icon: Target, href: (id) => `/leads/${id}` },
  { veld: "opdracht_id", label: "Opdracht", icon: Wrench, href: (id) => `/opdrachten/${id}` },
  { veld: "installatie_id", label: "Installatie", icon: Wrench, href: () => `/installaties` },
  { veld: "factuur_id", label: "Factuur", icon: Receipt, href: (id) => `/financieel/${id}` },
];

type ZoekResultaat = { id: string; naam: string };

export default function TicketKoppelingenEditor({ ticket }: { ticket: HelpdeskTicket }) {
  const { profile } = useAuth();
  const update = useUpdateTicket();
  const [actief, setActief] = useState<Koppeling["veld"] | null>(null);
  const [zoekterm, setZoekterm] = useState("");

  const partnerId = profile?.partner_id;

  const { data: resultaten = [], isFetching } = useQuery({
    queryKey: ["ticket-koppeling-zoek", actief, zoekterm, partnerId],
    enabled: !!actief && !!partnerId && zoekterm.trim().length >= 2,
    queryFn: async (): Promise<ZoekResultaat[]> => {
      const safe = zoekterm.replace(/[,()%*]/g, " ").trim();
      if (!safe || !actief || !partnerId) return [];
      if (actief === "klant_id") {
        const { data } = await supabase.from("klanten")
          .select("id, voornaam, achternaam, bedrijfsnaam, email")
          .eq("partner_id", partnerId)
          .or(`voornaam.ilike.%${safe}%,achternaam.ilike.%${safe}%,bedrijfsnaam.ilike.%${safe}%,email.ilike.%${safe}%`)
          .limit(10);
        return (data ?? []).map((k) => ({
          id: k.id,
          naam: k.bedrijfsnaam || `${k.voornaam ?? ""} ${k.achternaam ?? ""}`.trim() || k.email || "—",
        }));
      }
      if (actief === "lead_id") {
        const { data } = await supabase.from("leads")
          .select("id, voornaam, achternaam, email")
          .eq("partner_id", partnerId)
          .or(`voornaam.ilike.%${safe}%,achternaam.ilike.%${safe}%,email.ilike.%${safe}%`)
          .limit(10);
        return (data ?? []).map((l) => ({
          id: l.id,
          naam: `${l.voornaam ?? ""} ${l.achternaam ?? ""}`.trim() || l.email || "Lead",
        }));
      }
      if (actief === "opdracht_id") {
        const { data } = await supabase.from("opdrachten" as never)
          .select("id, opdrachtnummer, klant_naam")
          .eq("partner_id", partnerId)
          .or(`opdrachtnummer.ilike.%${safe}%,klant_naam.ilike.%${safe}%`)
          .limit(10);
        return ((data ?? []) as Array<{ id: string; opdrachtnummer: string | null; klant_naam: string | null }>).map((o) => ({
          id: o.id,
          naam: `${o.opdrachtnummer ?? "Opdracht"} · ${o.klant_naam ?? ""}`.trim(),
        }));
      }
      if (actief === "installatie_id") {
        const { data } = await supabase.from("installaties")
          .select("id, installatienummer, consument_naam")
          .eq("partner_id", partnerId)
          .or(`installatienummer.ilike.%${safe}%,consument_naam.ilike.%${safe}%`)
          .limit(10);
        return (data ?? []).map((i) => ({
          id: i.id,
          naam: `${i.installatienummer ?? "Installatie"} · ${i.consument_naam ?? ""}`.trim(),
        }));
      }
      if (actief === "factuur_id") {
        const { data } = await supabase.from("financiele_documenten")
          .select("id, documentnummer")
          .eq("partner_id", partnerId)
          .ilike("documentnummer", `%${safe}%`)
          .limit(10);
        return (data ?? []).map((f) => ({ id: f.id, naam: f.documentnummer }));
      }
      return [];
    },
  });

  const koppel = async (veld: Koppeling["veld"], id: string | null) => {
    try {
      await update.mutateAsync({ id: ticket.id, [veld]: id } as never);
      setActief(null);
      setZoekterm("");
    } catch (e) {
      toast.error(`Koppelen mislukt: ${(e as Error).message}`);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-semibold flex items-center gap-2"><LinkIcon className="h-4 w-4" /> Koppelingen</h2>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {VELDEN.map((v) => {
          const id = ticket[v.veld];
          const Icon = v.icon;
          return (
            <div key={v.veld} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Badge variant="outline" className="text-[10px]">{v.label}</Badge>
                </div>
                {id ? (
                  <Button variant="ghost" size="sm" onClick={() => koppel(v.veld, null)} disabled={update.isPending}>
                    <X className="h-3 w-3 mr-1" /> Ontkoppelen
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => { setActief(v.veld); setZoekterm(""); }}>
                    Koppelen
                  </Button>
                )}
              </div>
              {id && (
                <Link to={v.href(id)} className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                  Openen <ExternalLink className="h-3 w-3" />
                </Link>
              )}
              {actief === v.veld && (
                <div className="space-y-2 pt-2 border-t">
                  <Label className="text-xs">Zoek {v.label.toLowerCase()}…</Label>
                  <Input autoFocus value={zoekterm} onChange={(e) => setZoekterm(e.target.value)} placeholder="Min. 2 tekens" />
                  {isFetching && <p className="text-xs text-muted-foreground">Zoeken…</p>}
                  {!isFetching && zoekterm.length >= 2 && resultaten.length === 0 && (
                    <p className="text-xs text-muted-foreground">Geen resultaten.</p>
                  )}
                  <ul className="max-h-48 overflow-auto divide-y rounded border">
                    {resultaten.map((r) => (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => koppel(v.veld, r.id)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                        >
                          {r.naam}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <Button variant="ghost" size="sm" onClick={() => { setActief(null); setZoekterm(""); }}>Annuleren</Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}