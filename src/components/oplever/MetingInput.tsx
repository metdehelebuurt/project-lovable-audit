import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { GRENSWAARDEN, valideerMeting } from "./GrenswaardenLogic";
import type { Meting } from "./types";

interface Props {
  meting: Meting;
  onChange: (m: Meting) => void;
}

export default function MetingInput({ meting, onChange }: Props) {
  const grens = GRENSWAARDEN[meting.type];
  const passed = valideerMeting(meting);
  const isPassFailOnly = meting.type === "polariteit" || meting.type === "fasevolgorde";

  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{grens.label}{meting.groep ? ` — ${meting.groep}` : ""}</p>
          <p className="text-xs text-muted-foreground">{grens.helptekst}</p>
        </div>
        {passed === true && <Badge className="bg-green-500/15 text-green-700 border-green-500/40">OK</Badge>}
        {passed === false && <Badge variant="destructive">Buiten norm</Badge>}
      </div>
      {isPassFailOnly ? (
        <div className="flex gap-2">
          {(["true", "false"] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                String(meting.passed) === v
                  ? v === "true"
                    ? "bg-green-500/15 text-green-700 border-green-500/40"
                    : "bg-destructive/10 text-destructive border-destructive/40"
                  : "bg-background text-foreground border-border"
              }`}
              onClick={() => onChange({ ...meting, passed: v === "true" })}
            >
              {v === "true" ? "Pass" : "Fail"}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Waarde</Label>
            <Input
              type="number"
              inputMode="decimal"
              step="any"
              value={meting.waarde === undefined ? "" : String(meting.waarde)}
              onChange={(e) => onChange({ ...meting, waarde: e.target.value === "" ? undefined : Number(e.target.value) })}
            />
          </div>
          <span className="pb-2 text-sm text-muted-foreground">{grens.eenheid}</span>
        </div>
      )}
    </div>
  );
}