import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface EmbedCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widgetId: string;
  widgetType: string;
}

export const EmbedCodeDialog = ({ open, onOpenChange, widgetId, widgetType }: EmbedCodeDialogProps) => {
  const [copied, setCopied] = useState(false);

  const baseUrl = window.location.origin;
  const embedPath = widgetType === "contactformulier"
    ? `/embed/contact/${widgetId}`
    : `/embed/calculator/${widgetId}`;

  const embedCode = `<iframe
  src="${baseUrl}${embedPath}"
  width="100%"
  height="600"
  frameborder="0"
  style="border: none; border-radius: 12px; max-width: 520px;"
  title="${widgetType === 'contactformulier' ? 'Contactformulier' : 'Besparingscalculator'}"
></iframe>`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Embed code</DialogTitle>
          <DialogDescription>
            Kopieer onderstaande code en plak deze in de HTML van uw website.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            readOnly
            value={embedCode}
            rows={8}
            className="font-mono text-xs"
          />
          <div className="flex gap-2">
            <Button onClick={handleCopy} className="rounded-[40px] gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Gekopieerd!" : "Kopieer code"}
            </Button>
            <Button variant="outline" className="rounded-[40px]" asChild>
              <a href={`${baseUrl}${embedPath}`} target="_blank" rel="noopener noreferrer">
                Preview openen
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
