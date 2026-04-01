import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Addon {
  id: string;
  naam: string;
  slug: string;
  type: string;
  maand_prijs: number;
  jaar_prijs: number;
  beschrijving: string | null;
  actief: boolean;
}

const emptyAddon = {
  naam: "", slug: "", type: "adviseur", maand_prijs: 0, jaar_prijs: 0, beschrijving: "", actief: true,
};

export default function AddonConfigurator() {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAddon, setEditAddon] = useState<Addon | null>(null);
  const [form, setForm] = useState(emptyAddon);
  const [saving, setSaving] = useState(false);

  const fetchAddons = async () => {
    const { data } = await supabase.from("abonnement_addons").select("*").order("created_at");
    if (data) setAddons(data as any);
    setLoading(false);
  };

  useEffect(() => { fetchAddons(); }, []);

  const openNew = () => {
    setEditAddon(null);
    setForm({ ...emptyAddon });
    setDialogOpen(true);
  };

  const openEdit = (addon: Addon) => {
    setEditAddon(addon);
    setForm({ naam: addon.naam, slug: addon.slug, type: addon.type, maand_prijs: addon.maand_prijs, jaar_prijs: addon.jaar_prijs, beschrijving: addon.beschrijving ?? "", actief: addon.actief });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.naam.trim() || !form.slug.trim()) {
      toast.error("Naam en slug zijn verplicht");
      return;
    }
    setSaving(true);
    const payload = {
      naam: form.naam, slug: form.slug, type: form.type,
      maand_prijs: form.maand_prijs, jaar_prijs: form.jaar_prijs,
      beschrijving: form.beschrijving || null, actief: form.actief,
    };

    if (editAddon) {
      const { error } = await supabase.from("abonnement_addons").update(payload).eq("id", editAddon.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Add-on bijgewerkt");
    } else {
      const { error } = await supabase.from("abonnement_addons").insert(payload);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Add-on aangemaakt");
    }
    setSaving(false);
    setDialogOpen(false);
    fetchAddons();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("abonnement_addons").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Add-on verwijderd");
    fetchAddons();
  };

  if (loading) return <p className="text-sm text-muted-foreground">Laden...</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Add-ons beheer</h3>
        <Button onClick={openNew} size="sm"><Plus className="h-4 w-4 mr-1" />Nieuwe add-on</Button>
      </div>

      <Card className="rounded-2xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Naam</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Maandprijs</TableHead>
              <TableHead>Jaarprijs</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {addons.map(addon => (
              <TableRow key={addon.id} className={!addon.actief ? "opacity-50" : ""}>
                <TableCell>
                  <div>
                    <p className="font-medium">{addon.naam}</p>
                    <p className="text-xs text-muted-foreground">{addon.slug}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">{addon.type}</Badge>
                </TableCell>
                <TableCell>€{addon.maand_prijs}/mnd</TableCell>
                <TableCell>€{addon.jaar_prijs}/jaar</TableCell>
                <TableCell>
                  <Badge className={addon.actief ? "bg-green-100 text-green-800" : "bg-muted text-foreground"}>
                    {addon.actief ? "Actief" : "Inactief"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(addon)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(addon.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {addons.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Geen add-ons geconfigureerd</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editAddon ? "Add-on bewerken" : "Nieuwe add-on"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Naam</Label><Input value={form.naam} onChange={e => setForm(p => ({ ...p, naam: e.target.value }))} placeholder="Extra adviseur" /></div>
              <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="extra_adviseur" /></div>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="adviseur">Adviseur</SelectItem>
                  <SelectItem value="installateur">Installateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Maandprijs (€)</Label><Input type="number" value={form.maand_prijs} onChange={e => setForm(p => ({ ...p, maand_prijs: +e.target.value }))} /></div>
              <div><Label>Jaarprijs (€)</Label><Input type="number" value={form.jaar_prijs} onChange={e => setForm(p => ({ ...p, jaar_prijs: +e.target.value }))} /></div>
            </div>
            <div><Label>Beschrijving</Label><Input value={form.beschrijving} onChange={e => setForm(p => ({ ...p, beschrijving: e.target.value }))} /></div>
            <div className="flex items-center gap-2">
              <Switch checked={form.actief} onCheckedChange={v => setForm(p => ({ ...p, actief: v }))} />
              <Label>Actief</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuleren</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Opslaan..." : "Opslaan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
