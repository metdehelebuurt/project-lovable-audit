import OpleverChecklistItem from "./OpleverChecklistItem";
import { STANDAARD_CHECKLIST } from "./GrenswaardenLogic";
import type { ChecklistItem, Opleverrapport } from "./types";

interface Props {
  draft: Partial<Opleverrapport>;
  onChange: (patch: Partial<Opleverrapport>) => void;
}

export default function StepVisueleInspectie({ draft, onChange }: Props) {
  const items: ChecklistItem[] = draft.visuele_inspectie?.length
    ? draft.visuele_inspectie
    : STANDAARD_CHECKLIST.map((c) => ({ key: c.key, label: c.label, status: null }));

  const updateItem = (idx: number, item: ChecklistItem) => {
    const next = [...items];
    next[idx] = item;
    onChange({ visuele_inspectie: next });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Loop alle punten af. Bij &quot;Niet OK&quot; is een toelichting verplicht.</p>
      {items.map((item, idx) => (
        <OpleverChecklistItem key={item.key} item={item} onChange={(i) => updateItem(idx, i)} />
      ))}
    </div>
  );
}