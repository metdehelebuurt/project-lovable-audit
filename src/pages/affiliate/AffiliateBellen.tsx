import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TemperatuurBadge from "@/components/sales/TemperatuurBadge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Phone, Mail, SkipForward, CheckCircle2, XCircle, Calendar, FileText, Clock, MessageCircle, CalendarPlus, Globe, MapPin, Briefcase, Headphones, History as HistoryIcon, Building2, Sparkles, PhoneOff, PhoneMissed, Presentation, Trophy } from "lucide-react";
import { AffiliateSubnav } from "@/components/affiliate/AffiliateSubnav";
import { useAffiliateLeads, useUpdateAffiliateLead, type AffiliateLead } from "@/hooks/affiliate/useAffiliateLeads";
import { useLogContactmoment, useLeadContactmomenten } from "@/hooks/affiliate/useAffiliateLeadContact";
import { useTerugbelAfspraken } from "@/hooks/affiliate/useTerugbelAfspraken";
import { useOpvolgTaken, useVoltooiOpvolgTaak } from "@/hooks/affiliate/useOpvolgTaken";
import { CONTACT_UITKOMST_OPTIES, STATUS_LABEL } from "@/lib/affiliate/leadStatus";
import { useAffiliatePipelineConfig } from "@/hooks/affiliate/useAffiliatePipelineConfig";
import { kleurBadge, kleurDot } from "@/lib/affiliate/pipelineKleur";
import { telLink, whatsappLink } from "@/lib/affiliate/contact";
import { TerugbelDialog } from "@/components/affiliate/TerugbelDialog";
import { TrialStartenButton } from "@/components/affiliate/TrialStartenButton";
import { useBelStats } from "@/hooks/affiliate/useBelStats";
import { BedrijfSamenvattingKaart } from "@/components/affiliate/BedrijfSamenvattingKaart";
import { BelQueueStrip } from "@/components/affiliate/BelQueueStrip";
import { VerrijkLeadDialog } from "@/components/affiliate/VerrijkLeadDialog";
import { VerlorenRedenDialog } from "@/components/affiliate/VerlorenRedenDialog";
import { vereistDialog, type UitkomstWaarde } from "@/lib/affiliate/uitkomstAutomatisering";
import { UitkomstGroep, UitkomstKnop } from "@/components/affiliate/UitkomstSoundboard";
import { GespreksTimer } from "@/components/affiliate/Belsessie/Timer";
import { BriefingKaart } from "@/components/affiliate/Belsessie/BriefingKaart";
import { StatusKaart } from "@/components/affiliate/Belsessie/StatusKaart";
import { useNotitieConcept } from "@/hooks/affiliate/useNotitieConcept";
import { toast } from "sonner";

const AffiliateBellen = () => {
  const { data: leads = [] } = useAffiliateLeads("mine");
  const { data: terugbelAfspraken = [] } = useTerugbelAfspraken("open");
  const { data: opvolgTaken = [] } = useOpvolgTaken("open");
  const voltooiTaak = useVoltooiOpvolgTaak();
  const update = useUpdateAffiliateLead();
  const log = useLogContactmoment();
  const { data: belStats } = useBelStats();
  const { data: pipelineConfig = [] } = useAffiliatePipelineConfig();
  const [idx, setIdx] = useState(0);
  const [seconden, setSeconden] = useState(0);
  const [timerLoopt, setTimerLoopt] = useState(false);
  const [openTerugbel, setOpenTerugbel] = useState(false);
  const [openAfspraak, setOpenAfspraak] = useState(false);
  const [afspraakType, setAfspraakType] = useState<"terugbel" | "demo">("terugbel");
  const [pendingUitkomst, setPendingUitkomst] = useState<typeof CONTACT_UITKOMST_OPTIES[number] | null>(null);
  const [openVerrijk, setOpenVerrijk] = useState(false);
  const [openVerloren, setOpenVerloren] = useState(false);
  // Beschermt tegen dubbele klikken op de soundboard-knoppen terwijl er nog
  // een insert/mutatie loopt. Combineert React-state (voor UI) met een ref
  // (voor synchrone guard binnen dezelfde event-loop tick).
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const guard = async (fn: () => Promise<void> | void) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await fn();
    } catch {
      /* foutmelding is al getoond; notitie blijft als concept bewaard */
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const belQueue = useMemo(() => {
    const eindVandaag = new Date(); eindVandaag.setHours(23, 59, 59, 999);
    const nu = Date.now();
    // Leads met EEN toekomstige open afspraak (later dan vandaag) horen NIET in de queue.
    const leadsMetToekomstigeAfspraak = new Set(
      terugbelAfspraken
        .filter((a) => new Date(a.geplande_op).getTime() > eindVandaag.getTime())
        .map((a) => a.lead_id),
    );
    const dueLeadIds = new Set(
      terugbelAfspraken
        .filter((a) => new Date(a.geplande_op) <= eindVandaag)
        .map((a) => a.lead_id),
    );
    for (const t of opvolgTaken) {
      if (!t.lead_id) continue;
      if (new Date(t.due_op) <= eindVandaag) dueLeadIds.add(t.lead_id);
    }
    return leads.filter((l) => {
      // Leads zonder telefoon kunnen we niet bellen — verberg ze in de cockpit.
      if (!l.telefoon) return false;
      // Afgesloten leads (verloren/gewonnen) horen nooit in de belqueue.
      // Uitzondering: een verloren lead die via de lost-review terug in de
      // pipeline is gezet en waarvan die datum bereikt is.
      if (l.status === "gewonnen") return false;
      if (l.status === "verloren") {
        if (!l.terug_in_pipeline_op) return false;
        if (new Date(l.terug_in_pipeline_op) > eindVandaag) return false;
        return true;
      }
      // Een toekomstige afspraak heeft voorrang: lead niet in queue.
      if (leadsMetToekomstigeAfspraak.has(l.id) && !dueLeadIds.has(l.id)) return false;
      if (dueLeadIds.has(l.id)) return true;
      // Status `terugbel_gepland` mag alleen via due-afspraak in de queue komen,
      // niet via status-fallback (anders blijven leads met afspraak ver in de toekomst hangen).
      if (
        l.status !== "nieuw" &&
        l.status !== "nieuw_campagne" &&
        l.status !== "nieuw_demo_voltooid" &&
        l.status !== "gebeld_geen_gehoor" &&
        l.status !== "mail_gestuurd"
      ) return false;
      if (!l.volgende_actie_datum) return true;
      return new Date(l.volgende_actie_datum) <= eindVandaag;
    });
  }, [leads, terugbelAfspraken, opvolgTaken]);

  const current: AffiliateLead | undefined = belQueue[idx];
  const { data: historie = [] } = useLeadContactmomenten(current?.id);
  const { notitie, setNotitie, wisConcept, heeftConcept } = useNotitieConcept(current?.id);

  const huidigeTaken = useMemo(() => {
    if (!current) return [];
    const vandaag = new Date(); vandaag.setHours(23, 59, 59, 999);
    return opvolgTaken.filter((t) => t.lead_id === current.id && new Date(t.due_op) <= vandaag);
  }, [opvolgTaken, current]);

  // Bij wissel van lead: timer reset en pauze.
  useEffect(() => {
    setSeconden(0);
    setTimerLoopt(false);
  }, [current?.id]);

  const next = () => {
    setIdx((i) => Math.min(i + 1, belQueue.length));
  };

  const handleUitkomst = async (uitkomst: { value: string; label: string; nextStatus: AffiliateLead["status"] }) => {
    if (!current) return;
    try {
      await log.mutateAsync({
        lead_id: current.id,
        type: "telefoon",
        uitkomst: uitkomst.label,
        notitie: notitie || null,
        duur_seconden: seconden,
      });
    } catch (e) {
      toast.error(
        `Notitie niet opgeslagen: ${e instanceof Error ? e.message : "onbekende fout"}. Je tekst blijft bewaard — probeer het opnieuw.`,
      );
      throw e;
    }
    await update.mutateAsync({ id: current.id, patch: { status: uitkomst.nextStatus } });
    // Sluit openstaande opvolg-taken voor deze lead — ze zijn nu opgevolgd.
    for (const t of huidigeTaken) {
      await voltooiTaak.mutateAsync(t.id).catch(() => undefined);
    }
    wisConcept();
    next();
  };

  /** Slimme afhandeling: dwingt afspraak/terugbel-popup af voordat de status wordt gezet. */
  const handleUitkomstSmart = async (uitkomst: typeof CONTACT_UITKOMST_OPTIES[number]) => {
    if (!current) return;
    if (busyRef.current) return;
    // Verloren: verplichte popup met categorie + reden.
    if (uitkomst.value === "niet_interessant") {
      setOpenVerloren(true);
      return;
    }
    const dialog = vereistDialog(uitkomst.value as UitkomstWaarde, current, terugbelAfspraken);
    if (dialog) {
      setAfspraakType(dialog);
      setPendingUitkomst(uitkomst);
      setOpenAfspraak(true);
      return;
    }
    await guard(async () => {
      await handleUitkomst(uitkomst);
      if (uitkomst.value === "voorstel") {
        toast.success("Status op 'voorstel verstuurd'. Open de lead om een offerte te maken.");
      }
    });
  };

  /** Knop "Demo inplannen" — opent direct demo-dialog en zet daarna status. */
  const handleDemoInplannen = () => {
    if (!current) return;
    setAfspraakType("demo");
    setPendingUitkomst({ value: "gesprek_gepland", label: "Demo gepland", nextStatus: "demo_gepland" });
    setOpenAfspraak(true);
  };

  /** Knop "Mail gestuurd → nabellen" — logt mailmoment en plant verplicht terugbelafspraak. */
  const handleMailGestuurd = async () => {
    if (!current) return;
    if (busyRef.current) return;
    await guard(async () => {
      await log.mutateAsync({
        lead_id: current.id,
        type: "email",
        uitkomst: "Mail gestuurd",
        notitie: notitie || null,
        duur_seconden: seconden,
      });
      toast.success("Mail gelogd — plan nu de nabel-afspraak");
      setAfspraakType("terugbel");
      setPendingUitkomst({ value: "terugbellen", label: "Nabellen na mail", nextStatus: "mail_gestuurd" });
      setOpenAfspraak(true);
    });
  };

  const onAfspraakSaved = async () => {
    const u = pendingUitkomst;
    setPendingUitkomst(null);
    if (u) {
      await handleUitkomst(u);
    } else {
      toast.success("Afspraak ingepland");
    }
  };

  const handleTrialGestart = async () => {
    if (!current) return;
    if (busyRef.current) return;
    await guard(async () => {
      await log.mutateAsync({
        lead_id: current.id,
        type: "telefoon",
        uitkomst: "Trial gestart",
        notitie: notitie || null,
        duur_seconden: seconden,
      });
      next();
    });
  };

  const tel = current ? telLink(current.telefoon) : null;
  const wa = current ? whatsappLink(current.telefoon) : null;
  const voortgangPct = belQueue.length > 0 ? Math.round((idx / belQueue.length) * 100) : 0;
  const fase = current ? pipelineConfig.find((f) => f.status_key === current.status) : null;

  return (
    <div className="p-6 space-y-4">
      <AffiliateSubnav />
      {/* Cockpit header */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <CardContent className="py-4 px-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                <Headphones className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold leading-tight">Belsessie</h1>
                <p className="text-xs text-muted-foreground">Focus op één lead tegelijk · cockpit-modus</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Voortgang</p>
                <p className="font-semibold tabular-nums">
                  {Math.min(idx + 1, belQueue.length)} / {belQueue.length}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Gebeld vandaag</p>
                <p className="font-semibold tabular-nums">{belStats?.vandaagGebeld ?? 0}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Afspraken</p>
                <p className="font-semibold tabular-nums text-emerald-600">{belStats?.vandaagAfspraken ?? 0}</p>
              </div>
            </div>
          </div>
          <Progress value={voortgangPct} className="h-1.5" />
          <BelQueueStrip queue={belQueue} huidigeIndex={idx} onKies={setIdx} />
        </CardContent>
      </Card>

      {!current ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-emerald-500" /><p className="font-medium text-foreground">Klaar! Geen leads meer in de belqueue.</p><p className="text-sm">Voeg nieuwe leads toe of claim uit de koude-leads pool.</p></CardContent></Card>
      ) : (
        <div className="grid lg:grid-cols-[1fr_320px] gap-4 items-start">
          <div className="space-y-4 min-w-0">
          <Card className="border-primary/20 bg-primary/[0.03]">
            <CardHeader className="flex flex-row justify-between items-start gap-4 pb-3">
              <div>
                <h2 className="text-3xl font-bold leading-tight tracking-tight">{current.bedrijfsnaam}</h2>
                {current.contactpersoon && <p className="text-muted-foreground mt-1 text-base">{current.contactpersoon}</p>}
                <div className="flex flex-wrap gap-2 mt-3">
                  {fase ? (
                    <Badge variant="outline" className={`gap-1.5 ${kleurBadge(fase.kleur)}`}>
                      <span className={`h-2 w-2 rounded-full ${kleurDot(fase.kleur)}`} />
                      {fase.label}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">{STATUS_LABEL[current.status]}</Badge>
                  )}
                  <TemperatuurBadge temperatuur={current.temperatuur as any} />
                  {current.branche && <Badge variant="secondary" className="gap-1"><Briefcase className="h-3 w-3" />{current.branche}</Badge>}
                  {current.regio && <Badge variant="secondary" className="gap-1"><MapPin className="h-3 w-3" />{current.regio}</Badge>}
                  {current.website && (
                    <a href={current.website.startsWith("http") ? current.website : `https://${current.website}`} target="_blank" rel="noreferrer">
                      <Badge variant="outline" className="gap-1 hover:bg-muted"><Globe className="h-3 w-3" />Website</Badge>
                    </a>
                  )}
                </div>
              </div>
              <GespreksTimer
                seconden={seconden}
                loopt={timerLoopt}
                onTick={setSeconden}
                onToggle={() => setTimerLoopt((v) => !v)}
                onReset={() => { setSeconden(0); setTimerLoopt(false); }}
              />
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Grote "Bel nu" CTA */}
              {tel ? (
                <a
                  href={tel}
                  className="flex items-center justify-center gap-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-5 text-2xl font-bold tracking-tight shadow-sm transition-colors"
                >
                  <Phone className="h-6 w-6" />
                  <span className="tabular-nums">{current.telefoon}</span>
                </a>
              ) : (
                <div className="rounded-lg border border-dashed bg-muted/40 px-6 py-5 text-center text-sm text-muted-foreground">
                  Geen telefoonnummer bekend voor deze lead.
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {wa && <Button asChild variant="outline" size="sm" className="text-emerald-700 border-emerald-300"><a href={wa} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4 mr-2" /> WhatsApp</a></Button>}
                {current.email && <Button asChild variant="outline" size="sm"><a href={`mailto:${current.email}`}><Mail className="h-4 w-4 mr-2" /> E-mail</a></Button>}
                <Button variant="outline" size="sm" onClick={() => setOpenTerugbel(true)}><CalendarPlus className="h-4 w-4 mr-2" /> Terugbel plannen</Button>
                <Button variant="outline" size="sm" onClick={() => setOpenVerrijk(true)} className="text-primary border-primary/40 hover:bg-primary/10">
                  <Sparkles className="h-4 w-4 mr-2" /> Verrijken
                </Button>
              </div>

              <Tabs defaultValue="gesprek" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="gesprek"><FileText className="h-3.5 w-3.5 mr-1.5" />Gesprek</TabsTrigger>
                  <TabsTrigger value="bedrijf"><Building2 className="h-3.5 w-3.5 mr-1.5" />Bedrijf</TabsTrigger>
                  <TabsTrigger value="historie"><HistoryIcon className="h-3.5 w-3.5 mr-1.5" />Historie</TabsTrigger>
                </TabsList>

                <TabsContent value="gesprek" className="space-y-3 pt-3">
                  <StatusKaart lead={current} afspraken={terugbelAfspraken} />
                  <BriefingKaart leadId={current.id} />
                  {historie.length > 0 && (
                    <div className="text-sm border rounded-md p-3 bg-muted/20">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                          <HistoryIcon className="h-3.5 w-3.5" /> Recente contactmomenten
                        </p>
                        <span className="text-[10px] text-muted-foreground">
                          {historie.length} totaal
                        </span>
                      </div>
                      <ul className="space-y-1.5">
                        {historie.slice(0, 3).map((c) => (
                          <li key={c.id} className="flex items-start gap-2 text-xs">
                            <Badge variant="outline" className="text-[10px] shrink-0">{c.type}</Badge>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                {c.uitkomst && <span className="font-medium truncate">{c.uitkomst}</span>}
                                <span className="text-muted-foreground shrink-0 text-[10px]">
                                  {new Date(c.created_at).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                              {c.notitie && <p className="text-muted-foreground line-clamp-2 mt-0.5">{c.notitie}</p>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {huidigeTaken.length > 0 && (
                    <div className="text-sm border rounded-md p-3 bg-primary/5 border-primary/20">
                      <p className="font-medium mb-2 text-xs uppercase tracking-wide text-primary">Openstaande opvolg-taken</p>
                      <ul className="space-y-1">
                        {huidigeTaken.map((t) => (
                          <li key={t.id} className="flex items-start gap-2">
                            <Badge variant="outline" className="text-xs">{t.type}</Badge>
                            <span className="flex-1">
                              <span className="font-medium">{t.titel}</span>
                              {t.notitie && <span className="text-muted-foreground"> — {t.notitie}</span>}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {current.ai_volgende_actie && (
                    <div className="text-sm border rounded-md p-3 bg-amber-50 border-amber-200">
                      <p className="font-medium mb-1 text-xs uppercase tracking-wide text-amber-700">AI-advies</p>
                      <p>{current.ai_volgende_actie}</p>
                      {current.ai_score != null && (
                        <p className="text-xs text-muted-foreground mt-1">Score: {current.ai_score}/100 · {current.ai_score_reden}</p>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium">Gespreksnotitie</label>
                    <Textarea rows={5} value={notitie} onChange={(e) => setNotitie(e.target.value)} placeholder="Wat is besproken?" />
                  </div>
                </TabsContent>

                <TabsContent value="bedrijf" className="pt-3 space-y-3">
                  {current.notities && (
                    <div className="text-sm border rounded-md p-3 bg-muted/30">
                      <p className="font-medium mb-1 text-xs uppercase tracking-wide text-muted-foreground">Lead-notities</p>
                      <p className="whitespace-pre-wrap">{current.notities}</p>
                    </div>
                  )}
                  <BedrijfSamenvattingKaart lead={current} />
                </TabsContent>

                <TabsContent value="historie" className="pt-3">
                  {historie.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">Nog geen eerdere contactmomenten.</p>
                  ) : (
                    <ul className="space-y-2">
                      {historie.map((c) => (
                        <li key={c.id} className="border rounded-md p-3 text-sm">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">{c.type}</Badge>
                              {c.uitkomst && <span className="text-xs font-medium">{c.uitkomst}</span>}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(c.created_at).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          {c.notitie && <p className="text-muted-foreground whitespace-pre-wrap">{c.notitie}</p>}
                        </li>
                      ))}
                    </ul>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          </div>

          {/* Soundboard sidebar — sticky */}
          <div className="lg:sticky lg:top-4">
            <Card className="border-2">
              <CardHeader className="pb-2 bg-muted/40 border-b">
                <CardTitle className="text-sm font-semibold">Volgende stap</CardTitle>
                <p className="text-[11px] text-muted-foreground">Kies hoe het gesprek eindigde</p>
              </CardHeader>
              <CardContent className="p-3 space-y-4">
                {/* Groep: Niet bereikt */}
                <UitkomstGroep titel="Niet bereikt">
                  <UitkomstKnop
                    icon={PhoneMissed}
                    label="Geen gehoor"
                    accent="muted"
                    onClick={() => handleUitkomstSmart(CONTACT_UITKOMST_OPTIES.find((u) => u.value === "geen_gehoor")!)}
                    disabled={busy}
                  />
                  <UitkomstKnop
                    icon={Phone}
                    label="Terugbellen"
                    hint="Verplicht inplannen"
                    accent="amber"
                    onClick={() => handleUitkomstSmart(CONTACT_UITKOMST_OPTIES.find((u) => u.value === "terugbellen")!)}
                    disabled={busy}
                  />
                  <UitkomstKnop
                    icon={Mail}
                    label="Mail gestuurd / nabellen"
                    hint="Logt mail + plant nabel"
                    accent="amber"
                    onClick={handleMailGestuurd}
                    disabled={busy}
                  />
                </UitkomstGroep>

                {/* Groep: Niet relevant */}
                <UitkomstGroep titel="Niet relevant">
                  <UitkomstKnop
                    icon={XCircle}
                    label="Niet interessant"
                    hint="Notitie verplicht"
                    accent="rose"
                    onClick={() => handleUitkomstSmart(CONTACT_UITKOMST_OPTIES.find((u) => u.value === "niet_interessant")!)}
                    disabled={busy}
                  />
                </UitkomstGroep>

                {/* Groep: Bereikt & vervolg */}
                <UitkomstGroep titel="Bereikt &amp; vervolg">
                  <UitkomstKnop
                    icon={Calendar}
                    label="Afspraak gepland"
                    hint="Check: staat de afspraak?"
                    accent="blue"
                    onClick={() => handleUitkomstSmart(CONTACT_UITKOMST_OPTIES.find((u) => u.value === "gesprek_gepland")!)}
                    disabled={busy}
                  />
                  <UitkomstKnop
                    icon={Presentation}
                    label="Demo inplannen"
                    hint="Plant demo + mail"
                    accent="blue"
                    onClick={handleDemoInplannen}
                    disabled={busy}
                  />
                  <UitkomstKnop
                    icon={FileText}
                    label="Voorstel doen"
                    accent="violet"
                    onClick={() => handleUitkomstSmart(CONTACT_UITKOMST_OPTIES.find((u) => u.value === "voorstel")!)}
                    disabled={busy}
                  />
                </UitkomstGroep>

                {/* Groep: Deal */}
                <UitkomstGroep titel="Deal">
                  <UitkomstKnop
                    icon={Trophy}
                    label="Gewonnen"
                    accent="emerald"
                    onClick={() => handleUitkomstSmart(CONTACT_UITKOMST_OPTIES.find((u) => u.value === "gewonnen")!)}
                    disabled={busy}
                  />
                  {current && (
                    <TrialStartenButton
                      lead={current}
                      variant="outline"
                      className="w-full justify-start h-10 text-sm font-medium hover:bg-primary/5 hover:text-primary hover:border-primary/40"
                      onStarted={handleTrialGestart}
                    />
                  )}
                </UitkomstGroep>

                <div className="pt-2 border-t">
                  <Button variant="ghost" className="w-full justify-start text-muted-foreground h-9" onClick={next}>
                    <SkipForward className="h-4 w-4 mr-2" /> Overslaan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      {current && (
        <TerugbelDialog
          open={openTerugbel}
          onOpenChange={setOpenTerugbel}
          leadId={current.id}
          leadNaam={current.bedrijfsnaam}
          klantEmail={current.email}
          affiliateId={current.eigenaar_id}
        />
      )}
      {current && (
        <TerugbelDialog
          open={openAfspraak}
          onOpenChange={(o) => {
            setOpenAfspraak(o);
            if (!o) setPendingUitkomst(null);
          }}
          leadId={current.id}
          leadNaam={current.bedrijfsnaam}
          klantEmail={current.email}
          afspraakType={afspraakType}
          affiliateId={current.eigenaar_id}
          onSaved={onAfspraakSaved}
        />
      )}
      {current && (
        <VerrijkLeadDialog open={openVerrijk} onOpenChange={setOpenVerrijk} lead={current} />
      )}
      {current && (
        <VerlorenRedenDialog
          open={openVerloren}
          onOpenChange={setOpenVerloren}
          leadId={current.id}
          leadNaam={current.bedrijfsnaam}
          onSaved={next}
        />
      )}
    </div>
  );
};

export default AffiliateBellen;