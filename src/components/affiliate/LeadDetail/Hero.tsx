import { useMemo } from "react";
import { Phone, Mail, MessageCircle, Globe, MoreHorizontal, Presentation, FileCheck2, Sparkles, Wand2, CalendarPlus, Tag, Star, Flame, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { STATUS_KLEUR, STATUS_LABEL, type AffiliateLeadStatus } from "@/lib/affiliate/leadStatus";
import { telLink, whatsappLink } from "@/lib/affiliate/contact";
import type { AffiliateLead } from "@/hooks/affiliate/useAffiliateLeads";
import { TrialStatusBadge } from "../TrialStatusBadge";
import type { TijdlijnItem } from "./Tijdlijn/useLeadTijdlijn";
import { cn } from "@/lib/utils";

const TEMP_KLEUR: Record<string, string> = {
  koud: "bg-slate-100 text-slate-700",
  lauw: "bg-amber-100 text-amber-800",
  warm: "bg-orange-100 text-orange-800",
  heet: "bg-rose-100 text-rose-800",
};

const TEMP_ACCENT: Record<string, string> = {
  koud: "bg-slate-400",
  lauw: "bg-amber-400",
  warm: "bg-orange-500",
  heet: "bg-rose-500",
};

interface Props {
  lead: AffiliateLead;
  bronLabel: string | null;
  tijdlijn: TijdlijnItem[];
  gewonnenPartnerId: string | null;
  trialEinddatum: string | null;
  onActie: (a: "terugbel" | "demo" | "order" | "verrijken" | "ai") => void;
}

/** Rijke hero met KPI's en geprioriteerde acties. */
export function LeadDetailHero({ lead, bronLabel, tijdlijn, gewonnenPartnerId, trialEinddatum, onActie }: Props) {
  const status = lead.status as AffiliateLeadStatus;
  const tel = telLink(lead.telefoon);
  const wa = whatsappLink(lead.telefoon);

  const kpis = useMemo(() => berekenKpis(lead, tijdlijn), [lead, tijdlijn]);
  const deadlineKleur = kleurVoorDeadline(lead.volgende_actie_datum);
  const accent = TEMP_ACCENT[lead.temperatuur ?? "lauw"] ?? "bg-slate-400";

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card p-4 sm:p-5 space-y-3 min-w-0">
      <span className={cn("absolute left-0 top-0 bottom-0 w-1.5", accent)} aria-hidden />
      <div className="flex flex-wrap items-start justify-between gap-3 pl-2">
        <div className="min-w-0 space-y-1.5 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold leading-tight truncate">{lead.bedrijfsnaam}</h1>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge className={STATUS_KLEUR[status]}>{STATUS_LABEL[status]}</Badge>
            {lead.temperatuur && (
              <Badge variant="outline" className={TEMP_KLEUR[lead.temperatuur] ?? ""}>
                <Flame className="h-3 w-3 mr-1" />{lead.temperatuur}
              </Badge>
            )}
            {bronLabel && (
              <Badge variant="outline"><Tag className="h-3 w-3 mr-1" />{bronLabel}</Badge>
            )}
            {typeof lead.ai_score === "number" && (
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/30">
                <Star className="h-3 w-3 mr-1" />AI {lead.ai_score}/100
              </Badge>
            )}
            {gewonnenPartnerId && <TrialStatusBadge trialEinddatum={trialEinddatum} />}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 justify-end shrink-0">
          {tel && (
            <Button asChild size="sm">
              <a href={tel}><Phone className="h-4 w-4 mr-1.5" />Bel</a>
            </Button>
          )}
          {lead.email && (
            <Button asChild size="sm" variant="outline">
              <a href={`mailto:${lead.email}`}><Mail className="h-4 w-4 mr-1.5" />Mail</a>
            </Button>
          )}
          {wa && (
            <Button asChild size="sm" variant="outline" className="text-emerald-700 border-emerald-300">
              <a href={wa} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4 mr-1.5" />WhatsApp</a>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline"><MoreHorizontal className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Meer</span></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => onActie("terugbel")}>
                <CalendarPlus className="h-4 w-4 mr-2" /> Terugbel inplannen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onActie("demo")}>
                <Presentation className="h-4 w-4 mr-2" /> Demo plannen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onActie("order")} disabled={!lead.email}>
                <FileCheck2 className="h-4 w-4 mr-2" /> Order bevestigen
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onActie("ai")}>
                <Wand2 className="h-4 w-4 mr-2" /> AI-opvolging openen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onActie("verrijken")}>
                <Sparkles className="h-4 w-4 mr-2" /> Verrijken met AI
              </DropdownMenuItem>
              {lead.website && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer">
                      <Globe className="h-4 w-4 mr-2" /> Website openen
                    </a>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="pl-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
        <Kpi label="Waarde" value={kpis.waarde} kleur="text-emerald-700" />
        <span className="text-border">·</span>
        <Kpi label="Stil sinds" value={kpis.stil} kleur={kpis.stilTextKleur} />
        <span className="text-border">·</span>
        <Kpi label="E-mails" value={String(kpis.mails)} kleur="text-purple-700" />
        <span className="text-border">·</span>
        <Kpi label="Contact" value={String(kpis.contact)} kleur="text-blue-700" />
        <span className="text-border">·</span>
        <span className="text-xs text-muted-foreground">
          aangemaakt {dagenGeleden(lead.created_at)} dgn geleden
        </span>
      </div>

      {lead.volgende_actie_datum && (
        <div className={cn("ml-2 rounded-lg border px-3 py-1.5 text-sm flex items-center gap-2", deadlineKleur)}>
          <Clock className="h-4 w-4" />
          <span className="font-medium">Volgende actie</span>
          <span>{new Date(lead.volgende_actie_datum).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "short" })}</span>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, kleur }: { label: string; value: string; kleur?: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={cn("font-semibold", kleur)}>{value}</span>
    </span>
  );
}

function berekenKpis(lead: AffiliateLead, tijdlijn: TijdlijnItem[]) {
  const mails = tijdlijn.filter((i) => i.type === "mail_in" || i.type === "mail_uit").length;
  const contact = tijdlijn.filter((i) => i.type === "contactmoment").length;
  const laatste = tijdlijn.find((i) => i.type === "contactmoment" || i.type === "mail_in" || i.type === "mail_uit");
  const stilDgn = laatste ? dagenGeleden(laatste.datum) : dagenGeleden(lead.created_at);
  const stil = laatste ? `${stilDgn} dgn` : "Nooit";
  const stilTextKleur = stilDgn > 14 ? "text-rose-700" : stilDgn > 7 ? "text-amber-700" : "text-slate-700";
  const waarde = lead.geschatte_waarde
    ? new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(Number(lead.geschatte_waarde))
    : "—";
  return { waarde, stil, stilTextKleur, mails, contact };
}

function dagenGeleden(datum: string | null | undefined): number {
  if (!datum) return 0;
  const ms = Date.now() - new Date(datum).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

function kleurVoorDeadline(datum: string | null | undefined): string {
  if (!datum) return "border-border bg-muted/20";
  const d = new Date(datum).getTime();
  const nu = Date.now();
  const diff = (d - nu) / 86_400_000;
  if (diff < 0) return "border-rose-200 bg-rose-50";
  if (diff < 2) return "border-amber-200 bg-amber-50";
  return "border-emerald-200 bg-emerald-50";
}