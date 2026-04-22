import ChecklistSection from "./ChecklistSection";
import { BEKABELING_CHECKLIST } from "./GrenswaardenLogic";
import type { Opleverrapport } from "./types";

interface Props {
  draft: Partial<Opleverrapport>;
  onChange: (patch: Partial<Opleverrapport>) => void;
}

export default function StepBekabelingMeterkast({ draft, onChange }: Props) {
  const extra = draft.extra_velden ?? {};
  return (
    <ChecklistSection
      items={extra.bekabeling_meterkast}
      preset={BEKABELING_CHECKLIST}
      intro="Controle van bekabeling, meterkast en groepenverdeling. Standaard staat alles op n.v.t. — markeer alleen relevante punten."
      onChange={(items) => onChange({ extra_velden: { ...extra, bekabeling_meterkast: items } })}
    />
  );
}