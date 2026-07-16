import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Wand2 } from "lucide-react";
import {
  CONFIGURATOR_TEMPLATES,
  type ConfigureerbaarType,
  type TemplateAttribuut,
} from "@/lib/assemblage/typeTemplates";
import {
  useAssemblageSlots,
  useUpsertSlot,
  useRemoveSlot,
  useApplyTemplateSlots,
  type AssemblageSlot,
} from "@/hooks/producten/useAssemblageSlots";
import SlotRow from "./SlotRow";

interface Props {
  assemblageId: string | null;
  partnerId: string | null | undefined;
  configureerbaarType: ConfigureerbaarType;
  templateAttributen: Record<string, unknown>;
  onTypeChange: (t: ConfigureerbaarType) => void;
  onAttributenChange: (attrs: Record<string, unknown>) => void;
}

function AttribuutVeld({
  attribuut,
  value,
  onChange,
}: {
  attribuut: TemplateAttribuut;
  value: unknown;
  onChange: (v: string | boolean) => void;
}) {
  if (attribuut.type === "boolean") {
    return (
      <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
        <div>
          <Label>{attribuut.label}</Label>
          {attribuut.helptekst && (
            <p className="text-xs text-muted-foreground">{attribuut.helptekst}</p>
          )}
        </div>
        <Switch checked={Boolean(value)} onCheckedChange={onChange} />
      </div>
    );
  }
  return (
    <div>
      <Label>{attribuut.label}</Label>
      <Select value={String(value ?? attribuut.default)} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {attribuut.opties?.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {attribuut.helptekst && <p className="text-xs text-muted-foreground mt-1">{attribuut.helptekst}</p>}
    </div>
  );
}

export default function AssemblageConfigurator({
  assemblageId,
  partnerId,
  configureerbaarType,
  templateAttributen,
  onTypeChange,
  onAttributenChange,
}: Props) {
  const template = CONFIGURATOR_TEMPLATES[configureerbaarType];
  const { data: slots = [] } = useAssemblageSlots(assemblageId);
  const upsert = useUpsertSlot();
  const remove = useRemoveSlot();
  const apply = useApplyTemplateSlots();

  const canApplyTemplate = useMemo(
    () => assemblageId && partnerId && slots.length === 0 && template.slots.length > 0,
    [assemblageId, partnerId, slots.length, template.slots.length],
  );

  const handleApplyTemplate = () => {
    if (!assemblageId || !partnerId) return;
    apply.mutate({
      assemblage_id: assemblageId,
      partner_id: partnerId,
      slots: template.slots.map((s) => ({
        sleutel: s.sleutel,
        label: s.label,
        slot_type: s.slot_type,
        product_rol_filter: s.product_rol_filter ?? null,
        categorie_filter: s.categorie_filter ?? null,
        spec_filter: s.spec_filter ?? null,
        min_aantal: s.min_aantal,
        max_aantal: s.max_aantal,
        default_aantal: s.default_aantal,
        verplicht: s.verplicht,
        helptekst: s.helptekst ?? null,
      })),
    });
  };

  const handleAddSlot = () => {
    if (!assemblageId || !partnerId) return;
    const nextVolgorde = (slots[slots.length - 1]?.volgorde ?? 0) + 10;
    upsert.mutate({
      partner_id: partnerId,
      assemblage_id: assemblageId,
      sleutel: `slot_${slots.length + 1}`,
      label: "Nieuw slot",
      slot_type: "single_select",
      product_rol_filter: null,
      categorie_filter: null,
      spec_filter: null,
      min_aantal: 1,
      max_aantal: 1,
      default_aantal: 1,
      verplicht: true,
      volgorde: nextVolgorde,
      helptekst: null,
    });
  };

  const handleSlotChange = (slot: AssemblageSlot, patch: Partial<AssemblageSlot>) => {
    upsert.mutate({ ...slot, ...patch, id: slot.id });
  };

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-primary" /> Configurator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Type samengesteld product</Label>
            <Select
              value={configureerbaarType}
              onValueChange={(v) => onTypeChange(v as ConfigureerbaarType)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(CONFIGURATOR_TEMPLATES) as ConfigureerbaarType[]).map((k) => (
                  <SelectItem key={k} value={k}>{CONFIGURATOR_TEMPLATES[k].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">{template.omschrijving}</p>
          </div>
        </div>

        {template.attributen.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Template-attributen
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              Deze waarden komen als variabelen beschikbaar in spec-filters van de slots (via
              <code className="ml-1 px-1 rounded bg-muted">{"{{template.<sleutel>}}"}</code>).
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {template.attributen.map((attr) => (
                <AttribuutVeld
                  key={attr.sleutel}
                  attribuut={attr}
                  value={templateAttributen[attr.sleutel] ?? attr.default}
                  onChange={(v) => onAttributenChange({ ...templateAttributen, [attr.sleutel]: v })}
                />
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Keuzegroepen (slots) — {slots.length}
            </h4>
            <div className="flex gap-2">
              {canApplyTemplate && (
                <Button variant="outline" size="sm" onClick={handleApplyTemplate}
                  disabled={apply.isPending}>
                  <Wand2 className="h-3 w-3 mr-1" /> Standaard slots invullen
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleAddSlot}
                disabled={!assemblageId}>
                <Plus className="h-3 w-3 mr-1" /> Slot toevoegen
              </Button>
            </div>
          </div>

          {!assemblageId && (
            <p className="text-sm text-muted-foreground">
              Sla de assemblage eerst op om slots toe te voegen.
            </p>
          )}

          {assemblageId && slots.length === 0 && (
            <p className="text-sm text-muted-foreground rounded-xl border border-dashed p-6 text-center">
              Nog geen slots. Kies "Standaard slots invullen" om de configurator meteen werkbaar te maken,
              of voeg handmatig een slot toe.
            </p>
          )}

          <div className="space-y-3">
            {slots.map((slot) => (
              <SlotRow
                key={slot.id}
                slot={slot}
                onChange={(patch) => handleSlotChange(slot, patch)}
                onDelete={() => remove.mutate({ id: slot.id, assemblage_id: slot.assemblage_id })}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}