import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Paperclip, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { renderElementToPdfBlob, uploadPdfToStorage } from "@/lib/pdfFromElement";
import EmailComposerFields, {
  EmailComposerValue,
  parseAddressList,
} from "@/components/email/EmailComposerFields";
import {
  applyTemplateData,
  useEmailTemplate,
} from "@/lib/email/useEmailTemplate";
import { useEmailConfigStatus } from "@/lib/email/useEmailConfigStatus";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import SenderPicker from "@/components/email/SenderPicker";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opdracht: {
    id: string;
    klant_naam: string;
    partner_id: string;
    klant_voornaam?: string | null;
    documentnummer?: string | null;
  };
  defaultTo: string;
  pdfElementSelector?: string;
  onSent?: () => void;
}

export default function OrderbevestigingEmailDialog({
  open,
  onOpenChange,
  opdracht,
  defaultTo,
  pdfElementSelector = ".pdf-print-root",
  onSent,
}: Props) {
  const { user, profile } = useAuth();
  const { data: configStatus, isLoading: configLoading } = useEmailConfigStatus(
    opdracht.partner_id,
  );
  const { data: tpl, isLoading: tplLoading } = useEmailTemplate(
    opdracht.partner_id,
    "orderbevestiging",
  );

  const renderData = useMemo(
    () => ({
      klant: {
        naam: opdracht.klant_naam,
        voornaam: opdracht.klant_voornaam || opdracht.klant_naam?.split(" ")[0] || "",
      },
      partner: {
        naam: profile?.partner_id ? "" : "",
        afzender: "",
      },
      document: {
        nummer: opdracht.documentnummer || "",
        type: "orderbevestiging",
      },
    }),
    [opdracht, profile],
  );

  const [composer, setComposer] = useState<EmailComposerValue>({
    to: defaultTo,
    cc: "",
    bcc: "",
    subject: "",
    bodyHtml: "",
  });
  const [sending, setSending] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [fromAccountId, setFromAccountId] = useState<string | null>(null);

  // Bij open: laad template + render variabelen
  useEffect(() => {
    if (!open) {
      setInitialized(false);
      return;
    }
    if (initialized || !tpl) return;
    const rendered = applyTemplateData(tpl, renderData);
    setComposer((prev) => ({
      ...prev,
      to: defaultTo,
      subject: rendered.onderwerp,
      bodyHtml: rendered.body_html,
    }));
    setInitialized(true);
  }, [open, tpl, renderData, defaultTo, initialized]);

  const handleSend = async () => {
    const toAddress = composer.to.trim();
    if (!toAddress) {
      toast.error("Vul een ontvanger in");
      return;
    }
    if (!configStatus?.configured) {
      toast.error("E-mail kan niet worden verzonden", {
        description: configStatus?.reason,
      });
      return;
    }

    setSending(true);
    let path: string | undefined;
    try {
      const el = document.querySelector(pdfElementSelector) as HTMLElement | null;
      if (el) {
        try {
          const blob = await renderElementToPdfBlob(el);
          path = await uploadPdfToStorage(
            supabase,
            opdracht.partner_id,
            "orderbevestiging",
            opdracht.id,
            blob,
          );
        } catch (e) {
          console.error("PDF render failed:", e);
          toast.warning(
            "PDF kon niet worden gegenereerd, e-mail wordt zonder bijlage verstuurd",
          );
        }
      }

      const { data, error } = await supabase.functions.invoke(
        "send-orderbevestiging-email",
        {
          body: {
            opdracht_id: opdracht.id,
            ontvanger_email: toAddress,
            cc: parseAddressList(composer.cc),
            bcc: parseAddressList(composer.bcc),
            subject: composer.subject,
            html_body: composer.bodyHtml,
            attachment_path: path || null,
            attachment_filename: `orderbevestiging-${opdracht.id}.pdf`,
            from_account_id: fromAccountId,
          },
        },
      );
      if (error || data?.error) {
        toast.error("Verzenden mislukt", {
          description: data?.error || error?.message || "Onbekende fout",
        });
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

  const loading = configLoading || tplLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Orderbevestiging per e-mail versturen</DialogTitle>
        </DialogHeader>

        {!loading && configStatus && !configStatus.configured && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-destructive">
                E-mailconfiguratie niet ingesteld
              </p>
              <p className="text-muted-foreground">{configStatus.reason}</p>
              <Link
                to="/instellingen?tab=email"
                className="text-primary hover:underline text-xs"
              >
                Naar Instellingen → E-mail
              </Link>
            </div>
          </div>
        )}

        <EmailComposerFields
          value={composer}
          onChange={setComposer}
          currentUserEmail={user?.email || undefined}
        />
        <SenderPicker userId={user?.id} value={fromAccountId} onChange={setFromAccountId} />

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Paperclip className="h-3.5 w-3.5" /> PDF van de orderbevestiging
          wordt automatisch bijgevoegd
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || loading || !configStatus?.configured}
            className="gap-2"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Verzenden
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}