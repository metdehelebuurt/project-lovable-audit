import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Trash2, Search, FileText, Download, Upload } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Document = Database["public"]["Tables"]["documenten"]["Row"];
type DocumentEntityType = Database["public"]["Enums"]["document_entity_type"];
type DocumentType = Database["public"]["Enums"]["document_type"];

const entityTypeLabels: Record<DocumentEntityType, string> = {
  lead: "Lead", schouw: "Schouw", offerte: "Offerte", installatie: "Installatie",
};
const docTypeLabels: Record<DocumentType, string> = {
  contract: "Contract", foto: "Foto", certificaat: "Certificaat", rapport: "Rapport", overig: "Overig",
};

const Documenten = () => {
  const { profile } = useAuth();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [entityType, setEntityType] = useState<DocumentEntityType>("lead");
  const [entityId, setEntityId] = useState("");
  const [docType, setDocType] = useState<DocumentType>("overig");
  const [beschrijving, setBeschrijving] = useState("");
  const queryClient = useQueryClient();

  const canEdit = profile?.rol === "superadmin" || profile?.rol === "partner_admin" || profile?.rol === "partner_staff";

  const { data: documenten = [], isLoading } = useQuery({
    queryKey: ["documenten"],
    queryFn: async () => {
      const { data, error } = await supabase.from("documenten").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Document[];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file || !entityId.trim()) throw new Error("Bestand en entity ID zijn verplicht");
      if (!profile?.partner_id && profile?.rol !== "superadmin") throw new Error("Geen partner gekoppeld");

      const ext = file.name.split(".").pop();
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
      queryClient.invalidateQueries({ queryKey: ["documenten"] });
      toast.success("Document geüpload");
      setDialogOpen(false);
      setFile(null);
      setEntityId("");
      setBeschrijving("");
    },
    onError: (err: Error) => toast.error("Fout", { description: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("documenten").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documenten"] });
      toast.success("Document verwijderd");
    },
    onError: (err: Error) => toast.error("Fout", { description: err.message }),
  });

  const filtered = documenten.filter(d =>
    `${d.naam} ${d.beschrijving ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Documenten</h1>
          <p className="text-muted-foreground mt-1">Bestanden gekoppeld aan leads, schouwen, offertes en installaties</p>
        </div>
        {canEdit && (
          <Button onClick={() => setDialogOpen(true)} className="rounded-pill gap-2">
            <Upload className="h-4 w-4" /> Upload Document
          </Button>
        )}
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Zoek documenten..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Laden...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Geen documenten gevonden</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naam</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Entiteit</TableHead>
                    <TableHead>Grootte</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(doc => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{doc.naam}</p>
                          {doc.beschrijving && <p className="text-xs text-muted-foreground">{doc.beschrijving}</p>}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{docTypeLabels[doc.type]}</Badge></TableCell>
                      <TableCell><Badge variant="secondary">{entityTypeLabels[doc.entity_type]}</Badge></TableCell>
                      <TableCell>{formatSize(doc.bestand_grootte)}</TableCell>
                      <TableCell>{new Date(doc.created_at).toLocaleDateString("nl-NL")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <a href={doc.bestand_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                          {canEdit && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Document verwijderen</AlertDialogTitle>
                                  <AlertDialogDescription>Weet je zeker dat je "{doc.naam}" wilt verwijderen?</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteMutation.mutate(doc.id)} className="bg-destructive text-destructive-foreground">Verwijderen</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Document uploaden</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Bestand *</Label>
              <Input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} className="rounded-xl" />
            </div>
            <div>
              <Label>Entiteit type *</Label>
              <Select value={entityType} onValueChange={v => setEntityType(v as DocumentEntityType)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(entityTypeLabels) as DocumentEntityType[]).map(t => (
                    <SelectItem key={t} value={t}>{entityTypeLabels[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Entiteit ID *</Label>
              <Input value={entityId} onChange={e => setEntityId(e.target.value)} placeholder="UUID van lead/schouw/offerte/installatie" className="rounded-xl" />
            </div>
            <div>
              <Label>Document type</Label>
              <Select value={docType} onValueChange={v => setDocType(v as DocumentType)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(docTypeLabels) as DocumentType[]).map(t => (
                    <SelectItem key={t} value={t}>{docTypeLabels[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Beschrijving</Label>
              <Textarea value={beschrijving} onChange={e => setBeschrijving(e.target.value)} className="rounded-xl" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-pill">Annuleren</Button>
            <Button onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isPending || !file} className="rounded-pill">
              {uploadMutation.isPending ? "Uploaden..." : "Uploaden"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Documenten;
