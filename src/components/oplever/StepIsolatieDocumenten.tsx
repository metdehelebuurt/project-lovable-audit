import ChecklistSection from "./ChecklistSection";
import StepDocumentatie from "./StepDocumentatie";
import { STANDAARD_ISOLATIE_DOCUMENTEN } from "./isolatieConfig";
import type { Opleverrapport } from "./types";

interface Props {
  rapportId: string;
  partnerId: string;
  draft: Partial<Opleverrapport>;
  onChange: (patch: Partial<Opleverrapport>) => void;
}

export default function StepIsolatieDocumenten({ rapportId, partnerId, draft, onChange }: Props) {
  const extra = draft.extra_velden ?? {};

  return (
    <div className="space-y-5">
      <ChecklistSection
        items={extra.isolatie_documenten}
        preset={STANDAARD_ISOLATIE_DOCUMENTEN.map((c) => ({ key: c.key, label: c.label }))}
        defaultStatus={null}
        intro="Leg vast welke stukken de klant heeft ontvangen. Dit is tevens de basis voor de ISDE-verantwoording."
        onChange={(items) => onChange({ extra_velden: { ...extra, isolatie_documenten: items } })}
      />
      <StepDocumentatie rapportId={rapportId} partnerId={partnerId} draft={draft} onChange={onChange} />
    </div>
  );
}
