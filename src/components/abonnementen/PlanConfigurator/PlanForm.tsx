import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import ModuleSelector from "./ModuleSelector";
import FeatureSelector from "./FeatureSelector";

export interface PlanFormData {
  naam: string;
  slug: string;
  beschrijving: string;
  maand_prijs: number;
  jaar_prijs: number;
  max_leads: number | null;
  max_offertes: number | null;
  max_gebruikers: number | null;
  max_adviseurs: number | null;
  max_installateurs: number | null;
  modules: string[];
  features: string[];
  voorwaarden: string;
  actief: boolean;
  volgorde: number;
}

interface Props {
  form: PlanFormData;
  onChange: (next: PlanFormData) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  isEdit: boolean;
}

const numField = (val: number | null, set: (v: number | null) => void) => (
  <Input
    type="number"
    placeholder="∞"
    value={val ?? ""}
    onChange={(e) => set(e.target.value ? +e.target.value : null)}
  />
);

export default function PlanForm({ form, onChange, onSave, onCancel, saving, isEdit }: Props) {
  const patch = (p: Partial<PlanFormData>) => onChange({ ...form, ...p });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Naam</Label>
          <Input value={form.naam} onChange={(e) => patch({ naam: e.target.value })} />
        </div>
        <div>
          <Label>Slug</Label>
          <Input value={form.slug} onChange={(e) => patch({ slug: e.target.value })} />
        </div>
      </div>

      <div>
        <Label>Beschrijving</Label>
        <Textarea value={form.beschrijving} onChange={(e) => patch({ beschrijving: e.target.value })} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Maandprijs (€)</Label>
          <Input type="number" value={form.maand_prijs} onChange={(e) => patch({ maand_prijs: +e.target.value })} />
        </div>
        <div>
          <Label>Jaarprijs (€)</Label>
          <Input type="number" value={form.jaar_prijs} onChange={(e) => patch({ jaar_prijs: +e.target.value })} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div><Label>Max leads</Label>{numField(form.max_leads, (v) => patch({ max_leads: v }))}</div>
        <div><Label>Max offertes</Label>{numField(form.max_offertes, (v) => patch({ max_offertes: v }))}</div>
        <div><Label>Max gebruikers</Label>{numField(form.max_gebruikers, (v) => patch({ max_gebruikers: v }))}</div>
        <div><Label>Max adviseurs</Label>{numField(form.max_adviseurs, (v) => patch({ max_adviseurs: v }))}</div>
        <div><Label>Max installateurs</Label>{numField(form.max_installateurs, (v) => patch({ max_installateurs: v }))}</div>
        <div>
          <Label>Volgorde</Label>
          <Input type="number" value={form.volgorde} onChange={(e) => patch({ volgorde: +e.target.value })} />
        </div>
      </div>

      <ModuleSelector selected={form.modules} onChange={(modules) => patch({ modules })} />
      <FeatureSelector selected={form.features} onChange={(features) => patch({ features })} />

      <div>
        <Label>Voorwaarden</Label>
        <Textarea rows={4} value={form.voorwaarden} onChange={(e) => patch({ voorwaarden: e.target.value })} />
      </div>

      <div className="flex items-center gap-2">
        <Switch checked={form.actief} onCheckedChange={(v) => patch({ actief: v })} />
        <Label>Actief (beschikbaar voor nieuwe abonnementen)</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>Annuleren</Button>
        <Button onClick={onSave} disabled={saving}>{saving ? "Opslaan..." : isEdit ? "Bijwerken" : "Opslaan"}</Button>
      </div>
    </div>
  );
}
