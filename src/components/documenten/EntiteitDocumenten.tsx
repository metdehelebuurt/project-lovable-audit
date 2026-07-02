import { useState, useRef } from "react";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, Upload, Download, Trash2, ExternalLink, Image as ImageIcon, Pencil, Check, X } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Document = Database["public"]["Tables"]["documenten"]["Row"];
type DocumentEntityType = Database["public"]["Enums"]["document_entity_type"];
type DocumentType = Database["public"]["Enums"]["document_type"];

const docTypeLabels: Record<DocumentType, string> = {
  contract: "Contract", foto: "Foto", certificaat: "Certificaat", rapport: "Rapport", overig: "Overig",
};

interface Props {
  entityType: DocumentEntityType;
  entityId: string;
  title?: string;
}

const formatSize = (bytes: number | null) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const isImage = (mime: string | null) => !!mime && mime.startsWith("image/");

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

  const canUpload =
    profile?.rol === "superadmin" ||
    profile?.rol === "partner_admin" ||
    profile?.rol === "partner_staff" ||
    profile?.rol === "backoffice" ||
    profile?.rol === "adviseur" ||
    profile?.rol === "installateur";

  const canDeleteAll =
    profile?.rol === "superadmin" ||
    profile?.rol === "partner_admin" ||
    profile?.rol === "partner_staff" ||
    profile?.rol === "backoffice";

  const canRename = canDeleteAll;

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
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Document[];
    },
  });

  const resetForm = () => {
    setFile(null);
    setDocType("overig");
    setBeschrijving("");
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
      });
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
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("documenten").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Document verwijderd");
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
      setRenameId(null);
      setRenameValue("");
    },
    onError: (err: Error) => toast.error("Wijzigen mislukt", { description: err.message }),
  });

  const startRename = (d: Document) => {
    setRenameId(d.id);
    setRenameValue(d.naam);
  };
  const cancelRename = () => { setRenameId(null); setRenameValue(""); };

  const isPdf = (mime: string | null) => mime === "application/pdf";

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" /> {title}
          {documenten.length > 0 && (
            <Badge variant="secondary" className="ml-1">{documenten.length}</Badge>
          )}
        </CardTitle>
        {canUpload && (
          <Button size="sm" onClick={() => setDialogOpen(true)} className="rounded-pill gap-2">
            <Upload className="h-3.5 w-3.5" /> Uploaden
          </Button>
        )}
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
          <div className="space-y-2">
            {documenten.map((d) => {
              const mayDelete = canDeleteAll || d.geupload_door_id === profile?.id;
              const image = isImage(d.mime_type);
              const editing = renameId === d.id;
              return (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-xl border hover:bg-muted/30 transition-colors">
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(d)}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left group"
                    aria-label={`Preview van ${d.naam}`}
                  >
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-border group-hover:ring-primary/40 transition">
                      {image ? (
                        <img
                          src={d.bestand_url}
                          alt={d.naam}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
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
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") { e.preventDefault(); renameMutation.mutate({ id: d.id, naam: renameValue }); }
                              if (e.key === "Escape") { e.preventDefault(); cancelRename(); }
                            }}
                            className="h-8 text-sm"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-success"
                            onClick={(e) => { e.preventDefault(); renameMutation.mutate({ id: d.id, naam: renameValue }); }}
                            disabled={renameMutation.isPending}
                            aria-label="Opslaan"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={(e) => { e.preventDefault(); cancelRename(); }}
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
                      <Button variant="ghost" size="icon" onClick={() => startRename(d)} aria-label="Naam wijzigen">
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
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive" aria-label="Verwijderen">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Document verwijderen</AlertDialogTitle>
                            <AlertDialogDescription>Weet je zeker dat je "{d.naam}" wilt verwijderen?</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuleren</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(d.id)} className="bg-destructive text-destructive-foreground">
                              Verwijderen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={!!previewDoc} onOpenChange={(o) => !o && setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">{previewDoc?.naam}</DialogTitle>
          </DialogHeader>
          {previewDoc && (
            <div className="space-y-3">
              <div className="rounded-xl bg-muted/40 overflow-hidden flex items-center justify-center max-h-[70vh]">
                {isImage(previewDoc.mime_type) ? (
                  <img
                    src={previewDoc.bestand_url}
                    alt={previewDoc.naam}
                    className="max-h-[70vh] w-auto object-contain"
                  />
                ) : isPdf(previewDoc.mime_type) ? (
                  <iframe
                    src={previewDoc.bestand_url}
                    title={previewDoc.naam}
                    className="w-full h-[70vh]"
                  />
                ) : (
                  <div className="p-10 text-center">
                    <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Geen inline preview beschikbaar voor dit bestandstype.</p>
                  </div>
                )}
              </div>
              {previewDoc.beschrijving && (
                <p className="text-sm text-muted-foreground">{previewDoc.beschrijving}</p>
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{docTypeLabels[previewDoc.type]} • {formatSize(previewDoc.bestand_grootte)} • {new Date(previewDoc.created_at).toLocaleDateString("nl-NL")}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild className="rounded-pill">
                    <a href={previewDoc.bestand_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5 mr-1" /> Openen
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="rounded-pill">
                    <a href={previewDoc.bestand_url} download={previewDoc.naam}>
                      <Download className="h-3.5 w-3.5 mr-1" /> Downloaden
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                <p className="text-xs text-muted-foreground mt-1">
                  {file.name} • {formatSize(file.size)}
                </p>
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