import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AddonConfigurator from "../AddonConfigurator";
import { MODULE_BY_KEY } from "@/lib/modules";
import { FEATURE_BY_KEY } from "@/lib/abonnementFeatures";
import PlanForm, { type PlanFormData } from "./PlanForm";

interface Plan extends PlanFormData {
  id: string;
}

const emptyPlan: PlanFormData = {
  naam: "", slug: "", beschrijving: "", maand_prijs: 0, jaar_prijs: 0,
  max_leads: null, max_offertes: null, max_gebruikers: null,
  max_adviseurs: null, max_installateurs: null,
  modules: [], features: [], voorwaarden: "", actief: true, volgorde: 0,
};

export default function PlanConfigurator() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState<PlanFormData>(emptyPlan);
  const [saving, setSaving] = useState(false);

  const fetchPlans = async () => {
    const { data } = await supabase.from("abonnement_plannen").select("*").order("volgorde");
    if (data) {
      setPlans(data.map((p) => ({
        ...p,
        beschrijving: p.beschrijving ?? "",
        voorwaarden: p.voorwaarden ?? "",
        modules: Array.isArray(p.modules) ? (p.modules as string[]) : [],
        features: Array.isArray(p.features) ? (p.features as string[]) : [],
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchPlans(); }, []);

  const openNew = () => {
    setEditPlan(null);
    setForm({ ...emptyPlan, volgorde: plans.length + 1 });
    setDialogOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditPlan(plan);
    setForm({ ...plan });
    setDialogOpen(true);
  };

  const openDuplicate = (plan: Plan) => {
    setEditPlan(null);
    setForm({
      ...plan,
      naam: `${plan.naam} (kopie)`,
      slug: `${plan.slug}-kopie`,
      volgorde: plans.length + 1,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.naam.trim() || !form.slug.trim()) {
      toast.error("Naam en slug zijn verplicht");
      return;
    }
    setSaving(true);
    const payload = {
      naam: form.naam, slug: form.slug, beschrijving: form.beschrijving || null,
      maand_prijs: form.maand_prijs, jaar_prijs: form.jaar_prijs,
      max_leads: form.max_leads, max_offertes: form.max_offertes,
      max_gebruikers: form.max_gebruikers, max_adviseurs: form.max_adviseurs,
      max_installateurs: form.max_installateurs,
      modules: form.modules as never, features: form.features as never,
      voorwaarden: form.voorwaarden || null, actief: form.actief, volgorde: form.volgorde,
    };

    const { error } = editPlan
      ? await supabase.from("abonnement_plannen").update(payload).eq("id", editPlan.id)
      : await supabase.from("abonnement_plannen").insert(payload);

    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editPlan ? "Plan bijgewerkt" : "Plan aangemaakt");
    setDialogOpen(false);
    fetchPlans();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Plan verwijderen? Dit kan niet ongedaan worden gemaakt.")) return;
    const { error } = await supabase.from("abonnement_plannen").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Plan verwijderd");
    fetchPlans();
  };

  if (loading) return <p className="text-sm text-muted-foreground">Laden...</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Abonnementsplannen</h3>
        <Button onClick={openNew} size="sm"><Plus className="h-4 w-4 mr-1" />Nieuw plan</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card key={plan.id} className={`rounded-2xl ${!plan.actief ? "opacity-60" : ""}`}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">{plan.naam}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{plan.slug}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDuplicate(plan)} title="Dupliceer">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(plan)} title="Bewerken">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(plan.id)} title="Verwijderen">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-4">
                <div>
                  <p className="text-2xl font-bold">€{plan.maand_prijs}</p>
                  <p className="text-xs text-muted-foreground">/maand</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">€{plan.jaar_prijs}</p>
                  <p className="text-xs text-muted-foreground">/jaar</p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Leads: {plan.max_leads ?? "∞"} | Offertes: {plan.max_offertes ?? "∞"}</p>
                <p>Gebruikers: {plan.max_gebruikers ?? "∞"} | Adviseurs: {plan.max_adviseurs ?? "∞"}</p>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Modules ({plan.modules.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {plan.modules.slice(0, 5).map((m) => (
                      <Badge key={m} variant="secondary" className="text-[10px]">
                        {MODULE_BY_KEY[m]?.label ?? m}
                      </Badge>
                    ))}
                    {plan.modules.length > 5 && <Badge variant="outline" className="text-[10px]">+{plan.modules.length - 5}</Badge>}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Features ({plan.features.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {plan.features.slice(0, 4).map((f) => (
                      <Badge key={f} variant="outline" className="text-[10px]">
                        {FEATURE_BY_KEY[f]?.label ?? f}
                      </Badge>
                    ))}
                    {plan.features.length > 4 && <Badge variant="outline" className="text-[10px]">+{plan.features.length - 4}</Badge>}
                  </div>
                </div>
              </div>
              {!plan.actief && <Badge variant="outline" className="text-destructive">Inactief</Badge>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editPlan ? "Plan bewerken" : "Nieuw plan"}</DialogTitle>
          </DialogHeader>
          <PlanForm
            form={form}
            onChange={setForm}
            onSave={handleSave}
            onCancel={() => setDialogOpen(false)}
            saving={saving}
            isEdit={!!editPlan}
          />
        </DialogContent>
      </Dialog>

      <div className="mt-8 pt-6 border-t">
        <AddonConfigurator />
      </div>
    </div>
  );
}
