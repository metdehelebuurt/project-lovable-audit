import { useMemo } from "react";
import { Phone, Mail, MessageCircle, Globe, MoreHorizontal, Presentation, FileCheck2, Sparkles, Wand2, CalendarPlus, Tag, Star, Flame, Euro, Clock, Activity, MailOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { STATUS_KLEUR, STATUS_LABEL, type AffiliateLeadStatus } from "@/lib/affiliate/leadStatus";
import { telLink, whatsappLink } from "@/lib/affiliate/contact";
import type { AffiliateLead } from "@/hooks/affiliate/useAffiliateLeads";
import { TrialStartenButton } from "../TrialStartenButton";
import { TrialStatusBadge } from "../TrialStatusBadge";
import type { TijdlijnItem } from "./Tijdlijn/useLeadTijdlijn";

const TEMP_KLEUR: Record<string, string> = {
  koud: "bg-slate-100 text-slate-700",
  lauw: "bg-amber-100 text-amber-800",
  warm: "bg-orange-100 text-orange-800",
  heet: "bg-rose-100 text-rose-800",
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

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <h1 className="text-2xl font-bold leading-tight truncate">{lead.bedrijfsnaam}</h1>
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
          <p className="text-xs text-muted-foreground">
            {[lead.contactpersoon, lead.plaats, `aangemaakt ${dagenGeleden(lead.created_at)} dgn geleden`]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 justify-end">
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
              <Button size="sm" variant="outline"><MoreHorizontal className="h-4 w-4 mr-1" />Meer</Button>
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
          {!gewonnenPartnerId && <TrialStartenButton lead={lead} size="sm" />}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <KpiTegel icon={Euro} label="Waarde" value={kpis.waarde} />
        <KpiTegel icon={Clock} label="Stil sinds" value={kpis.stil} kleur={kpis.stilKleur} />
        <KpiTegel icon={MailOpen} label="E-mails" value={String(kpis.mails)} />
        <KpiTegel icon={Activity} label="Contactmomenten" value={String(kpis.contact)} />
      </div>

      {lead.volgende_actie_datum && (
        <div className={`rounded-lg border px-3 py-2 text-sm flex items-center gap-2 ${deadlineKleur}`}>
          <Clock className="h-4 w-4" />
          <span className="font-medium">Volgende actie</span>
          <span>{new Date(lead.volgende_actie_datum).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "short" })}</span>
          {/* notitie veld bestaat niet op deze tabel; weggelaten */}
        </div>
      )}
    </div>
  );
}

function KpiTegel({ icon: Icon, label, value, kleur }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; kleur?: string }) {
  return (
    <div className={`rounded-lg border bg-muted/30 px-3 py-2 ${kleur ?? ""}`}>
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" />{label}
      </div>
      <div className="text-lg font-semibold leading-tight mt-0.5">{value}</div>
    </div>
  );
}

function berekenKpis(lead: AffiliateLead, tijdlijn: TijdlijnItem[]) {
  const mails = tijdlijn.filter((i) => i.type === "mail_in" || i.type === "mail_uit").length;
  const contact = tijdlijn.filter((i) => i.type === "contactmoment").length;
  const laatste = tijdlijn.find((i) => i.type === "contactmoment" || i.type === "mail_in" || i.type === "mail_uit");
  const stilDgn = laatste ? dagenGeleden(laatste.datum) : dagenGeleden(lead.created_at);
  const stil = laatste ? `${stilDgn} dgn` : "Nooit";
  const stilKleur = stilDgn > 14 ? "border-rose-200 bg-rose-50/60" : stilDgn > 7 ? "border-amber-200 bg-amber-50/60" : "";
  const waarde = lead.geschatte_waarde
    ? new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(Number(lead.geschatte_waarde))
    : "—";
  return { waarde, stil, stilKleur, mails, contact };
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