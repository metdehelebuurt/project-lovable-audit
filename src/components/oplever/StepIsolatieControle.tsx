import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import ChecklistSection from "./ChecklistSection";
import { STANDAARD_ISOLATIE_CHECKLIST } from "./isolatieConfig";
import type { Opleverrapport } from "./types";

interface Props {
  draft: Partial<Opleverrapport>;
  onChange: (patch: Partial<Opleverrapport>) => void;
}

export default function StepIsolatieControle({ draft, onChange }: Props) {
  const extra = draft.extra_velden ?? {};
  const patchExtra = (patch: Partial<typeof extra>) => onChange({ extra_velden: { ...extra, ...patch } });

  return (
    <div className="space-y-5">
      <ChecklistSection
        items={extra.isolatie_controle}
        preset={STANDAARD_ISOLATIE_CHECKLIST.map((c) => ({ key: c.key, label: c.label }))}
        defaultStatus={null}
        intro="Controleer de uitvoering punt voor punt. Bij 'Niet OK' is een toelichting verplicht."
        onChange={(items) => patchExtra({ isolatie_controle: items })}
      />

      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <h3 className="font-semibold">Controlemetingen</h3>

        <div className="flex items-center justify-between rounded-lg border px-3 py-2">
          <Label htmlFor="thermografie" className="cursor-pointer">Thermografische controle uitgevoerd</Label>
          <Switch
            id="thermografie"
            checked={!!extra.isolatie_thermografie_uitgevoerd}
            onCheckedChange={(c) => patchExtra({ isolatie_thermografie_uitgevoerd: c })}
          />
        </div>

        {extra.isolatie_thermografie_uitgevoerd ? (
          <div className="space-y-1.5">
            <Label htmlFor="thermo-notitie">Bevindingen thermografie</Label>
            <Textarea
              id="thermo-notitie"
              rows={3}
              value={extra.isolatie_thermografie_notitie ?? ""}
              onChange={(e) => patchExtra({ isolatie_thermografie_notitie: e.target.value })}
              placeholder="Bijv. geen koudebruggen zichtbaar bij dakrand en aansluiting gevel."
            />
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="qv10">Luchtdichtheid qv10 (dm³/s per m²)</Label>
            <Input
              id="qv10"
              type="number"
              step="0.01"
              inputMode="decimal"
              value={extra.isolatie_luchtdichtheid_qv10 ?? ""}
              onChange={(e) =>
                patchExtra({ isolatie_luchtdichtheid_qv10: e.target.value === "" ? null : Number(e.target.value) })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gasbesparing">Verwachte gasbesparing (m³/jaar)</Label>
            <Input
              id="gasbesparing"
              type="number"
              inputMode="numeric"
              value={extra.isolatie_besparing_m3_gas ?? ""}
              onChange={(e) => {
                const m3 = e.target.value === "" ? null : Number(e.target.value);
                patchExtra({
                  isolatie_besparing_m3_gas: m3,
                  isolatie_co2_besparing_kg: m3 == null ? null : Math.round(m3 * 1.887),
                });
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="co2">Verwachte CO₂-besparing (kg/jaar)</Label>
            <Input
              id="co2"
              type="number"
              inputMode="numeric"
              value={extra.isolatie_co2_besparing_kg ?? ""}
              onChange={(e) =>
                patchExtra({ isolatie_co2_besparing_kg: e.target.value === "" ? null : Number(e.target.value) })
              }
            />
            <p className="text-xs text-muted-foreground">Automatisch berekend uit gasbesparing (1,887 kg CO₂ per m³).</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <h3 className="font-semibold">ISDE-subsidie</h3>
        <div className="flex items-center justify-between rounded-lg border px-3 py-2">
          <Label htmlFor="isde-ingediend" className="cursor-pointer">Aanvraag ingediend</Label>
          <Switch
            id="isde-ingediend"
            checked={!!extra.isde_aanvraag_ingediend}
            onCheckedChange={(c) => patchExtra({ isde_aanvraag_ingediend: c })}
          />
        </div>
        {extra.isde_aanvraag_ingediend ? (
          <div className="space-y-1.5">
            <Label htmlFor="isde-nummer">Aanvraagnummer</Label>
            <Input
              id="isde-nummer"
              value={extra.isde_aanvraagnummer ?? ""}
              onChange={(e) => patchExtra({ isde_aanvraagnummer: e.target.value })}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
