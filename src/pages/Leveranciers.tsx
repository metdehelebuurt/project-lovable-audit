import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Building2, ListOrdered } from "lucide-react";
import PrijslijstEditor from "@/components/leveranciers/PrijslijstEditor";

interface Leverancier {
  id: string;
  naam: string;
  email: string | null;
  telefoon: string | null;
  adres: string | null;
  postcode: string | null;
  plaats: string | null;
  kvk_nummer: string | null;
  btw_nummer: string | null;
  iban: string | null;
  contactpersoon: string | null;
  notities: string | null;
}

const emptyLeverancier = {
  naam: "", email: "", telefoon: "", adres: "", postcode: "", plaats: "",
  kvk_nummer: "", btw_nummer: "", iban: "", contactpersoon: "", notities: "",
};

export default function Leveranciers() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<Leverancier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyLeverancier);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [prijslijstId, setPrijslijstId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!profile?.partner_id) return;
    const { data } = await supabase
      .from("leveranciers")
      .select("*")
      .eq("partner_id", profile.partner_id)
      .order("naam");
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [profile?.partner_id]);

  const handleSave = async () => {
    if (!profile?.partner_id || !form.naam.trim()) return;
    setSaving(true);

    const payload = { ...form, partner_id: profile.partner_id };

    if (editId) {
      const { error } = await supabase.from("leveranciers").update(payload).eq("id", editId);
      if (error) toast({ title: "Fout", description: error.message, variant: "destructive" });
      else toast({ title: "Leverancier bijgewerkt" });
    } else {
      const { error } = await supabase.from("leveranciers").insert(payload);
      if (error) toast({ title: "Fout", description: error.message, variant: "destructive" });
      else toast({ title: "Leverancier aangemaakt" });
    }

    setSaving(false);
    setDialogOpen(false);
    setForm(emptyLeverancier);
    setEditId(null);
    fetchData();
  };

  const handleEdit = (item: Leverancier) => {
    setForm({
      naam: item.naam, email: item.email || "", telefoon: item.telefoon || "",
      adres: item.adres || "", postcode: item.postcode || "", plaats: item.plaats || "",
      kvk_nummer: item.kvk_nummer || "", btw_nummer: item.btw_nummer || "",
      iban: item.iban || "", contactpersoon: item.contactpersoon || "", notities: item.notities || "",
    });
    setEditId(item.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Weet je zeker dat je deze leverancier wilt verwijderen?")) return;
    const { error } = await supabase.from("leveranciers").delete().eq("id", id);
    if (error) toast({ title: "Fout", description: error.message, variant: "destructive" });
    else { toast({ title: "Verwijderd" }); fetchData(); }
  };

  const filtered = items.filter((i) =>
    i.naam.toLowerCase().includes(search.toLowerCase()) ||
    (i.contactpersoon || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leveranciers</h1>
          <p className="text-muted-foreground">Beheer je leveranciers voor inkooporders en -facturen</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setForm(emptyLeverancier); setEditId(null); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Leverancier</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editId ? "Leverancier bewerken" : "Nieuwe leverancier"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Bedrijfsnaam *</Label>
                <Input value={form.naam} onChange={(e) => setForm({ ...form, naam: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Contactpersoon</Label>
                <Input value={form.contactpersoon} onChange={(e) => setForm({ ...form, contactpersoon: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Telefoon</Label>
                <Input value={form.telefoon} onChange={(e) => setForm({ ...form, telefoon: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Adres</Label>
                <Input value={form.adres} onChange={(e) => setForm({ ...form, adres: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Postcode</Label>
                <Input value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Plaats</Label>
                <Input value={form.plaats} onChange={(e) => setForm({ ...form, plaats: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>KvK-nummer</Label>
                <Input value={form.kvk_nummer} onChange={(e) => setForm({ ...form, kvk_nummer: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>BTW-nummer</Label>
                <Input value={form.btw_nummer} onChange={(e) => setForm({ ...form, btw_nummer: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>IBAN</Label>
                <Input value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Notities</Label>
                <Textarea value={form.notities} onChange={(e) => setForm({ ...form, notities: e.target.value })} rows={2} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuleren</Button>
              <Button onClick={handleSave} disabled={saving || !form.naam.trim()}>
                {editId ? "Opslaan" : "Toevoegen"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Zoek leverancier..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Contactpersoon</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefoon</TableHead>
                <TableHead>Plaats</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {loading ? "Laden..." : "Geen leveranciers gevonden"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.naam}</TableCell>
                    <TableCell>{item.contactpersoon || "—"}</TableCell>
                    <TableCell>{item.email || "—"}</TableCell>
                    <TableCell>{item.telefoon || "—"}</TableCell>
                    <TableCell>{item.plaats || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => setPrijslijstId(item.id)} title="Prijslijst">
                        <ListOrdered className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!prijslijstId} onOpenChange={(o) => !o && setPrijslijstId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Prijslijst — {items.find((i) => i.id === prijslijstId)?.naam ?? ""}
            </DialogTitle>
          </DialogHeader>
          {prijslijstId && profile?.partner_id && (
            <PrijslijstEditor partnerId={profile.partner_id} leverancierId={prijslijstId} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
