import { useMemo, useState } from "react";
import { Phone, MessageSquare, MailOpen, Send, Sparkles, ArrowRightLeft, Pencil, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useLogContactmoment } from "@/hooks/affiliate/useAffiliateLeadContact";
import { toast } from "sonner";
import { LegeStaatBlok } from "../LegeStaatBlok";
import { useLeadTijdlijn, type TijdlijnItem, type TijdlijnType } from "./useLeadTijdlijn";

interface Props {
  leadId: string;
  email?: string | null;
}

type Filter = "alles" | "calls" | "mail" | "ai" | "wijzigingen";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "alles", label: "Alles" },
  { key: "calls", label: "Calls & notities" },
  { key: "mail", label: "E-mail" },
  { key: "ai", label: "AI" },
  { key: "wijzigingen", label: "Wijzigingen" },
];

const ICON: Record<TijdlijnType, React.ComponentType<{ className?: string }>> = {
  contactmoment: Phone,
  mail_in: MailOpen,
  mail_uit: Send,
  ai_opvolg: Sparkles,
  status: ArrowRightLeft,
  veld: Pencil,
};

const KLEUR: Record<TijdlijnType, string> = {
  contactmoment: "bg-blue-100 text-blue-700",
  mail_in: "bg-emerald-100 text-emerald-700",
  mail_uit: "bg-emerald-100 text-emerald-700",
  ai_opvolg: "bg-primary/15 text-primary",
  status: "bg-amber-100 text-amber-700",
  veld: "bg-slate-100 text-slate-700",
};

export function LeadActiviteitenTijdlijn({ leadId, email }: Props) {
  const { data = [], isLoading } = useLeadTijdlijn({ leadId, email });
  const [filter, setFilter] = useState<Filter>("alles");

  const filtered = useMemo(() => data.filter((i) => matchFilter(i, filter)), [data, filter]);
  const tellingen = useMemo(() => telPerFilter(data), [data]);

  return (
    <div className="space-y-4">
      <TijdlijnComposer leadId={leadId} />

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const aantal = tellingen[f.key];
          const actief = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`text-xs rounded-full px-2.5 py-1 border transition-colors ${
                actief
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted/60 border-border text-muted-foreground"
              }`}
            >
              {f.label}
              {aantal > 0 && <span className={`ml-1.5 ${actief ? "opacity-90" : "opacity-70"}`}>{aantal}</span>}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <LegeStaatBlok
          icon={Activity}
          titel={filter === "alles" ? "Nog geen activiteit" : "Geen items in deze filter"}
          subtitel={filter === "alles" ? "Log je eerste gesprek of stuur een mail om hier iets terug te zien." : undefined}
        />
      ) : (
        <ol className="relative space-y-3 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-border">
          {filtered.map((item) => <TijdlijnRij key={item.id} item={item} />)}
        </ol>
      )}
    </div>
  );
}

function TijdlijnRij({ item }: { item: TijdlijnItem }) {
  const Icon = ICON[item.type];
  return (
    <li className="relative pl-10">
      <span className={`absolute left-0 top-1 inline-flex items-center justify-center h-8 w-8 rounded-full border bg-background ${KLEUR[item.type]}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="rounded-lg border bg-card px-3 py-2.5 min-w-0 overflow-hidden">
        <div className="flex flex-wrap items-baseline justify-between gap-2 min-w-0">
          <p className="text-sm font-medium leading-tight break-words min-w-0">{item.titel}</p>
          <time className="text-xs text-muted-foreground shrink-0">
            {new Date(item.datum).toLocaleString("nl-NL", { dateStyle: "short", timeStyle: "short" })}
          </time>
        </div>
        {item.subtitel && <p className="text-xs text-muted-foreground mt-0.5 break-words">{item.subtitel}</p>}
        {item.body && (
          <p className="text-sm mt-1.5 whitespace-pre-wrap break-words text-foreground/90 line-clamp-4">{item.body}</p>
        )}
      </div>
    </li>
  );
}

function TijdlijnComposer({ leadId }: { leadId: string }) {
  const log = useLogContactmoment();
  const [type, setType] = useState<"telefoon" | "email" | "notitie" | "afspraak">("telefoon");
  const [uitkomst, setUitkomst] = useState<string>("gesproken");
  const [notitie, setNotitie] = useState("");

  const submit = async () => {
    if (!notitie.trim()) return;
    try {
      await log.mutateAsync({ lead_id: leadId, type, notitie, uitkomst });
      setNotitie("");
      toast.success("Gelogd");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Loggen mislukt");
    }
  };

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
          <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="telefoon">📞 Telefoon</SelectItem>
          <SelectItem value="afspraak">📅 Afspraak</SelectItem>
          <SelectItem value="email">📧 Mail (handmatig)</SelectItem>
            <SelectItem value="notitie">📝 Notitie</SelectItem>
          </SelectContent>
        </Select>
        <Select value={uitkomst} onValueChange={setUitkomst}>
          <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="gesproken">Gesproken</SelectItem>
            <SelectItem value="voicemail">Voicemail</SelectItem>
            <SelectItem value="niet_bereikt">Niet bereikt</SelectItem>
            <SelectItem value="terugbel_afspraak">Terugbel afgesproken</SelectItem>
            <SelectItem value="gelogd">Gelogd</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Textarea
        rows={2}
        value={notitie}
        onChange={(e) => setNotitie(e.target.value)}
        placeholder="Wat besproken, vervolgactie…"
        className="text-sm"
      />
      <div className="flex justify-end">
        <Button size="sm" onClick={submit} disabled={!notitie.trim() || log.isPending}>
          {log.isPending ? "Loggen…" : "Loggen"}
        </Button>
      </div>
    </div>
  );
}

function matchFilter(item: TijdlijnItem, filter: Filter): boolean {
  switch (filter) {
    case "alles": return true;
    case "calls": return item.type === "contactmoment";
    case "mail": return item.type === "mail_in" || item.type === "mail_uit";
    case "ai": return item.type === "ai_opvolg";
    case "wijzigingen": return item.type === "status" || item.type === "veld";
  }
}

function telPerFilter(items: TijdlijnItem[]): Record<Filter, number> {
  const r: Record<Filter, number> = { alles: items.length, calls: 0, mail: 0, ai: 0, wijzigingen: 0 };
  for (const i of items) {
    if (i.type === "contactmoment") r.calls++;
    else if (i.type === "mail_in" || i.type === "mail_uit") r.mail++;
    else if (i.type === "ai_opvolg") r.ai++;
    else r.wijzigingen++;
  }
  return r;
}