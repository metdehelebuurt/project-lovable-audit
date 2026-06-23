import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Send, Trash2, User2, History } from "lucide-react";
import { useUpdateSalesLead, useDeleteSalesLead, type SalesLead } from "@/hooks/sales/useSalesLeads";
import { useAffiliateGebruikers } from "@/hooks/sales/useDoorzetten";
import { useMyPipeline } from "@/hooks/sales/usePipelineConfig";
import { kleurClasses } from "@/lib/sales/pipeline";
import { TEMPERATUREN, TEMP_LABEL, TEMP_ICON, type Temperatuur } from "@/lib/sales/temperatuur";
import TemperatuurBadge from "@/components/sales/TemperatuurBadge";
import DoorzetDialog from "./DoorzetDialog";
import LeadTimeline from "./LeadTimeline";

interface Props {
  lead: SalesLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LeadDetailDrawer({ lead, open, onOpenChange }: Props) {
  const [vorm, setVorm] = useState<Partial<SalesLead>>({});
  const [doorzetOpen, setDoorzetOpen] = useState(false);
  const upd = useUpdateSalesLead();
  const del = useDeleteSalesLead();
  const { data: affiliates } = useAffiliateGebruikers();
  const { data: pipeline } = useMyPipeline();

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
              {lead.eigenaar_id ? (
                <Badge variant="secondary">Toegewezen</Badge>
              ) : (
                <Badge variant="outline">In pool</Badge>
              )}
            </div>

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
    </>
  );
}