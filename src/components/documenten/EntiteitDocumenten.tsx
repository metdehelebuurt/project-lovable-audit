import { useState, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, Upload, LayoutGrid, List } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Database } from "@/integrations/supabase/types";
import SortableDocumentRow from "./SortableDocumentRow";
import DocumentPreviewDialog from "./DocumentPreviewDialog";
import DocumentGridCard from "./DocumentGridCard";

type Document = Database["public"]["Tables"]["documenten"]["Row"];
type DocumentEntityType = Database["public"]["Enums"]["document_entity_type"];
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

interface Props {
  entityType: DocumentEntityType;
  entityId: string;
  title?: string;
}

export default function EntiteitDocumenten({ entityType, entityId, title = "Documenten & foto's" }: Props) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocumentType>("overig");
  const [beschrijving, setBeschrijving] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteDoc, setDeleteDoc] = useState<Document | null>(null);
  const [localOrder, setLocalOrder] = useState<Document[] | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">(() => {
    if (typeof window === "undefined") return "list";
    return (localStorage.getItem("documenten-view") as "list" | "grid") || "list";
  });

  const handleViewMode = (v: string) => {
    if (v !== "list" && v !== "grid") return;
    setViewMode(v);
    try { localStorage.setItem("documenten-view", v); } catch { /* noop */ }
  };

  const canUpload =
    profile?.rol === "superadmin" || profile?.rol === "partner_admin" ||
    profile?.rol === "partner_staff" || profile?.rol === "backoffice" ||
    profile?.rol === "adviseur" || profile?.rol === "installateur";
  const canDeleteAll =
    profile?.rol === "superadmin" || profile?.rol === "partner_admin" ||
    profile?.rol === "partner_staff" || profile?.rol === "backoffice";
  const canRename = canDeleteAll;
  const canReorder = canDeleteAll;
  const canTag = canUpload;

  const queryKey = ["entiteit-documenten", entityType, entityId];

  const { data: documenten = [], isLoading } = useQuery({
    queryKey,
    enabled: !!entityId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documenten")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("volgorde", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Document[];
    },
  });

  const geordend = useMemo(() => localOrder ?? documenten, [localOrder, documenten]);

  const resetForm = () => {
    setFile(null); setDocType("overig"); setBeschrijving("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Kies eerst een bestand");
      if (!profile?.partner_id && profile?.rol !== "superadmin") {
        throw new Error("Geen partner gekoppeld aan account");
      }
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${entityType}/${entityId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("product-images").upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      const nextVolgorde = (documenten.reduce((max, d: any) => Math.max(max, d.volgorde ?? 0), 0)) + 1;
      const { error } = await supabase.from("documenten").insert({
        partner_id: profile!.partner_id!,
        entity_type: entityType,
        entity_id: entityId,
        naam: file.name,
        type: docType,
        bestand_url: urlData.publicUrl,
        bestand_grootte: file.size,
        mime_type: file.type,
        geupload_door_id: profile!.id,
        beschrijving: beschrijving || null,
        volgorde: nextVolgorde,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Document geüpload");
      setDialogOpen(false);
      resetForm();
    },
    onError: (err: Error) => toast.error("Upload mislukt", { description: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (doc: Document) => {
      const { error } = await supabase.from("documenten").delete().eq("id", doc.id);
      if (error) throw error;
      // Audit-log
      const { error: logErr } = await supabase.from("audit_log").insert({
        partner_id: doc.partner_id,
        actor_id: profile?.id ?? null,
        actie: "delete",
        entity_type: "documenten",
        entity_id: doc.id,
        oude_waarde: {
          naam: doc.naam,
          type: doc.type,
          bestand_url: doc.bestand_url,
          bestand_grootte: doc.bestand_grootte,
          mime_type: doc.mime_type,
          entity_type: doc.entity_type,
          entity_id: doc.entity_id,
        } as any,
      } as any);
      if (logErr) console.warn("Audit log opslaan mislukt", logErr);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Document verwijderd");
      setDeleteDoc(null);
    },
    onError: (err: Error) => toast.error("Verwijderen mislukt", { description: err.message }),
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, naam }: { id: string; naam: string }) => {
      const trimmed = naam.trim();
      if (!trimmed) throw new Error("Naam mag niet leeg zijn");
      if (trimmed.length > 255) throw new Error("Naam is te lang");
      const { error } = await supabase.from("documenten").update({ naam: trimmed }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Naam bijgewerkt");
      setRenameId(null); setRenameValue("");
    },
    onError: (err: Error) => toast.error("Wijzigen mislukt", { description: err.message }),
  });

  const tagsMutation = useMutation({
    mutationFn: async ({ id, tags }: { id: string; tags: string[] }) => {
      const cleaned = Array.from(new Set(tags.map((t) => t.trim()).filter(Boolean))).slice(0, 20);
      const { error } = await supabase.from("documenten").update({ tags: cleaned } as any).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, tags }) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<Document[]>(queryKey);
      queryClient.setQueryData<Document[]>(queryKey, (old) =>
        (old ?? []).map((d) => d.id === id ? ({ ...d, tags } as any) : d)
      );
      return { prev };
    },
    onError: (err: Error, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev);
      toast.error("Tags opslaan mislukt", { description: err.message });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const reorderMutation = useMutation({
    mutationFn: async (ordered: Document[]) => {
      // Update volgorde per document. Bewuste batching: één statement per rij.
      for (let i = 0; i < ordered.length; i++) {
        const { error } = await supabase
          .from("documenten")
          .update({ volgorde: i + 1 } as any)
          .eq("id", ordered[i].id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Volgorde opgeslagen");
      setLocalOrder(null);
    },
    onError: (err: Error) => {
      toast.error("Sorteren mislukt", { description: err.message });
      setLocalOrder(null); // fallback naar server-order
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = geordend.findIndex((d) => d.id === active.id);
    const newIndex = geordend.findIndex((d) => d.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(geordend, oldIndex, newIndex);
    setLocalOrder(next);
    reorderMutation.mutate(next);
  };

  const startRename = (d: Document) => { setRenameId(d.id); setRenameValue(d.naam); };
  const cancelRename = () => { setRenameId(null); setRenameValue(""); };

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" /> {title}
          {documenten.length > 0 && <Badge variant="secondary" className="ml-1">{documenten.length}</Badge>}
        </CardTitle>
        <div className="flex items-center gap-2">
          {documenten.length > 0 && (
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={handleViewMode}
              size="sm"
              className="border rounded-lg"
            >
              <ToggleGroupItem value="list" aria-label="Lijstweergave" className="h-8 w-8 p-0">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="grid" aria-label="Rasterweergave" className="h-8 w-8 p-0">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          )}
          {canUpload && (
            <Button size="sm" onClick={() => setDialogOpen(true)} className="rounded-pill gap-2">
              <Upload className="h-3.5 w-3.5" /> Uploaden
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Laden...</p>
        ) : documenten.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-xl">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nog geen documenten of foto's</p>
            {canUpload && (
              <Button variant="link" size="sm" onClick={() => setDialogOpen(true)} className="mt-1">
                Eerste document uploaden
              </Button>
            )}
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={geordend.map((d) => d.id)} strategy={verticalListSortingStrategy}>
              {viewMode === "list" ? (
                <div className="space-y-2">
                  {geordend.map((d) => (
                    <SortableDocumentRow
                      key={d.id}
                      doc={d}
                      editing={renameId === d.id}
                      renameValue={renameValue}
                      renamePending={renameMutation.isPending}
                      canRename={canRename}
                      canReorder={canReorder}
                      mayDelete={canDeleteAll || d.geupload_door_id === profile?.id}
                      onPreview={setPreviewDoc}
                      onStartRename={startRename}
                      onCancelRename={cancelRename}
                      onRenameChange={setRenameValue}
                      onRenameSubmit={(doc) => renameMutation.mutate({ id: doc.id, naam: renameValue })}
                      onDeleteRequest={setDeleteDoc}
                      canTag={canTag}
                      onTagsChange={(doc, tags) => tagsMutation.mutate({ id: doc.id, tags })}
                      tagsPending={tagsMutation.isPending}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {geordend.map((d) => (
                    <DocumentGridCard
                      key={d.id}
                      doc={d}
                      editing={renameId === d.id}
                      renameValue={renameValue}
                      renamePending={renameMutation.isPending}
                      canRename={canRename}
                      canReorder={canReorder}
                      mayDelete={canDeleteAll || d.geupload_door_id === profile?.id}
                      onPreview={setPreviewDoc}
                      onStartRename={startRename}
                      onCancelRename={cancelRename}
                      onRenameChange={setRenameValue}
                      onRenameSubmit={(doc) => renameMutation.mutate({ id: doc.id, naam: renameValue })}
                      onDeleteRequest={setDeleteDoc}
                      canTag={canTag}
                      onTagsChange={(doc, tags) => tagsMutation.mutate({ id: doc.id, tags })}
                      tagsPending={tagsMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </SortableContext>
          </DndContext>
        )}
      </CardContent>

      <DocumentPreviewDialog doc={previewDoc} onOpenChange={(o) => !o && setPreviewDoc(null)} />

      <AlertDialog open={!!deleteDoc} onOpenChange={(o) => !o && setDeleteDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Document verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je "{deleteDoc?.naam}" wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
              De verwijdering wordt geregistreerd in het audit-log met jouw naam en tijdstip.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDoc && deleteMutation.mutate(deleteDoc)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground"
            >
              {deleteMutation.isPending ? "Bezig..." : "Verwijderen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Document of foto uploaden</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Bestand *</Label>
              <Input
                ref={fileInputRef}
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="rounded-xl"
              />
              {file && (
                <p className="text-xs text-muted-foreground mt-1">{file.name} • {formatSize(file.size)}</p>
              )}
            </div>
            <div>
              <Label>Type</Label>
              <Select value={docType} onValueChange={(v) => setDocType(v as DocumentType)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(docTypeLabels) as DocumentType[]).map((t) => (
                    <SelectItem key={t} value={t}>{docTypeLabels[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Beschrijving (optioneel)</Label>
              <Textarea
                value={beschrijving}
                onChange={(e) => setBeschrijving(e.target.value)}
                className="rounded-xl"
                rows={2}
                placeholder="Korte beschrijving van het bestand"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-pill">Annuleren</Button>
            <Button
              onClick={() => uploadMutation.mutate()}
              disabled={uploadMutation.isPending || !file}
              className="rounded-pill"
            >
              {uploadMutation.isPending ? "Uploaden..." : "Uploaden"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}