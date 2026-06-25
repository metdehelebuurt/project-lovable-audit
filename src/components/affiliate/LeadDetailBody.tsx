import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Phone, Mail, Globe, Save, MessageSquarePlus, MessageCircle, CalendarPlus,
  Presentation, FileCheck2, Sparkles, MapPin, Building2, Briefcase, Flame,
  Star, Rocket, Tag, CalendarClock, MoreHorizontal, ListChecks, Activity, History, StickyNote,
} from "lucide-react";
import { useState, useEffect } from "react";
import { STATUS_LABEL, STATUS_VOLGORDE, STATUS_KLEUR, type AffiliateLeadStatus } from "@/lib/affiliate/leadStatus";
import { useUpdateAffiliateLead, type AffiliateLead } from "@/hooks/affiliate/useAffiliateLeads";
import { useLeadContactmomenten, useLogContactmoment } from "@/hooks/affiliate/useAffiliateLeadContact";
import { telLink, whatsappLink } from "@/lib/affiliate/contact";
import { toast } from "sonner";
import { TerugbelDialog } from "./TerugbelDialog";
import { TrialStartenButton } from "./TrialStartenButton";
import { TrialStatusBadge } from "./TrialStatusBadge";
import { VerrijkLeadDialog } from "./VerrijkLeadDialog";
import { VerlorenRedenDialog } from "./VerlorenRedenDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import EmailTab from "@/components/email/EmailTab";
import EmailCompose from "@/components/email/EmailCompose";
import { AiOpvolgKaart } from "./AiOpvolgKaart";
import { OpvolgLogLijst } from "./OpvolgLogLijst";
import { useLeadBronnen } from "@/hooks/sales/useLeadBronnen";
import { useSearchParams } from "react-router-dom";

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

const TEMP_KLEUR: Record<string, string> = {
  koud: "bg-slate-100 text-slate-700",
  lauw: "bg-amber-100 text-amber-800",
  warm: "bg-orange-100 text-orange-800",
  heet: "bg-rose-100 text-rose-800",
};

interface Props {
  lead: AffiliateLead;
}

export function LeadDetailBody({ lead }: Props) {
  const update = useUpdateAffiliateLead();
  const log = useLogContactmoment();
  const { data: history = [] } = useLeadContactmomenten(lead.id);
  const { data: bronnen = [] } = useLeadBronnen();
  const [status, setStatus] = useState<AffiliateLeadStatus>(lead.status as AffiliateLeadStatus);
  const [waarde, setWaarde] = useState(String(lead.geschatte_waarde ?? ""));
  const [notitie, setNotitie] = useState(lead.notities ?? "");
  const [temperatuur, setTemperatuur] = useState<string>(lead.temperatuur ?? "lauw");
  const [volgendeActie, setVolgendeActie] = useState<string>(lead.volgende_actie_datum ?? "");
  const [contactNotitie, setContactNotitie] = useState("");
  const [openTerugbel, setOpenTerugbel] = useState(false);
  const [openDemo, setOpenDemo] = useState(false);
  const [openOrder, setOpenOrder] = useState(false);
  const [openVerrijk, setOpenVerrijk] = useState(false);
  const [openVerloren, setOpenVerloren] = useState(false);

  useEffect(() => {
    setStatus(lead.status as AffiliateLeadStatus);
    setWaarde(String(lead.geschatte_waarde ?? ""));
    setNotitie(lead.notities ?? "");
    setTemperatuur(lead.temperatuur ?? "lauw");
    setVolgendeActie(lead.volgende_actie_datum ?? "");
    setContactNotitie("");
  }, [lead.id, lead.status, lead.geschatte_waarde, lead.notities, lead.temperatuur, lead.volgende_actie_datum]);

  const tel = telLink(lead.telefoon);
  const wa = whatsappLink(lead.telefoon);
  const gewonnenPartnerId = (lead as unknown as { gewonnen_partner_id?: string | null }).gewonnen_partner_id ?? null;
  const bronRecord = bronnen.find((b) => b.id === lead.bron_id);
  const bronLabel = bronRecord?.label ?? (lead.bron ? BRON_LABEL[lead.bron] ?? lead.bron : null);
  const adresRegels = [lead.adres, [lead.postcode, lead.plaats].filter(Boolean).join(" ")].filter(Boolean);

  const { data: partnerInfo } = useQuery({
    queryKey: ["affiliate-lead-partner", gewonnenPartnerId],
    enabled: !!gewonnenPartnerId,
    queryFn: async () => {
      const { data } = await supabase.from("partners").select("trial_einddatum").eq("id", gewonnenPartnerId!).maybeSingle();
      return data;
    },
  });

  const opslaan = async () => {
    try {
      // Als gebruiker status naar 'verloren' zet → verplichte reden via dialog.
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

  const logGesprek = async () => {
    if (!contactNotitie.trim()) return;
    await log.mutateAsync({ lead_id: lead.id, type: "telefoon", notitie: contactNotitie, uitkomst: "gelogd" });
    setContactNotitie("");
  };

  return (
    <div className="space-y-4">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 -mx-4 px-4 py-3 bg-background/85 backdrop-blur border-b">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <Badge className={STATUS_KLEUR[status]}>{STATUS_LABEL[status]}</Badge>
            {lead.temperatuur && (
              <Badge variant="outline" className={TEMP_KLEUR[lead.temperatuur] ?? ""}>
                <Flame className="h-3 w-3 mr-1" /> {lead.temperatuur}
              </Badge>
            )}
            {bronLabel && (
              <Badge variant="outline" className="bg-muted/40">
                <Tag className="h-3 w-3 mr-1" /> {bronLabel}
              </Badge>
            )}
            {typeof lead.ai_score === "number" && (
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/30">
                <Star className="h-3 w-3 mr-1" /> AI {lead.ai_score}/100
              </Badge>
            )}
            {lead.contactpersoon && <Badge variant="outline">{lead.contactpersoon}</Badge>}
            {gewonnenPartnerId && <TrialStatusBadge trialEinddatum={partnerInfo?.trial_einddatum ?? null} />}
          </div>
          <div className="flex items-center gap-2">
            {tel && (
              <Button asChild size="sm" variant="outline">
                <a href={tel}><Phone className="h-4 w-4 mr-1" />Bel</a>
              </Button>
            )}
            {wa && (
              <Button asChild size="sm" variant="outline" className="text-emerald-700 border-emerald-300">
                <a href={wa} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4 mr-1" />WhatsApp</a>
              </Button>
            )}
            {lead.email && (
              <Button asChild size="sm" variant="outline">
                <a href={`mailto:${lead.email}`}><Mail className="h-4 w-4 mr-1" />Mail</a>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline"><MoreHorizontal className="h-4 w-4 mr-1" /> Acties</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setOpenTerugbel(true)}>
                  <CalendarPlus className="h-4 w-4 mr-2" /> Terugbel plannen
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOpenDemo(true)}>
                  <Presentation className="h-4 w-4 mr-2" /> Demo inplannen
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOpenOrder(true)} disabled={!lead.email}>
                  <FileCheck2 className="h-4 w-4 mr-2" /> Orderbevestiging sturen
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOpenVerrijk(true)} className="text-primary">
                  <Sparkles className="h-4 w-4 mr-2" /> Verrijken met AI
                </DropdownMenuItem>
                {lead.website && (
                  <DropdownMenuItem asChild>
                    <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer">
                      <Globe className="h-4 w-4 mr-2" /> Website openen
                    </a>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {!gewonnenPartnerId && <TrialStartenButton lead={lead} size="sm" />}
          </div>
        </div>
      </div>

      {/* 2-koloms workspace */}
      <div className="grid gap-5 lg:grid-cols-[360px,1fr]">
        {/* LINKERPANEEL */}
        <aside className="space-y-4 lg:sticky lg:top-[88px] lg:self-start">
          {/* Sales kerngegevens */}
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

          {/* Contact */}
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" /> Contact
            </h3>
            <dl className="text-sm space-y-1.5">
              <Rij icon={<Phone className="h-3.5 w-3.5" />} label="Telefoon" value={lead.telefoon} />
              <Rij icon={<Mail className="h-3.5 w-3.5" />} label="E-mail" value={lead.email} />
              <Rij icon={<Globe className="h-3.5 w-3.5" />} label="Website" value={lead.website} />
            </dl>
          </div>

          {/* Bedrijfsgegevens */}
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" /> Bedrijfsgegevens
            </h3>
            <dl className="text-sm space-y-1.5">
              <Rij icon={<Briefcase className="h-3.5 w-3.5" />} label="Branche" value={lead.branche} />
              <Rij icon={<MapPin className="h-3.5 w-3.5" />} label="Regio" value={lead.regio} />
              {adresRegels.length > 0 && (
                <div className="flex gap-2">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <dt className="text-xs text-muted-foreground">Adres</dt>
                    <dd>{adresRegels.map((r, i) => <div key={i}>{r}</div>)}</dd>
                  </div>
                </div>
              )}
              <Rij icon={<Tag className="h-3.5 w-3.5" />} label="Bron" value={bronLabel} />
            </dl>
            {lead.ai_bedrijf_samenvatting && (
              <p className="text-xs text-muted-foreground border-t pt-2 mt-2 italic">
                <Sparkles className="h-3 w-3 inline mr-1 text-primary" />
                {lead.ai_bedrijf_samenvatting}
              </p>
            )}
          </div>

          {/* Trial CTA als nog niet gestart */}
          {!gewonnenPartnerId && (
            <div className="rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-4 space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Rocket className="h-4 w-4 text-primary" /> Klaar om te starten?
              </p>
              <p className="text-xs text-muted-foreground">
                Start een 30-daagse trial op naam van deze klant. Jij wordt automatisch gekoppeld als affiliate.
              </p>
              <TrialStartenButton lead={lead} size="sm" />
            </div>
          )}
        </aside>

        {/* RECHTERPANEEL — TABS */}
        <section>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto">
              <TabsTrigger value="overzicht" className="text-xs sm:text-sm">
                <ListChecks className="h-3.5 w-3.5 mr-1.5" /> Overzicht
              </TabsTrigger>
              <TabsTrigger value="activiteit" className="text-xs sm:text-sm">
                <Activity className="h-3.5 w-3.5 mr-1.5" /> Activiteit
              </TabsTrigger>
              <TabsTrigger value="email" className="text-xs sm:text-sm">
                <Mail className="h-3.5 w-3.5 mr-1.5" /> E-mail
              </TabsTrigger>
              <TabsTrigger value="notities" className="text-xs sm:text-sm">
                <StickyNote className="h-3.5 w-3.5 mr-1.5" /> Notities
              </TabsTrigger>
              <TabsTrigger value="ai" className="text-xs sm:text-sm">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" /> AI
              </TabsTrigger>
              <TabsTrigger value="historie" className="text-xs sm:text-sm">
                <History className="h-3.5 w-3.5 mr-1.5" /> Historie
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overzicht" className="mt-4 space-y-4">
              <AiOpvolgKaart lead={lead} />
              <div className="rounded-lg border bg-card p-4">
                <OpvolgLogLijst leadId={lead.id} />
              </div>
            </TabsContent>

            <TabsContent value="activiteit" className="mt-4 space-y-4">
              <div className="rounded-lg border bg-card p-4 space-y-2">
                <Label className="flex items-center gap-2">
                  <MessageSquarePlus className="h-4 w-4" /> Gespreksnotitie loggen
                </Label>
                <Textarea rows={3} value={contactNotitie} onChange={(e) => setContactNotitie(e.target.value)} placeholder="Wat besproken, vervolgactie..." />
                <Button size="sm" onClick={logGesprek} disabled={!contactNotitie.trim() || log.isPending}>
                  Loggen
                </Button>
              </div>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Nog geen contactmomenten gelogd.</p>
              ) : (
                <div className="space-y-2">
                  {history.map((h) => (
                    <div key={h.id} className="text-sm border rounded-md p-3 bg-muted/30">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{h.type} {h.uitkomst ? `· ${h.uitkomst}` : ""}</span>
                        <span>{new Date(h.created_at).toLocaleString("nl-NL")}</span>
                      </div>
                      {h.notitie && <p className="mt-1 whitespace-pre-wrap">{h.notitie}</p>}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="email" className="mt-4 space-y-2">
              <p className="text-xs text-muted-foreground">
                In- en uitgaande mails vanuit jouw gekoppelde Gmail/Outlook worden hier automatisch getoond.
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

            <TabsContent value="ai" className="mt-4 space-y-4">
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
                <OpvolgLogLijst leadId={lead.id} />
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </div>

      <TerugbelDialog open={openTerugbel} onOpenChange={setOpenTerugbel} leadId={lead.id} leadNaam={lead.bedrijfsnaam} klantEmail={lead.email} />
      <TerugbelDialog open={openDemo} onOpenChange={setOpenDemo} leadId={lead.id} leadNaam={lead.bedrijfsnaam} klantEmail={lead.email} afspraakType="demo" />
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
        defaultBody={`Beste ${lead.contactpersoon ?? "klant"},\n\nHartelijk dank voor je vertrouwen in mijnhuis.nu. Hierbij bevestigen we je order voor ${lead.bedrijfsnaam}.\n\nWat je kunt verwachten:\n- Onze 30-daagse trial start direct na activatie\n- Je ontvangt persoonlijke onboarding via je affiliate\n- Bij vragen ben ik je vaste contactpersoon\n\nWelkom bij mijnhuis.nu!`}
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
        <dd>{value}</dd>
      </div>
    </div>
  );
}