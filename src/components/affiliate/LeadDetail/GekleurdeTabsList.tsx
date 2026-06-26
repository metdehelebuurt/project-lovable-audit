import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, MailOpen, StickyNote, Sparkles, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type LeadTabKey = "tijdlijn" | "email" | "notities" | "opvolging" | "historie";

export interface LeadTabDef {
  value: LeadTabKey;
  label: string;
  korteLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Tailwind kleurnaam zonder shade (bv. "indigo") */
  kleur: string;
  subtitel: string;
}

export const LEAD_TABS: LeadTabDef[] = [
  {
    value: "tijdlijn",
    label: "Tijdlijn",
    korteLabel: "Tijdlijn",
    icon: Activity,
    kleur: "indigo",
    subtitel: "Alle activiteit, calls, mails en wijzigingen op één lijn",
  },
  {
    value: "email",
    label: "E-mail",
    korteLabel: "Mail",
    icon: MailOpen,
    kleur: "purple",
    subtitel: "In- en uitgaande mails uit je gekoppelde Gmail of Outlook",
  },
  {
    value: "notities",
    label: "Notities",
    korteLabel: "Notities",
    icon: StickyNote,
    kleur: "amber",
    subtitel: "Interne aantekeningen — automatisch opgeslagen",
  },
  {
    value: "opvolging",
    label: "AI-opvolging",
    korteLabel: "AI",
    icon: Sparkles,
    kleur: "emerald",
    subtitel: "Slimme suggesties en bedrijfssamenvatting van de AI-coach",
  },
  {
    value: "historie",
    label: "Historie",
    korteLabel: "Historie",
    icon: History,
    kleur: "slate",
    subtitel: "Veld- en statuswijzigingen op deze lead",
  },
];

// Volle classlist zodat Tailwind niets purgt.
const ACTIEF_CLS: Record<string, string> = {
  indigo: "data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-indigo-600/20",
  purple: "data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-purple-600/20",
  amber: "data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-amber-500/20",
  emerald: "data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-emerald-600/20",
  slate: "data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-slate-700/20",
};

interface Props {
  counts?: Partial<Record<LeadTabKey, number>>;
}

/** Tabbalk met duidelijke kleuren per tab en optionele teltegels. */
export function GekleurdeTabsList({ counts }: Props) {
  return (
    <TabsList
      className={cn(
        "w-full min-w-0 h-auto p-1 gap-1 rounded-xl border bg-muted/40",
        "grid grid-cols-5",
      )}
    >
      {LEAD_TABS.map((t) => {
        const aantal = counts?.[t.value];
        return (
          <TabsTrigger
            key={t.value}
            value={t.value}
            className={cn(
              "min-w-0 gap-1 rounded-lg px-1.5 sm:px-2.5 py-1.5 sm:py-2",
              "text-muted-foreground hover:text-foreground hover:bg-background/60",
              "data-[state=active]:font-semibold transition-colors",
              "text-[11px] sm:text-sm",
              ACTIEF_CLS[t.kleur],
            )}
          >
            <t.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span className="hidden sm:inline truncate">{t.label}</span>
            <span className="sm:hidden truncate">{t.korteLabel}</span>
            {typeof aantal === "number" && aantal > 0 && (
              <Badge
                variant="secondary"
                className="ml-auto h-4 min-w-4 px-1 text-[10px] bg-background/80 text-foreground border data-[state=active]:bg-white/20"
              >
                {aantal}
              </Badge>
            )}
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}

// Kleurmap voor de callout banners — buiten de component zodat ze hergebruikt kunnen worden.
export const TAB_CALLOUT_CLS: Record<LeadTabKey, { rand: string; bg: string; icoon: string; titel: string }> = {
  tijdlijn: { rand: "border-l-indigo-500", bg: "bg-indigo-50/60", icoon: "bg-indigo-100 text-indigo-700", titel: "text-indigo-900" },
  email: { rand: "border-l-purple-500", bg: "bg-purple-50/60", icoon: "bg-purple-100 text-purple-700", titel: "text-purple-900" },
  notities: { rand: "border-l-amber-500", bg: "bg-amber-50/60", icoon: "bg-amber-100 text-amber-800", titel: "text-amber-900" },
  opvolging: { rand: "border-l-emerald-500", bg: "bg-emerald-50/60", icoon: "bg-emerald-100 text-emerald-700", titel: "text-emerald-900" },
  historie: { rand: "border-l-slate-500", bg: "bg-slate-50", icoon: "bg-slate-200 text-slate-700", titel: "text-slate-900" },
};

/** Callout-banner bovenaan een tab; toont icoon + titel + subtitel + optionele actie. */
export function TabCallout({
  tab,
  actie,
}: {
  tab: LeadTabKey;
  actie?: React.ReactNode;
}) {
  const def = LEAD_TABS.find((t) => t.value === tab)!;
  const cls = TAB_CALLOUT_CLS[tab];
  const Icon = def.icon;
  return (
    <div className={cn("flex items-center gap-3 rounded-lg border border-l-4 p-3", cls.rand, cls.bg)}>
      <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-md shrink-0", cls.icoon)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-semibold leading-tight", cls.titel)}>{def.label}</p>
        <p className="text-xs text-muted-foreground truncate">{def.subtitel}</p>
      </div>
      {actie && <div className="shrink-0">{actie}</div>}
    </div>
  );
}