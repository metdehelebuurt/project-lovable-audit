import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  FileText, Download, ExternalLink, Trash2, Pencil, Check, X, GripVertical,
  Tag as TagIcon, Plus,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Document = Database["public"]["Tables"]["documenten"]["Row"];
type DocumentType = Database["public"]["Enums"]["document_type"];

const docTypeLabels: Record<DocumentType, string> = {
  contract: "Contract", foto: "Foto", certificaat: "Certificaat", rapport: "Rapport", overig: "Overig",
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
}

const DocumentGridCard = ({
  doc: d, editing, renameValue, renamePending, canRename, canReorder, mayDelete,
  onPreview, onStartRename, onCancelRename, onRenameChange, onRenameSubmit, onDeleteRequest,
  canTag, onTagsChange, tagsPending,
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
    if (!v || tags.includes(v)) { setNewTag(""); return; }
    onTagsChange(d, [...tags, v]);
    setNewTag("");
  };
  const removeTag = (t: string) => onTagsChange(d, tags.filter((x) => x !== t));

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl border bg-background overflow-hidden flex flex-col group hover:shadow-md transition-shadow"
    >
      <div className="relative">
        <button
          type="button"
          onClick={() => onPreview(d)}
          className="block w-full aspect-square bg-muted/40 flex items-center justify-center overflow-hidden"
          aria-label={`Preview van ${d.naam}`}
        >
          {image ? (
            <img src={d.bestand_url} alt={d.naam} loading="lazy" className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform" />
          ) : (
            <FileText className="h-10 w-10 text-primary" />
          )}
        </button>
        {canReorder && (
          <button
            type="button"
            className="absolute top-1.5 left-1.5 p-1 rounded-md bg-background/80 backdrop-blur text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none opacity-0 group-hover:opacity-100 transition"
            aria-label="Slepen om te sorteren"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        )}
        <Badge variant="secondary" className="absolute top-1.5 right-1.5 text-[10px] h-5">
          {docTypeLabels[d.type]}
        </Badge>
      </div>
      <div className="p-2.5 space-y-1.5">
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
              className="h-7 text-xs"
            />
            <Button size="icon" variant="ghost" className="h-7 w-7 text-success" onClick={() => onRenameSubmit(d)} disabled={renamePending} aria-label="Opslaan">
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onCancelRename} aria-label="Annuleren">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <p className="text-xs font-medium truncate" title={d.naam}>{d.naam}</p>
        )}

        {(tags.length > 0 || canTag) && (
          <div className="flex items-center gap-1 flex-wrap">
            {tags.map((t) => (
              <Badge key={t} variant="outline" className="h-4 px-1.5 text-[9px] gap-0.5">
                <TagIcon className="h-2 w-2" />
                {t}
                {canTag && (
                  <button type="button" onClick={() => removeTag(t)} className="ml-0.5 hover:text-destructive" aria-label={`Tag ${t} verwijderen`} disabled={tagsPending}>
                    <X className="h-2 w-2" />
                  </button>
                )}
              </Badge>
            ))}
            {canTag && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-4 px-1 text-[9px] gap-0.5 text-muted-foreground">
                    <Plus className="h-2.5 w-2.5" /> Tag
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  <div className="flex items-center gap-1">
                    <Input
                      autoFocus
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Enter") { e.preventDefault(); addTag(); }
                      }}
                      placeholder="Bijv. Voorzijde"
                      className="h-8 text-sm"
                    />
                    <Button size="sm" onClick={addTag} disabled={!newTag.trim() || tagsPending}>OK</Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-0.5 pt-1 border-t -mx-2.5 px-2.5">
          {canRename && !editing && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onStartRename(d)} aria-label="Naam wijzigen">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
            <a href={d.bestand_url} target="_blank" rel="noopener noreferrer" aria-label="Openen">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
            <a href={d.bestand_url} download={d.naam} aria-label="Downloaden">
              <Download className="h-3.5 w-3.5" />
            </a>
          </Button>
          {mayDelete && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDeleteRequest(d)} aria-label="Verwijderen">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentGridCard;