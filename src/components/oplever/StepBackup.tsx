import ChecklistSection from "./ChecklistSection";
import { BACKUP_CHECKLIST } from "./GrenswaardenLogic";
import type { Opleverrapport } from "./types";

interface Props {
  draft: Partial<Opleverrapport>;
  onChange: (patch: Partial<Opleverrapport>) => void;
}

export default function StepBackup({ draft, onChange }: Props) {
  const extra = draft.extra_velden ?? {};
  return (
    <ChecklistSection
      items={extra.backup_check}
      preset={BACKUP_CHECKLIST}
      intro="Controle van backup-/noodstroomvoorziening en automatische omschakeling."
      onChange={(items) => onChange({ extra_velden: { ...extra, backup_check: items } })}
    />
  );
}