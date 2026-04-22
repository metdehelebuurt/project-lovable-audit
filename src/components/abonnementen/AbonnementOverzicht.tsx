import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { AlertTriangle, Pencil, RefreshCw, Plus, Trash2, Package } from "lucide-react";
import NieuwAbonnementDialog from "./NieuwAbonnementDialog";
import AddonToewijsDialog from "./AddonToewijsDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Abonnement {
  id: string;
  partner_id: string;
  plan: string;
  plan_id: string | null;
  status: string;
  interval: string;
  maand_bedrag: number;
  start_datum: string;
  verloop_datum: string | null;
  opzeg_datum: string | null;
  korting_percentage: number;
  korting_vast_bedrag: number;
  korting_reden: string | null;
  gratis_maanden: number;
  notities: string | null;
  partners?: { naam: string } | null;
  abonnement_plannen?: { naam: string; slug: string } | null;
}

const statusKleuren: Record<string, string> = {
  actief: "bg-green-100 text-green-800",
  trial: "bg-blue-100 text-blue-800",
  verlopen: "bg-red-100 text-red-800",
  opgezegd: "bg-orange-100 text-orange-800",
  gepauzeerd: "bg-yellow-100 text-yellow-800",
};

export default function AbonnementOverzicht() {
  const [abonnementen, setAbonnementen] = useState<Abonnement[]>([]);
  const [plans, setPlans] = useState<{ id: string; naam: string; slug: string; maand_prijs: number; jaar_prijs: number }[]>([]);
  const [addonCounts, setAddonCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState("alle");
  const [planFilter, setPlanFilter] = useState("alle");
  const [search, setSearch] = useState("");
  const [editDialog, setEditDialog] = useState(false);
  const [selected, setSelected] = useState<Abonnement | null>(null);
  const [editForm, setEditForm] = useState({ plan_id: "", status: "", korting_percentage: 0, korting_vast_bedrag: 0, korting_reden: "", gratis_maanden: 0, notities: "", verloop_datum: "" });
  const [saving, setSaving] = useState(false);
  const [nieuwOpen, setNieuwOpen] = useState(false);
  const [addonOpen, setAddonOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Abonnement | null>(null);
  const [addonTarget, setAddonTarget] = useState<Abonnement | null>(null);

  const fetchAll = async () => {
    const [{ data: aboData }, { data: planData }, { data: addonData }] = await Promise.all([
      supabase.from("abonnementen").select("*, partners(naam), abonnement_plannen(naam, slug)").order("created_at", { ascending: false }),
      supabase.from("abonnement_plannen").select("id, naam, slug, maand_prijs, jaar_prijs").eq("actief", true).order("volgorde"),
      supabase.from("abonnement_addon_aankopen").select("partner_id, aantal").eq("status", "actief"),
    ]);
    if (aboData) setAbonnementen(aboData as any);
    if (planData) setPlans(planData);
    const counts: Record<string, number> = {};
    (addonData ?? []).forEach((a: { partner_id: string; aantal: number }) => {
      counts[a.partner_id] = (counts[a.partner_id] ?? 0) + (a.aantal || 0);
    });
    setAddonCounts(counts);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("mollie-sync-status", { body: {} });
      if (error) throw error;
      const synced = (data as { synced?: number })?.synced ?? 0;
      toast.success(`${synced} abonnement(en) gesynchroniseerd met Mollie`);
      fetchAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Synchronisatie mislukt");
    } finally {
      setSyncing(false);
    }
  };

  const filtered = abonnementen.filter(a => {
    if (filter !== "alle" && a.status !== filter) return false;
    if (planFilter !== "alle" && a.plan_id !== planFilter) return false;
    if (search && !(a.partners as any)?.naam?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const warnings = abonnementen.filter(a => {
    if (a.status === "trial" && a.verloop_datum) {
      const days = Math.ceil((new Date(a.verloop_datum).getTime() - Date.now()) / 86400000);
      return days <= 7 && days >= 0;
    }
    return false;
  });

  const openEdit = (abo: Abonnement) => {
    setSelected(abo);
    setEditForm({
      plan_id: abo.plan_id ?? "",
      status: abo.status,
      korting_percentage: (abo as any).korting_percentage ?? 0,
      korting_vast_bedrag: (abo as any).korting_vast_bedrag ?? 0,
      korting_reden: (abo as any).korting_reden ?? "",
      gratis_maanden: (abo as any).gratis_maanden ?? 0,
      notities: (abo as any).notities ?? "",
      verloop_datum: abo.verloop_datum ?? "",
    });
    setEditDialog(true);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase.from("abonnementen").update({
      plan_id: editForm.plan_id || null,
      status: editForm.status,
      korting_percentage: editForm.korting_percentage,
      korting_vast_bedrag: editForm.korting_vast_bedrag,
      korting_reden: editForm.korting_reden || null,
      gratis_maanden: editForm.gratis_maanden,
      notities: editForm.notities || null,
      verloop_datum: editForm.verloop_datum || null,
    } as any).eq("id", selected.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Abonnement bijgewerkt");

    // Log wijziging
    await supabase.from("abonnement_wijzigingen").insert({
      abonnement_id: selected.id,
      partner_id: selected.partner_id,
      type: "bewerkt",
      details: { wijzigingen: editForm } as any,
    } as any);

    setEditDialog(false);
    fetchAll();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("abonnementen").delete().eq("id", deleteTarget.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Abonnement verwijderd");
    setDeleteTarget(null);
    fetchAll();
  };

  if (loading) return <p className="text-sm text-muted-foreground">Laden...</p>;

  return (
    <div className="space-y-4">
      {warnings.length > 0 && (
        <Card className="rounded-2xl border-orange-200 bg-orange-50">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">{warnings.length} trial(s) verlopen binnenkort</span>
            </div>
            <div className="mt-2 space-y-1">
              {warnings.map(w => (
                <p key={w.id} className="text-xs text-orange-700">
                  {(w.partners as any)?.naam} — verloopt {w.verloop_datum ? format(new Date(w.verloop_datum), "d MMM yyyy", { locale: nl }) : ""}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <Input placeholder="Zoek partner..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle statussen</SelectItem>
            <SelectItem value="actief">Actief</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="verlopen">Verlopen</SelectItem>
            <SelectItem value="opgezegd">Opgezegd</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing} className="ml-auto">
          <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? "animate-spin" : ""}`} />
          Sync Mollie
        </Button>
        <Button size="sm" onClick={() => setNieuwOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />Nieuw abonnement
        </Button>
      </div>

      <Card className="rounded-2xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Partner</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Interval</TableHead>
              <TableHead>Bedrag</TableHead>
              <TableHead>Verloopt</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(abo => (
              <TableRow key={abo.id}>
                <TableCell className="font-medium">{(abo.partners as any)?.naam ?? "-"}</TableCell>
                <TableCell>{(abo.abonnement_plannen as any)?.naam ?? abo.plan}</TableCell>
                <TableCell>
                  <Badge className={statusKleuren[abo.status] ?? "bg-muted text-foreground"}>{abo.status}</Badge>
                </TableCell>
                <TableCell className="text-sm">{(abo as any).interval ?? "-"}</TableCell>
                <TableCell>€{abo.maand_bedrag}</TableCell>
                <TableCell className="text-sm">
                  {abo.verloop_datum ? format(new Date(abo.verloop_datum), "d MMM yyyy", { locale: nl }) : "-"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(abo)} title="Bewerken">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setAddonTarget(abo); setAddonOpen(true); }} title="Add-ons">
                      <Package className="h-3.5 w-3.5" />
                      {addonCounts[abo.partner_id] ? (
                        <span className="ml-0.5 text-[10px]">{addonCounts[abo.partner_id]}</span>
                      ) : null}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(abo)} title="Verwijderen">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Geen abonnementen gevonden</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Abonnement bewerken</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Plan</Label>
              <Select value={editForm.plan_id} onValueChange={v => setEditForm(p => ({ ...p, plan_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecteer plan" /></SelectTrigger>
                <SelectContent>
                  {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.naam} — €{p.maand_prijs}/mnd</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Status</Label>
              <Select value={editForm.status} onValueChange={v => setEditForm(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="actief">Actief</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="verlopen">Verlopen</SelectItem>
                  <SelectItem value="opgezegd">Opgezegd</SelectItem>
                  <SelectItem value="gepauzeerd">Gepauzeerd</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Verloop datum</Label><Input type="date" value={editForm.verloop_datum} onChange={e => setEditForm(p => ({ ...p, verloop_datum: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Korting %</Label><Input type="number" value={editForm.korting_percentage} onChange={e => setEditForm(p => ({ ...p, korting_percentage: +e.target.value }))} /></div>
              <div><Label>Korting vast €</Label><Input type="number" value={editForm.korting_vast_bedrag} onChange={e => setEditForm(p => ({ ...p, korting_vast_bedrag: +e.target.value }))} /></div>
            </div>
            <div><Label>Korting reden</Label><Input value={editForm.korting_reden} onChange={e => setEditForm(p => ({ ...p, korting_reden: e.target.value }))} /></div>
            <div><Label>Gratis maanden</Label><Input type="number" value={editForm.gratis_maanden} onChange={e => setEditForm(p => ({ ...p, gratis_maanden: +e.target.value }))} /></div>
            <div><Label>Notities</Label><Textarea value={editForm.notities} onChange={e => setEditForm(p => ({ ...p, notities: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>Annuleren</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Opslaan..." : "Opslaan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NieuwAbonnementDialog
        open={nieuwOpen}
        onOpenChange={setNieuwOpen}
        plans={plans}
        onCreated={fetchAll}
      />

      <AddonToewijsDialog
        open={addonOpen}
        onOpenChange={(v) => { setAddonOpen(v); if (!v) fetchAll(); }}
        partnerId={addonTarget?.partner_id ?? null}
        abonnementId={addonTarget?.id ?? null}
        partnerNaam={(addonTarget?.partners as { naam?: string } | null | undefined)?.naam ?? ""}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Abonnement verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Je verwijdert het abonnement van <strong>{(deleteTarget?.partners as { naam?: string } | null | undefined)?.naam ?? "deze partner"}</strong>.
              Dit kan niet ongedaan worden. Eventuele Mollie-subscription moet apart worden opgezegd.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
