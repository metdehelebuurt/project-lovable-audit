import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { History, User as UserIcon, FileText, ClipboardCheck, Calendar, Wrench, ShieldCheck, StickyNote, Settings } from "lucide-react";
import { useEntiteitHistorie, type EntiteitType, type EntiteitHistorieRij } from "@/hooks/useEntiteitHistorie";

const actieLabels: Record<string, string> = {
  aangemaakt: "Aangemaakt",
  status_gewijzigd: "Status gewijzigd",
  bedrag_gewijzigd: "Bedrag gewijzigd",
  toegewezen: "Toegewezen",
  toegewezen_gewijzigd: "Toewijzing gewijzigd",
  eigenaar_gewijzigd: "Eigenaar gewijzigd",
  adviseur_gewijzigd: "Adviseur gewijzigd",
  monteur_gewijzigd: "Monteur gewijzigd",
  datum_gewijzigd: "Datum gewijzigd",
  email_gewijzigd: "E-mailadres gewijzigd",
  telefoon_gewijzigd: "Telefoon gewijzigd",
  bron_gewijzigd: "Lead-bron gewijzigd",
  adres_gewijzigd: "Adres gewijzigd",
  naam_gewijzigd: "Naam gewijzigd",
  bedrijfsnaam_gewijzigd: "Bedrijfsnaam gewijzigd",
  prioriteit_gewijzigd: "Prioriteit gewijzigd",
  geescaleerd: "Geëscaleerd",
  opgelost: "Opgelost",
  gereed_gemeld: "Gereed gemeld",
  bewerkt: "Bewerkt",
  verwijderd: "Verwijderd",
  verzonden: "Verzonden",
  geaccepteerd: "Geaccepteerd",
  afgewezen: "Afgewezen",
  betaald_gemarkeerd: "Betaald",
};

const rolLabels: Record<string, string> = {
  superadmin: "Platformbeheer",
  partner_admin: "Beheerder",
  partner_staff: "Medewerker",
  backoffice: "Backoffice",
  adviseur: "Adviseur",
  installateur: "Monteur",
  consument: "Klant",
  affiliate: "Affiliate",
};

function initials(naam: string | null): string {
  if (!naam) return "?";
  const p = naam.trim().split(/\s+/);
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export interface ExtraEvent {
  date: string;
  type: "offerte" | "opdracht" | "schouw" | "afspraak" | "oplevering" | "notitie" | "created" | "installatie";
  label: string;
  detail?: string;
}

const eventIcons: Record<ExtraEvent["type"], any> = {
  offerte: FileText,
  opdracht: Wrench,
  schouw: ClipboardCheck,
  afspraak: Calendar,
  oplevering: ShieldCheck,
  notitie: StickyNote,
  installatie: Settings,
  created: UserIcon,
};

function groupByDay<T extends { date: string }>(rows: T[]): Record<string, T[]> {
  return rows.reduce<Record<string, T[]>>((acc, r) => {
    const d = new Date(r.date).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
    (acc[d] ??= []).push(r);
    return acc;
  }, {});
}

interface Props {
  entiteitType: EntiteitType;
  entiteitId: string | undefined;
  extraEvents?: ExtraEvent[];
  titel?: string;
}

type CombinedItem =
  | { kind: "historie"; date: string; row: EntiteitHistorieRij }
  | { kind: "event"; date: string; event: ExtraEvent };

export default function GecombineerdeTijdlijn({ entiteitType, entiteitId, extraEvents = [], titel = "Activiteit" }: Props) {
  const { data: historie = [], isLoading } = useEntiteitHistorie(entiteitType, entiteitId);

  const items: CombinedItem[] = useMemo(() => {
    const a: CombinedItem[] = historie.map((r) => ({ kind: "historie", date: r.created_at, row: r }));
    const b: CombinedItem[] = extraEvents
      .filter((e) => e.date)
      .map((e) => ({ kind: "event", date: e.date, event: e }));
    return [...a, ...b].sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime());
  }, [historie, extraEvents]);

  const groups = useMemo(() => groupByDay(items), [items]);

  if (isLoading && items.length === 0) {
    return <p className="text-sm text-muted-foreground p-6">Laden…</p>;
  }
  if (items.length === 0) {
    return (
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Nog geen activiteit
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardContent className="py-4 space-y-5">
        <h2 className="font-semibold flex items-center gap-2"><History className="h-4 w-4" />{titel}</h2>
        {Object.entries(groups).map(([dag, rows]) => (
          <div key={dag} className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{dag}</p>
            <ul className="space-y-2">
              {rows.map((it, i) =>
                it.kind === "historie" ? <HistorieRow key={`h-${it.row.id}`} r={it.row} /> : <EventRow key={`e-${i}-${it.date}`} e={it.event} />,
              )}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function HistorieRow({ r }: { r: EntiteitHistorieRij }) {
  return (
    <li className="flex gap-3 items-start border-l-2 border-border pl-3 py-1">
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-[10px] font-semibold text-primary">
        {r.actor_naam ? initials(r.actor_naam) : <UserIcon className="h-3.5 w-3.5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium">{r.actor_naam ?? "Systeem"}</span>
          {r.actor_rol ? (
            <span className="text-xs text-muted-foreground ml-1">· {rolLabels[r.actor_rol] ?? r.actor_rol}</span>
          ) : null}
          <span className="text-muted-foreground"> — {actieLabels[r.actie] ?? r.actie}</span>
          {r.veld ? <span className="text-xs text-muted-foreground"> ({r.veld})</span> : null}
        </p>
        {(r.oude_waarde || r.nieuwe_waarde) && (
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="font-mono">{r.oude_waarde ?? "—"}</span>
            <span className="mx-1">→</span>
            <span className="font-mono">{r.nieuwe_waarde ?? "—"}</span>
          </p>
        )}
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {new Date(r.created_at).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </li>
  );
}

function EventRow({ e }: { e: ExtraEvent }) {
  const Icon = eventIcons[e.type] ?? UserIcon;
  return (
    <li className="flex gap-3 items-start border-l-2 border-border pl-3 py-1">
      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{e.label}</p>
        {e.detail && <p className="text-xs text-muted-foreground mt-0.5">{e.detail}</p>}
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {new Date(e.date).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </li>
  );
}