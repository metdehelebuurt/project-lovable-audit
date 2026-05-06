import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check, ExternalLink } from "lucide-react";
import { useState } from "react";

interface EmbedCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widgetId: string;
  widgetType: string;
}

export const EmbedCodeDialog = ({ open, onOpenChange, widgetId, widgetType }: EmbedCodeDialogProps) => {
  const [copied, setCopied] = useState<string | null>(null);

  const baseUrl = window.location.origin;
  const embedPath =
    widgetType === "contactformulier"
      ? `/embed/contact/${widgetId}`
      : widgetType === "productcatalogus"
      ? `/embed/catalogus/${widgetId}`
      : `/embed/calculator/${widgetId}`;

  const isCatalogus = widgetType === "productcatalogus";
  const iframeHeight = isCatalogus ? 900 : 600;
  const iframeMaxWidth = isCatalogus ? 1080 : 520;

  const embedCode = `<iframe
  src="${baseUrl}${embedPath}"
  width="100%"
  height="${iframeHeight}"
  frameborder="0"
  style="border: none; border-radius: 12px; max-width: ${iframeMaxWidth}px;"
  title="${
    widgetType === "contactformulier"
      ? "Contactformulier"
      : isCatalogus
      ? "Productcatalogus"
      : "Besparingscalculator"
  }"
></iframe>`;

  const projectRef = (import.meta.env.VITE_SUPABASE_PROJECT_ID as string) || "";
  const apiBase = projectRef
    ? `https://${projectRef}.supabase.co/functions/v1/partner-api`
    : "https://<project>.supabase.co/functions/v1/partner-api";

  const apiSnippet = `# Producten ophalen
curl "${apiBase}/products" \\
  -H "Authorization: Bearer pat_xxx_jouw_token"

# Lead aanmaken (vanuit een productpagina)
curl -X POST "${apiBase}/leads" \\
  -H "Authorization: Bearer pat_xxx_jouw_token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "voornaam": "Jan",
    "achternaam": "Jansen",
    "email": "jan@example.com",
    "telefoon": "0612345678",
    "product_id": "<uuid>",
    "bericht": "Graag een offerte"
  }'`;

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Integratiecode</DialogTitle>
          <DialogDescription>
            Plak de iframe-snippet in je website, of gebruik de REST API voor headless integratie.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="embed" className="space-y-4">
          <TabsList>
            <TabsTrigger value="embed">Embed (iframe)</TabsTrigger>
            {isCatalogus && <TabsTrigger value="api">REST API</TabsTrigger>}
          </TabsList>

          <TabsContent value="embed" className="space-y-4">
          <Textarea
            readOnly
            value={embedCode}
            rows={8}
            className="font-mono text-xs"
          />

          <div className="flex gap-2">
            <Button onClick={() => handleCopy(embedCode, "embed")} className="rounded-[40px] gap-2">
              {copied === "embed" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied === "embed" ? "Gekopieerd!" : "Kopieer code"}
            </Button>
            <Button variant="outline" className="rounded-[40px] gap-2" asChild>
              <a href={`${baseUrl}${embedPath}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" /> Preview openen
              </a>
            </Button>
          </div>

          {/* Live preview */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Live preview</p>
            <div className="border rounded-xl overflow-hidden bg-white" style={{ height: 360 }}>
              <iframe
                src={`${baseUrl}${embedPath}`}
                width="100%"
                height="100%"
                style={{ border: "none" }}
                title="Widget preview"
              />
            </div>
          </div>
          </TabsContent>

          {isCatalogus && (
            <TabsContent value="api" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Maak eerst een API-token aan onderaan de Webtools-pagina. Een token is eenmalig
                zichtbaar bij aanmaken — bewaar hem veilig.
              </p>
              <Textarea readOnly value={apiSnippet} rows={14} className="font-mono text-xs" />
              <Button onClick={() => handleCopy(apiSnippet, "api")} className="rounded-[40px] gap-2">
                {copied === "api" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied === "api" ? "Gekopieerd!" : "Kopieer voorbeeld"}
              </Button>
              <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                <p className="font-medium text-foreground">Endpoints</p>
                <p><code>GET /products</code> — alle website-zichtbare producten</p>
                <p><code>GET /brands</code> — actieve merken</p>
                <p><code>GET /categories</code> — gebruikte categorieën</p>
                <p><code>POST /leads</code> — lead aanmaken (incl. optioneel product_id voor automatische conceptofferte)</p>
                <p className="pt-2">Rate limit: 60 verzoeken per minuut per token.</p>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
