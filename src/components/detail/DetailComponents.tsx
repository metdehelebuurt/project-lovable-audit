import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText, ClipboardCheck, MapPin, Video, Plus, CalendarIcon,
  PhoneCall, Wrench, Mail, Phone,
} from "lucide-react";

/* ─── Formatters ─── */
export const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
export const formatDateTime = (d: string) =>
  new Date(d).toLocaleString("nl-NL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
export const formatCurrency = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

/* ─── QuickStat ─── */
export const QuickStat = ({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5">
    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-foreground">{value}</p>
    </div>
  </div>
);

/* ─── TabButton ─── */
export const TabButton = ({ active, label, count, onClick }: { active: boolean; label: string; count?: number; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
      active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
    }`}
  >
    {label}
    {count !== undefined && (
      <span className={`ml-1.5 text-xs ${active ? "text-primary" : "text-muted-foreground"}`}>({count})</span>
    )}
  </button>
);

/* ─── InfoRow ─── */
export const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) => (
  <div className="flex items-center gap-2 text-sm p-2 rounded-lg">
    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
    <span className="text-xs text-muted-foreground w-16 shrink-0">{label}</span>
    <span className="flex-1 truncate">{value || <span className="text-muted-foreground italic">—</span>}</span>
  </div>
);

/* ─── Offertes List ─── */
export const OffertesLijst = ({ offertes, onNew }: { offertes: any[]; onNew?: () => void }) => (
  <Card className="rounded-2xl border-0 shadow-sm">
    <CardHeader className="flex flex-row items-center justify-between pb-3">
      <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Offertes</CardTitle>
      {onNew && <Button size="sm" variant="outline" onClick={onNew} className="rounded-xl gap-1"><Plus className="h-3.5 w-3.5" /> Nieuwe offerte</Button>}
    </CardHeader>
    <CardContent>
      {offertes.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">Geen offertes</p>
      ) : (
        <div className="space-y-2">
          {offertes.map((o: any) => (
            <Link key={o.id} to={`/offertes/${o.id}/pdf`} className="flex items-center justify-between p-3 rounded-xl border hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center"><FileText className="h-4 w-4 text-primary" /></div>
                <div>
                  <p className="text-sm font-medium">{o.offertenummer}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(o.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">{formatCurrency(o.totaal_bedrag)}</span>
                <Badge variant="outline" className="text-xs">{o.status}</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

/* ─── Schouwen List ─── */
export const SchouwenLijst = ({ schouwen, onNew }: { schouwen: any[]; onNew?: () => void }) => (
  <Card className="rounded-2xl border-0 shadow-sm">
    <CardHeader className="flex flex-row items-center justify-between pb-3">
      <CardTitle className="text-base flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-primary" /> Schouwen</CardTitle>
      {onNew && <Button size="sm" variant="outline" onClick={onNew} className="rounded-xl gap-1"><Plus className="h-3.5 w-3.5" /> Nieuwe schouw</Button>}
    </CardHeader>
    <CardContent>
      {schouwen.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">Geen schouwen</p>
      ) : (
        <div className="space-y-2">
          {schouwen.map((s: any) => (
            <Link key={s.id} to={`/schouwen/${s.id}`} className="flex items-center justify-between p-3 rounded-xl border hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center"><ClipboardCheck className="h-4 w-4 text-primary" /></div>
                <div>
                  <p className="text-sm font-medium">{s.schouw_nummer}</p>
                  <p className="text-xs text-muted-foreground">{s.categorie} • {formatDate(s.geplande_datum)}</p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">{s.status}</Badge>
            </Link>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

/* ─── Afspraken List ─── */
export const AfsprakenLijst = ({ afspraken, onNew }: { afspraken: any[]; onNew?: () => void }) => (
  <Card className="rounded-2xl border-0 shadow-sm">
    <CardHeader className="flex flex-row items-center justify-between pb-3">
      <CardTitle className="text-base flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-primary" /> Afspraken</CardTitle>
      {onNew && <Button size="sm" variant="outline" onClick={onNew} className="rounded-xl gap-1"><Plus className="h-3.5 w-3.5" /> Inplannen</Button>}
    </CardHeader>
    <CardContent>
      {afspraken.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">Geen afspraken</p>
      ) : (
        <div className="space-y-2">
          {afspraken.map((a: any) => (
            <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  {a.type === "belafspraak" ? <PhoneCall className="h-4 w-4 text-primary" /> :
                   a.type === "op_afstand" ? <Video className="h-4 w-4 text-primary" /> :
                   <MapPin className="h-4 w-4 text-primary" />}
                </div>
                <div>
                  <p className="text-sm font-medium">{a.titel}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(a.datum)}
                    {a.start_tijd && ` • ${a.start_tijd.slice(0, 5)}`}
                    {a.eind_tijd && ` - ${a.eind_tijd.slice(0, 5)}`}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">{a.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

/* ─── Opdrachten List ─── */
const opdStatusColors: Record<string, string> = {
  nieuw: "bg-primary/10 text-primary",
  bevestigd: "bg-accent/50 text-accent-foreground",
  schouw_gepland: "bg-primary/10 text-primary",
  installatie_gepland: "bg-primary/10 text-primary",
  in_uitvoering: "bg-amber-100 text-amber-700",
  afgerond: "bg-emerald-100 text-emerald-700",
  geannuleerd: "bg-red-100 text-red-600",
};
const opdStatusLabels: Record<string, string> = {
  nieuw: "Nieuw", bevestigd: "Bevestigd", schouw_gepland: "Schouw gepland",
  installatie_gepland: "Installatie gepland", in_uitvoering: "In uitvoering",
  afgerond: "Afgerond", geannuleerd: "Geannuleerd",
};

export const OpdrachtenLijst = ({ opdrachten, onNavigate }: { opdrachten: any[]; onNavigate?: (id: string) => void }) => (
  <Card className="rounded-2xl border-0 shadow-sm">
    <CardHeader className="pb-3">
      <CardTitle className="text-base flex items-center gap-2"><Wrench className="h-4 w-4 text-primary" /> Opdrachten</CardTitle>
    </CardHeader>
    <CardContent>
      {opdrachten.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">Geen opdrachten</p>
      ) : (
        <div className="space-y-2">
          {opdrachten.map((o: any) => (
            <div
              key={o.id}
              onClick={() => onNavigate?.(o.id)}
              className="flex items-center justify-between p-3 rounded-xl border hover:bg-muted/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center"><Wrench className="h-4 w-4 text-primary" /></div>
                <div>
                  <p className="text-sm font-medium">{o.klant_naam}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(o.created_at)}
                    {o.klant_adres && ` • ${o.klant_adres}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">{formatCurrency(o.totaal_bedrag || 0)}</span>
                <Badge className={opdStatusColors[o.status] || ""}>{opdStatusLabels[o.status] || o.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

/* ─── Snelle Acties Sidebar ─── */
export const SnelleActies = ({
  onAfspraak, onOfferte, onSchouw, email, telefoon,
}: {
  onAfspraak: () => void;
  onOfferte: () => void;
  onSchouw: () => void;
  email?: string | null;
  telefoon?: string | null;
}) => (
  <Card className="rounded-2xl border-0 shadow-sm">
    <CardHeader className="pb-2"><CardTitle className="text-sm">Snelle acties</CardTitle></CardHeader>
    <CardContent className="space-y-2">
      <Button variant="outline" size="sm" className="w-full justify-start rounded-xl gap-2 text-xs" onClick={onAfspraak}>
        <CalendarIcon className="h-3.5 w-3.5" /> Afspraak inplannen
      </Button>
      <Button variant="outline" size="sm" className="w-full justify-start rounded-xl gap-2 text-xs" onClick={onOfferte}>
        <FileText className="h-3.5 w-3.5" /> Offerte aanmaken
      </Button>
      <Button variant="outline" size="sm" className="w-full justify-start rounded-xl gap-2 text-xs" onClick={onSchouw}>
        <ClipboardCheck className="h-3.5 w-3.5" /> Schouw inplannen
      </Button>
      {email && (
        <Button variant="outline" size="sm" className="w-full justify-start rounded-xl gap-2 text-xs" asChild>
          <a href={`mailto:${email}`}><Mail className="h-3.5 w-3.5" /> E-mail versturen</a>
        </Button>
      )}
      {telefoon && (
        <Button variant="outline" size="sm" className="w-full justify-start rounded-xl gap-2 text-xs" asChild>
          <a href={`tel:${telefoon}`}><Phone className="h-3.5 w-3.5" /> Bellen</a>
        </Button>
      )}
    </CardContent>
  </Card>
);

/* ─── Samenvatting Sidebar ─── */
export const SamenvattingCard = ({ items }: { items: { label: string; value: string | number }[] }) => (
  <Card className="rounded-2xl border-0 shadow-sm">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm flex items-center gap-2">Samenvatting</CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex justify-between text-sm">
          <span className="text-muted-foreground">{item.label}</span>
          <span className="font-medium">{item.value}</span>
        </div>
      ))}
    </CardContent>
  </Card>
);

/* ─── Activiteit Tijdlijn ─── */
interface TimelineEvent {
  type: string;
  date: string;
  label: string;
  detail?: string;
}

const timelineColors: Record<string, string> = {
  notitie: "bg-primary",
  contact: "bg-violet-500",
  offerte: "bg-amber-500",
  schouw: "bg-emerald-500",
  afspraak: "bg-blue-500",
  opdracht: "bg-orange-500",
  created: "bg-muted-foreground",
};

export const ActiviteitTijdlijn = ({ events }: { events: TimelineEvent[] }) => {
  const sorted = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 30);
  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">Tijdlijn</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sorted.map((event, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="flex flex-col items-center">
                <div className={`h-2.5 w-2.5 rounded-full mt-1.5 ${timelineColors[event.type] || "bg-muted-foreground"}`} />
                {i < sorted.length - 1 && <div className="w-px h-full bg-border min-h-[20px]" />}
              </div>
              <div className="pb-3">
                <p className="text-sm font-medium text-foreground">{event.label}</p>
                {event.detail && <p className="text-xs text-muted-foreground">{event.detail}</p>}
                <p className="text-[10px] text-muted-foreground">{formatDateTime(event.date)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
