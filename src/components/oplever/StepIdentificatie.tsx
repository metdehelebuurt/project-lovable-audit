import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import KlantSelector from "./KlantSelector";
import type { Opleverrapport } from "./types";

interface Props {
  draft: Partial<Opleverrapport>;
  onChange: (patch: Partial<Opleverrapport>) => void;
  klantNaam?: string;
  klantAdres?: string;
  partnerId: string;
  klantId: string | null;
  onKlantChange: (id: string | null) => void;
}

export default function StepIdentificatie({ draft, onChange, klantNaam, klantAdres, partnerId, klantId, onKlantChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">Klant- en projectgegevens</h3>
        {klantNaam ? (
          <p className="text-sm text-muted-foreground">
            {klantNaam}{klantAdres ? ` — ${klantAdres}` : ""}
          </p>
        ) : null}
      </div>
      <KlantSelector partnerId={partnerId} klantId={klantId} onChange={onKlantChange} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="opleverdatum">Opleverdatum</Label>
          <Input
            id="opleverdatum"
            type="date"
            value={draft.opleverdatum ?? ""}
            onChange={(e) => onChange({ opleverdatum: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="rapportnummer">Rapportnummer</Label>
          <Input id="rapportnummer" value={draft.rapportnummer ?? ""} disabled />
        </div>
      </div>
      <div>
        <Label htmlFor="scope">Omvang geïnspecteerde installatie</Label>
        <Textarea
          id="scope"
          rows={3}
          placeholder="Bijv. Nieuwe batterijgroep + aanpassing meterkast"
          value={draft.scope_omschrijving ?? ""}
          onChange={(e) => onChange({ scope_omschrijving: e.target.value })}
        />
      </div>
    </div>
  );
}