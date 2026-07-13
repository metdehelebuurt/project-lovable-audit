import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, ExternalLink, Trash2, Pencil, Check, X, GripVertical, Tag as TagIcon, Plus } from "lucide-react";
import { Info } from "lucide-react";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  canTag: boolean;
  onTagsChange: (d: Document, tags: string[]) => void;
  tagsPending: boolean;
  canEditMeta?: boolean;
  onEditMeta?: (d: Document) => void;
}

const SortableDocumentRow = ({
  doc: d, editing, renameValue, renamePending, canRename, canReorder, mayDelete,
  onPreview, onStartRename, onCancelRename, onRenameChange, onRenameSubmit, onDeleteRequest,
  canTag, onTagsChange, tagsPending, canEditMeta, onEditMeta,
}: Props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: d.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const image = isImage(d.mime_type);
  const rawTags = (d as any).tags;
  const tags: string[] = Array.isArray(rawTags) ? rawTags.filter((x: unknown): x is string => typeof x === "string") : [];
  const [newTag, setNewTag] = useState("");
  const addTag = () => {
    const v = newTag.trim();
    if (!v) return;
    if (tags.includes(v)) { setNewTag(""); return; }
    onTagsChange(d, [...tags, v]);
    setNewTag("");
  };
  const removeTag = (t: string) => onTagsChange(d, tags.filter((x) => x !== t));

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 p-3 rounded-xl border hover:bg-muted/30 transition-colors bg-background"
    >
      {canReorder && (
        <button
          type="button"
          className="p-1 mt-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
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
        className="h-20 w-20 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-border hover:ring-primary/60 transition"
        aria-label={`Preview van ${d.naam}`}
      >
        {image ? (
          <img src={d.bestand_url} alt={d.naam} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <FileText className="h-7 w-7 text-primary" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex items-center gap-1">
            <Input
              autoFocus
              value={renameValue}
              onChange={(e) => onRenameChange(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter") { e.preventDefault(); onRenameSubmit(d); }
                if (e.key === "Escape") { e.preventDefault(); onCancelRename(); }
              }}
              className="h-8 text-sm"
            />
            <Button
              size="icon" variant="ghost" className="h-8 w-8 text-success"
              onClick={() => onRenameSubmit(d)}
              disabled={renamePending}
              aria-label="Opslaan"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="icon" variant="ghost" className="h-8 w-8"
              onClick={onCancelRename}
              aria-label="Annuleren"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onPreview(d)}
            className="text-sm font-medium truncate max-w-full text-left hover:text-primary transition block"
          >
            {d.naam}
          </button>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
          <Badge variant="outline" className="h-4 px-1.5 text-[10px]">{docTypeLabels[d.type]}</Badge>
          <span>{formatSize(d.bestand_grootte)}</span>
          <span>•</span>
          <span>{new Date(d.created_at).toLocaleDateString("nl-NL")}</span>
          {(d as any).locatie && (
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">📍 {(d as any).locatie}</Badge>
          )}
        </div>
        {(d as any).beschrijving && (
          <p className="text-xs text-foreground/80 mt-1 line-clamp-2">{(d as any).beschrijving}</p>
        )}
        {(tags.length > 0 || canTag) && (
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            {tags.map((t) => (
              <Badge key={t} variant="secondary" className="h-5 px-2 text-[10px] gap-1">
                <TagIcon className="h-2.5 w-2.5" />
                {t}
                {canTag && (
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    className="ml-0.5 hover:text-destructive"
                    aria-label={`Tag ${t} verwijderen`}
                    disabled={tagsPending}
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </Badge>
            ))}
            {canTag && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px] gap-1 text-muted-foreground">
                    <Plus className="h-3 w-3" /> Tag
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start">
                  <div className="flex items-center gap-1">
                    <Input
                      autoFocus
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Enter") { e.preventDefault(); addTag(); }
                      }}
                      placeholder="Bijv. Woonkamer, Voorzijde"
                      className="h-8 text-sm"
                    />
                    <Button size="sm" onClick={addTag} disabled={!newTag.trim() || tagsPending}>
                      Toevoegen
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Bijv. locatie, dak, meterkast.</p>
                </PopoverContent>
              </Popover>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {canRename && !editing && (
          <Button variant="ghost" size="icon" onClick={() => onStartRename(d)} aria-label="Naam wijzigen">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        {canEditMeta && onEditMeta && (
          <Button variant="ghost" size="icon" onClick={() => onEditMeta(d)} aria-label="Beschrijving en locatie bewerken" title="Beschrijving & locatie">
            <Info className="h-4 w-4" />
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