import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  AlarmClock, BellRing, CalendarClock, CheckCircle2, Mail, Phone, Search, Send, Sparkles, UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAlleDemoAfspraken, type DemoAfspraakRow } from "@/hooks/affiliate/useAlleDemoAfspraken";
import { telLink } from "@/lib/affiliate/contact";

type Periode = "vandaag" | "week" | "open" | "historie";

function affNaam(a: DemoAfspraakRow["eigenaar"]): string {
  if (!a) return "—";
  const naam = [a.voornaam, a.achternaam].filter(Boolean).join(" ").trim();
  return naam || a.email || "—";
}

function isBinnen(datum: Date, van: Date, tot: Date) {
  return datum >= van && datum <= tot;
}

/** Volgende werkdag (op vrijdag/za/zo → maandag, anders morgen). */
function nextWorkday(from: Date = new Date()): Date {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  do {
    d.setDate(d.getDate() + 1);
  } while (d.getDay() === 0 || d.getDay() === 6);
  return d;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** ISO-string voor <input type="datetime-local"> zonder tijdzone-shift. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function DemoOverzicht() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [periode, setPeriode] = useState<Periode>("open");
  const [affiliateId, setAffiliateId] = useState<string>("alle");
  const [zoek, setZoek] = useState("");
  const [verzetAfspraak, setVerzetAfspraak] = useState<DemoAfspraakRow | null>(null);
  const [verzetTijd, setVerzetTijd] = useState<string>("");

  const scope = periode === "historie" ? "alle" : "open";
  const { data: rows = [], isLoading } = useAlleDemoAfspraken(scope);

  const affiliateOpties = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) {
      if (r.eigenaar?.id) map.set(r.eigenaar.id, affNaam(r.eigenaar));
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [rows]);

  const nu = new Date();
  const eindVandaag = new Date(); eindVandaag.setHours(23, 59, 59, 999);
  const eindWeek = new Date(Date.now() + 7 * 86400_000); eindWeek.setHours(23, 59, 59, 999);
  const startMaand = new Date(nu.getFullYear(), nu.getMonth(), 1);
  const morgenWerkdag = useMemo(() => nextWorkday(nu), [nu]);

  const gefilterd = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    return rows.filter((r) => {
      if (affiliateId !== "alle" && r.affiliate_id !== affiliateId) return false;
      const datum = new Date(r.geplande_op);
      if (periode === "vandaag" && !isBinnen(datum, new Date(0), eindVandaag)) return false;
      if (periode === "week" && !isBinnen(datum, new Date(0), eindWeek)) return false;
      if (periode === "historie" && !r.afgehandeld_op) return false;
      if (q) {
        const hay = [
          r.affiliate_leads?.bedrijfsnaam,
          r.affiliate_leads?.contactpersoon,
          r.affiliate_leads?.email,
          r.notitie,
          affNaam(r.eigenaar),
        ].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, affiliateId, zoek, periode, eindVandaag, eindWeek]);

  const kpi = useMemo(() => {
    let vandaag = 0, week = 0, achterstallig = 0, afgehandeld = 0, morgen = 0;
    for (const r of rows) {
      const d = new Date(r.geplande_op);
      if (!r.afgehandeld_op) {
        if (d < nu) achterstallig++;
        if (d <= eindVandaag && d >= nu) vandaag++;
        if (d <= eindWeek && d >= nu) week++;
        if (sameDay(d, morgenWerkdag)) morgen++;
      } else if (new Date(r.afgehandeld_op) >= startMaand) {
        afgehandeld++;
      }
    }
    return { vandaag, week, achterstallig, afgehandeld, morgen };
  }, [rows, nu, eindVandaag, eindWeek, startMaand, morgenWerkdag]);

  const groepen = useMemo(() => {
    const out = {
      morgen: [] as DemoAfspraakRow[],
      achterstallig: [] as DemoAfspraakRow[],
      vandaag: [] as DemoAfspraakRow[],
      week: [] as DemoAfspraakRow[],
      later: [] as DemoAfspraakRow[],
      afgehandeld: [] as DemoAfspraakRow[],
    };
    for (const r of gefilterd) {
      if (r.afgehandeld_op) { out.afgehandeld.push(r); continue; }
      const d = new Date(r.geplande_op);
      if (sameDay(d, morgenWerkdag)) { out.morgen.push(r); continue; }
      if (d < nu) out.achterstallig.push(r);
      else if (d <= eindVandaag) out.vandaag.push(r);
      else if (d <= eindWeek) out.week.push(r);
      else out.later.push(r);
    }
    return out;
  }, [gefilterd, nu, eindVandaag, eindWeek, morgenWerkdag]);

  const afvink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("affiliate_terugbel_afspraken")
        .update({ afgehandeld_op: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alle-demo-afspraken"] });
      toast.success("Demo afgevinkt");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const verzet = useMutation({
    mutationFn: async ({ id, nieuweTijd }: { id: string; nieuweTijd: string }) => {
      const iso = new Date(nieuweTijd).toISOString();
      const { error } = await supabase
        .from("affiliate_terugbel_afspraken")
        .update({ geplande_op: iso, reminder_24u_op: null, reminder_1u_op: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alle-demo-afspraken"] });
      toast.success("Demo verzet");
      setVerzetAfspraak(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const stuurReminder = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke("affiliate-afspraak-reminder", {
        body: { afspraakId: id },
      });
      if (error) throw error;
      if (data && typeof data === "object" && "error" in data && (data as { error?: string }).error) {
        throw new Error((data as { error: string }).error);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alle-demo-afspraken"] });
      toast.success("Herinnerings-mail naar klant verstuurd");
    },
    onError: (e: Error) => toast.error(e.message || "Verzenden mislukt"),
  });

  const openVerzet = (r: DemoAfspraakRow) => {
    setVerzetAfspraak(r);
    setVerzetTijd(toLocalInput(r.geplande_op));
  };

  const totaal = gefilterd.length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiKaart label="Achterstallig" waarde={kpi.achterstallig} kleur="bg-rose-50 text-rose-700 border-rose-200" />
        <KpiKaart label="Vandaag" waarde={kpi.vandaag} kleur="bg-amber-50 text-amber-800 border-amber-200" />
        <KpiKaart label="Morgen (nabellen)" waarde={kpi.morgen} kleur="bg-violet-50 text-violet-800 border-violet-200" />
        <KpiKaart label="Komende 7 dagen" waarde={kpi.week} kleur="bg-blue-50 text-blue-800 border-blue-200" />
        <KpiKaart label="Afgerond deze maand" waarde={kpi.afgehandeld} kleur="bg-emerald-50 text-emerald-800 border-emerald-200" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="h-4 w-4" /> Alle geplande demo's
            <Badge variant="outline" className="ml-2">{totaal}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <Select value={periode} onValueChange={(v) => setPeriode(v as Periode)}>
              <SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Alle open</SelectItem>
                <SelectItem value="vandaag">Vandaag</SelectItem>
                <SelectItem value="week">Komende week</SelectItem>
                <SelectItem value="historie">Historie (afgerond)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={affiliateId} onValueChange={setAffiliateId}>
              <SelectTrigger className="w-full md:w-64"><SelectValue placeholder="Affiliate" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle affiliates</SelectItem>
                {affiliateOpties.map(([id, naam]) => (
                  <SelectItem key={id} value={id}>{naam}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={zoek}
                onChange={(e) => setZoek(e.target.value)}
                placeholder="Zoek op bedrijf, contactpersoon, notitie…"
                className="pl-7"
              />
            </div>
          </div>

          {isLoading && <p className="text-sm text-muted-foreground">Laden…</p>}
          {!isLoading && totaal === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Geen demo's gevonden voor deze filter.
            </p>
          )}

          <Sectie
            label={`Morgen — nabellen om no-show te voorkomen (${morgenWerkdag.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })})`}
            kleur="bg-violet-100 text-violet-800 border-violet-300"
            highlight
            items={groepen.morgen} navigate={navigate}
            onAfvink={(id) => afvink.mutate(id)}
            onVerzet={openVerzet}
            onReminder={(id) => stuurReminder.mutate(id)}
            reminderPending={stuurReminder.isPending ? stuurReminder.variables : undefined}
            morgenWerkdag={morgenWerkdag}
          />
          <Sectie
            label="Achterstallig" kleur="bg-rose-100 text-rose-800 border-rose-300"
            items={groepen.achterstallig} navigate={navigate}
            onAfvink={(id) => afvink.mutate(id)} onVerzet={openVerzet}
            morgenWerkdag={morgenWerkdag}
          />
          <Sectie
            label="Vandaag" kleur="bg-amber-100 text-amber-800 border-amber-300"
            items={groepen.vandaag} navigate={navigate}
            onAfvink={(id) => afvink.mutate(id)} onVerzet={openVerzet}
            morgenWerkdag={morgenWerkdag}
          />
          <Sectie
            label="Komende 7 dagen" kleur="bg-blue-100 text-blue-800 border-blue-300"
            items={groepen.week} navigate={navigate}
            onAfvink={(id) => afvink.mutate(id)} onVerzet={openVerzet}
            onReminder={(id) => stuurReminder.mutate(id)}
            reminderPending={stuurReminder.isPending ? stuurReminder.variables : undefined}
            morgenWerkdag={morgenWerkdag}
          />
          <Sectie
            label="Later" kleur="bg-slate-100 text-slate-700 border-slate-300"
            items={groepen.later} navigate={navigate}
            onAfvink={(id) => afvink.mutate(id)} onVerzet={openVerzet}
            morgenWerkdag={morgenWerkdag}
          />
          <Sectie
            label="Afgerond" kleur="bg-emerald-100 text-emerald-800 border-emerald-300"
            items={groepen.afgehandeld} navigate={navigate}
            morgenWerkdag={morgenWerkdag}
          />
        </CardContent>
      </Card>

      <Dialog open={!!verzetAfspraak} onOpenChange={(o) => !o && setVerzetAfspraak(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demo verzetten</DialogTitle>
            <DialogDescription>
              Kies een nieuw moment. De klant ontvangt geen automatische update — stuur zelf een reminder/mail.
            </DialogDescription>
          </DialogHeader>
          {verzetAfspraak && (
            <div className="space-y-3">
              <p className="text-sm">
                <span className="font-medium">{verzetAfspraak.affiliate_leads?.bedrijfsnaam ?? "Lead"}</span>
                {verzetAfspraak.affiliate_leads?.contactpersoon ? ` · ${verzetAfspraak.affiliate_leads.contactpersoon}` : ""}
              </p>
              <div className="space-y-1">
                <Label htmlFor="verzet-tijd">Nieuwe datum & tijd</Label>
                <Input
                  id="verzet-tijd"
                  type="datetime-local"
                  value={verzetTijd}
                  onChange={(e) => setVerzetTijd(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setVerzetAfspraak(null)}>Annuleren</Button>
            <Button
              onClick={() => verzetAfspraak && verzetTijd && verzet.mutate({ id: verzetAfspraak.id, nieuweTijd: verzetTijd })}
              disabled={!verzetTijd || verzet.isPending}
            >
              {verzet.isPending ? "Bezig…" : "Verzetten"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KpiKaart({ label, waarde, kleur }: { label: string; waarde: number; kleur: string }) {
  return (
    <div className={`rounded-lg border p-3 ${kleur}`}>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="text-2xl font-semibold tabular-nums">{waarde}</p>
    </div>
  );
}

interface SectieProps {
  label: string;
  kleur: string;
  items: DemoAfspraakRow[];
  navigate: ReturnType<typeof useNavigate>;
  onAfvink?: (id: string) => void;
  onVerzet?: (r: DemoAfspraakRow) => void;
  onReminder?: (id: string) => void;
  reminderPending?: string;
  highlight?: boolean;
  morgenWerkdag: Date;
}

function Sectie({ label, kleur, items, navigate, onAfvink, onVerzet, onReminder, reminderPending, highlight, morgenWerkdag }: SectieProps) {
  if (items.length === 0) return null;
  return (
    <div className={`space-y-2 ${highlight ? "rounded-lg border border-violet-300 bg-violet-50/50 p-3" : ""}`}>
      <div className="flex items-center gap-2">
        <h4 className={`text-sm font-semibold ${highlight ? "text-violet-900 flex items-center gap-1.5" : ""}`}>
          {highlight && <BellRing className="h-4 w-4" />} {label}
        </h4>
        <Badge variant="outline" className={kleur}>{items.length}</Badge>
      </div>
      <div className="space-y-2">
        {items.map((r) => {
          const bedrijf = r.affiliate_leads?.bedrijfsnaam ?? "Lead";
          const contact = r.affiliate_leads?.contactpersoon;
          const tel = telLink(r.affiliate_leads?.telefoon);
          const email = r.affiliate_leads?.email;
          const gedelegeerd = r.collega_user_id && r.collega_user_id !== r.affiliate_id;
          const isMorgen = sameDay(new Date(r.geplande_op), morgenWerkdag);
          const reminderTijd = r.reminder_24u_op ? new Date(r.reminder_24u_op) : null;
          return (
            <div
              key={r.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/affiliate/leads/${r.lead_id}`)}
              onKeyDown={(e) => { if (e.key === "Enter") navigate(`/affiliate/leads/${r.lead_id}`); }}
              className={`flex flex-wrap items-center gap-3 border rounded-md p-3 cursor-pointer transition-colors ${
                highlight ? "bg-white hover:bg-violet-50/70 border-violet-200" : "hover:bg-muted/40"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium truncate">{bedrijf}</p>
                  <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200 text-[10px] gap-1">
                    <Sparkles className="h-3 w-3" /> Demo
                  </Badge>
                  {isMorgen && !highlight && (
                    <Badge variant="outline" className="bg-violet-100 text-violet-800 border-violet-300 text-[10px] gap-1">
                      <AlarmClock className="h-3 w-3" /> Morgen
                    </Badge>
                  )}
                  {gedelegeerd && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] gap-1">
                      <UserPlus className="h-3 w-3" /> Overgedragen
                    </Badge>
                  )}
                  {r.noshow && (
                    <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]">
                      No-show
                    </Badge>
                  )}
                  {reminderTijd && (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] gap-1">
                      <BellRing className="h-3 w-3" /> Reminder verstuurd
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(r.geplande_op).toLocaleString("nl-NL")}
                  {contact ? ` · ${contact}` : ""}
                  {r.notitie ? ` · ${r.notitie}` : ""}
                </p>
                <p className="text-[11px] text-muted-foreground">Affiliate: {affNaam(r.eigenaar)}</p>
                {reminderTijd && (
                  <p className="text-[11px] text-emerald-700">
                    Reminder verstuurd om {reminderTijd.toLocaleString("nl-NL")}
                  </p>
                )}
              </div>
              {tel && (
                <Button asChild size="sm" variant="outline" onClick={(e) => e.stopPropagation()}>
                  <a href={tel}><Phone className="h-3 w-3 mr-1" /> Bel</a>
                </Button>
              )}
              {email && (
                <Button asChild size="sm" variant="outline" onClick={(e) => e.stopPropagation()}>
                  <a href={`mailto:${email}`}><Mail className="h-3 w-3" /></a>
                </Button>
              )}
              {onReminder && email && !r.afgehandeld_op && (
                <Button
                  size="sm"
                  variant={highlight ? "default" : "outline"}
                  onClick={(e) => { e.stopPropagation(); onReminder(r.id); }}
                  disabled={reminderPending === r.id}
                  title="Reminder-mail sturen naar klant"
                >
                  <Send className="h-3 w-3 mr-1" />
                  {reminderPending === r.id ? "Bezig…" : "Reminder"}
                </Button>
              )}
              {onVerzet && !r.afgehandeld_op && (
                <Button
                  size="sm" variant="outline"
                  onClick={(e) => { e.stopPropagation(); onVerzet(r); }}
                  title="Demo verzetten"
                >
                  <CalendarClock className="h-3 w-3 mr-1" /> Verzet
                </Button>
              )}
              {onAfvink && !r.afgehandeld_op && (
                <Button
                  size="sm" variant="ghost"
                  onClick={(e) => { e.stopPropagation(); onAfvink(r.id); }}
                  title="Afvinken"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}