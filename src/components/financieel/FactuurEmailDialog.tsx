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
  doc: { id: string; documentnummer: string; partner_id: string; type?: string; factuur_subtype?: string };
  defaultTo: string;
  pdfElementSelector?: string;
  onSent?: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  verkoopfactuur: "Factuur",
  creditnota: "Creditnota",
  inkoopfactuur: "Inkoopfactuur",
  inkooporder: "Inkooporder",
  pakbon: "Pakbon",
};

function getLabel(type?: string, subtype?: string): string {
  if (type === "verkoopfactuur") {
    if (subtype === "voorschot") return "Voorschotfactuur";
    if (subtype === "eindafrekening") return "Eindafrekening";
  }
  return TYPE_LABELS[type || "verkoopfactuur"] || "Document";
}

export default function FactuurEmailDialog({ open, onOpenChange, doc, defaultTo, pdfElementSelector = ".pdf-print-root", onSent }: Props) {
  const label = getLabel(doc.type, doc.factuur_subtype);
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState(`${label} ${doc.documentnummer}`);
  const [body, setBody] = useState(`Beste relatie,\n\nHierbij ontvangt u ${label.toLowerCase()} ${doc.documentnummer}.\n\nMet vriendelijke groet`);
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
          path = await uploadPdfToStorage(supabase, doc.partner_id, "factuur", doc.id, blob);
        } catch (e) {
          console.error(e);
          toast.warning("PDF kon niet worden gegenereerd, e-mail wordt zonder bijlage verstuurd");
        }
      }

      const html = `<div style="font-family:sans-serif;padding:20px;">${body.split("\n").map(l => `<p>${l || "&nbsp;"}</p>`).join("")}</div>`;

      const { data, error } = await supabase.functions.invoke("send-factuur-email", {
        body: {
          financieel_document_id: doc.id,
          ontvanger_email: to.trim(),
          subject,
          html_body: html,
          attachment_path: path || null,
          attachment_filename: `${doc.documentnummer}.pdf`,
        },
      });
      if (error || data?.error) {
        toast.error("Verzenden mislukt", { description: data?.error || error?.message });
      } else {
        toast.success(`${label} verstuurd`);
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
        <DialogHeader><DialogTitle>{label} per e-mail versturen</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Aan</Label><Input value={to} onChange={(e) => setTo(e.target.value)} className="mt-1" /></div>
          <div><Label>Onderwerp</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1" /></div>
          <div><Label>Bericht</Label><Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} className="mt-1" /></div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Paperclip className="h-3.5 w-3.5" /> PDF wordt automatisch bijgevoegd
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