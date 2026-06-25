import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAffiliateEmailTemplates, type AffiliateEmailTemplateRow } from "@/hooks/affiliate/useAffiliateEmailTemplates";
import { useSendTestTemplate } from "@/hooks/affiliate/useSendTestTemplate";
import { VariabelenPicker } from "./VariabelenPicker";
import { TemplatePreview } from "./TemplatePreview";
import type { AffiliateTemplate } from "@/lib/affiliateTemplates/registry";
import { Send, RotateCcw, Save } from "lucide-react";

interface Props {
  template: AffiliateTemplate;
  row: AffiliateEmailTemplateRow | null;
  open: boolean;
  onClose: () => void;
}

export function TemplateEditor({ template, row, open, onClose }: Props) {
  const { upsert, reset } = useAffiliateEmailTemplates();
  const testSend = useSendTestTemplate();
  const [onderwerp, setOnderwerp] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setOnderwerp(row?.onderwerp ?? template.defaultOnderwerp);
    setBodyHtml(row?.body_html ?? template.defaultBodyHtml);
  }, [template.key, row]);

  const handleVariabeleInsert = (placeholder: string) => {
    const ta = bodyRef.current;
    if (!ta) {
      setBodyHtml((b) => b + placeholder);
      return;
    }
    const start = ta.selectionStart ?? bodyHtml.length;
    const end = ta.selectionEnd ?? bodyHtml.length;
    const next = bodyHtml.slice(0, start) + placeholder + bodyHtml.slice(end);
    setBodyHtml(next);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + placeholder.length, start + placeholder.length);
    }, 0);
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

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{template.displayName}</SheetTitle>
          <SheetDescription>{template.beschrijving} · Trigger: {template.trigger}</SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="bewerken" className="mt-4">
          <TabsList>
            <TabsTrigger value="bewerken">Bewerken</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="bewerken" className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label htmlFor="onderwerp">Onderwerp</Label>
              <Input
                id="onderwerp"
                value={onderwerp}
                onChange={(e) => setOnderwerp(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Beschikbare variabelen (klik om in te voegen)</Label>
              <VariabelenPicker variabelen={template.variabelen} onInsert={handleVariabeleInsert} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="body">Body (HTML toegestaan)</Label>
              <Textarea
                id="body"
                ref={bodyRef}
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                rows={14}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Tip: gebruik &lt;p&gt;, &lt;ul&gt;, &lt;strong&gt;, &lt;a href=""&gt;. Handtekening wordt automatisch toegevoegd.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <TemplatePreview template={template} onderwerp={onderwerp} bodyHtml={bodyHtml} />
          </TabsContent>
        </Tabs>

        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t">
          <Button onClick={opslaan} disabled={upsert.isPending}>
            <Save className="h-4 w-4 mr-1.5" /> Opslaan
          </Button>
          <Button
            variant="outline"
            onClick={() => testSend.mutate({ template_key: template.key, onderwerp, body_html: bodyHtml })}
            disabled={testSend.isPending}
          >
            <Send className="h-4 w-4 mr-1.5" /> Test naar mij sturen
          </Button>
          {row && (
            <Button variant="ghost" onClick={herstellen} disabled={reset.isPending}>
              <RotateCcw className="h-4 w-4 mr-1.5" /> Herstel standaard
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
