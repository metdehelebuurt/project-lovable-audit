import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, SkipForward, CheckCircle2, XCircle, Calendar, FileText, Clock, MessageCircle, CalendarPlus, Globe, MapPin, Briefcase } from "lucide-react";
import { AffiliateSubnav } from "@/components/affiliate/AffiliateSubnav";
import { useAffiliateLeads, useUpdateAffiliateLead, type AffiliateLead } from "@/hooks/affiliate/useAffiliateLeads";
import { useLogContactmoment } from "@/hooks/affiliate/useAffiliateLeadContact";
import { useTerugbelAfspraken } from "@/hooks/affiliate/useTerugbelAfspraken";
import { useOpvolgTaken, useVoltooiOpvolgTaak } from "@/hooks/affiliate/useOpvolgTaken";
import { CONTACT_UITKOMST_OPTIES } from "@/lib/affiliate/leadStatus";
import { telLink, whatsappLink } from "@/lib/affiliate/contact";
import { TerugbelDialog } from "@/components/affiliate/TerugbelDialog";
import { TrialStartenButton } from "@/components/affiliate/TrialStartenButton";
import { BelStatsBalk } from "@/components/affiliate/BelStatsBalk";
import { BedrijfSamenvattingKaart } from "@/components/affiliate/BedrijfSamenvattingKaart";

const AffiliateBellen = () => {
  const { data: leads = [] } = useAffiliateLeads("mine");
  const { data: terugbelAfspraken = [] } = useTerugbelAfspraken("open");
  const { data: opvolgTaken = [] } = useOpvolgTaken("open");
  const voltooiTaak = useVoltooiOpvolgTaak();
  const update = useUpdateAffiliateLead();
  const log = useLogContactmoment();
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

  return (
    <div className="p-6">
      <AffiliateSubnav />
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Belwerkbank</h1>
          <p className="text-sm text-muted-foreground">{belQueue.length} leads klaar om te bellen vandaag</p>
        </div>
      </div>
      <div className="mb-4">
        <BelStatsBalk queueCount={belQueue.length} />
      </div>

      {!current ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-emerald-500" /><p className="font-medium text-foreground">Klaar! Geen leads meer in de belqueue.</p><p className="text-sm">Voeg nieuwe leads toe of claim uit de koude-leads pool.</p></CardContent></Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4 items-start">
          <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row justify-between items-start">
              <div>
                <CardTitle>{current.bedrijfsnaam}</CardTitle>
                {current.contactpersoon && <p className="text-muted-foreground mt-1">{current.contactpersoon}</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  {current.branche && <Badge variant="secondary" className="gap-1"><Briefcase className="h-3 w-3" />{current.branche}</Badge>}
                  {current.regio && <Badge variant="secondary" className="gap-1"><MapPin className="h-3 w-3" />{current.regio}</Badge>}
                  {current.website && (
                    <a href={current.website.startsWith("http") ? current.website : `https://${current.website}`} target="_blank" rel="noreferrer">
                      <Badge variant="outline" className="gap-1 hover:bg-muted"><Globe className="h-3 w-3" />Website</Badge>
                    </a>
                  )}
                </div>
              </div>
              <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> {formatTimer(seconden)}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {tel && <Button asChild className="bg-emerald-600 hover:bg-emerald-700"><a href={tel}><Phone className="h-4 w-4 mr-2" /> {current.telefoon}</a></Button>}
                {wa && <Button asChild variant="outline" className="text-emerald-700 border-emerald-300"><a href={wa} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4 mr-2" /> WhatsApp</a></Button>}
                {current.email && <Button asChild variant="outline"><a href={`mailto:${current.email}`}><Mail className="h-4 w-4 mr-2" /> E-mail</a></Button>}
                <Button variant="outline" onClick={() => setOpenTerugbel(true)}><CalendarPlus className="h-4 w-4 mr-2" /> Terugbel plannen</Button>
              </div>
              {current.notities && (
                <div className="text-sm border rounded-md p-3 bg-muted/30">
                  <p className="font-medium mb-1 text-xs uppercase tracking-wide text-muted-foreground">Eerdere notities</p>
                  <p className="whitespace-pre-wrap">{current.notities}</p>
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
                <Textarea rows={4} value={notitie} onChange={(e) => setNotitie(e.target.value)} placeholder="Wat is besproken?" />
              </div>
            </CardContent>
          </Card>
          <BedrijfSamenvattingKaart lead={current} />
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Uitkomst</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {CONTACT_UITKOMST_OPTIES.map((u) => {
                const Icon = u.value === "gewonnen" ? CheckCircle2 : u.value === "niet_interessant" ? XCircle : u.value === "gesprek_gepland" ? Calendar : u.value === "voorstel" ? FileText : Phone;
                return (
                  <Button key={u.value} variant="outline" className="w-full justify-start" onClick={() => handleUitkomst(u)}>
                    <Icon className="h-4 w-4 mr-2" /> {u.label}
                  </Button>
                );
              })}
              {current && (
                <TrialStartenButton
                  lead={current}
                  variant="outline"
                  className="w-full justify-start"
                  onStarted={handleTrialGestart}
                />
              )}
              <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={next}>
                <SkipForward className="h-4 w-4 mr-2" /> Overslaan
              </Button>
              <p className="text-xs text-muted-foreground text-center pt-2">{idx + 1} / {belQueue.length}</p>
            </CardContent>
          </Card>
        </div>
      )}
      {current && (
        <TerugbelDialog open={openTerugbel} onOpenChange={setOpenTerugbel} leadId={current.id} leadNaam={current.bedrijfsnaam} />
      )}
    </div>
  );
};

export default AffiliateBellen;