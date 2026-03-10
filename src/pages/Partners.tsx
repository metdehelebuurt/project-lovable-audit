import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Pencil, Search, Building2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Partner = Database["public"]["Tables"]["partners"]["Row"];
type PartnerInsert = Database["public"]["Tables"]["partners"]["Insert"];
type PartnerStatus = Database["public"]["Enums"]["partner_status"];

const statusColors: Record<PartnerStatus, string> = {
  in_review: "bg-warning-light text-warning-foreground",
  actief: "bg-success-light text-success",
  inactief: "bg-muted text-muted-foreground",
  geblokkeerd: "bg-error-light text-error",
};

const statusLabels: Record<PartnerStatus, string> = {
  in_review: "In review",
  actief: "Actief",
  inactief: "Inactief",
  geblokkeerd: "Geblokkeerd",
};

const emptyPartner: Partial<PartnerInsert> = {
  naam: "", email: "", telefoonnummer: "", website: "",
  adres: "", postcode: "", plaats: "", kvk: "", btw: "",
  contactpersoon_voornaam: "", contactpersoon_achternaam: "",
  contactpersoon_email: "", contactpersoon_telefoon: "",
  contactpersoon_functie: "", contract_type: "standaard",
  abonnement_type: "starter", notities: "",
};

const Partners = () => {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [form, setForm] = useState<Partial<PartnerInsert>>(emptyPartner);
  const queryClient = useQueryClient();

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ["partners"],
    queryFn: async () => {
      const { data, error } = await supabase.from("partners").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Partner[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<PartnerInsert> & { id?: string }) => {
      if (data.id) {
        const { id, ...rest } = data;
        const { error } = await supabase.from("partners").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("partners").insert(data as PartnerInsert);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      toast.success(editingPartner ? "Partner bijgewerkt" : "Partner aangemaakt");
      closeDialog();
    },
    onError: (err: Error) => toast.error("Fout", { description: err.message }),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PartnerStatus }) => {
      const { error } = await supabase.from("partners").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      toast.success("Status bijgewerkt");
    },
    onError: (err: Error) => toast.error("Fout", { description: err.message }),
  });

  const openCreate = () => { setEditingPartner(null); setForm(emptyPartner); setDialogOpen(true); };
  const openEdit = (p: Partner) => { setEditingPartner(p); setForm(p); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditingPartner(null); setForm(emptyPartner); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.naam) { toast.error("Bedrijfsnaam is verplicht"); return; }
    saveMutation.mutate(editingPartner ? { ...form, id: editingPartner.id } : form);
  };

  const updateField = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const filtered = partners.filter(p =>
    p.naam.toLowerCase().includes(search.toLowerCase()) ||
    (p.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.plaats ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Partners</h1>
          <p className="text-muted-foreground mt-1">Beheer partnerorganisaties</p>
        </div>
        <Button onClick={openCreate} className="rounded-pill gap-2">
          <Plus className="h-4 w-4" /> Nieuwe Partner
        </Button>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Zoek partners..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Laden...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Geen partners gevonden</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bedrijfsnaam</TableHead>
                    <TableHead>Contactpersoon</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Plaats</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Abonnement</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(partner => (
                    <TableRow key={partner.id}>
                      <TableCell className="font-medium">{partner.naam}</TableCell>
                      <TableCell>{[partner.contactpersoon_voornaam, partner.contactpersoon_achternaam].filter(Boolean).join(" ") || "—"}</TableCell>
                      <TableCell>{partner.email || partner.contactpersoon_email || "—"}</TableCell>
                      <TableCell>{partner.plaats || "—"}</TableCell>
                      <TableCell>
                        <Select value={partner.status} onValueChange={(v) => statusMutation.mutate({ id: partner.id, status: v as PartnerStatus })}>
                          <SelectTrigger className="w-32 h-8">
                            <Badge className={statusColors[partner.status]}>{statusLabels[partner.status]}</Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(statusLabels) as PartnerStatus[]).map(s => (
                              <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="capitalize">{partner.abonnement_type || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(partner)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPartner ? "Partner bewerken" : "Nieuwe partner"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Bedrijfsgegevens</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Bedrijfsnaam *</Label>
                  <Input value={form.naam || ""} onChange={e => updateField("naam", e.target.value)} required className="rounded-xl" />
                </div>
                <div><Label>E-mail</Label><Input type="email" value={form.email || ""} onChange={e => updateField("email", e.target.value)} className="rounded-xl" /></div>
                <div><Label>Telefoon</Label><Input value={form.telefoonnummer || ""} onChange={e => updateField("telefoonnummer", e.target.value)} className="rounded-xl" /></div>
                <div><Label>Website</Label><Input value={form.website || ""} onChange={e => updateField("website", e.target.value)} className="rounded-xl" /></div>
                <div><Label>KvK-nummer</Label><Input value={form.kvk || ""} onChange={e => updateField("kvk", e.target.value)} className="rounded-xl" /></div>
                <div><Label>BTW-nummer</Label><Input value={form.btw || ""} onChange={e => updateField("btw", e.target.value)} className="rounded-xl" /></div>
                <div><Label>Adres</Label><Input value={form.adres || ""} onChange={e => updateField("adres", e.target.value)} className="rounded-xl" /></div>
                <div><Label>Postcode</Label><Input value={form.postcode || ""} onChange={e => updateField("postcode", e.target.value)} className="rounded-xl" /></div>
                <div><Label>Plaats</Label><Input value={form.plaats || ""} onChange={e => updateField("plaats", e.target.value)} className="rounded-xl" /></div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Contactpersoon</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Voornaam</Label><Input value={form.contactpersoon_voornaam || ""} onChange={e => updateField("contactpersoon_voornaam", e.target.value)} className="rounded-xl" /></div>
                <div><Label>Achternaam</Label><Input value={form.contactpersoon_achternaam || ""} onChange={e => updateField("contactpersoon_achternaam", e.target.value)} className="rounded-xl" /></div>
                <div><Label>E-mail</Label><Input type="email" value={form.contactpersoon_email || ""} onChange={e => updateField("contactpersoon_email", e.target.value)} className="rounded-xl" /></div>
                <div><Label>Telefoon</Label><Input value={form.contactpersoon_telefoon || ""} onChange={e => updateField("contactpersoon_telefoon", e.target.value)} className="rounded-xl" /></div>
                <div><Label>Functie</Label><Input value={form.contactpersoon_functie || ""} onChange={e => updateField("contactpersoon_functie", e.target.value)} className="rounded-xl" /></div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Contract & Licentie</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Contract type</Label>
                  <Select value={form.contract_type || "standaard"} onValueChange={v => updateField("contract_type", v)}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standaard">Standaard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Abonnement</Label>
                  <Select value={form.abonnement_type || "starter"} onValueChange={v => updateField("abonnement_type", v)}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Max adviseurs</Label><Input type="number" value={form.licentie_adviseurs ?? ""} onChange={e => setForm(p => ({ ...p, licentie_adviseurs: e.target.value ? parseInt(e.target.value) : null }))} className="rounded-xl" /></div>
                <div><Label>Max installateurs</Label><Input type="number" value={form.licentie_installateurs ?? ""} onChange={e => setForm(p => ({ ...p, licentie_installateurs: e.target.value ? parseInt(e.target.value) : null }))} className="rounded-xl" /></div>
              </div>
            </div>

            <div>
              <Label>Notities</Label>
              <Textarea value={form.notities || ""} onChange={e => updateField("notities", e.target.value)} className="rounded-xl" rows={3} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog} className="rounded-pill">Annuleren</Button>
              <Button type="submit" className="rounded-pill" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Opslaan..." : editingPartner ? "Bijwerken" : "Aanmaken"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Partners;
