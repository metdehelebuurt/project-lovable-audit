import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, ExternalLink, Trash2, Pencil, Check, X, GripVertical } from "lucide-react";
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

interface Props {
  doc: Document;
  editing: boolean;
  renameValue: string;
  renamePending: boolean;
  canRename: boolean;
  canReorder: boolean;
  mayDelete: boolean;
  onPreview: (d: Document) => void;
  onStartRename: (d: Document) => void;
  onCancelRename: () => void;
  onRenameChange: (v: string) => void;
  onRenameSubmit: (d: Document) => void;
  onDeleteRequest: (d: Document) => void;
}

const SortableDocumentRow = ({
  doc: d, editing, renameValue, renamePending, canRename, canReorder, mayDelete,
  onPreview, onStartRename, onCancelRename, onRenameChange, onRenameSubmit, onDeleteRequest,
}: Props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: d.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const image = isImage(d.mime_type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 rounded-xl border hover:bg-muted/30 transition-colors bg-background"
    >
      {canReorder && (
        <button
          type="button"
          className="p-1 mr-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
          aria-label="Slepen om te sorteren"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      <button
        type="button"
        onClick={() => onPreview(d)}
        className="flex items-center gap-3 min-w-0 flex-1 text-left group"
        aria-label={`Preview van ${d.naam}`}
      >
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-border group-hover:ring-primary/40 transition">
          {image ? (
            <img src={d.bestand_url} alt={d.naam} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <FileText className="h-5 w-5 text-primary" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Input
                autoFocus
                value={renameValue}
                onChange={(e) => onRenameChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); onRenameSubmit(d); }
                  if (e.key === "Escape") { e.preventDefault(); onCancelRename(); }
                }}
                className="h-8 text-sm"
              />
              <Button
                size="icon" variant="ghost" className="h-8 w-8 text-success"
                onClick={(e) => { e.preventDefault(); onRenameSubmit(d); }}
                disabled={renamePending}
                aria-label="Opslaan"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="icon" variant="ghost" className="h-8 w-8"
                onClick={(e) => { e.preventDefault(); onCancelRename(); }}
                aria-label="Annuleren"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <p className="text-sm font-medium truncate group-hover:text-primary transition">{d.naam}</p>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="h-4 px-1.5 text-[10px]">{docTypeLabels[d.type]}</Badge>
            <span>{formatSize(d.bestand_grootte)}</span>
            <span>•</span>
            <span>{new Date(d.created_at).toLocaleDateString("nl-NL")}</span>
          </div>
        </div>
      </button>
      <div className="flex items-center gap-1 shrink-0">
        {canRename && !editing && (
          <Button variant="ghost" size="icon" onClick={() => onStartRename(d)} aria-label="Naam wijzigen">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" asChild>
          <a href={d.bestand_url} target="_blank" rel="noopener noreferrer" aria-label="Openen">
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
        <Button variant="ghost" size="icon" asChild>
          <a href={d.bestand_url} download={d.naam} aria-label="Downloaden">
            <Download className="h-4 w-4" />
          </a>
        </Button>
        {mayDelete && (
          <Button
            variant="ghost" size="icon" className="text-destructive"
            onClick={() => onDeleteRequest(d)}
            aria-label="Verwijderen"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default SortableDocumentRow;