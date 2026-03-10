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
import { Plus, Pencil, Trash2, Search, Users } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
type LeadStatus = Database["public"]["Enums"]["lead_status"];

const statusLabels: Record<LeadStatus, string> = {
  nieuw: "Nieuw",
  gekwalificeerd: "Gekwalificeerd",
  offerte_verzonden: "Offerte verzonden",
  klant: "Klant",
  verloren: "Verloren",
};

const statusColors: Record<LeadStatus, string> = {
  nieuw: "bg-primary/10 text-primary",
  gekwalificeerd: "bg-success-light text-success",
  offerte_verzonden: "bg-warning-light text-warning-foreground",
  klant: "bg-success text-success-foreground",
  verloren: "bg-error-light text-error",
};

const bronOptions = ["website", "telefoon", "referral", "advertentie", "beurs", "overig"];

interface LeadFormData {
  voornaam: string;
  achternaam: string;
  email: string;
  telefoon: string;
  bedrijfsnaam: string;
  adres: string;
  postcode: string;
  plaats: string;
  bron: string;
  notities: string;
}

const emptyForm: LeadFormData = {
  voornaam: "", achternaam: "", email: "", telefoon: "",
  bedrijfsnaam: "", adres: "", postcode: "", plaats: "",
  bron: "", notities: "",
};

const Leads = () => {
  const { profile } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("alle");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [form, setForm] = useState<LeadFormData>(emptyForm);
  const queryClient = useQueryClient();

  const isSuperadmin = profile?.rol === "superadmin";
  const isAdmin = profile?.rol === "partner_admin" || profile?.rol === "partner_staff";

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });

  const { data: adviseurs = [] } = useQuery({
    queryKey: ["adviseurs-list"],
    queryFn: async () => {
      let query = supabase.from("users").select("id, voornaam, achternaam").eq("rol", "adviseur");
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { id?: string } & LeadFormData) => {
      const { id, ...rest } = data;
      const record: any = {
        ...rest,
        telefoon: rest.telefoon || null,
        bedrijfsnaam: rest.bedrijfsnaam || null,
        adres: rest.adres || null,
        postcode: rest.postcode || null,
        plaats: rest.plaats || null,
        bron: rest.bron || null,
        notities: rest.notities || null,
      };

      if (id) {
        const { error } = await supabase.from("leads").update(record).eq("id", id);
        if (error) throw error;
      } else {
        record.partner_id = profile?.partner_id;
        record.owner_user_id = profile?.id;
        if (!record.partner_id && isSuperadmin) {
          throw new Error("Superadmin moet een partner selecteren om leads aan te maken");
        }
        const { error } = await supabase.from("leads").insert(record as LeadInsert);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success(editingLead ? "Lead bijgewerkt" : "Lead aangemaakt");
      closeDialog();
    },
    onError: (err: Error) => toast.error("Fout", { description: err.message }),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LeadStatus }) => {
      const { error } = await supabase.from("leads").update({ lead_status: status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Status bijgewerkt");
    },
    onError: (err: Error) => toast.error("Fout", { description: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead verwijderd");
    },
    onError: (err: Error) => toast.error("Fout", { description: err.message }),
  });

  const openCreate = () => { setEditingLead(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (l: Lead) => {
    setEditingLead(l);
    setForm({
      voornaam: l.voornaam, achternaam: l.achternaam, email: l.email,
      telefoon: l.telefoon || "", bedrijfsnaam: l.bedrijfsnaam || "",
      adres: l.adres || "", postcode: l.postcode || "", plaats: l.plaats || "",
      bron: l.bron || "", notities: l.notities || "",
    });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditingLead(null); setForm(emptyForm); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(editingLead ? { ...form, id: editingLead.id } : form);
  };

  const filtered = leads.filter(l => {
    const matchSearch = `${l.voornaam} ${l.achternaam} ${l.email} ${l.plaats ?? ""}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "alle" || l.lead_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const canDelete = isSuperadmin || isAdmin;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Leads</h1>
          <p className="text-muted-foreground mt-1">Beheer leads en prospects</p>
        </div>
        <Button onClick={openCreate} className="rounded-pill gap-2">
          <Plus className="h-4 w-4" /> Nieuwe Lead
        </Button>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Zoek leads..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle statussen</SelectItem>
                {(Object.keys(statusLabels) as LeadStatus[]).map(s => (
                  <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Laden...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Geen leads gevonden</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naam</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Telefoon</TableHead>
                    <TableHead>Plaats</TableHead>
                    <TableHead>Bron</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(lead => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.voornaam} {lead.achternaam}</TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>{lead.telefoon || "—"}</TableCell>
                      <TableCell>{lead.plaats || "—"}</TableCell>
                      <TableCell className="capitalize">{lead.bron || "—"}</TableCell>
                      <TableCell>
                        <Select value={lead.lead_status} onValueChange={v => statusMutation.mutate({ id: lead.id, status: v as LeadStatus })}>
                          <SelectTrigger className="w-40 h-8">
                            <Badge className={statusColors[lead.lead_status]}>{statusLabels[lead.lead_status]}</Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(statusLabels) as LeadStatus[]).map(s => (
                              <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(lead)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {canDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Lead verwijderen</AlertDialogTitle>
                                  <AlertDialogDescription>Weet je zeker dat je {lead.voornaam} {lead.achternaam} wilt verwijderen?</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteMutation.mutate(lead.id)} className="bg-destructive text-destructive-foreground">Verwijderen</AlertDialogAction>
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
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLead ? "Lead bewerken" : "Nieuwe lead"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Voornaam *</Label><Input value={form.voornaam} onChange={e => setForm(p => ({ ...p, voornaam: e.target.value }))} required className="rounded-xl" /></div>
              <div><Label>Achternaam *</Label><Input value={form.achternaam} onChange={e => setForm(p => ({ ...p, achternaam: e.target.value }))} required className="rounded-xl" /></div>
            </div>
            <div><Label>E-mailadres *</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required className="rounded-xl" /></div>
            <div><Label>Telefoon</Label><Input value={form.telefoon} onChange={e => setForm(p => ({ ...p, telefoon: e.target.value }))} className="rounded-xl" /></div>
            <div><Label>Bedrijfsnaam</Label><Input value={form.bedrijfsnaam} onChange={e => setForm(p => ({ ...p, bedrijfsnaam: e.target.value }))} className="rounded-xl" /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2"><Label>Adres</Label><Input value={form.adres} onChange={e => setForm(p => ({ ...p, adres: e.target.value }))} className="rounded-xl" /></div>
              <div><Label>Postcode</Label><Input value={form.postcode} onChange={e => setForm(p => ({ ...p, postcode: e.target.value }))} className="rounded-xl" /></div>
            </div>
            <div><Label>Plaats</Label><Input value={form.plaats} onChange={e => setForm(p => ({ ...p, plaats: e.target.value }))} className="rounded-xl" /></div>
            <div>
              <Label>Bron</Label>
              <Select value={form.bron || "none"} onValueChange={v => setForm(p => ({ ...p, bron: v === "none" ? "" : v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecteer bron" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Geen</SelectItem>
                  {bronOptions.map(b => <SelectItem key={b} value={b} className="capitalize">{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Notities</Label><Textarea value={form.notities} onChange={e => setForm(p => ({ ...p, notities: e.target.value }))} className="rounded-xl" rows={3} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog} className="rounded-pill">Annuleren</Button>
              <Button type="submit" className="rounded-pill" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Opslaan..." : editingLead ? "Bijwerken" : "Aanmaken"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Leads;
