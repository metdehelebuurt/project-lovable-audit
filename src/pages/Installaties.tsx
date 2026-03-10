import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Wrench, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type InstallatieStatus = Database["public"]["Enums"]["installatie_status"];

interface Installatie {
  id: string;
  partner_id: string;
  offerte_id: string | null;
  lead_id: string | null;
  installateur_id: string | null;
  consument_id: string | null;
  consument_naam: string | null;
  status: InstallatieStatus;
  geplande_startdatum: string | null;
  geplande_einddatum: string | null;
  notities: string | null;
  created_at: string;
}

const statusLabels: Record<InstallatieStatus, string> = {
  gepland: "Gepland",
  in_uitvoering: "In uitvoering",
  afgerond: "Afgerond",
  geannuleerd: "Geannuleerd",
};

const statusColors: Record<InstallatieStatus, string> = {
  gepland: "bg-primary/10 text-primary",
  in_uitvoering: "bg-warning-light text-warning-foreground",
  afgerond: "bg-success-light text-success",
  geannuleerd: "bg-error-light text-error",
};

const emptyForm = {
  consument_naam: "",
  installateur_id: "",
  offerte_id: "",
  lead_id: "",
  status: "gepland" as InstallatieStatus,
  geplande_startdatum: "",
  geplande_einddatum: "",
  notities: "",
};

const Installaties = () => {
  const { profile } = useAuth();
  const [installaties, setInstallaties] = useState<Installatie[]>([]);
  const [installateurs, setInstallateurs] = useState<{ id: string; voornaam: string; achternaam: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);

  const isSuperadmin = profile?.rol === "superadmin";

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("installaties")
      .select("*")
      .order("created_at", { ascending: false });
    setInstallaties(data ?? []);

    // Fetch installateurs
    const { data: users } = await supabase
      .from("users")
      .select("id, voornaam, achternaam")
      .eq("rol", "installateur");
    setInstallateurs(users ?? []);

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (!form.consument_naam.trim()) {
      toast.error("Consument naam is verplicht");
      return;
    }
    if (!profile?.partner_id && !isSuperadmin) {
      toast.error("Geen partner gekoppeld");
      return;
    }

    const payload = {
      consument_naam: form.consument_naam,
      installateur_id: form.installateur_id || null,
      offerte_id: form.offerte_id || null,
      lead_id: form.lead_id || null,
      status: form.status,
      geplande_startdatum: form.geplande_startdatum || null,
      geplande_einddatum: form.geplande_einddatum || null,
      notities: form.notities || null,
      partner_id: profile!.partner_id ?? installaties[0]?.partner_id ?? "",
    };

    if (editId) {
      const { error } = await supabase.from("installaties").update(payload).eq("id", editId);
      if (error) { toast.error(error.message); return; }
      toast.success("Installatie bijgewerkt");
    } else {
      const { error } = await supabase.from("installaties").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Installatie aangemaakt");
    }
    setOpen(false);
    setForm(emptyForm);
    setEditId(null);
    fetchData();
  };

  const handleEdit = (inst: Installatie) => {
    setForm({
      consument_naam: inst.consument_naam ?? "",
      installateur_id: inst.installateur_id ?? "",
      offerte_id: inst.offerte_id ?? "",
      lead_id: inst.lead_id ?? "",
      status: inst.status,
      geplande_startdatum: inst.geplande_startdatum ?? "",
      geplande_einddatum: inst.geplande_einddatum ?? "",
      notities: inst.notities ?? "",
    });
    setEditId(inst.id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Weet je zeker dat je deze installatie wilt verwijderen?")) return;
    const { error } = await supabase.from("installaties").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Verwijderd");
    fetchData();
  };

  const handleStatusChange = async (id: string, status: InstallatieStatus) => {
    const { error } = await supabase.from("installaties").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Status bijgewerkt");
    fetchData();
  };

  const filtered = installaties.filter((i) =>
    (i.consument_naam ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Installaties</h1>
          <p className="text-muted-foreground mt-1">Beheer installatieopdrachten</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setForm(emptyForm); setEditId(null); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nieuwe installatie</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editId ? "Installatie bewerken" : "Nieuwe installatie"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div>
                <Label>Consument naam *</Label>
                <Input value={form.consument_naam} onChange={(e) => setForm({ ...form, consument_naam: e.target.value })} />
              </div>
              <div>
                <Label>Installateur</Label>
                <Select value={form.installateur_id} onValueChange={(v) => setForm({ ...form, installateur_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecteer installateur" /></SelectTrigger>
                  <SelectContent>
                    {installateurs.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.voornaam} {u.achternaam}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as InstallatieStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Startdatum</Label>
                  <Input type="date" value={form.geplande_startdatum} onChange={(e) => setForm({ ...form, geplande_startdatum: e.target.value })} />
                </div>
                <div>
                  <Label>Einddatum</Label>
                  <Input type="date" value={form.geplande_einddatum} onChange={(e) => setForm({ ...form, geplande_einddatum: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Notities</Label>
                <Textarea value={form.notities} onChange={(e) => setForm({ ...form, notities: e.target.value })} />
              </div>
              <Button onClick={handleSave}>{editId ? "Opslaan" : "Aanmaken"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Zoeken op consument..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Consument</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Startdatum</TableHead>
                <TableHead>Einddatum</TableHead>
                <TableHead className="text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Laden...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Geen installaties gevonden</TableCell></TableRow>
              ) : filtered.map((inst) => (
                <TableRow key={inst.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleEdit(inst)}>
                  <TableCell className="font-medium">{inst.consument_naam ?? "—"}</TableCell>
                  <TableCell>
                    <Select value={inst.status} onValueChange={(v) => handleStatusChange(inst.id, v as InstallatieStatus)}>
                      <SelectTrigger className="w-[160px]" onClick={(e) => e.stopPropagation()}>
                        <Badge className={statusColors[inst.status]}>{statusLabels[inst.status]}</Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{inst.geplande_startdatum ?? "—"}</TableCell>
                  <TableCell>{inst.geplande_einddatum ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(inst.id); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Installaties;
