import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, Globe, Save, MessageSquarePlus, MessageCircle, CalendarPlus, Presentation, FileCheck2 } from "lucide-react";
import { useState, useEffect } from "react";
import { STATUS_LABEL, STATUS_VOLGORDE, type AffiliateLeadStatus } from "@/lib/affiliate/leadStatus";
import { useUpdateAffiliateLead, type AffiliateLead } from "@/hooks/affiliate/useAffiliateLeads";
import { useLeadContactmomenten, useLogContactmoment } from "@/hooks/affiliate/useAffiliateLeadContact";
import { telLink, whatsappLink } from "@/lib/affiliate/contact";
import { TerugbelDialog } from "./TerugbelDialog";
import { TrialStartenButton } from "./TrialStartenButton";
import { TrialStatusBadge } from "./TrialStatusBadge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import EmailTab from "@/components/email/EmailTab";
import EmailCompose from "@/components/email/EmailCompose";
import { AiOpvolgKaart } from "./AiOpvolgKaart";

interface Props {
  lead: AffiliateLead;
}

export function LeadDetailBody({ lead }: Props) {
  const update = useUpdateAffiliateLead();
  const log = useLogContactmoment();
  const { data: history = [] } = useLeadContactmomenten(lead.id);
  const [status, setStatus] = useState<AffiliateLeadStatus>(lead.status as AffiliateLeadStatus);
  const [waarde, setWaarde] = useState(String(lead.geschatte_waarde ?? ""));
  const [notitie, setNotitie] = useState(lead.notities ?? "");
  const [contactNotitie, setContactNotitie] = useState("");
  const [openTerugbel, setOpenTerugbel] = useState(false);
  const [openDemo, setOpenDemo] = useState(false);
  const [openOrder, setOpenOrder] = useState(false);

  useEffect(() => {
    setStatus(lead.status as AffiliateLeadStatus);
    setWaarde(String(lead.geschatte_waarde ?? ""));
    setNotitie(lead.notities ?? "");
    setContactNotitie("");
  }, [lead.id, lead.status, lead.geschatte_waarde, lead.notities]);

  const tel = telLink(lead.telefoon);
  const wa = whatsappLink(lead.telefoon);
  const gewonnenPartnerId = (lead as unknown as { gewonnen_partner_id?: string | null }).gewonnen_partner_id ?? null;

  const { data: partnerInfo } = useQuery({
    queryKey: ["affiliate-lead-partner", gewonnenPartnerId],
    enabled: !!gewonnenPartnerId,
    queryFn: async () => {
      const { data } = await supabase.from("partners").select("trial_einddatum").eq("id", gewonnenPartnerId!).maybeSingle();
      return data;
    },
  });

  const opslaan = async () => {
    await update.mutateAsync({
      id: lead.id,
      patch: { status, geschatte_waarde: parseFloat(waarde) || 0, notities: notitie },
    });
  };

  const logGesprek = async () => {
    if (!contactNotitie.trim()) return;
    await log.mutateAsync({ lead_id: lead.id, type: "telefoon", notitie: contactNotitie, uitkomst: "gelogd" });
    setContactNotitie("");
  };

  return (
    <div className="space-y-5">
      {lead.contactpersoon && <Badge variant="outline">{lead.contactpersoon}</Badge>}
      {gewonnenPartnerId && <TrialStatusBadge trialEinddatum={partnerInfo?.trial_einddatum ?? null} />}
      {!gewonnenPartnerId && (
        <div className="rounded-md border border-primary/20 bg-primary/5 p-3 flex items-center justify-between gap-3">
          <div className="text-sm">
            <p className="font-medium">Klaar om te starten?</p>
            <p className="text-xs text-muted-foreground">Start direct een 30-daagse trial voor deze klant.</p>
          </div>
          <TrialStartenButton lead={lead} size="sm" />
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {tel && <Button asChild size="sm" variant="outline"><a href={tel}><Phone className="h-4 w-4 mr-1" />{lead.telefoon}</a></Button>}
        {wa && <Button asChild size="sm" variant="outline" className="text-emerald-700 border-emerald-300"><a href={wa} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4 mr-1" />WhatsApp</a></Button>}
        {lead.email && <Button asChild size="sm" variant="outline"><a href={`mailto:${lead.email}`}><Mail className="h-4 w-4 mr-1" />{lead.email}</a></Button>}
        {lead.website && <Button asChild size="sm" variant="outline"><a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer"><Globe className="h-4 w-4 mr-1" />Website</a></Button>}
        <Button size="sm" variant="outline" onClick={() => setOpenTerugbel(true)}><CalendarPlus className="h-4 w-4 mr-1" /> Terugbel plannen</Button>
        <Button size="sm" variant="outline" onClick={() => setOpenDemo(true)}><Presentation className="h-4 w-4 mr-1" /> Demo inplannen</Button>
        <Button size="sm" variant="outline" onClick={() => setOpenOrder(true)} disabled={!lead.email}><FileCheck2 className="h-4 w-4 mr-1" /> Orderbevestiging sturen</Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as AffiliateLeadStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_VOLGORDE.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Geschatte waarde (€)</Label>
          <Input type="number" value={waarde} onChange={(e) => setWaarde(e.target.value)} />
        </div>
      </div>

      <div>
        <Label>Notities</Label>
        <Textarea rows={3} value={notitie} onChange={(e) => setNotitie(e.target.value)} />
      </div>

      <Button onClick={opslaan} disabled={update.isPending} className="w-full">
        <Save className="h-4 w-4 mr-2" /> Opslaan
      </Button>

      <AiOpvolgKaart lead={lead} />

      <div className="border-t pt-4 space-y-2">
        <Label className="flex items-center gap-2"><MessageSquarePlus className="h-4 w-4" /> Gespreksnotitie loggen</Label>
        <Textarea rows={2} value={contactNotitie} onChange={(e) => setContactNotitie(e.target.value)} placeholder="Wat besproken, vervolgactie..." />
        <Button size="sm" onClick={logGesprek} disabled={!contactNotitie.trim() || log.isPending}>Loggen</Button>
      </div>

      {history.length > 0 && (
        <div className="space-y-2">
          <Label>Geschiedenis</Label>
          {history.map((h) => (
            <div key={h.id} className="text-sm border rounded-md p-2 bg-muted/30">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{h.type} {h.uitkomst ? `· ${h.uitkomst}` : ""}</span>
                <span>{new Date(h.created_at).toLocaleString("nl-NL")}</span>
              </div>
              {h.notitie && <p className="mt-1 whitespace-pre-wrap">{h.notitie}</p>}
            </div>
          ))}
        </div>
      )}

      <div className="border-t pt-4 space-y-2">
        <Label>E-mails</Label>
        <p className="text-xs text-muted-foreground">
          In- en uitgaande mails vanuit jouw gekoppelde Gmail/Outlook worden hier automatisch getoond.
        </p>
        <EmailTab affiliateLeadId={lead.id} email={lead.email ?? undefined} />
      </div>
      <TerugbelDialog open={openTerugbel} onOpenChange={setOpenTerugbel} leadId={lead.id} leadNaam={lead.bedrijfsnaam} />
      <TerugbelDialog open={openDemo} onOpenChange={setOpenDemo} leadId={lead.id} leadNaam={lead.bedrijfsnaam} afspraakType="demo" />
      <EmailCompose
        open={openOrder}
        onOpenChange={setOpenOrder}
        defaultTo={lead.email ?? ""}
        defaultSubject={`Orderbevestiging mijnhuis.nu — ${lead.bedrijfsnaam}`}
        defaultBody={`Beste ${lead.contactpersoon ?? "klant"},\n\nHartelijk dank voor je vertrouwen in mijnhuis.nu. Hierbij bevestigen we je order voor ${lead.bedrijfsnaam}.\n\nWat je kunt verwachten:\n- Onze 30-daagse trial start direct na activatie\n- Je ontvangt persoonlijke onboarding via je affiliate\n- Bij vragen ben ik je vaste contactpersoon\n\nWelkom bij mijnhuis.nu!`}
        affiliateLeadId={lead.id}
      />
    </div>
  );
}