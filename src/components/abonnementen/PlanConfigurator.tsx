import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AddonConfigurator from "./AddonConfigurator";



const ALL_MODULES = [
  "leads", "offertes", "schouwen", "opdrachten", "installaties", "planning",
  "producten", "analytics", "documenten", "energieadvies", "tools", "webtools",
  "thuisbatterij", "affiliates",
];

const ALL_FEATURES = [
  "basis_rapportage", "email_templates", "geavanceerde_rapportage", "webtools",
  "thuisbatterij_selector", "document_beheer", "affiliate_programma", "white_label", "api_toegang",
];

const moduleLabels: Record<string, string> = {
  leads: "Leads", offertes: "Offertes", schouwen: "Schouwen", opdrachten: "Opdrachten",
  installaties: "Installaties", planning: "Planning", producten: "Producten",
  analytics: "Analytics", documenten: "Documenten", energieadvies: "Energieadvies",
  tools: "Tools", webtools: "Webtools", thuisbatterij: "Thuisbatterij", affiliates: "Affiliates",
};

const featureLabels: Record<string, string> = {
  basis_rapportage: "Basis rapportage", email_templates: "E-mail templates",
  geavanceerde_rapportage: "Geavanceerde rapportage", webtools: "Webtools",
  thuisbatterij_selector: "Thuisbatterij selector", document_beheer: "Documentbeheer",
  affiliate_programma: "Affiliate programma", white_label: "White-label", api_toegang: "API toegang",
};

interface Plan {
  id: string;
  naam: string;
  slug: string;
  beschrijving: string | null;
  maand_prijs: number;
  jaar_prijs: number;
  max_leads: number | null;
  max_offertes: number | null;
  max_gebruikers: number | null;
  max_adviseurs: number | null;
  max_installateurs: number | null;
  modules: string[];
  features: string[];
  voorwaarden: string | null;
  actief: boolean;
  volgorde: number;
}

const emptyPlan: Omit<Plan, "id"> = {
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
  const [form, setForm] = useState<Omit<Plan, "id">>(emptyPlan);
  const [saving, setSaving] = useState(false);

  const fetchPlans = async () => {
    const { data } = await supabase.from("abonnement_plannen")
      .select("*").order("volgorde");
    if (data) {
      setPlans(data.map(p => ({
        ...p,
        modules: Array.isArray(p.modules) ? p.modules as string[] : [],
        features: Array.isArray(p.features) ? p.features as string[] : [],
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
      modules: form.modules as any, features: form.features as any,
      voorwaarden: form.voorwaarden || null, actief: form.actief, volgorde: form.volgorde,
    };

    if (editPlan) {
      const { error } = await supabase.from("abonnement_plannen").update(payload).eq("id", editPlan.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Plan bijgewerkt");
    } else {
      const { error } = await supabase.from("abonnement_plannen").insert(payload);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Plan aangemaakt");
    }
    setSaving(false);
    setDialogOpen(false);
    fetchPlans();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("abonnement_plannen").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Plan verwijderd");
    fetchPlans();
  };

  const toggleModule = (mod: string) => {
    setForm(prev => ({
      ...prev,
      modules: prev.modules.includes(mod) ? prev.modules.filter(m => m !== mod) : [...prev.modules, mod],
    }));
  };

  const toggleFeature = (feat: string) => {
    setForm(prev => ({
      ...prev,
      features: prev.features.includes(feat) ? prev.features.filter(f => f !== feat) : [...prev.features, feat],
    }));
  };

  if (loading) return <p className="text-sm text-muted-foreground">Laden...</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Abonnementsplannen</h3>
        <Button onClick={openNew} size="sm"><Plus className="h-4 w-4 mr-1" />Nieuw plan</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map(plan => (
          <Card key={plan.id} className={`rounded-2xl ${!plan.actief ? "opacity-50" : ""}`}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">{plan.naam}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{plan.slug}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(plan)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(plan.id)}>
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
              <div className="flex flex-wrap gap-1">
                {plan.modules.slice(0, 5).map(m => (
                  <Badge key={m} variant="secondary" className="text-[10px]">{moduleLabels[m] ?? m}</Badge>
                ))}
                {plan.modules.length > 5 && <Badge variant="outline" className="text-[10px]">+{plan.modules.length - 5}</Badge>}
              </div>
              {!plan.actief && <Badge variant="outline" className="text-destructive">Inactief</Badge>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editPlan ? "Plan bewerken" : "Nieuw plan"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Naam</Label><Input value={form.naam} onChange={e => setForm(p => ({ ...p, naam: e.target.value }))} /></div>
              <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} /></div>
            </div>
            <div><Label>Beschrijving</Label><Textarea value={form.beschrijving ?? ""} onChange={e => setForm(p => ({ ...p, beschrijving: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Maandprijs (€)</Label><Input type="number" value={form.maand_prijs} onChange={e => setForm(p => ({ ...p, maand_prijs: +e.target.value }))} /></div>
              <div><Label>Jaarprijs (€)</Label><Input type="number" value={form.jaar_prijs} onChange={e => setForm(p => ({ ...p, jaar_prijs: +e.target.value }))} /></div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div><Label>Max leads</Label><Input type="number" placeholder="∞" value={form.max_leads ?? ""} onChange={e => setForm(p => ({ ...p, max_leads: e.target.value ? +e.target.value : null }))} /></div>
              <div><Label>Max offertes</Label><Input type="number" placeholder="∞" value={form.max_offertes ?? ""} onChange={e => setForm(p => ({ ...p, max_offertes: e.target.value ? +e.target.value : null }))} /></div>
              <div><Label>Max gebruikers</Label><Input type="number" placeholder="∞" value={form.max_gebruikers ?? ""} onChange={e => setForm(p => ({ ...p, max_gebruikers: e.target.value ? +e.target.value : null }))} /></div>
              <div><Label>Max adviseurs</Label><Input type="number" placeholder="∞" value={form.max_adviseurs ?? ""} onChange={e => setForm(p => ({ ...p, max_adviseurs: e.target.value ? +e.target.value : null }))} /></div>
              <div><Label>Max installateurs</Label><Input type="number" placeholder="∞" value={form.max_installateurs ?? ""} onChange={e => setForm(p => ({ ...p, max_installateurs: e.target.value ? +e.target.value : null }))} /></div>
              <div><Label>Volgorde</Label><Input type="number" value={form.volgorde} onChange={e => setForm(p => ({ ...p, volgorde: +e.target.value }))} /></div>
            </div>

            <div>
              <Label className="mb-2 block">Modules</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ALL_MODULES.map(mod => (
                  <label key={mod} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={form.modules.includes(mod)} onCheckedChange={() => toggleModule(mod)} />
                    {moduleLabels[mod] ?? mod}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Features</Label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_FEATURES.map(feat => (
                  <label key={feat} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={form.features.includes(feat)} onCheckedChange={() => toggleFeature(feat)} />
                    {featureLabels[feat] ?? feat}
                  </label>
                ))}
              </div>
            </div>

            <div><Label>Voorwaarden</Label><Textarea rows={4} value={form.voorwaarden ?? ""} onChange={e => setForm(p => ({ ...p, voorwaarden: e.target.value }))} /></div>

            <div className="flex items-center gap-2">
              <Switch checked={form.actief} onCheckedChange={v => setForm(p => ({ ...p, actief: v }))} />
              <Label>Actief (beschikbaar voor nieuwe abonnementen)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuleren</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Opslaan..." : "Opslaan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add-ons configuratie */}
      <div className="mt-8 pt-6 border-t">
        <AddonConfigurator />
      </div>
    </div>
  );
}
