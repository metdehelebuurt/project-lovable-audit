import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { PaneelProduct } from "../types";

interface Props {
  producten: PaneelProduct[];
  loading: boolean;
  geselecteerd: PaneelProduct | null;
  onChange: (p: PaneelProduct | null) => void;
}

const PaneelProductPicker = ({ producten, loading, geselecteerd, onChange }: Props) => {
  return (
    <div className="space-y-1.5">
      <Label>Zonnepaneel product</Label>
      <Select
        value={geselecteerd?.id ?? ""}
        onValueChange={(id) => onChange(producten.find((p) => p.id === id) ?? null)}
        disabled={loading}
      >
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Producten laden..." : "Kies een paneel uit catalogus"} />
        </SelectTrigger>
        <SelectContent>
          {producten.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.naam} {p.wp ? `· ${p.wp} Wp` : ""} ({p.breedteMm}×{p.lengteMm} mm)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {geselecteerd && !geselecteerd.wp && (
        <p className="text-xs text-amber-600">
          Dit product heeft geen Wp-waarde in de catalogus — vermogen wordt op 0 berekend.
        </p>
      )}
    </div>
  );
};

export default PaneelProductPicker;