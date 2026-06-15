import { useEffect, useRef, useState } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
import { parseAddressList } from "@/components/email/EmailComposerFields";
import { Mail, X } from "lucide-react";

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
  const { profile } = useAuth();
  const [to, setTo] = useState(defaultTo);
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState(createDefaultSubject(label, doc.documentnummer, isResend));
  const [body, setBody] = useState(createDefaultBody(label, doc.documentnummer, isResend));
  const [sending, setSending] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const generationToken = useRef(0);

  const blobToDataUrl = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });

  const MIN_PDF_BYTES = 5000;

  // Controleer dat de blob daadwerkelijk een PDF is door de eerste 4 bytes (%PDF) te lezen.
  const isPdfBlob = async (blob: Blob): Promise<boolean> => {
    try {
      const head = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
      return head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46;
    } catch {
      return false;
    }
  };

  // Verifieer dat de geüploade bijlage daadwerkelijk in storage staat met juiste grootte + %PDF header.
  const verifyUploadedAttachment = async (path: string, expectedSize: number): Promise<{ ok: true } | { ok: false; reason: string }> => {
    const { data: signed, error: signedErr } = await supabase
      .storage.from("email-bijlagen").createSignedUrl(path, 60);
    if (signedErr || !signed?.signedUrl) {
      return { ok: false, reason: "Bijlage kon niet worden geverifieerd (signed URL mislukt)." };
    }
    const resp = await fetch(signed.signedUrl);
    if (!resp.ok) {
      return { ok: false, reason: `Bijlage niet leesbaar in storage (HTTP ${resp.status}).` };
    }
    const buf = new Uint8Array(await resp.arrayBuffer());
    if (buf.length !== expectedSize) {
      return { ok: false, reason: `Bijlage-grootte mismatch: ${buf.length} vs verwacht ${expectedSize}.` };
    }
    if (buf.length < MIN_PDF_BYTES) {
      return { ok: false, reason: `Bijlage te klein (${buf.length} bytes).` };
    }
    if (!(buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46)) {
      return { ok: false, reason: "Bijlage in storage is geen geldig PDF-bestand." };
    }
    return { ok: true };
  };

  const tryDownloadArchivedPdf = async (): Promise<Blob | null> => {
    try {
      const path = `${doc.partner_id}/factuur/${doc.id}.pdf`;
      const { data, error } = await supabase.storage.from("facturen").download(path);
      if (error || !data || data.size < 2000) return null;
      return data;
    } catch {
      return null;
    }
  };

  const generatePdf = async () => {
    const token = ++generationToken.current;
    setPdfStatus("loading");
    setPdfError(null);
    try {
      let blob: Blob | null = null;

      // 1. Bij "opnieuw versturen" eerst proberen het archief te hergebruiken.
      if (isResend) {
        blob = await tryDownloadArchivedPdf();
      }

      // 2. Anders: gebruik het in-DOM element als dat bestaat (snelste pad).
      if (!blob) {
        const el = document.querySelector(pdfElementSelector) as HTMLElement | null;
        if (el && el.scrollHeight > 200) {
          blob = await renderElementToPdfBlob(el);
        }
      }

      // 3. Fallback: headless render via renderFactuurPdf.
      if (!blob) {
        const result = await renderFactuurPdf(doc.id);
        blob = result.blob;
      }

      // Validatie: te kleine blob = lege render.
      if (!blob || blob.size < 2000) {
        throw new Error("PDF-render lijkt leeg. Probeer 'Opnieuw genereren'.");
      }

      // Race-veiligheid: alleen toepassen als dit nog de laatste run is.
      if (token !== generationToken.current) return;

      const dataUrl = await blobToDataUrl(blob);
      setPdfBlob(blob);
      setPdfDataUrl(dataUrl);
      setPdfStatus("ready");
    } catch (err) {
      if (token !== generationToken.current) return;
      console.error("PDF generatie mislukt:", err);
      setPdfError(err instanceof Error ? err.message : "Onbekende fout");
      setPdfStatus("error");
    }
  };

  useEffect(() => {
    if (!open) return;

    // Volledige reset zodat oude state nooit per ongeluk wordt verzonden.
    setTo(defaultTo);
    setCc("");
    setBcc("");
    setShowCc(false);
    setShowBcc(false);
    setSubject(createDefaultSubject(label, doc.documentnummer, isResend));
    setBody(createDefaultBody(label, doc.documentnummer, isResend));
    setPdfBlob(null);
    setPdfDataUrl(null);
    setPdfError(null);
    setPdfStatus("idle");
    void generatePdf();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultTo, doc.id, isResend, open]);

  const handleSend = async () => {
    if (!to.trim()) { toast.error("Vul een ontvanger in"); return; }
    if (!body.trim()) { toast.error("Bericht mag niet leeg zijn"); return; }
    if (pdfStatus !== "ready" || !pdfBlob) {
      toast.error("PDF is nog niet klaar — wacht tot het voorbeeld is geladen.");
      return;
    }
    if (pdfBlob.size < MIN_PDF_BYTES) {
      toast.error(`Bijlage lijkt leeg (${pdfBlob.size} bytes) — genereer de PDF opnieuw.`);
      return;
    }
    if (!(await isPdfBlob(pdfBlob))) {
      toast.error("Bijlage is geen geldig PDF-bestand — genereer opnieuw.");
      return;
    }
    setSending(true);
    let path: string | undefined;
    try {
      // Upload naar email-bijlagen bucket (verplicht — geen verzending zonder bijlage).
      path = await uploadPdfToStorage(supabase, doc.partner_id, "factuur", doc.id, pdfBlob);
      if (!path) {
        throw new Error("Upload van bijlage mislukt — geen pad ontvangen.");
      }

      // Harde verificatie: bestand bestaat, juiste grootte, geldige PDF.
      const verify = await verifyUploadedAttachment(path, pdfBlob.size);
      if (!verify.ok) {
        throw new Error(verify.reason);
      }

      // Archiveer parallel in facturen-bucket voor latere "opnieuw versturen".
      void uploadPdfToFacturenBucket(supabase, doc.partner_id, doc.id, pdfBlob);

      const html = `<div style="font-family:sans-serif;padding:20px;">${body.split("\n").map(l => `<p>${l || "&nbsp;"}</p>`).join("")}</div>`;

      const { data, error } = await supabase.functions.invoke("send-factuur-email", {
        body: {
          financieel_document_id: doc.id,
          ontvanger_email: to.trim(),
          subject,
          html_body: html,
          attachment_path: path,
          attachment_filename: `${label.replace(/\s+/g, "")}-${doc.documentnummer}.pdf`,
          expected_attachment_size: pdfBlob.size,
          is_resend: isResend,
          cc: parseAddressList(cc),
          bcc: parseAddressList(bcc),
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

          <div>
            <div className="flex items-center justify-between">
              <Label>Aan</Label>
              <div className="flex items-center gap-2 text-xs">
                {!showCc && <button type="button" onClick={() => setShowCc(true)} className="text-muted-foreground hover:text-foreground">+ CC</button>}
                {!showBcc && <button type="button" onClick={() => setShowBcc(true)} className="text-muted-foreground hover:text-foreground">+ BCC</button>}
              </div>
            </div>
            <Input value={to} onChange={(e) => setTo(e.target.value)} className="mt-1" />
          </div>
          {showCc && (
            <div>
              <div className="flex items-center justify-between">
                <Label>CC</Label>
                <button type="button" onClick={() => { setCc(""); setShowCc(false); }} className="text-xs text-muted-foreground" aria-label="CC verwijderen"><X className="h-3.5 w-3.5" /></button>
              </div>
              <Input value={cc} onChange={(e) => setCc(e.target.value)} className="mt-1" placeholder="cc1@voorbeeld.nl, cc2@voorbeeld.nl" />
            </div>
          )}
          {showBcc && (
            <div>
              <div className="flex items-center justify-between">
                <Label>BCC</Label>
                <div className="flex items-center gap-2">
                  {profile?.email && (
                    <button type="button" onClick={() => {
                      const list = parseAddressList(bcc);
                      if (!list.includes(profile.email!)) list.push(profile.email!);
                      setBcc(list.join(", "));
                    }} className="text-xs text-primary hover:underline flex items-center gap-1">
                      <Mail className="h-3 w-3" /> BCC mij
                    </button>
                  )}
                  <button type="button" onClick={() => { setBcc(""); setShowBcc(false); }} className="text-xs text-muted-foreground" aria-label="BCC verwijderen"><X className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <Input value={bcc} onChange={(e) => setBcc(e.target.value)} className="mt-1" placeholder="bcc1@voorbeeld.nl" />
            </div>
          )}
          <div><Label>Onderwerp</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1" /></div>
          <div><Label>Bericht</Label><Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} className="mt-1" /></div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
            <Button onClick={handleSend} disabled={sending || pdfStatus !== "ready" || !body.trim() || !to.trim()} className="gap-2">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Verzenden
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}