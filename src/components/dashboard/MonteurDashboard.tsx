import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format, addDays, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wrench,
  CalendarDays,
  ShieldCheck,
  LifeBuoy,
  Smartphone,
  MapPin,
  ArrowRight,
} from "lucide-react";
import InstallatieStatusBadge from "@/components/installaties/InstallatieStatusBadge";
import type { InstallatieStatus } from "@/components/installaties/status";

interface InstallatieRij {
  id: string;
  installatienummer: string | null;
  consument_naam: string | null;
  werkadres: string | null;
  klant_adres: string | null;
  geplande_startdatum: string | null;
  status: string;
}

interface OpenOpleverRij {
  id: string;
  rapportnummer: string | null;
  status: string;
  installatie_id: string | null;
}

interface TicketRij {
  id: string;
  ticketnummer: string;
  titel: string;
  status: string;
  prioriteit: string;
}

const MonteurDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const userId = profile?.id;

  const today = format(new Date(), "yyyy-MM-dd");
  const in7 = format(addDays(new Date(), 7), "yyyy-MM-dd");

  const { data: vandaag = [] } = useQuery({
    queryKey: ["monteur-vandaag", userId, today],
    queryFn: async () => {
      const { data } = await supabase
        .from("installaties")
        .select("id, installatienummer, consument_naam, werkadres, klant_adres, geplande_startdatum, status")
        .eq("installateur_id", userId!)
        .gte("geplande_startdatum", today)
        .lte("geplande_startdatum", today)
        .order("geplande_startdatum", { ascending: true });
      return (data ?? []) as InstallatieRij[];
    },
    enabled: !!userId,
  });

  const { data: komende = [] } = useQuery({
    queryKey: ["monteur-komende", userId, today, in7],
    queryFn: async () => {
      const { data } = await supabase
        .from("installaties")
        .select("id, installatienummer, consument_naam, werkadres, klant_adres, geplande_startdatum, status")
        .eq("installateur_id", userId!)
        .gt("geplande_startdatum", today)
        .lte("geplande_startdatum", in7)
        .order("geplande_startdatum", { ascending: true });
      return (data ?? []) as InstallatieRij[];
    },
    enabled: !!userId,
  });

  const { data: openOplever = [] } = useQuery({
    queryKey: ["monteur-open-oplever", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("opleverrapporten")
        .select("id, rapportnummer, status, installatie_id, installateur_id")
        .eq("installateur_id", userId!)
        .neq("status", "verzonden")
        .order("updated_at", { ascending: false })
        .limit(8);
      return (data ?? []) as OpenOpleverRij[];
    },
    enabled: !!userId,
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ["monteur-tickets", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("helpdesk_tickets")
        .select("id, ticketnummer, titel, status, prioriteit")
        .eq("toegewezen_aan", userId!)
        .not("status", "in", "(opgelost,gesloten)")
        .order("created_at", { ascending: false })
        .limit(8);
      return (data ?? []) as TicketRij[];
    },
    enabled: !!userId,
  });

  const renderInstallatieKaart = (i: InstallatieRij) => {
    const adres = i.werkadres ?? i.klant_adres ?? "";
    const tijd = i.geplande_startdatum
      ? format(parseISO(i.geplande_startdatum), "EEE d MMM HH:mm", { locale: nl })
      : "—";
    return (
      <div
        key={i.id}
        className="flex items-center gap-3 py-2.5 border-b border-border last:border-0"
      >
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Wrench className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {i.consument_naam ?? i.installatienummer ?? "Installatie"}
          </p>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{adres || "geen adres"}</span>
            <span className="ml-1 whitespace-nowrap">• {tijd}</span>
          </p>
        </div>
        <InstallatieStatusBadge status={i.status as InstallatieStatus} />
        <Button
          size="icon"
          variant="ghost"
          aria-label="Naar werkscherm"
          onClick={() => navigate(`/installaties/${i.id}/werk`)}
        >
          <Smartphone className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const eersteVandaag = vandaag[0];

  return (
    <div className="space-y-4">
      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          className="gap-2"
          onClick={() =>
            eersteVandaag
              ? navigate(`/installaties/${eersteVandaag.id}/werk`)
              : navigate("/installaties")
          }
        >
          <Smartphone className="h-4 w-4" />
          {eersteVandaag ? "Naar werkscherm vandaag" : "Mijn installaties"}
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => navigate("/opleveringen/nieuw")}
        >
          <ShieldCheck className="h-4 w-4" />
          Nieuw opleverrapport
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => navigate("/helpdesk/tickets/nieuw?bron=monteur")}
        >
          <LifeBuoy className="h-4 w-4" />
          Ticket aanmaken
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" /> Vandaag
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vandaag.length === 0 ? (
              <p className="text-sm text-muted-foreground">Geen installaties vandaag.</p>
            ) : (
              <div>{vandaag.map(renderInstallatieKaart)}</div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" /> Komende 7 dagen
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/installaties")} className="gap-1">
                Alles <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {komende.length === 0 ? (
              <p className="text-sm text-muted-foreground">Geen geplande installaties.</p>
            ) : (
              <div>{komende.slice(0, 6).map(renderInstallatieKaart)}</div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Open opleverrapporten
            </CardTitle>
          </CardHeader>
          <CardContent>
            {openOplever.length === 0 ? (
              <p className="text-sm text-muted-foreground">Geen openstaande rapporten.</p>
            ) : (
              <div>
                {openOplever.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => navigate(`/opleveringen/${r.id}`)}
                    className="w-full text-left flex items-center gap-3 py-2.5 border-b border-border last:border-0 hover:bg-muted/40 rounded-md px-1"
                  >
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {r.rapportnummer ?? "Opleverrapport"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{r.status}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <LifeBuoy className="h-4 w-4 text-primary" /> Mijn tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">Geen openstaande tickets.</p>
            ) : (
              <div>
                {tickets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => navigate(`/helpdesk/tickets/${t.id}`)}
                    className="w-full text-left flex items-center gap-3 py-2.5 border-b border-border last:border-0 hover:bg-muted/40 rounded-md px-1"
                  >
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <LifeBuoy className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.titel}</p>
                      <p className="text-[11px] text-muted-foreground">{t.ticketnummer} • {t.status}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{t.prioriteit}</Badge>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MonteurDashboard;