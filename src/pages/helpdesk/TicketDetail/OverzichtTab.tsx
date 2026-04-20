import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, User, FileText, Wrench, Receipt, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { HelpdeskTicket } from "@/hooks/helpdesk/useTickets";

type Linkje = { label: string; naam: string; href: string };

function useKoppelingen(ticket: HelpdeskTicket) {
  return useQuery({
    queryKey: ["ticket-koppelingen", ticket.id],
    queryFn: async () => {
      const links: Linkje[] = [];

      if (ticket.klant_id) {
        const { data } = await supabase.from("klanten")
          .select("id, voornaam, achternaam, bedrijfsnaam").eq("id", ticket.klant_id).maybeSingle();
        if (data) {
          const naam = data.bedrijfsnaam || `${data.voornaam ?? ""} ${data.achternaam ?? ""}`.trim();
          links.push({ label: "Klant", naam, href: `/klanten/${data.id}` });
        }
      }
      if (ticket.lead_id) {
        const { data } = await supabase.from("leads")
          .select("id, voornaam, achternaam").eq("id", ticket.lead_id).maybeSingle();
        if (data) {
          links.push({ label: "Lead", naam: `${data.voornaam ?? ""} ${data.achternaam ?? ""}`.trim() || "Lead", href: `/leads/${data.id}` });
        }
      }
      if (ticket.opdracht_id) {
        const { data } = await supabase.from("opdrachten" as never)
          .select("id, klant_naam").eq("id", ticket.opdracht_id).maybeSingle();
        if (data) {
          const o = data as { id: string; klant_naam: string | null };
          links.push({ label: "Opdracht", naam: o.klant_naam || "Opdracht", href: `/opdrachten/${o.id}` });
        }
      }
      if (ticket.installatie_id) {
        const { data } = await supabase.from("installaties")
          .select("id, consument_naam").eq("id", ticket.installatie_id).maybeSingle();
        if (data) {
          links.push({ label: "Installatie", naam: data.consument_naam || "Installatie", href: `/installaties` });
        }
      }
      if (ticket.factuur_id) {
        const { data } = await supabase.from("financiele_documenten")
          .select("id, documentnummer").eq("id", ticket.factuur_id).maybeSingle();
        if (data) {
          links.push({ label: "Factuur", naam: data.documentnummer, href: `/financieel/${data.id}` });
        }
      }
      return links;
    },
  });
}

const ICONEN: Record<string, typeof User> = {
  Klant: User,
  Lead: Target,
  Opdracht: Wrench,
  Installatie: Wrench,
  Factuur: Receipt,
};

export default function OverzichtTab({ ticket }: { ticket: HelpdeskTicket }) {
  const { data: links = [], isLoading } = useKoppelingen(ticket);

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card className="p-6 space-y-3">
        <h2 className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4" /> Probleemomschrijving</h2>
        {ticket.omschrijving
          ? <p className="text-sm whitespace-pre-wrap">{ticket.omschrijving}</p>
          : <p className="text-sm text-muted-foreground">Geen omschrijving.</p>}
      </Card>

      <Card className="p-6 space-y-3">
        <h2 className="font-semibold">Productcontext</h2>
        <Row label="Categorie" value={ticket.product_categorie} />
        <Row label="Merk" value={ticket.product_merk} />
        <Row label="Type" value={ticket.product_type} />
        <Row label="Installatiejaar" value={ticket.product_installatiejaar?.toString()} />
        <Row label="Foutcode" value={ticket.foutcode} />
      </Card>

      <Card className="p-6 space-y-3 lg:col-span-2">
        <h2 className="font-semibold">Koppelingen</h2>
        {isLoading && <p className="text-sm text-muted-foreground">Laden…</p>}
        {!isLoading && links.length === 0 && <p className="text-sm text-muted-foreground">Geen gekoppelde records.</p>}
        {!isLoading && links.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-3">
            {links.map((l, i) => {
              const Icon = ICONEN[l.label] ?? User;
              return (
                <Link key={i} to={l.href}
                  className="group flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Badge variant="outline" className="text-[10px] mb-1">{l.label}</Badge>
                    <p className="text-sm font-medium truncate">{l.naam}</p>
                  </div>
                  <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between text-sm border-b border-border last:border-0 pb-2 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}