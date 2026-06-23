import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Phone, Mail, SkipForward, CheckCircle2, XCircle, Calendar, FileText, Clock, MessageCircle, CalendarPlus, Globe, MapPin, Briefcase, Headphones, History as HistoryIcon, Building2 } from "lucide-react";
import { AffiliateSubnav } from "@/components/affiliate/AffiliateSubnav";
import { useAffiliateLeads, useUpdateAffiliateLead, type AffiliateLead } from "@/hooks/affiliate/useAffiliateLeads";
import { useLogContactmoment, useLeadContactmomenten } from "@/hooks/affiliate/useAffiliateLeadContact";
import { useTerugbelAfspraken } from "@/hooks/affiliate/useTerugbelAfspraken";
import { useOpvolgTaken, useVoltooiOpvolgTaak } from "@/hooks/affiliate/useOpvolgTaken";
import { CONTACT_UITKOMST_OPTIES } from "@/lib/affiliate/leadStatus";
import { telLink, whatsappLink } from "@/lib/affiliate/contact";
import { TerugbelDialog } from "@/components/affiliate/TerugbelDialog";
import { TrialStartenButton } from "@/components/affiliate/TrialStartenButton";
import { useBelStats } from "@/hooks/affiliate/useBelStats";
import { BedrijfSamenvattingKaart } from "@/components/affiliate/BedrijfSamenvattingKaart";
import { BelQueueStrip } from "@/components/affiliate/BelQueueStrip";

const AffiliateBellen = () => {
  const { data: leads = [] } = useAffiliateLeads("mine");
  const { data: terugbelAfspraken = [] } = useTerugbelAfspraken("open");
  const { data: opvolgTaken = [] } = useOpvolgTaken("open");
  const voltooiTaak = useVoltooiOpvolgTaak();
  const update = useUpdateAffiliateLead();
  const log = useLogContactmoment();
  const { data: belStats } = useBelStats();
  const [notitie, setNotitie] = useState("");
  const [idx, setIdx] = useState(0);
  const [seconden, setSeconden] = useState(0);
  const tickRef = useRef<number | null>(null);
  const [openTerugbel, setOpenTerugbel] = useState(false);

  const belQueue = useMemo(() => {
    const vandaag = new Date(); vandaag.setHours(23, 59, 59, 999);
    const dueLeadIds = new Set(
      terugbelAfspraken
        .filter((a) => new Date(a.geplande_op) <= vandaag)
        .map((a) => a.lead_id),
    );
    for (const t of opvolgTaken) {
      if (!t.lead_id) continue;
      if (new Date(t.due_op) <= vandaag) dueLeadIds.add(t.lead_id);
    }
    return leads.filter((l) => {
      if (dueLeadIds.has(l.id)) return true;
      if (l.status !== "nieuw" && l.status !== "gebeld_geen_gehoor") return false;
      if (!l.volgende_actie_datum) return true;
      return new Date(l.volgende_actie_datum) <= vandaag;
    });
  }, [leads, terugbelAfspraken, opvolgTaken]);

  const current: AffiliateLead | undefined = belQueue[idx];
  const { data: historie = [] } = useLeadContactmomenten(current?.id);

  const huidigeTaken = useMemo(() => {
    if (!current) return [];
    const vandaag = new Date(); vandaag.setHours(23, 59, 59, 999);
    return opvolgTaken.filter((t) => t.lead_id === current.id && new Date(t.due_op) <= vandaag);
  }, [opvolgTaken, current]);

  useEffect(() => { setSeconden(0); }, [current?.id]);

  useEffect(() => {
    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = window.setInterval(() => setSeconden((s) => s + 1), 1000) as unknown as number;
    return () => { if (tickRef.current) window.clearInterval(tickRef.current); };
  }, []);

  const next = () => {
    setNotitie("");
    setIdx((i) => Math.min(i + 1, belQueue.length));
  };

  const handleUitkomst = async (uitkomst: { value: string; label: string; nextStatus: AffiliateLead["status"] }) => {
    if (!current) return;
    await log.mutateAsync({
      lead_id: current.id,
      type: "telefoon",
      uitkomst: uitkomst.label,
      notitie: notitie || null,
      duur_seconden: seconden,
    });
    await update.mutateAsync({ id: current.id, patch: { status: uitkomst.nextStatus } });
    // Sluit openstaande opvolg-taken voor deze lead — ze zijn nu opgevolgd.
    for (const t of huidigeTaken) {
      await voltooiTaak.mutateAsync(t.id).catch(() => undefined);
    }
    next();
  };

  const handleTrialGestart = async () => {
    if (!current) return;
    await log.mutateAsync({
      lead_id: current.id,
      type: "telefoon",
      uitkomst: "Trial gestart",
      notitie: notitie || null,
      duur_seconden: seconden,
    });
    next();
  };

  const formatTimer = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const tel = current ? telLink(current.telefoon) : null;
  const wa = current ? whatsappLink(current.telefoon) : null;
  const voortgangPct = belQueue.length > 0 ? Math.round((idx / belQueue.length) * 100) : 0;

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
                  {current.branche && <Badge variant="secondary" className="gap-1"><Briefcase className="h-3 w-3" />{current.branche}</Badge>}
                  {current.regio && <Badge variant="secondary" className="gap-1"><MapPin className="h-3 w-3" />{current.regio}</Badge>}
                  {current.website && (
                    <a href={current.website.startsWith("http") ? current.website : `https://${current.website}`} target="_blank" rel="noreferrer">
                      <Badge variant="outline" className="gap-1 hover:bg-muted"><Globe className="h-3 w-3" />Website</Badge>
                    </a>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Gesprekstijd</p>
                <p className="text-2xl font-bold tabular-nums text-primary flex items-center gap-1.5 justify-end">
                  <Clock className="h-4 w-4" /> {formatTimer(seconden)}
                </p>
              </div>
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
              </div>

              <Tabs defaultValue="gesprek" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="gesprek"><FileText className="h-3.5 w-3.5 mr-1.5" />Gesprek</TabsTrigger>
                  <TabsTrigger value="bedrijf"><Building2 className="h-3.5 w-3.5 mr-1.5" />Bedrijf</TabsTrigger>
                  <TabsTrigger value="historie"><HistoryIcon className="h-3.5 w-3.5 mr-1.5" />Historie</TabsTrigger>
                </TabsList>

                <TabsContent value="gesprek" className="space-y-3 pt-3">
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
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Hoe ging het?</CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-1.5">
                {CONTACT_UITKOMST_OPTIES.map((u) => {
                  const Icon = u.value === "gewonnen" ? CheckCircle2 : u.value === "niet_interessant" ? XCircle : u.value === "gesprek_gepland" ? Calendar : u.value === "voorstel" ? FileText : Phone;
                  const accent =
                    u.value === "gewonnen" ? "hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300" :
                    u.value === "niet_interessant" ? "hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300" :
                    u.value === "gesprek_gepland" ? "hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300" :
                    u.value === "voorstel" ? "hover:bg-violet-50 hover:text-violet-700 hover:border-violet-300" :
                    "hover:bg-muted";
                  return (
                    <Button
                      key={u.value}
                      variant="outline"
                      className={`w-full justify-start h-11 text-sm font-medium transition-colors ${accent}`}
                      onClick={() => handleUitkomst(u)}
                    >
                      <Icon className="h-4 w-4 mr-2.5 shrink-0" /> {u.label}
                    </Button>
                  );
                })}
                {current && (
                  <TrialStartenButton
                    lead={current}
                    variant="outline"
                    className="w-full justify-start h-11 text-sm font-medium hover:bg-primary/5 hover:text-primary hover:border-primary/40"
                    onStarted={handleTrialGestart}
                  />
                )}
                <div className="pt-2 mt-2 border-t">
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
        <TerugbelDialog open={openTerugbel} onOpenChange={setOpenTerugbel} leadId={current.id} leadNaam={current.bedrijfsnaam} />
      )}
    </div>
  );
};

export default AffiliateBellen;