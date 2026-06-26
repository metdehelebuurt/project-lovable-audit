import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, Globe, Save, Activity, MailOpen, StickyNote, Sparkles, History, Star, CalendarClock, Rocket } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_LABEL, STATUS_VOLGORDE, type AffiliateLeadStatus } from "@/lib/affiliate/leadStatus";
import { useUpdateAffiliateLead, type AffiliateLead } from "@/hooks/affiliate/useAffiliateLeads";
import { useLeadBronnen } from "@/hooks/sales/useLeadBronnen";
import EmailTab from "@/components/email/EmailTab";
import EmailCompose from "@/components/email/EmailCompose";
import { TerugbelDialog } from "./TerugbelDialog";
import { TrialStartenButton } from "./TrialStartenButton";
import { VerrijkLeadDialog } from "./VerrijkLeadDialog";
import { VerlorenRedenDialog } from "./VerlorenRedenDialog";
import { AiOpvolgKaart } from "./AiOpvolgKaart";
import { ContactpersonenKaart } from "./LeadDetail/ContactpersonenKaart";
import { BedrijfsKaartUitgebreid } from "./LeadDetail/BedrijfsKaartUitgebreid";
import { BewerkBanner } from "./LeadDetail/BewerkBanner";
import { HistorieTab } from "./LeadDetail/HistorieTab";
import { LeadDetailHero } from "./LeadDetail/Hero";
import { LeadActiviteitenTijdlijn } from "./LeadDetail/Tijdlijn";
import { useLeadTijdlijn } from "./LeadDetail/Tijdlijn/useLeadTijdlijn";

const BRON_LABEL: Record<string, string> = {
  platform_pool: "Platform pool",
  eigen_import: "Eigen import",
  referral_klik: "Referral klik",
  sales_admin: "Sales admin",
};

const TEMP_OPTIES = [
  { value: "koud", label: "Koud" },
  { value: "lauw", label: "Lauw" },
  { value: "warm", label: "Warm" },
  { value: "heet", label: "Heet" },
];

interface Props { lead: AffiliateLead }

/**
 * Orchestrator voor de affiliate lead/klant-detailpagina.
 * Houdt alleen layout + dialog-state vast; alle blokken zijn losse componenten.
 */
export function LeadDetailBody({ lead }: Props) {
  const update = useUpdateAffiliateLead();
  const { data: bronnen = [] } = useLeadBronnen();
  const [status, setStatus] = useState<AffiliateLeadStatus>(lead.status as AffiliateLeadStatus);
  const [waarde, setWaarde] = useState(String(lead.geschatte_waarde ?? ""));
  const [notitie, setNotitie] = useState(lead.notities ?? "");
  const [temperatuur, setTemperatuur] = useState<string>(lead.temperatuur ?? "lauw");
  const [volgendeActie, setVolgendeActie] = useState<string>(lead.volgende_actie_datum ?? "");
  const [openTerugbel, setOpenTerugbel] = useState(false);
  const [openDemo, setOpenDemo] = useState(false);
  const [openOrder, setOpenOrder] = useState(false);
  const [openVerrijk, setOpenVerrijk] = useState(false);
  const [openVerloren, setOpenVerloren] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") ?? "tijdlijn";
  const setTab = (v: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", v);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    setStatus(lead.status as AffiliateLeadStatus);
    setWaarde(String(lead.geschatte_waarde ?? ""));
    setNotitie(lead.notities ?? "");
    setTemperatuur(lead.temperatuur ?? "lauw");
    setVolgendeActie(lead.volgende_actie_datum ?? "");
  }, [lead.id, lead.status, lead.geschatte_waarde, lead.notities, lead.temperatuur, lead.volgende_actie_datum]);

  const gewonnenPartnerId = (lead as unknown as { gewonnen_partner_id?: string | null }).gewonnen_partner_id ?? null;
  const bronRecord = bronnen.find((b) => b.id === lead.bron_id);
  const bronLabel = bronRecord?.label ?? (lead.bron ? BRON_LABEL[lead.bron] ?? lead.bron : null);

  const { data: partnerInfo } = useQuery({
    queryKey: ["affiliate-lead-partner", gewonnenPartnerId],
    enabled: !!gewonnenPartnerId,
    queryFn: async () => {
      const { data } = await supabase.from("partners").select("trial_einddatum").eq("id", gewonnenPartnerId!).maybeSingle();
      return data;
    },
  });

  const { data: tijdlijn = [] } = useLeadTijdlijn({ leadId: lead.id, email: lead.email });

  const opslaan = async () => {
    try {
      if (status === "verloren" && lead.status !== "verloren") {
        setOpenVerloren(true);
        return;
      }
      await update.mutateAsync({
        id: lead.id,
        patch: {
          status,
          geschatte_waarde: parseFloat(waarde) || 0,
          notities: notitie,
          temperatuur: temperatuur as AffiliateLead["temperatuur"],
          volgende_actie_datum: volgendeActie || null,
        },
      });
      toast.success("Lead opgeslagen");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Opslaan mislukt");
    }
  };

  const onActie = (a: "terugbel" | "demo" | "order" | "verrijken" | "ai") => {
    if (a === "terugbel") setOpenTerugbel(true);
    else if (a === "demo") setOpenDemo(true);
    else if (a === "order") setOpenOrder(true);
    else if (a === "verrijken") setOpenVerrijk(true);
    else if (a === "ai") setTab("opvolging");
  };

  return (
    <div className="space-y-5">
      <BewerkBanner leadId={lead.id} eigenaarId={lead.eigenaar_id} />

      <LeadDetailHero
        lead={lead}
        bronLabel={bronLabel}
        tijdlijn={tijdlijn}
        gewonnenPartnerId={gewonnenPartnerId}
        trialEinddatum={partnerInfo?.trial_einddatum ?? null}
        onActie={onActie}
      />

      <div className="grid gap-5 lg:grid-cols-[340px,1fr]">
        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Star className="h-4 w-4 text-muted-foreground" /> Sales kerngegevens
            </h3>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as AffiliateLeadStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_VOLGORDE.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Temperatuur</Label>
                <Select value={temperatuur} onValueChange={setTemperatuur}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TEMP_OPTIES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Waarde (€)</Label>
                <Input type="number" value={waarde} onChange={(e) => setWaarde(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1"><CalendarClock className="h-3 w-3" /> Volgende actie</Label>
              <Input type="date" value={volgendeActie} onChange={(e) => setVolgendeActie(e.target.value)} />
            </div>
            <Button onClick={opslaan} disabled={update.isPending} className="w-full" size="sm">
              <Save className="h-4 w-4 mr-2" /> Opslaan
            </Button>
          </div>

          <div className="rounded-lg border bg-card p-4 space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" /> Hoofdcontact
            </h3>
            <dl className="text-sm space-y-1.5">
              <Rij icon={<Phone className="h-3.5 w-3.5" />} label="Telefoon" value={lead.telefoon} />
              <Rij icon={<Mail className="h-3.5 w-3.5" />} label="E-mail" value={lead.email} />
              <Rij icon={<Globe className="h-3.5 w-3.5" />} label="Website" value={lead.website} />
            </dl>
          </div>

          <ContactpersonenKaart leadId={lead.id} />

          <BedrijfsKaartUitgebreid lead={lead} bronLabel={bronLabel} />

          {!gewonnenPartnerId && (
            <div className="rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-4 space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Rocket className="h-4 w-4 text-primary" /> Klaar om te starten?
              </p>
              <p className="text-xs text-muted-foreground">
                Start een 30-daagse trial op naam van deze klant.
              </p>
              <TrialStartenButton lead={lead} size="sm" />
            </div>
          )}
        </aside>

        <section>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-5 h-auto">
              <TabsTrigger value="tijdlijn" className="text-xs sm:text-sm">
                <Activity className="h-3.5 w-3.5 mr-1.5" /> Tijdlijn
              </TabsTrigger>
              <TabsTrigger value="email" className="text-xs sm:text-sm">
                <MailOpen className="h-3.5 w-3.5 mr-1.5" /> E-mail
              </TabsTrigger>
              <TabsTrigger value="notities" className="text-xs sm:text-sm">
                <StickyNote className="h-3.5 w-3.5 mr-1.5" /> Notities
              </TabsTrigger>
              <TabsTrigger value="opvolging" className="text-xs sm:text-sm">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Opvolging
              </TabsTrigger>
              <TabsTrigger value="historie" className="text-xs sm:text-sm">
                <History className="h-3.5 w-3.5 mr-1.5" /> Historie
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tijdlijn" className="mt-4">
              <LeadActiviteitenTijdlijn leadId={lead.id} email={lead.email} />
            </TabsContent>

            <TabsContent value="email" className="mt-4 space-y-2">
              <p className="text-xs text-muted-foreground">
                In- en uitgaande mails vanuit je gekoppelde Gmail/Outlook.
              </p>
              <EmailTab affiliateLeadId={lead.id} email={lead.email ?? undefined} />
            </TabsContent>

            <TabsContent value="notities" className="mt-4">
              <div className="rounded-lg border bg-card p-4 space-y-2">
                <Label>Interne notities</Label>
                <Textarea
                  rows={14}
                  value={notitie}
                  onChange={(e) => setNotitie(e.target.value)}
                  onBlur={opslaan}
                  placeholder="Korte interne notities — automatisch opgeslagen na verlaten van veld"
                />
                <p className="text-xs text-muted-foreground">Wordt automatisch opgeslagen.</p>
              </div>
            </TabsContent>

            <TabsContent value="opvolging" className="mt-4 space-y-4">
              <AiOpvolgKaart lead={lead} />
              {lead.ai_bedrijf_samenvatting && (
                <div className="rounded-lg border bg-card p-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-primary" /> AI-bedrijfssamenvatting
                  </h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.ai_bedrijf_samenvatting}</p>
                </div>
              )}
              <Button variant="outline" onClick={() => setOpenVerrijk(true)} className="w-full">
                <Sparkles className="h-4 w-4 mr-2" /> Verrijk lead opnieuw met AI
              </Button>
            </TabsContent>

            <TabsContent value="historie" className="mt-4">
              <div className="rounded-lg border bg-card p-4">
                <HistorieTab leadId={lead.id} />
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </div>

      <TerugbelDialog open={openTerugbel} onOpenChange={setOpenTerugbel} leadId={lead.id} leadNaam={lead.bedrijfsnaam} klantEmail={lead.email} affiliateId={lead.eigenaar_id} />
      <TerugbelDialog open={openDemo} onOpenChange={setOpenDemo} leadId={lead.id} leadNaam={lead.bedrijfsnaam} klantEmail={lead.email} afspraakType="demo" affiliateId={lead.eigenaar_id} />
      <VerrijkLeadDialog open={openVerrijk} onOpenChange={setOpenVerrijk} lead={lead} />
      <VerlorenRedenDialog
        open={openVerloren}
        onOpenChange={(o) => { setOpenVerloren(o); if (!o) setStatus(lead.status as AffiliateLeadStatus); }}
        leadId={lead.id}
        leadNaam={lead.bedrijfsnaam}
      />
      <EmailCompose
        open={openOrder}
        onOpenChange={setOpenOrder}
        defaultTo={lead.email ?? ""}
        defaultSubject={`Orderbevestiging mijnhuis.nu — ${lead.bedrijfsnaam}`}
        defaultBody={`Beste ${lead.contactpersoon ?? "klant"},\n\nHartelijk dank voor je vertrouwen in mijnhuis.nu. Hierbij bevestigen we je order voor ${lead.bedrijfsnaam}.\n\nWelkom bij mijnhuis.nu!`}
        affiliateLeadId={lead.id}
      />
    </div>
  );
}

function Rij({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div>
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="break-all">{value}</dd>
      </div>
    </div>
  );
}