import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Addon {
  id: string;
  naam: string;
  slug: string;
  type: string;
  maand_prijs: number;
  jaar_prijs: number;
}

interface Aankoop {
  id: string;
  addon_id: string;
  aantal: number;
  interval: string;
  maand_bedrag: number;
  status: string;
  abonnement_addons?: { naam: string; type: string } | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string | null;
  abonnementId: string | null;
  partnerNaam: string;
}

export default function AddonToewijsDialog({ open, onOpenChange, partnerId, abonnementId, partnerNaam }: Props) {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [aankopen, setAankopen] = useState<Aankoop[]>([]);
  const [form, setForm] = useState({ addon_id: "", aantal: 1, interval: "maand" as "maand" | "jaar" });
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    if (!partnerId) return;
    const [{ data: a }, { data: aa }] = await Promise.all([
      supabase.from("abonnement_addons").select("*").eq("actief", true).order("naam"),
      supabase.from("abonnement_addon_aankopen")
        .select("*, abonnement_addons(naam, type)")
        .eq("partner_id", partnerId)
        .order("created_at", { ascending: false }),
    ]);
    if (a) setAddons(a as Addon[]);
    if (aa) setAankopen(aa as Aankoop[]);
  };

  useEffect(() => { if (open) fetchAll(); }, [open, partnerId]);

  const huidigeAddon = addons.find((a) => a.id === form.addon_id);
  const maandbedrag = huidigeAddon
    ? (form.interval === "jaar" ? huidigeAddon.jaar_prijs / 12 : huidigeAddon.maand_prijs) * form.aantal
    : 0;

  const handleAdd = async () => {
    if (!partnerId || !form.addon_id) {
      toast.error("Kies een add-on");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("abonnement_addon_aankopen").insert({
      partner_id: partnerId,
      abonnement_id: abonnementId,
      addon_id: form.addon_id,
      aantal: form.aantal,
      interval: form.interval,
      maand_bedrag: maandbedrag,
      status: "actief",
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Add-on toegevoegd");
    setForm({ addon_id: "", aantal: 1, interval: "maand" });
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("abonnement_addon_aankopen").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Add-on verwijderd");
    fetchAll();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add-ons — {partnerNaam}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">Actieve add-ons</h4>
            {aankopen.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nog geen add-ons</p>
            ) : (
              <div className="space-y-2">
                {aankopen.map((aa) => (
                  <div key={aa.id} className="flex items-center justify-between rounded-md border p-2">
                    <div className="text-sm">
                      <p className="font-medium">{aa.abonnement_addons?.naam} × {aa.aantal}</p>
                      <p className="text-xs text-muted-foreground">
                        €{Number(aa.maand_bedrag).toFixed(2)}/mnd · {aa.interval} ·{" "}
                        <Badge variant="secondary" className="text-[10px]">{aa.status}</Badge>
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(aa.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t pt-4 space-y-3">
            <h4 className="text-sm font-semibold">Add-on toevoegen</h4>
            <div>
              <Label>Add-on</Label>
              <Select value={form.addon_id} onValueChange={(v) => setForm((p) => ({ ...p, addon_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Kies add-on" /></SelectTrigger>
                <SelectContent>
                  {addons.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.naam} (€{a.maand_prijs}/mnd · €{a.jaar_prijs}/jr)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Aantal</Label><Input type="number" min={1} value={form.aantal} onChange={(e) => setForm((p) => ({ ...p, aantal: Math.max(1, +e.target.value) }))} /></div>
              <div>
                <Label>Interval</Label>
                <Select value={form.interval} onValueChange={(v) => setForm((p) => ({ ...p, interval: v as "maand" | "jaar" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maand">Maandelijks</SelectItem>
                    <SelectItem value="jaar">Jaarlijks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {huidigeAddon && (
              <p className="text-xs text-muted-foreground">Maandbedrag: €{maandbedrag.toFixed(2)}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Sluiten</Button>
          <Button onClick={handleAdd} disabled={saving || !form.addon_id}>{saving ? "Toevoegen..." : "Add-on toevoegen"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}