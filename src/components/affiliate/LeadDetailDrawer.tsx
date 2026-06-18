import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, Globe, Save, MessageSquarePlus } from "lucide-react";
import { useState, useEffect } from "react";
import { STATUS_LABEL, STATUS_VOLGORDE, type AffiliateLeadStatus } from "@/lib/affiliate/leadStatus";
import { useUpdateAffiliateLead, type AffiliateLead } from "@/hooks/affiliate/useAffiliateLeads";
import { useLeadContactmomenten, useLogContactmoment } from "@/hooks/affiliate/useAffiliateLeadContact";

interface Props {
  lead: AffiliateLead | null;
  onClose: () => void;
}

export function LeadDetailDrawer({ lead, onClose }: Props) {
  const update = useUpdateAffiliateLead();
  const log = useLogContactmoment();
  const { data: history = [] } = useLeadContactmomenten(lead?.id);
  const [status, setStatus] = useState<AffiliateLeadStatus>("nieuw");
  const [waarde, setWaarde] = useState("");
  const [notitie, setNotitie] = useState("");
  const [contactNotitie, setContactNotitie] = useState("");

  useEffect(() => {
    if (lead) {
      setStatus(lead.status as AffiliateLeadStatus);
      setWaarde(String(lead.geschatte_waarde ?? ""));
      setNotitie(lead.notities ?? "");
      setContactNotitie("");
    }
  }, [lead]);

  if (!lead) return null;

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
    <Sheet open={!!lead} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{lead.bedrijfsnaam}</SheetTitle>
        </SheetHeader>
        <div className="space-y-5 mt-4">
          {lead.contactpersoon && <Badge variant="outline">{lead.contactpersoon}</Badge>}
          <div className="flex flex-wrap gap-2">
            {lead.telefoon && <Button asChild size="sm" variant="outline"><a href={`tel:${lead.telefoon}`}><Phone className="h-4 w-4 mr-1" />{lead.telefoon}</a></Button>}
            {lead.email && <Button asChild size="sm" variant="outline"><a href={`mailto:${lead.email}`}><Mail className="h-4 w-4 mr-1" />{lead.email}</a></Button>}
            {lead.website && <Button asChild size="sm" variant="outline"><a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer"><Globe className="h-4 w-4 mr-1" />Website</a></Button>}
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
        </div>
      </SheetContent>
    </Sheet>
  );
}