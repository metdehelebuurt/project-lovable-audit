import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink, Download, ZoomIn, ZoomOut, RotateCcw, RotateCw, Maximize2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Document = Database["public"]["Tables"]["documenten"]["Row"];
type DocumentType = Database["public"]["Enums"]["document_type"];

const docTypeLabels: Record<DocumentType, string> = {
  contract: "Contract", foto: "Foto", certificaat: "Certificaat", rapport: "Rapport", overig: "Overig",
};

const formatSize = (bytes: number | null) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const isImage = (mime: string | null) => !!mime && mime.startsWith("image/");
const isPdf = (mime: string | null) => mime === "application/pdf";

interface Props {
  doc: Document | null;
  onOpenChange: (open: boolean) => void;
}

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 5;

const DocumentPreviewDialog = ({ doc, onOpenChange }: Props) => {
  const [zoom, setZoom] = useState(1);
  const [rotate, setRotate] = useState(0);

  useEffect(() => {
    if (doc) { setZoom(1); setRotate(0); }
  }, [doc?.id]);

  const zoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.25).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.25).toFixed(2)));
  const reset = () => { setZoom(1); setRotate(0); };
  const rotateLeft = () => setRotate((r) => (r - 90 + 360) % 360);
  const rotateRight = () => setRotate((r) => (r + 90) % 360);

  const onWheel = (e: React.WheelEvent) => {
    if (!doc || !isImage(doc.mime_type)) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +(z + delta).toFixed(2))));
  };

  const image = isImage(doc?.mime_type ?? null);

  return (
    <Dialog open={!!doc} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">{doc?.naam}</DialogTitle>
        </DialogHeader>
        {doc && (
          <div className="space-y-3">
            {image && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Button size="sm" variant="outline" onClick={zoomOut} disabled={zoom <= MIN_ZOOM} className="gap-1">
                  <ZoomOut className="h-3.5 w-3.5" /> Uit
                </Button>
                <div className="tabular-nums font-medium w-14 text-center">{Math.round(zoom * 100)}%</div>
                <Button size="sm" variant="outline" onClick={zoomIn} disabled={zoom >= MAX_ZOOM} className="gap-1">
                  <ZoomIn className="h-3.5 w-3.5" /> In
                </Button>
                <span className="mx-1 h-4 w-px bg-border" />
                <Button size="sm" variant="outline" onClick={rotateLeft} className="gap-1">
                  <RotateCcw className="h-3.5 w-3.5" /> Links
                </Button>
                <Button size="sm" variant="outline" onClick={rotateRight} className="gap-1">
                  <RotateCw className="h-3.5 w-3.5" /> Rechts
                </Button>
                <Button size="sm" variant="ghost" onClick={reset} className="gap-1">
                  <Maximize2 className="h-3.5 w-3.5" /> Reset
                </Button>
                <span className="ml-auto text-muted-foreground">Scroll om te zoomen</span>
              </div>
            )}
            <div
              className="rounded-xl bg-muted/40 overflow-auto flex items-center justify-center max-h-[70vh]"
              onWheel={onWheel}
              style={{ minHeight: "40vh" }}
            >
              {image ? (
                <img
                  src={doc.bestand_url}
                  alt={doc.naam}
                  draggable={false}
                  style={{
                    transform: `scale(${zoom}) rotate(${rotate}deg)`,
                    transformOrigin: "center center",
                    transition: "transform 0.15s ease-out",
                    maxHeight: "70vh",
                    maxWidth: "100%",
                  }}
                  className="object-contain select-none"
                />
              ) : isPdf(doc.mime_type) ? (
                <iframe src={doc.bestand_url} title={doc.naam} className="w-full h-[70vh]" />
              ) : (
                <div className="p-10 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Geen inline preview beschikbaar voor dit bestandstype.</p>
                </div>
              )}
            </div>
            {doc.beschrijving && <p className="text-sm text-muted-foreground">{doc.beschrijving}</p>}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{docTypeLabels[doc.type]} • {formatSize(doc.bestand_grootte)} • {new Date(doc.created_at).toLocaleDateString("nl-NL")}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild className="rounded-pill">
                  <a href={doc.bestand_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5 mr-1" /> Openen
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild className="rounded-pill">
                  <a href={doc.bestand_url} download={doc.naam}>
                    <Download className="h-3.5 w-3.5 mr-1" /> Downloaden
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreviewDialog;