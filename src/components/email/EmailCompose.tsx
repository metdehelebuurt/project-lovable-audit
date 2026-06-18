import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTo?: string;
  defaultSubject?: string;
  availableTo?: string[];
  leadId?: string;
  klantId?: string;
  affiliateLeadId?: string;
  offerteId?: string;
  onSent?: () => void;
}

const EmailCompose = ({ open, onOpenChange, defaultTo = "", defaultSubject = "", availableTo, leadId, klantId, affiliateLeadId, offerteId, onSent }: Props) => {
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      toast.error("Vul alle velden in");
      return;
    }

    setSending(true);
    try {
      const htmlBody = body.split("\n").map(line => `<p>${line || "&nbsp;"}</p>`).join("");

      const { data, error } = await supabase.functions.invoke("email-api-send", {
        body: {
          to: to.trim(),
          subject: subject.trim(),
          html_body: htmlBody,
          lead_id: leadId || null,
          klant_id: klantId || null,
          affiliate_lead_id: affiliateLeadId || null,
          offerte_id: offerteId || null,
        },
      });

      if (error || data?.error) {
        toast.error("Verzenden mislukt", { description: data?.error || error?.message });
      } else {
        toast.success("E-mail verzonden");
        setTo("");
        setSubject("");
        setBody("");
        onOpenChange(false);
        onSent?.();
      }
    } catch {
      toast.error("Verzenden mislukt");
    }
    setSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nieuwe e-mail</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Aan</Label>
            {availableTo && availableTo.length > 1 ? (
              <Select value={to} onValueChange={setTo}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Kies e-mailadres" />
                </SelectTrigger>
                <SelectContent>
                  {availableTo.map(addr => (
                    <SelectItem key={addr} value={addr}>{addr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="email@voorbeeld.nl" className="mt-1" />
            )}
          </div>
          <div>
            <Label>Onderwerp</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Onderwerp" className="mt-1" />
          </div>
          <div>
            <Label>Bericht</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} placeholder="Typ uw bericht..." className="mt-1" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
            <Button onClick={handleSend} disabled={sending} className="gap-2">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Verzenden
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailCompose;
