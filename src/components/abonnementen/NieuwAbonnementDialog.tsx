import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Plan {
  id: string;
  naam: string;
  slug: string;
  maand_prijs: number;
  jaar_prijs: number;
}

interface Partner {
  id: string;
  naam: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: Plan[];
  onCreated: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function NieuwAbonnementDialog({ open, onOpenChange, plans, onCreated }: Props) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [bestaande, setBestaande] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    partner_id: "",
    plan_id: "",
    interval: "maand" as "maand" | "jaar",
    status: "trial",
    start_datum: today(),
    trial_dagen: 14,
    korting_percentage: 0,
    korting_vast_bedrag: 0,
    korting_reden: "",
    notities: "",
  });

  useEffect(() => {
    if (!open) return;
    (async () => {
      const [{ data: p }, { data: a }] = await Promise.all([
        supabase.from("partners").select("id, naam").order("naam"),
        supabase.from("abonnementen").select("partner_id"),
      ]);
      if (p) setPartners(p);
      setBestaande(new Set((a ?? []).map((x: { partner_id: string }) => x.partner_id)));
    })();
  }, [open]);

  const beschikbarePartners = partners.filter((p) => !bestaande.has(p.id));
  const huidigPlan = plans.find((p) => p.id === form.plan_id);
  const basisBedrag = huidigPlan
    ? form.interval === "jaar" ? huidigPlan.jaar_prijs / 12 : huidigPlan.maand_prijs
    : 0;

  const handleSave = async () => {
    if (!form.partner_id || !form.plan_id) {
      toast.error("Kies een partner en plan");
      return;
    }
    setSaving(true);
    const verloopDatum = form.status === "trial" && form.trial_dagen > 0
      ? new Date(Date.now() + form.trial_dagen * 86400000).toISOString().slice(0, 10)
      : null;

    const { data: nieuw, error } = await supabase.from("abonnementen").insert({
      partner_id: form.partner_id,
      plan_id: form.plan_id,
      plan: huidigPlan?.slug ?? "starter",
      interval: form.interval,
      status: form.status,
      maand_bedrag: basisBedrag,
      start_datum: form.start_datum,
      verloop_datum: verloopDatum,
      korting_percentage: form.korting_percentage,
      korting_vast_bedrag: form.korting_vast_bedrag,
      korting_reden: form.korting_reden || null,
      notities: form.notities || null,
    }).select("id").single();

    if (error || !nieuw) {
      setSaving(false);
      toast.error(error?.message ?? "Aanmaken mislukt");
      return;
    }

    await supabase.from("abonnement_wijzigingen").insert({
      abonnement_id: nieuw.id,
      partner_id: form.partner_id,
      naar_plan_id: form.plan_id,
      type: "aangemaakt",
      details: { handmatig: true, status: form.status, interval: form.interval },
    });

    setSaving(false);
    toast.success("Abonnement aangemaakt");
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nieuw abonnement</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Partner</Label>
            <Select value={form.partner_id} onValueChange={(v) => setForm((p) => ({ ...p, partner_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecteer partner zonder abonnement" /></SelectTrigger>
              <SelectContent>
                {beschikbarePartners.length === 0
                  ? <SelectItem value="_geen" disabled>Alle partners hebben al een abonnement</SelectItem>
                  : beschikbarePartners.map((p) => <SelectItem key={p.id} value={p.id}>{p.naam}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Plan</Label>
              <Select value={form.plan_id} onValueChange={(v) => setForm((p) => ({ ...p, plan_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Plan" /></SelectTrigger>
                <SelectContent>
                  {plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.naam}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="actief">Actief</SelectItem>
                  <SelectItem value="gepauzeerd">Gepauzeerd</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Startdatum</Label>
              <Input type="date" value={form.start_datum} onChange={(e) => setForm((p) => ({ ...p, start_datum: e.target.value }))} />
            </div>
          </div>
          {form.status === "trial" && (
            <div>
              <Label>Trial-dagen</Label>
              <Input type="number" value={form.trial_dagen} onChange={(e) => setForm((p) => ({ ...p, trial_dagen: +e.target.value }))} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Korting %</Label><Input type="number" value={form.korting_percentage} onChange={(e) => setForm((p) => ({ ...p, korting_percentage: +e.target.value }))} /></div>
            <div><Label>Korting vast €</Label><Input type="number" value={form.korting_vast_bedrag} onChange={(e) => setForm((p) => ({ ...p, korting_vast_bedrag: +e.target.value }))} /></div>
          </div>
          <div><Label>Korting-reden</Label><Input value={form.korting_reden} onChange={(e) => setForm((p) => ({ ...p, korting_reden: e.target.value }))} /></div>
          <div><Label>Notities</Label><Textarea value={form.notities} onChange={(e) => setForm((p) => ({ ...p, notities: e.target.value }))} /></div>
          {huidigPlan && (
            <p className="text-xs text-muted-foreground">
              Maandbedrag: €{basisBedrag.toFixed(2)} ({form.interval === "jaar" ? "jaarprijs / 12" : "maandprijs"}).
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Aanmaken..." : "Abonnement aanmaken"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}