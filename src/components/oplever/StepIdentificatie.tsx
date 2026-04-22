import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import KlantSelector from "./KlantSelector";
import OpdrachtSelector from "./OpdrachtSelector";
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
  const extra = draft.extra_velden ?? {};
  const opdrachtId = draft.opdracht_id ?? null;
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
      <div>
        <Label className="mb-1 block">Verkooporder (optioneel)</Label>
        <OpdrachtSelector
          partnerId={partnerId}
          opdrachtId={opdrachtId}
          onChange={(id, opdracht) => {
            const patch: Partial<Opleverrapport> = { opdracht_id: id };
            // Auto-koppel klant als die nog niet gezet is
            if (id && opdracht?.klant_id && !klantId) {
              patch.klant_id = opdracht.klant_id;
              onKlantChange(opdracht.klant_id);
            }
            onChange(patch);
          }}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="projectnummer">Projectnummer</Label>
          <Input
            id="projectnummer"
            placeholder="Bijv. PRJ-2025-0123"
            value={extra.projectnummer ?? ""}
            onChange={(e) => onChange({ extra_velden: { ...extra, projectnummer: e.target.value } })}
          />
        </div>
        <div>
          <Label htmlFor="installatiedatum">Datum installatie</Label>
          <Input
            id="installatiedatum"
            type="date"
            value={extra.installatiedatum ?? ""}
            onChange={(e) => onChange({ extra_velden: { ...extra, installatiedatum: e.target.value } })}
          />
        </div>
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