import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Activity, UserPlus, Send, Phone, Tag, Clock } from "lucide-react";
import { useAffiliateGebruikers } from "@/hooks/sales/useDoorzetten";
import { FASE_LABEL, type SalesFase } from "@/lib/sales/faseLabels";
import type { SalesLead } from "@/hooks/sales/useSalesLeads";

interface TimelineEvent {
  date: string;
  icon: typeof Activity;
  label: string;
  detail?: string;
}

function fmt(d: string) {
  return new Date(d).toLocaleString("nl-NL", { dateStyle: "short", timeStyle: "short" });
}

export default function LeadTimeline({ lead }: { lead: SalesLead }) {
  const { data: affiliates } = useAffiliateGebruikers();

  const { data: contactmomenten = [] } = useQuery({
    queryKey: ["lead-contactmomenten", lead.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_lead_contactmomenten")
        .select("id, type, uitkomst, notitie, created_at")
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: historie = [] } = useQuery({
    queryKey: ["entiteit_historie", "lead", lead.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entiteit_historie")
        .select("id, actie, veld, oude_waarde, nieuwe_waarde, created_at")
        .eq("entiteit_type", "lead")
        .eq("entiteit_id", lead.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const eigenaarNaam = lead.eigenaar_id
    ? (affiliates ?? []).find((a) => a.id === lead.eigenaar_id)?.naam ?? "affiliate"
    : null;

  const events: TimelineEvent[] = [];

  if (lead.created_at) {
    events.push({
      date: lead.created_at,
      icon: UserPlus,
      label: "Lead aangemaakt",
      detail: lead.bron ? `Bron: ${lead.bron}` : undefined,
    });
  }

  if (lead.doorgezet_op) {
    events.push({
      date: lead.doorgezet_op,
      icon: Send,
      label: eigenaarNaam ? `Doorgezet naar ${eigenaarNaam}` : "In pool geplaatst",
    });
  } else if (lead.claimed_at) {
    events.push({
      date: lead.claimed_at,
      icon: Send,
      label: eigenaarNaam ? `Toegewezen aan ${eigenaarNaam}` : "Toegewezen",
    });
  }

  for (const c of contactmomenten) {
    events.push({
      date: c.created_at,
      icon: Phone,
      label: `Contactmoment: ${c.type ?? "overig"}`,
      detail: c.uitkomst ?? c.notitie ?? undefined,
    });
  }

  for (const h of historie) {
    if (h.veld === "sales_fase") {
      const oud = (h.oude_waarde ?? "") as SalesFase;
      const nieuw = (h.nieuwe_waarde ?? "") as SalesFase;
      events.push({
        date: h.created_at,
        icon: Tag,
        label: "Fase gewijzigd",
        detail: `${FASE_LABEL[oud] ?? oud ?? "—"} → ${FASE_LABEL[nieuw] ?? nieuw ?? "—"}`,
      });
    } else if (h.actie && h.actie !== "aangemaakt") {
      events.push({
        date: h.created_at,
        icon: Activity,
        label: h.actie.replace(/_/g, " "),
        detail: h.veld ?? undefined,
      });
    }
  }

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (events.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
        <Clock className="h-4 w-4 mx-auto mb-1 opacity-60" />
        Nog geen activiteit
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {events.map((e, i) => {
        const Icon = e.icon;
        return (
          <li key={i} className="flex gap-3 items-start border-l-2 border-border pl-3">
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 -ml-[1.05rem] mt-0.5 border-2 border-background">
              <Icon className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{e.label}</p>
              {e.detail && <p className="text-xs text-muted-foreground mt-0.5 break-words">{e.detail}</p>}
              <p className="text-[11px] text-muted-foreground mt-0.5">{fmt(e.date)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}