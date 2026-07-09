import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { type AffiliateLeadStatus } from "@/lib/affiliate/leadStatus";
import { useUpdateAffiliateLead, type AffiliateLead } from "@/hooks/affiliate/useAffiliateLeads";
import { useLeadBronnen } from "@/hooks/sales/useLeadBronnen";
import { useLeadContactpersonen } from "@/hooks/affiliate/useLeadContactpersonen";
import { useLeadNotities } from "@/hooks/affiliate/useLeadNotities";
import EmailTab from "@/components/email/EmailTab";
import EmailCompose from "@/components/email/EmailCompose";
import { TerugbelDialog } from "./TerugbelDialog";
import { VerrijkLeadDialog } from "./VerrijkLeadDialog";
import { VerlorenRedenDialog } from "./VerlorenRedenDialog";
import { AiOpvolgKaart } from "./AiOpvolgKaart";
import { BewerkBanner } from "./LeadDetail/BewerkBanner";
import { HistorieTab } from "./LeadDetail/HistorieTab";
import { LeadDetailHero } from "./LeadDetail/Hero";
import { LeadActiviteitenTijdlijn } from "./LeadDetail/Tijdlijn";
import { useLeadTijdlijn } from "./LeadDetail/Tijdlijn/useLeadTijdlijn";
import { LeadKlantStrip } from "./LeadDetail/LeadKlantStrip";
import { GekleurdeTabsList, TabCallout } from "./LeadDetail/GekleurdeTabsList";
import { NotitieLijst } from "./LeadDetail/NotitieLijst";
import { KlantStatusKaart } from "./LeadDetail/KlantStatusKaart";

const BRON_LABEL: Record<string, string> = {
  platform_pool: "Platform pool",
  eigen_import: "Eigen import",
  referral_klik: "Referral klik",
  sales_admin: "Sales admin",
};

interface Props { lead: AffiliateLead }

/**
 * Orchestrator voor de affiliate lead/klant-detailpagina.
 * Houdt alleen layout + dialog-state vast; alle blokken zijn losse componenten.
 */
export function LeadDetailBody({ lead }: Props) {
  const update = useUpdateAffiliateLead();
  const { data: bronnen = [] } = useLeadBronnen();
  const { data: contactpersonen = [] } = useLeadContactpersonen(lead.id);
  const contactEmails = Array.from(
    new Set(
      [lead.email, ...contactpersonen.map((c) => c.email)]
        .filter((e): e is string => !!e && e.trim().length > 0)
        .map((e) => e.trim().toLowerCase()),
    ),
  );
  const [status, setStatus] = useState<AffiliateLeadStatus>(lead.status as AffiliateLeadStatus);
  const [waarde, setWaarde] = useState(String(lead.geschatte_waarde ?? ""));
  const [temperatuur, setTemperatuur] = useState<string>(lead.temperatuur ?? "lauw");
  const [volgendeActie, setVolgendeActie] = useState<string>(lead.volgende_actie_datum ?? "");
  const [tags, setTags] = useState<string[]>(lead.tags ?? []);
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
    setTemperatuur(lead.temperatuur ?? "lauw");
    setVolgendeActie(lead.volgende_actie_datum ?? "");
    setTags(lead.tags ?? []);
  }, [lead.id, lead.status, lead.geschatte_waarde, lead.temperatuur, lead.volgende_actie_datum, lead.tags]);

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
  const { data: notitieEntries = [] } = useLeadNotities(lead.id);

  const tabCounts = {
    tijdlijn: tijdlijn.length,
    email: tijdlijn.filter((i) => i.type === "mail_in" || i.type === "mail_uit").length,
    notities: notitieEntries.length,
    opvolging: lead.ai_bedrijf_samenvatting ? 1 : 0,
    historie: tijdlijn.filter((i) => i.type === "status" || i.type === "veld").length,
  };

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
          temperatuur: temperatuur as AffiliateLead["temperatuur"],
          volgende_actie_datum: volgendeActie || null,
          tags,
        },
      });
      toast.success("Lead opgeslagen");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Opslaan mislukt");
    }
  };

  const tagsOpslaan = async (volgendeTags: string[]) => {
    const vorigeTags = tags;
    setTags(volgendeTags);
    try {
      await update.mutateAsync({ id: lead.id, patch: { tags: volgendeTags } });
      toast.success("Tags bijgewerkt");
    } catch {
      setTags(vorigeTags);
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
    <div className="space-y-4 min-w-0 w-full">
      <BewerkBanner leadId={lead.id} eigenaarId={lead.eigenaar_id} />

      <LeadDetailHero
        lead={lead}
        bronLabel={bronLabel}
        tijdlijn={tijdlijn}
        gewonnenPartnerId={gewonnenPartnerId}
        trialEinddatum={partnerInfo?.trial_einddatum ?? null}
        onActie={onActie}
      />

      <KlantStatusKaart leadId={lead.id} />

      <LeadKlantStrip
        lead={lead}
        bronLabel={bronLabel}
        status={status}
        setStatus={setStatus}
        temperatuur={temperatuur}
        setTemperatuur={setTemperatuur}
        waarde={waarde}
        setWaarde={setWaarde}
        volgendeActie={volgendeActie}
        setVolgendeActie={setVolgendeActie}
        tags={tags}
        onTagsOpslaan={tagsOpslaan}
        isPending={update.isPending}
        onOpslaan={opslaan}
        gewonnenPartnerId={gewonnenPartnerId}
      />

      <section className="min-w-0">
        <Tabs value={tab} onValueChange={setTab}>
          <GekleurdeTabsList counts={tabCounts} />

          <TabsContent value="tijdlijn" className="mt-4 space-y-3 min-w-0">
            <TabCallout tab="tijdlijn" />
            <LeadActiviteitenTijdlijn leadId={lead.id} email={lead.email} />
          </TabsContent>

          <TabsContent value="email" className="mt-4 space-y-3 min-w-0">
            <TabCallout tab="email" />
            <EmailTab
              affiliateLeadId={lead.id}
              email={lead.email ?? undefined}
              emails={contactEmails}
            />
          </TabsContent>

          <TabsContent value="notities" className="mt-4 space-y-3 min-w-0">
            <TabCallout tab="notities" />
            <NotitieLijst leadId={lead.id} />
          </TabsContent>

          <TabsContent value="opvolging" className="mt-4 space-y-3 min-w-0">
            <TabCallout
              tab="opvolging"
              actie={
                <Button size="sm" variant="outline" onClick={() => setOpenVerrijk(true)}>
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Verrijk
                </Button>
              }
            />
            <AiOpvolgKaart lead={lead} />
            {lead.ai_bedrijf_samenvatting && (
              <div className="rounded-xl border bg-card p-4 border-l-4 border-l-emerald-400">
                <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" /> AI-bedrijfssamenvatting
                </h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.ai_bedrijf_samenvatting}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="historie" className="mt-4 space-y-3 min-w-0">
            <TabCallout tab="historie" />
            <div className="rounded-xl border bg-card p-4">
              <HistorieTab leadId={lead.id} />
            </div>
          </TabsContent>
        </Tabs>
      </section>

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
