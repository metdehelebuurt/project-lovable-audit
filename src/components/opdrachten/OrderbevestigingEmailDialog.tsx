import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { renderElementToPdfBlob, uploadPdfToStorage } from "@/lib/pdfFromElement";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opdracht: { id: string; klant_naam: string; partner_id: string };
  defaultTo: string;
  pdfElementSelector?: string;
  onSent?: () => void;
}

export default function OrderbevestigingEmailDialog({
  open, onOpenChange, opdracht, defaultTo,
  pdfElementSelector = ".pdf-print-root", onSent,
}: Props) {
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState(`Orderbevestiging — ${opdracht.klant_naam}`);
  const [body, setBody] = useState(`Beste ${opdracht.klant_naam},\n\nHierbij ontvangt u onze orderbevestiging. De details vindt u in de bijlage.\n\nMet vriendelijke groet`);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!to.trim()) { toast.error("Vul een ontvanger in"); return; }
    setSending(true);
    let path: string | undefined;
    try {
      const el = document.querySelector(pdfElementSelector) as HTMLElement | null;
      if (el) {
        try {
          const blob = await renderElementToPdfBlob(el);
          path = await uploadPdfToStorage(supabase, opdracht.partner_id, "orderbevestiging", opdracht.id, blob);
        } catch (e) {
          console.error(e);
          toast.warning("PDF kon niet worden gegenereerd, e-mail wordt zonder bijlage verstuurd");
        }
      }

      const html = `<div style="font-family:sans-serif;padding:20px;">${body.split("\n").map(l => `<p>${l || "&nbsp;"}</p>`).join("")}</div>`;

      const { data, error } = await supabase.functions.invoke("send-orderbevestiging-email", {
        body: {
          opdracht_id: opdracht.id,
          ontvanger_email: to.trim(),
          subject,
          html_body: html,
          attachment_path: path || null,
          attachment_filename: `orderbevestiging-${opdracht.id}.pdf`,
        },
      });
      if (error || data?.error) {
        toast.error("Verzenden mislukt", { description: data?.error || error?.message });
      } else {
        toast.success("Orderbevestiging verstuurd");
        onOpenChange(false);
        onSent?.();
      }
    } catch (err: any) {
      toast.error("Verzenden mislukt", { description: err?.message });
    }
    setSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Orderbevestiging per e-mail versturen</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Aan</Label><Input value={to} onChange={(e) => setTo(e.target.value)} className="mt-1" /></div>
          <div><Label>Onderwerp</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1" /></div>
          <div><Label>Bericht</Label><Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} className="mt-1" /></div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Paperclip className="h-3.5 w-3.5" /> PDF van de orderbevestiging wordt automatisch bijgevoegd
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
}