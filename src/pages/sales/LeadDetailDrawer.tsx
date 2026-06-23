import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Send, Trash2, User2, History, MessageSquarePlus } from "lucide-react";
import { useUpdateSalesLead, useDeleteSalesLead, type SalesLead } from "@/hooks/sales/useSalesLeads";
import { useAffiliateGebruikers } from "@/hooks/sales/useDoorzetten";
import { useMyPipeline } from "@/hooks/sales/usePipelineConfig";
import { kleurClasses } from "@/lib/sales/pipeline";
import { TEMPERATUREN, TEMP_LABEL, TEMP_ICON, type Temperatuur } from "@/lib/sales/temperatuur";
import TemperatuurBadge from "@/components/sales/TemperatuurBadge";
import DoorzetDialog from "./DoorzetDialog";
import LeadTimeline from "./LeadTimeline";
import ContactmomentDialog from "@/components/sales/ContactmomentDialog";
import LeadScorePill from "@/components/sales/LeadScorePill";
import BronBadge from "@/components/sales/BronBadge";
import SnippetMenu from "@/components/sales/SnippetMenu";
import { useLeadBronnen } from "@/hooks/sales/useLeadBronnen";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  lead: SalesLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LeadDetailDrawer({ lead, open, onOpenChange }: Props) {
  const [vorm, setVorm] = useState<Partial<SalesLead>>({});
  const [doorzetOpen, setDoorzetOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const upd = useUpdateSalesLead();
  const del = useDeleteSalesLead();
  const { data: affiliates } = useAffiliateGebruikers();
  const { data: pipeline } = useMyPipeline();
  const { data: bronnen } = useLeadBronnen();
  const [aiBezig, setAiBezig] = useState(false);

  useEffect(() => {
    if (lead) setVorm(lead);
  }, [lead]);

  if (!lead) return null;

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
        notities: vorm.notities,
        fase_slug: vorm.fase_slug,
        temperatuur: vorm.temperatuur,
        volgende_actie_op: vorm.volgende_actie_op,
        geschatte_waarde: vorm.geschatte_waarde,
      },
    });
  };

  const verwijderen = () => {
    if (!confirm("Lead definitief verwijderen?")) return;
    del.mutate(lead.id);
    onOpenChange(false);
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
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Lead bewerken</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={kleurClasses(huidigeFase?.kleur ?? "slate")} variant="outline">
                {huidigeFase?.label ?? (vorm.fase_slug ?? "Nieuw")}
              </Badge>
              <TemperatuurBadge temperatuur={temperatuur} />
              <LeadScorePill lead={lead} />
              <BronBadge bronId={lead.bron_id} fallbackLabel={lead.bron} />
              {lead.eigenaar_id ? (
                <Badge variant="secondary">Toegewezen</Badge>
              ) : (
                <Badge variant="outline">In pool</Badge>
              )}
            </div>

            {lead.lead_score_basis_details ? (
              <div className="rounded-md border bg-muted/30 p-2 text-xs">
                <div className="font-medium mb-1">Score-onderbouwing</div>
                <div className="text-muted-foreground">
                  {Object.entries(lead.lead_score_basis_details as Record<string, unknown>)
                    .filter(([k]) => k !== "berekend_op")
                    .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
                    .join(" · ")}
                </div>
                {lead.ai_score_reden && <div className="mt-1 italic">AI: {lead.ai_score_reden}</div>}
              </div>
            ) : null}

            <div className="rounded-md bg-muted/40 p-3 text-sm flex items-center gap-2">
              <User2 className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">Huidige eigenaar</div>
                <div className="font-medium">
                  {lead.eigenaar_id
                    ? eigenaar
                      ? `${eigenaar.naam} — ${eigenaar.email}`
                      : "Affiliate"
                    : "Platform (nog niet doorgezet)"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Bedrijfsnaam</Label>
                <Input value={vorm.bedrijfsnaam ?? ""} onChange={(e) => setVorm({ ...vorm, bedrijfsnaam: e.target.value })} />
              </div>
              <div>
                <Label>Contactpersoon</Label>
                <Input value={vorm.contactpersoon ?? ""} onChange={(e) => setVorm({ ...vorm, contactpersoon: e.target.value })} />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input type="email" value={vorm.email ?? ""} onChange={(e) => setVorm({ ...vorm, email: e.target.value })} />
              </div>
              <div>
                <Label>Telefoon</Label>
                <Input value={vorm.telefoon ?? ""} onChange={(e) => setVorm({ ...vorm, telefoon: e.target.value })} />
              </div>
              <div>
                <Label>Website</Label>
                <Input value={vorm.website ?? ""} onChange={(e) => setVorm({ ...vorm, website: e.target.value })} />
              </div>
              <div>
                <Label>Branche</Label>
                <Input value={vorm.branche ?? ""} onChange={(e) => setVorm({ ...vorm, branche: e.target.value })} />
              </div>
              <div>
                <Label>Regio</Label>
                <Input value={vorm.regio ?? ""} onChange={(e) => setVorm({ ...vorm, regio: e.target.value })} />
              </div>
              <div className="col-span-2">
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
              <div>
                <Label>Geschatte waarde (€)</Label>
                <Input
                  type="number"
                  value={vorm.geschatte_waarde ?? ""}
                  onChange={(e) => setVorm({ ...vorm, geschatte_waarde: e.target.value === "" ? null : Number(e.target.value) })}
                />
              </div>
              <div>
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
              <div>
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
              <div className="col-span-2">
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
              <div className="col-span-2">
                <Label>Notitie</Label>
                <Textarea
                  rows={4}
                  value={vorm.notities ?? ""}
                  onChange={(e) => setVorm({ ...vorm, notities: e.target.value })}
                  maxLength={2000}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <Button onClick={opslaan} disabled={upd.isPending}>Opslaan</Button>
              <Button variant="outline" onClick={() => setLogOpen(true)} className="gap-2">
                <MessageSquarePlus className="h-4 w-4" /> Log contact
              </Button>
              <SnippetMenu lead={lead} />
              <Button variant="outline" onClick={aiHercalc} disabled={aiBezig} className="gap-2">
                <History className="h-4 w-4" /> {aiBezig ? "AI bezig…" : "AI hercalc"}
              </Button>
              <Button variant="default" onClick={() => setDoorzetOpen(true)} className="gap-2">
                <Send className="h-4 w-4" /> Doorzetten naar affiliate
              </Button>
              <Button variant="ghost" className="text-destructive ml-auto gap-2" onClick={verwijderen}>
                <Trash2 className="h-4 w-4" /> Verwijderen
              </Button>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <History className="h-4 w-4" /> Activiteit
              </h3>
              <LeadTimeline lead={lead} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <DoorzetDialog open={doorzetOpen} onOpenChange={setDoorzetOpen} lead={lead} />
      <ContactmomentDialog
        open={logOpen}
        onOpenChange={setLogOpen}
        leadId={lead.id}
        bedrijfsnaam={lead.bedrijfsnaam ?? undefined}
      />
    </>
  );
}