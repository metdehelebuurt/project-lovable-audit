import OpleverChecklistItem from "./OpleverChecklistItem";
import type { ChecklistItem } from "./types";

interface Preset {
  key: string;
  label: string;
}

interface Props {
  items: ChecklistItem[] | undefined;
  preset: readonly Preset[];
  onChange: (items: ChecklistItem[]) => void;
  defaultStatus?: ChecklistItem["status"];
  intro?: string;
}

export default function ChecklistSection({ items, preset, onChange, defaultStatus = "nvt", intro }: Props) {
  const list: ChecklistItem[] = items?.length
    ? items
    : preset.map((p) => ({ key: p.key, label: p.label, status: defaultStatus }));

  const update = (idx: number, item: ChecklistItem) => {
    const next = [...list];
    next[idx] = item;
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {intro ? <p className="text-sm text-muted-foreground">{intro}</p> : null}
      {list.map((item, idx) => (
        <OpleverChecklistItem key={item.key} item={item} onChange={(i) => update(idx, i)} />
      ))}
    </div>
  );
}