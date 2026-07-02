import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Send, Trash2, User2, History, MessageSquarePlus, Building2, MapPin, Target, Sparkles, StickyNote, Save, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useUpdateSalesLead, useDeleteSalesLead, type SalesLead } from "@/hooks/sales/useSalesLeads";
import { useAffiliateGebruikers } from "@/hooks/sales/useDoorzetten";
import { useMyPipeline } from "@/hooks/sales/usePipelineConfig";
import { kleurClasses } from "@/lib/sales/pipeline";
import { TEMPERATUREN, TEMP_LABEL, TEMP_ICON, type Temperatuur } from "@/lib/sales/temperatuur";
import TemperatuurBadge from "@/components/sales/TemperatuurBadge";
import DoorzetDialog from "../DoorzetDialog";
import LeadTimeline from "../LeadTimeline";
import ContactmomentDialog from "@/components/sales/ContactmomentDialog";
import LeadScorePill from "@/components/sales/LeadScorePill";
import BronBadge from "@/components/sales/BronBadge";
import SnippetMenu from "@/components/sales/SnippetMenu";
import { useLeadBronnen } from "@/hooks/sales/useLeadBronnen";
import EmailTab from "@/components/email/EmailTab";
import { NotitieLijst } from "@/components/affiliate/LeadDetail/NotitieLijst";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  lead: SalesLead;
  /** Wat te doen na verwijderen. Default: navigeer terug. */
  onAfterDelete?: () => void;
}

/**
 * Volledig bewerkbaar formulier voor één sales lead.
 * Gebruikt op de detailpagina `/sales/leads/:id`.
 */
export default function LeadDetailEditor({ lead, onAfterDelete }: Props) {
  const navigate = useNavigate();
  const [vorm, setVorm] = useState<Partial<SalesLead>>(lead);
  const [doorzetOpen, setDoorzetOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [aiBezig, setAiBezig] = useState(false);
  const upd = useUpdateSalesLead();
  const del = useDeleteSalesLead();
  const { data: affiliates } = useAffiliateGebruikers();
  const { data: pipeline } = useMyPipeline();
  const { data: bronnen } = useLeadBronnen();

  useEffect(() => { setVorm(lead); }, [lead]);

  const opslaan = () => {
    upd.mutate({
      id: lead.id,
      patch: {
        bedrijfsnaam: vorm.bedrijfsnaam,
        contactpersoon: vorm.contactpersoon,
        email: vorm.email,
        telefoon: vorm.telefoon,
        branche: vorm.branche,
        regio: vorm.regio,
        website: vorm.website,
        adres: vorm.adres,
        postcode: vorm.postcode,
        plaats: vorm.plaats,
        fase_slug: vorm.fase_slug,
        temperatuur: vorm.temperatuur,
        volgende_actie_op: vorm.volgende_actie_op,
        geschatte_waarde: vorm.geschatte_waarde,
        bron_id: vorm.bron_id,
      },
    });
  };

  const verwijderen = () => {
    if (!confirm("Lead definitief verwijderen?")) return;
    del.mutate(lead.id, {
      onSuccess: () => {
        if (onAfterDelete) onAfterDelete();
        else navigate("/sales");
      },
    });
  };

  const aiHercalc = async () => {
    setAiBezig(true);
    try {
      const { error } = await supabase.functions.invoke("ai-affiliate-lead-score", {
        body: { leadId: lead.id },
      });
      if (error) throw error;
      toast.success("AI-score bijgewerkt");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAiBezig(false);
    }
  };

  const fases = (pipeline ?? []).filter((f) => f.zichtbaar !== false);
  const huidigeFase = fases.find((f) => f.fase_key === (vorm.fase_slug ?? "nieuw"));
  const temperatuur = (vorm.temperatuur ?? "koud") as Temperatuur;
  const eigenaar = lead.eigenaar_id
    ? (affiliates ?? []).find((a) => a.id === lead.eigenaar_id)
    : null;
  const deadline = vorm.volgende_actie_op ? new Date(vorm.volgende_actie_op as string) : null;
  const deadlineInput = deadline ? deadline.toISOString().slice(0, 10) : "";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
      {/* Hoofdkolom */}
      <div className="space-y-5 min-w-0">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" /> Bedrijf & contact
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <Label>Bedrijfsnaam</Label>
              <Input value={vorm.bedrijfsnaam ?? ""} onChange={(e) => setVorm({ ...vorm, bedrijfsnaam: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Contactpersoon</Label>
              <Input value={vorm.contactpersoon ?? ""} onChange={(e) => setVorm({ ...vorm, contactpersoon: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input type="email" value={vorm.email ?? ""} onChange={(e) => setVorm({ ...vorm, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Telefoon</Label>
              <Input value={vorm.telefoon ?? ""} onChange={(e) => setVorm({ ...vorm, telefoon: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Website</Label>
              <Input value={vorm.website ?? ""} onChange={(e) => setVorm({ ...vorm, website: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Branche</Label>
              <Input value={vorm.branche ?? ""} onChange={(e) => setVorm({ ...vorm, branche: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Regio</Label>
              <Input value={vorm.regio ?? ""} onChange={(e) => setVorm({ ...vorm, regio: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" /> Adres
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-[1fr_140px_1fr] gap-4">
            <div className="space-y-1.5 md:col-span-3">
              <Label>Straat + huisnummer</Label>
              <Input value={vorm.adres ?? ""} onChange={(e) => setVorm({ ...vorm, adres: e.target.value })} placeholder="Bijv. Dorpsstraat 12" />
            </div>
            <div className="space-y-1.5 md:col-start-1">
              <Label>Postcode</Label>
              <Input value={vorm.postcode ?? ""} onChange={(e) => setVorm({ ...vorm, postcode: e.target.value })} placeholder="1234 AB" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Plaats</Label>
              <Input value={vorm.plaats ?? ""} onChange={(e) => setVorm({ ...vorm, plaats: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" /> Pijplijn & kwalificatie
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Fase</Label>
              <Select value={vorm.fase_slug ?? "nieuw"} onValueChange={(v) => setVorm({ ...vorm, fase_slug: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {fases.map((f) => (
                    <SelectItem key={f.fase_key} value={f.fase_key}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Temperatuur</Label>
              <Select value={temperatuur} onValueChange={(v) => setVorm({ ...vorm, temperatuur: v as Temperatuur })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TEMPERATUREN.map((t) => {
                    const Icon = TEMP_ICON[t];
                    return (
                      <SelectItem key={t} value={t}>
                        <span className="inline-flex items-center gap-1.5">
                          <Icon className="h-3.5 w-3.5" /> {TEMP_LABEL[t]}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Bron</Label>
              <Select
                value={vorm.bron_id ?? "geen"}
                onValueChange={(v) => setVorm({ ...vorm, bron_id: v === "geen" ? null : v })}
              >
                <SelectTrigger><SelectValue placeholder="Kies bron" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="geen">— Geen —</SelectItem>
                  {(bronnen ?? []).filter((b) => b.actief).map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Geschatte waarde (€)</Label>
              <Input
                type="number"
                value={vorm.geschatte_waarde ?? ""}
                onChange={(e) => setVorm({ ...vorm, geschatte_waarde: e.target.value === "" ? null : Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Volgende actie op</Label>
              <Input
                type="date"
                value={deadlineInput}
                onChange={(e) =>
                  setVorm({
                    ...vorm,
                    volgende_actie_op: e.target.value ? new Date(e.target.value).toISOString() : null,
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-muted-foreground" /> Notities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NotitieLijst leadId={lead.id} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" /> Activiteit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LeadTimeline lead={lead} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" /> E-mails
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmailTab affiliateLeadId={lead.id} email={lead.email ?? undefined} />
          </CardContent>
        </Card>
      </div>

      {/* Zijbalk */}
      <aside className="space-y-4 lg:sticky lg:top-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge className={kleurClasses(huidigeFase?.kleur ?? "slate")} variant="outline">
                {huidigeFase?.label ?? (vorm.fase_slug ?? "Nieuw")}
              </Badge>
              <TemperatuurBadge temperatuur={temperatuur} />
              {lead.eigenaar_id ? (
                <Badge variant="secondary">Toegewezen</Badge>
              ) : (
                <Badge variant="outline">In pool</Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <LeadScorePill lead={lead} />
              <BronBadge bronId={lead.bron_id} fallbackLabel={lead.bron} />
            </div>
            <Separator />
            <div className="flex items-start gap-2">
              <User2 className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Eigenaar</div>
                <div className="text-sm font-medium truncate">
                  {lead.eigenaar_id
                    ? eigenaar ? eigenaar.naam : "Affiliate"
                    : "Platform"}
                </div>
                {lead.eigenaar_id && eigenaar?.email && (
                  <div className="text-xs text-muted-foreground truncate">{eigenaar.email}</div>
                )}
              </div>
            </div>
            {lead.geschatte_waarde ? (
              <div className="rounded-lg bg-muted/50 px-3 py-2">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Waarde</div>
                <div className="text-lg font-semibold">€ {Number(lead.geschatte_waarde).toLocaleString("nl-NL")}</div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {lead.lead_score_basis_details ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                Score-onderbouwing
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
                {Object.entries(lead.lead_score_basis_details as Record<string, unknown>)
                  .filter(([k]) => k !== "berekend_op")
                  .map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}</dt>
                      <dd className="font-medium text-right">{String(v)}</dd>
                    </div>
                  ))}
              </dl>
              {lead.ai_score_reden && (
                <p className="text-muted-foreground italic pt-2 border-t">{lead.ai_score_reden}</p>
              )}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
              Snelle acties
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={opslaan} disabled={upd.isPending} className="w-full gap-2">
              <Save className="h-4 w-4" /> {upd.isPending ? "Opslaan…" : "Wijzigingen opslaan"}
            </Button>
            <Button variant="default" onClick={() => setDoorzetOpen(true)} className="w-full gap-2" style={{ background: "hsl(var(--primary))" }}>
              <Send className="h-4 w-4" /> Doorzetten naar affiliate
            </Button>
            <Button variant="outline" onClick={() => setLogOpen(true)} className="w-full gap-2">
              <MessageSquarePlus className="h-4 w-4" /> Contactmoment loggen
            </Button>
            <div className="flex gap-2">
              <SnippetMenu lead={lead} />
              <Button variant="outline" onClick={aiHercalc} disabled={aiBezig} className="gap-2 flex-1">
                <Sparkles className="h-4 w-4" /> {aiBezig ? "Bezig…" : "AI score"}
              </Button>
            </div>
            <Separator />
            <Button variant="ghost" className="w-full text-destructive hover:text-destructive gap-2" onClick={verwijderen}>
              <Trash2 className="h-4 w-4" /> Lead verwijderen
            </Button>
          </CardContent>
        </Card>
      </aside>

      <DoorzetDialog open={doorzetOpen} onOpenChange={setDoorzetOpen} lead={lead} />
      <ContactmomentDialog
        open={logOpen}
        onOpenChange={setLogOpen}
        leadId={lead.id}
        bedrijfsnaam={lead.bedrijfsnaam ?? undefined}
      />
    </div>
  );
}