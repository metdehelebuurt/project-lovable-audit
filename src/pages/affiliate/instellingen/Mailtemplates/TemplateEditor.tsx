import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAffiliateEmailTemplates, type AffiliateEmailTemplateRow } from "@/hooks/affiliate/useAffiliateEmailTemplates";
import { useSendTestTemplate } from "@/hooks/affiliate/useSendTestTemplate";
import { VariabelenPicker } from "./VariabelenPicker";
import { MailWysiwyg } from "./MailWysiwyg";
import { MailIframePreview } from "./MailIframePreview";
import { useAuth } from "@/contexts/AuthContext";
import type { Editor } from "@tiptap/react";
import type { AffiliateTemplate } from "@/lib/affiliateTemplates/registry";
import {
  Send, RotateCcw, Save, X, Monitor, Smartphone,
  PencilLine, Eye, SplitSquareHorizontal,
  Sparkles,
} from "lucide-react";
import { AiVerbeterPaneel } from "@/components/mailtemplates/AiVerbeterPaneel";

interface Props {
  template: AffiliateTemplate;
  row: AffiliateEmailTemplateRow | null;
  open: boolean;
  onClose: () => void;
}

type View = "split" | "editor" | "preview";
type Device = "desktop" | "mobile";

export function TemplateEditor({ template, row, open, onClose }: Props) {
  const { upsert, reset } = useAffiliateEmailTemplates();
  const { profile } = useAuth();
  const testSend = useSendTestTemplate();
  const editorRef = useRef<Editor | null>(null);

  const [onderwerp, setOnderwerp] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [view, setView] = useState<View>("split");
  const [device, setDevice] = useState<Device>("desktop");
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setOnderwerp(row?.onderwerp ?? template.defaultOnderwerp);
    setBodyHtml(row?.body_html ?? template.defaultBodyHtml);
  }, [template.key, row, open]);

  const handleVariabeleInsert = (placeholder: string) => {
    const ed = editorRef.current;
    if (!ed) {
      setBodyHtml((b) => b + placeholder);
      return;
    }
    ed.chain().focus().insertContent(placeholder).run();
  };

  const opslaan = () => {
    upsert.mutate(
      { template_key: template.key, onderwerp, body_html: bodyHtml },
      { onSuccess: () => onClose() },
    );
  };

  const herstellen = () => {
    if (!confirm("Standaardtekst herstellen? Je eigen aanpassingen gaan verloren.")) return;
    reset.mutate(template.key, {
      onSuccess: () => {
        setOnderwerp(template.defaultOnderwerp);
        setBodyHtml(template.defaultBodyHtml);
      },
    });
  };

  const verstuurTest = () => {
    const recipient = testEmail.trim();
    if (recipient && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) return;
    testSend.mutate({
      template_key: template.key,
      onderwerp,
      body_html: bodyHtml,
      recipient_email: recipient || undefined,
    });
  };

  const afzenderNaam =
    [profile?.voornaam, profile?.achternaam].filter(Boolean).join(" ").trim() || "Team mijnhuis.nu";
  const previewVars = {
    ...template.previewData,
    "affiliate.naam": afzenderNaam,
    "affiliate.email": profile?.email ?? template.previewData["affiliate.email"] ?? "",
    "affiliate.telefoon": profile?.telefoon ?? template.previewData["affiliate.telefoon"] ?? "",
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="w-screen h-screen max-w-none max-h-none p-0 gap-0 rounded-none border-0 sm:rounded-none flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">{template.displayName}</DialogTitle>
        <DialogDescription className="sr-only">{template.beschrijving}</DialogDescription>

        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b bg-background shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold truncate">{template.displayName}</h2>
              {row && <Badge variant="secondary" className="text-[10px]">Aangepast</Badge>}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {template.beschrijving} · Trigger: {template.trigger}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:flex items-center rounded-md border p-0.5">
              <Button size="sm" variant={view === "editor" ? "secondary" : "ghost"} className="h-7 px-2" onClick={() => setView("editor")}>
                <PencilLine className="h-3.5 w-3.5 mr-1" /> Bewerken
              </Button>
              <Button size="sm" variant={view === "split" ? "secondary" : "ghost"} className="h-7 px-2" onClick={() => setView("split")}>
                <SplitSquareHorizontal className="h-3.5 w-3.5 mr-1" /> Split
              </Button>
              <Button size="sm" variant={view === "preview" ? "secondary" : "ghost"} className="h-7 px-2" onClick={() => setView("preview")}>
                <Eye className="h-3.5 w-3.5 mr-1" /> Preview
              </Button>
            </div>
            <div className="flex items-center rounded-md border p-0.5">
              <Button size="sm" variant={device === "desktop" ? "secondary" : "ghost"} className="h-7 px-2" onClick={() => setDevice("desktop")}>
                <Monitor className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant={device === "mobile" ? "secondary" : "ghost"} className="h-7 px-2" onClick={() => setDevice("mobile")}>
                <Smartphone className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button size="icon" variant="ghost" onClick={onClose} aria-label="Sluiten">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-end px-5 py-2 border-b bg-muted/20 shrink-0">
          <Button size="sm" variant="outline" className="h-7 gap-1" onClick={() => setAiOpen(true)}>
            <Sparkles className="h-3.5 w-3.5 text-primary" /> AI verbeteren
          </Button>
        </div>

        {/* Main */}
        <div className="flex-1 min-h-0 grid md:grid-cols-2 grid-cols-1 gap-0 bg-muted/30">
          {/* Editor pane */}
          {view !== "preview" && (
            <div className={`${view === "editor" ? "md:col-span-2" : ""} min-h-0 overflow-auto p-4 md:p-5 space-y-4`}>
              <div className="space-y-1.5">
                <Label htmlFor="onderwerp" className="text-xs uppercase tracking-wide text-muted-foreground">Onderwerp</Label>
                <Input
                  id="onderwerp"
                  value={onderwerp}
                  onChange={(e) => setOnderwerp(e.target.value)}
                  className="text-sm"
                  placeholder="Wat ziet de klant in zijn inbox?"
                />
                <p className={`text-[11px] ${onderwerp.length > 78 ? "text-amber-600" : "text-muted-foreground"}`}>
                  {onderwerp.length} tekens · Gmail toont ±70 tekens, mobiel ±40.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Beschikbare variabelen <span className="normal-case text-muted-foreground/80">(klik om in te voegen)</span>
                </Label>
                <VariabelenPicker variabelen={template.variabelen} onInsert={handleVariabeleInsert} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Body</Label>
                <MailWysiwyg
                  value={bodyHtml}
                  onChange={setBodyHtml}
                  onReady={(ed) => (editorRef.current = ed)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Handtekening en footer worden automatisch toegevoegd onder je tekst. Zie rechts hoe het er voor de klant uitkomt.
                </p>
              </div>
            </div>
          )}

          {/* Preview pane */}
          {view !== "editor" && (
            <div className={`${view === "preview" ? "md:col-span-2" : ""} min-h-0 overflow-hidden p-4 md:p-5 border-l bg-slate-50`}>
              <MailIframePreview
                onderwerp={onderwerp}
                bodyHtml={bodyHtml}
                variabelen={previewVars}
                afzender={{
                  naam: afzenderNaam,
                  email: profile?.email ?? null,
                  telefoon: profile?.telefoon ?? null,
                }}
                device={device}
              />
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-t bg-background shrink-0">
          <div className="flex items-center gap-2">
            <Button onClick={opslaan} disabled={upsert.isPending}>
              <Save className="h-4 w-4 mr-1.5" /> Opslaan
            </Button>
            {row && (
              <Button variant="ghost" onClick={herstellen} disabled={reset.isPending}>
                <RotateCcw className="h-4 w-4 mr-1.5" /> Herstel standaard
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 min-w-[280px]">
            <Input
              type="email"
              placeholder="Testadres (leeg = naar mijzelf)"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="h-9 max-w-[260px]"
            />
            <Button variant="outline" onClick={verstuurTest} disabled={testSend.isPending}>
              <Send className="h-4 w-4 mr-1.5" />
              {testEmail.trim() ? "Test versturen" : "Test naar mij"}
            </Button>
          </div>
        </div>

        <AiVerbeterPaneel
          open={aiOpen}
          onClose={() => setAiOpen(false)}
          bron="affiliate"
          templateKey={template.key}
          templateNaam={template.displayName}
          onderwerp={onderwerp}
          body={bodyHtml}
          bodyFormaat="html"
          onApply={({ onderwerp: o, body: b }) => {
            setOnderwerp(o);
            setBodyHtml(b);
            setAiOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}