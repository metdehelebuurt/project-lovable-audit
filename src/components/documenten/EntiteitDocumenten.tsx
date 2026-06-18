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
import { FileText, Upload, Download, Trash2, ExternalLink, Image as ImageIcon } from "lucide-react";
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
              return (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-xl border hover:bg-muted/30 transition-colors">
                  <a href={d.bestand_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      {isImage(d.mime_type) ? <ImageIcon className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{d.naam}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="h-4 px-1.5 text-[10px]">{docTypeLabels[d.type]}</Badge>
                        <span>{formatSize(d.bestand_grootte)}</span>
                        <span>•</span>
                        <span>{new Date(d.created_at).toLocaleDateString("nl-NL")}</span>
                      </div>
                    </div>
                  </a>
                  <div className="flex items-center gap-1 shrink-0">
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