import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Send,
  Sparkles,
  Loader2,
  Bold,
  Italic,
  Link as LinkIcon,
  Paperclip,
  Star,
  FileText,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { generateOffertePdfViaIframe } from "@/lib/pdfFromPages";
import { parseAddressList } from "@/components/email/EmailComposerFields";
import { Mail, X } from "lucide-react";

interface OfferteEmailEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offerte: {
    id: string;
    offertenummer: string;
    klant_naam: string;
    klant_email: string;
    totaal_bedrag: number;
    share_token?: string | null;
    partner_id?: string | null;
  };
  partnerNaam?: string;
  onSent?: () => void;
}

interface PdfState {
  status: "idle" | "generating" | "ready" | "error";
  path?: string;
  signedUrl?: string;
  sizeBytes?: number;
  error?: string;
}

export default function OfferteEmailEditor({
  open,
  onOpenChange,
  offerte,
  partnerNaam,
  onSent,
}: OfferteEmailEditorProps) {
  const { profile } = useAuth();
  const editorRef = useRef<HTMLDivElement>(null);

  const [to, setTo] = useState(offerte.klant_email);
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState(
    `Offerte ${offerte.offertenummer} — ${partnerNaam || "Uw adviseur"}`,
  );
  const [includeAcceptLink, setIncludeAcceptLink] = useState(true);
  const [includePortalLink, setIncludePortalLink] = useState(true);
  const [includeVoorwaarden, setIncludeVoorwaarden] = useState(false);
  const [voorwaardenUrl, setVoorwaardenUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [feedbackScore, setFeedbackScore] = useState<number | null>(null);
  const [pdf, setPdf] = useState<PdfState>({ status: "idle" });

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

  const formatBytes = (b: number) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
    return `${(b / 1024 / 1024).toFixed(1)} MB`;
  };

  const generatePdf = useCallback(async () => {
    if (!offerte.partner_id) {
      setPdf({ status: "error", error: "Geen partner gekoppeld" });
      return;
    }
    setPdf({ status: "generating" });
    try {
      const { path, sizeBytes } = await generateOffertePdfViaIframe(
        supabase,
        offerte.id,
        offerte.partner_id,
      );
      const { data: signed } = await supabase.storage
        .from("email-bijlagen")
        .createSignedUrl(path, 3600);
      setPdf({
        status: "ready",
        path,
        signedUrl: signed?.signedUrl,
        sizeBytes,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "PDF-generatie mislukt";
      console.error("PDF-generatie:", err);
      setPdf({ status: "error", error: msg });
      toast.error("PDF-generatie mislukt", { description: msg });
    }
  }, [offerte.id, offerte.partner_id]);

  // Genereer PDF bij openen + reset bij sluiten
  useEffect(() => {
    if (open) {
      setSent(false);
      setFeedbackScore(null);
      void generatePdf();
    } else {
      setPdf({ status: "idle" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Load partner voorwaarden settings
  useEffect(() => {
    if (!offerte.partner_id) return;
    supabase
      .from("partners")
      .select("voorwaarden_pdf_url, feature_flags_json")
      .eq("id", offerte.partner_id)
      .single()
      .then(({ data }) => {
        if (data) {
          const url = (data as { voorwaarden_pdf_url?: string | null }).voorwaarden_pdf_url || null;
          setVoorwaardenUrl(url);
          if (url && data.feature_flags_json && typeof data.feature_flags_json === "object") {
            const flags = data.feature_flags_json as Record<string, unknown>;
            const tpl = flags.offerte_template as Record<string, unknown> | undefined;
            if (tpl?.voorwaarden_standaard_bijvoegen) setIncludeVoorwaarden(true);
          }
        }
      });
  }, [offerte.partner_id]);

  const defaultBody = `<p>Beste ${offerte.klant_naam},</p><p>Hierbij ontvangt u onze offerte met nummer <strong>${offerte.offertenummer}</strong> voor een totaalbedrag van <strong>${formatCurrency(offerte.totaal_bedrag)}</strong> (incl. BTW).</p><p>Neem gerust contact met ons op als u vragen heeft.</p><p>Met vriendelijke groet,<br/>${profile?.voornaam ?? ""} ${profile?.achternaam ?? ""}</p>`;

  const execCmd = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
  };

  const handleAiWrite = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-offerte-intro", {
        body: {
          klant_naam: offerte.klant_naam,
          offertenummer: offerte.offertenummer,
          totaal_bedrag: offerte.totaal_bedrag,
          partner_naam: partnerNaam,
          adviseur_naam: `${profile?.voornaam ?? ""} ${profile?.achternaam ?? ""}`,
          type: "email",
        },
      });
      if (error) throw error;
      const text = data?.tekst || data?.introductie;
      if (text && editorRef.current) {
        editorRef.current.innerHTML = text.replace(/\n/g, "<br/>");
      }
    } catch {
      toast.error("AI schrijven mislukt");
    }
    setAiLoading(false);
  };

  const handleSend = async () => {
    if (!to.trim()) {
      toast.error("Vul een ontvanger e-mailadres in");
      return;
    }
    if (pdf.status !== "ready" || !pdf.path) {
      toast.error("PDF is nog niet klaar");
      return;
    }
    setSending(true);
    try {
      const htmlBody = editorRef.current?.innerHTML || "";

      let linksHtml = "";
      const portalUrl = offerte.share_token
        ? `${window.location.origin}/offerte/${offerte.share_token}`
        : "";
      if (includeAcceptLink && portalUrl) {
        linksHtml += `<p><a href="${portalUrl}" style="display:inline-block;padding:12px 32px;background-color:#5B58E1;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Offerte bekijken & accepteren</a></p>`;
      }
      if (includePortalLink && portalUrl) {
        linksHtml += `<p><a href="${portalUrl}" style="color:#5B58E1;text-decoration:underline;">Bekijk uw interactieve offertepagina →</a></p>`;
      }
      if (includeVoorwaarden && voorwaardenUrl) {
        linksHtml += `<hr style="border:none;border-top:1px solid #eee;margin:16px 0;" /><p style="font-size:13px;color:#666;">📎 <a href="${voorwaardenUrl}" target="_blank" style="color:#5B58E1;text-decoration:underline;">Download onze algemene voorwaarden (PDF)</a></p>`;
      }

      const fullHtml = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">${htmlBody}${linksHtml}</div>`;

      const { data, error } = await supabase.functions.invoke("send-offerte-email", {
        body: {
          offerte_id: offerte.id,
          ontvanger_email: to.trim(),
          html_body: fullHtml,
          subject,
          attachment_path: pdf.path,
          attachment_filename: `Offerte-${offerte.offertenummer}.pdf`,
          cc: parseAddressList(cc),
          bcc: parseAddressList(bcc),
        },
      });
      if (error || data?.error) {
        toast.error("Versturen mislukt", { description: data?.error || error?.message });
      } else {
        toast.success("E-mail verstuurd!");
        setSent(true);
        onSent?.();
      }
    } catch {
      toast.error("Versturen mislukt");
    }
    setSending(false);
  };

  const handleFeedback = async (score: number) => {
    setFeedbackScore(score);
    try {
      const { data: existing } = await supabase
        .from("offertes")
        .select("feedback_berichten")
        .eq("id", offerte.id)
        .single();
      const msgs = Array.isArray(existing?.feedback_berichten) ? existing.feedback_berichten : [];
      const newMsg = {
        type: "email_feedback",
        score,
        auteur: `${profile?.voornaam ?? ""} ${profile?.achternaam ?? ""}`,
        datum: new Date().toISOString(),
      };
      await supabase
        .from("offertes")
        .update({ feedback_berichten: [...msgs, newMsg] as never })
        .eq("id", offerte.id);
    } catch {
      /* silent */
    }
    toast.success("Bedankt voor uw feedback!");
    setTimeout(() => onOpenChange(false), 800);
  };

  // Sent state — show feedback
  if (sent) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <div className="text-center space-y-4 py-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Send className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">E-mail verstuurd!</h3>
            <p className="text-sm text-muted-foreground">
              Hoe tevreden bent u met de gegenereerde e-mail?
            </p>
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => handleFeedback(s)}
                  className={`p-1.5 rounded-lg transition-colors ${feedbackScore === s ? "text-amber-500" : "text-muted-foreground/40 hover:text-amber-400"}`}
                  aria-label={`${s} sterren`}
                >
                  <Star
                    className="h-6 w-6"
                    fill={feedbackScore && s <= feedbackScore ? "currentColor" : "none"}
                  />
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Overslaan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const canSend = pdf.status === "ready" && !!to.trim() && !sending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-4 w-4" /> Offerte per e-mail versturen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* To */}
          <div className="grid grid-cols-[80px_1fr] items-center gap-2">
            <Label className="text-right text-sm text-muted-foreground">Aan</Label>
            <div className="flex items-center gap-2">
              <Input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="klant@email.nl"
                className="flex-1"
              />
              {!showCc && <button type="button" onClick={() => setShowCc(true)} className="text-xs text-muted-foreground hover:text-foreground">+ CC</button>}
              {!showBcc && <button type="button" onClick={() => setShowBcc(true)} className="text-xs text-muted-foreground hover:text-foreground">+ BCC</button>}
            </div>
          </div>

          {showCc && (
            <div className="grid grid-cols-[80px_1fr] items-center gap-2">
              <Label className="text-right text-sm text-muted-foreground">CC</Label>
              <div className="flex items-center gap-2">
                <Input value={cc} onChange={(e) => setCc(e.target.value)} placeholder="cc1@voorbeeld.nl, cc2@voorbeeld.nl" className="flex-1" />
                <button type="button" onClick={() => { setCc(""); setShowCc(false); }} aria-label="CC verwijderen" className="text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          )}

          {showBcc && (
            <div className="grid grid-cols-[80px_1fr] items-center gap-2">
              <Label className="text-right text-sm text-muted-foreground">BCC</Label>
              <div className="flex items-center gap-2">
                <Input value={bcc} onChange={(e) => setBcc(e.target.value)} placeholder="bcc1@voorbeeld.nl" className="flex-1" />
                {profile?.email && (
                  <button type="button" onClick={() => {
                    const list = parseAddressList(bcc);
                    if (!list.includes(profile.email!)) list.push(profile.email!);
                    setBcc(list.join(", "));
                  }} className="text-xs text-primary hover:underline flex items-center gap-1 whitespace-nowrap">
                    <Mail className="h-3 w-3" /> BCC mij
                  </button>
                )}
                <button type="button" onClick={() => { setBcc(""); setShowBcc(false); }} aria-label="BCC verwijderen" className="text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          )}

          {/* Subject */}
          <div className="grid grid-cols-[80px_1fr] items-center gap-2">
            <Label className="text-right text-sm text-muted-foreground">Onderwerp</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          <Separator />

          {/* Toolbar */}
          <div className="flex items-center gap-1 flex-wrap">
            <Button type="button" variant="ghost" size="sm" onClick={() => execCmd("bold")}>
              <Bold className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => execCmd("italic")}>
              <Italic className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const url = prompt("Link URL:");
                if (url) execCmd("createLink", url);
              }}
            >
              <LinkIcon className="h-3.5 w-3.5" />
            </Button>
            <div className="flex-1" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAiWrite}
              disabled={aiLoading}
              className="gap-1.5"
            >
              {aiLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              AI schrijven
            </Button>
          </div>

          {/* Editor */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="min-h-[200px] max-h-[300px] overflow-y-auto rounded-xl border border-border p-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: defaultBody }}
          />

          {/* Options */}
          <div className="space-y-3 rounded-xl bg-muted/50 p-4">
            <div className="flex items-center gap-3">
              <Checkbox
                id="accept-link"
                checked={includeAcceptLink}
                onCheckedChange={(c) => setIncludeAcceptLink(!!c)}
              />
              <Label htmlFor="accept-link" className="text-sm cursor-pointer">
                Acceptatielink bijvoegen
              </Label>
              {!offerte.share_token && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  Genereer eerst een deellink
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="portal-link"
                checked={includePortalLink}
                onCheckedChange={(c) => setIncludePortalLink(!!c)}
              />
              <Label htmlFor="portal-link" className="text-sm cursor-pointer">
                Interactieve offertepagina bijvoegen
              </Label>
            </div>
            {voorwaardenUrl && (
              <div className="flex items-center gap-3">
                <Checkbox
                  id="voorwaarden-link"
                  checked={includeVoorwaarden}
                  onCheckedChange={(c) => setIncludeVoorwaarden(!!c)}
                />
                <Label htmlFor="voorwaarden-link" className="text-sm cursor-pointer">
                  Algemene voorwaarden bijvoegen (PDF-link)
                </Label>
              </div>
            )}
          </div>

          {/* PDF preview block */}
          <div className="rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <span>Bijlage (PDF)</span>
              </div>
              {pdf.status === "ready" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={generatePdf}
                  className="gap-1.5 text-xs h-7"
                >
                  <RefreshCw className="h-3 w-3" /> Opnieuw genereren
                </Button>
              )}
            </div>

            {pdf.status === "generating" && (
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>PDF voorbereiden…</span>
              </div>
            )}

            {pdf.status === "error" && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm">
                <p className="text-destructive font-medium mb-1">PDF-generatie mislukt</p>
                <p className="text-xs text-muted-foreground mb-2">{pdf.error}</p>
                <Button type="button" variant="outline" size="sm" onClick={generatePdf}>
                  Opnieuw proberen
                </Button>
              </div>
            )}

            {pdf.status === "ready" && (
              <div className="flex items-center gap-3 rounded-lg bg-primary/5 border border-primary/20 p-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    Offerte-{offerte.offertenummer}.pdf
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {pdf.sizeBytes ? formatBytes(pdf.sizeBytes) : ""} · klaar voor verzending
                  </p>
                </div>
                {pdf.signedUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    asChild
                    className="gap-1.5 flex-shrink-0"
                  >
                    <a href={pdf.signedUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Openen
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Send */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuleren
            </Button>
            <Button onClick={handleSend} disabled={!canSend} className="gap-2">
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {pdf.status === "generating" ? "Wacht op PDF…" : "Versturen"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
