import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Paperclip, RefreshCw, ExternalLink, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { renderElementToPdfBlob, uploadPdfToStorage, uploadPdfToFacturenBucket } from "@/lib/pdfFromElement";
import { renderFactuurPdf } from "@/lib/renderFactuurPdf";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doc: { id: string; documentnummer: string; partner_id: string; type?: string; factuur_subtype?: string };
  defaultTo: string;
  pdfElementSelector?: string;
  isResend?: boolean;
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

function createDefaultSubject(label: string, documentnummer: string, isResend: boolean) {
  if (isResend) return `[Herinnering] ${label} ${documentnummer}`;
  return `${label} ${documentnummer}`;
}

function createDefaultBody(label: string, documentnummer: string, isResend: boolean) {
  if (isResend) {
    return `Beste relatie,\n\nHierbij sturen wij u nogmaals ${label.toLowerCase()} ${documentnummer}.\n\nMet vriendelijke groet`;
  }

  return `Beste relatie,\n\nHierbij ontvangt u ${label.toLowerCase()} ${documentnummer}.\n\nMet vriendelijke groet`;
}

export default function FactuurEmailDialog({ open, onOpenChange, doc, defaultTo, pdfElementSelector = ".pdf-print-root", isResend = false, onSent }: Props) {
  const label = getLabel(doc.type, doc.factuur_subtype);
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState(createDefaultSubject(label, doc.documentnummer, isResend));
  const [body, setBody] = useState(createDefaultBody(label, doc.documentnummer, isResend));
  const [sending, setSending] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const generatePdf = async () => {
    setPdfStatus("loading");
    setPdfError(null);
    try {
      // Snel pad: als de detailpagina het element rendert, gebruik dat.
      const el = document.querySelector(pdfElementSelector) as HTMLElement | null;
      let blob: Blob;
      if (el) {
        blob = await renderElementToPdfBlob(el);
      } else {
        const result = await renderFactuurPdf(doc.id);
        blob = result.blob;
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
      setPdfBlob(blob);
      setPdfDataUrl(dataUrl);
      setPdfStatus("ready");
    } catch (err) {
      console.error("PDF generatie mislukt:", err);
      setPdfError(err instanceof Error ? err.message : "Onbekende fout");
      setPdfStatus("error");
    }
  };

  useEffect(() => {
    if (!open) return;

    setTo(defaultTo);
    setSubject(createDefaultSubject(label, doc.documentnummer, isResend));
    setBody(createDefaultBody(label, doc.documentnummer, isResend));
    setPdfBlob(null);
    setPdfDataUrl(null);
    setPdfError(null);
    void generatePdf();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultTo, doc.id, isResend, open]);

  const handleSend = async () => {
    if (!to.trim()) { toast.error("Vul een ontvanger in"); return; }
    if (pdfStatus !== "ready" || !pdfBlob) {
      toast.error("PDF is nog niet klaar — wacht tot het voorbeeld is geladen.");
      return;
    }
    setSending(true);
    let path: string | undefined;
    try {
      // Upload naar email-bijlagen bucket (verplicht — geen verzending zonder bijlage).
      path = await uploadPdfToStorage(supabase, doc.partner_id, "factuur", doc.id, pdfBlob);

      // Archiveer parallel in facturen-bucket voor latere "opnieuw versturen".
      void uploadPdfToFacturenBucket(supabase, doc.partner_id, doc.id, pdfBlob);

      const html = `<div style="font-family:sans-serif;padding:20px;">${body.split("\n").map(l => `<p>${l || "&nbsp;"}</p>`).join("")}</div>`;

      const { data, error } = await supabase.functions.invoke("send-factuur-email", {
        body: {
          financieel_document_id: doc.id,
          ontvanger_email: to.trim(),
          subject,
          html_body: html,
          attachment_path: path || null,
          attachment_filename: `${label.replace(/\s+/g, "")}-${doc.documentnummer}.pdf`,
          is_resend: isResend,
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isResend ? `${label} opnieuw versturen` : `${label} per e-mail versturen`}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {/* PDF preview */}
          <div className="border rounded-md bg-muted/30">
            <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Paperclip className="h-4 w-4" />
                Voorbeeld bijlage
              </div>
              <div className="flex items-center gap-2">
                {pdfStatus === "ready" && pdfDataUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(pdfDataUrl, "_blank")}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1" /> Volledig openen
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={generatePdf}
                  disabled={pdfStatus === "loading"}
                >
                  <RefreshCw className={`h-3.5 w-3.5 mr-1 ${pdfStatus === "loading" ? "animate-spin" : ""}`} />
                  Opnieuw genereren
                </Button>
              </div>
            </div>
            <div className="h-[300px] flex items-center justify-center">
              {pdfStatus === "loading" && (
                <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  PDF wordt gegenereerd…
                </div>
              )}
              {pdfStatus === "error" && (
                <div className="flex flex-col items-center gap-2 text-sm text-destructive p-4 text-center">
                  <AlertCircle className="h-6 w-6" />
                  <span>PDF kon niet worden gegenereerd.</span>
                  {pdfError && <span className="text-xs text-muted-foreground">{pdfError}</span>}
                  <Button type="button" variant="outline" size="sm" onClick={generatePdf} className="mt-1">
                    Opnieuw proberen
                  </Button>
                </div>
              )}
              {pdfStatus === "ready" && pdfDataUrl && (
                <iframe
                  src={pdfDataUrl}
                  title="Factuur PDF preview"
                  className="w-full h-full rounded-b-md"
                />
              )}
            </div>
          </div>

          <div><Label>Aan</Label><Input value={to} onChange={(e) => setTo(e.target.value)} className="mt-1" /></div>
          <div><Label>Onderwerp</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1" /></div>
          <div><Label>Bericht</Label><Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} className="mt-1" /></div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
            <Button onClick={handleSend} disabled={sending || pdfStatus !== "ready"} className="gap-2">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Verzenden
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}