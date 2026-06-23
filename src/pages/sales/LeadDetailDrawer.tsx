import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Send, Trash2, User2 } from "lucide-react";
import { SALES_FASES, FASE_LABEL, FASE_COLOR } from "@/lib/sales/faseLabels";
import { useUpdateSalesLead, useDeleteSalesLead, type SalesLead } from "@/hooks/sales/useSalesLeads";
import { useAffiliateGebruikers } from "@/hooks/sales/useDoorzetten";
import DoorzetDialog from "./DoorzetDialog";

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
        sales_fase: vorm.sales_fase,
        geschatte_waarde: vorm.geschatte_waarde,
      },
    });
  };

  const verwijderen = () => {
    if (!confirm("Lead definitief verwijderen?")) return;
    del.mutate(lead.id);
    onOpenChange(false);
  };

  const fase = (vorm.sales_fase ?? "koud") as keyof typeof FASE_LABEL;
  const eigenaar = lead.eigenaar_id
    ? (affiliates ?? []).find((a) => a.id === lead.eigenaar_id)
    : null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Lead bewerken</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <Badge className={FASE_COLOR[fase]} variant="outline">{FASE_LABEL[fase]}</Badge>
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
                <Select value={vorm.sales_fase ?? "koud"} onValueChange={(v) => setVorm({ ...vorm, sales_fase: v as never })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SALES_FASES.map((f) => (
                      <SelectItem key={f} value={f}>{FASE_LABEL[f]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
          </div>
        </SheetContent>
      </Sheet>
      <DoorzetDialog open={doorzetOpen} onOpenChange={setDoorzetOpen} lead={lead} />
    </>
  );
}