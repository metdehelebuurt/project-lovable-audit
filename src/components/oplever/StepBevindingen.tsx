import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import type { Bevindingen, Opleverrapport, Verdict } from "./types";

interface Props {
  draft: Partial<Opleverrapport>;
  onChange: (patch: Partial<Opleverrapport>) => void;
}

const VERDICTS: { value: Verdict; label: string; tone: string }[] = [
  { value: "goedgekeurd", label: "Goedgekeurd", tone: "bg-green-500/15 text-green-700 border-green-500/40" },
  { value: "goedgekeurd_met_opmerkingen", label: "Goedgekeurd met opmerkingen", tone: "bg-amber-500/15 text-amber-700 border-amber-500/40" },
  { value: "afgekeurd", label: "Afgekeurd", tone: "bg-destructive/10 text-destructive border-destructive/40" },
];

export default function StepBevindingen({ draft, onChange }: Props) {
  const bev: Bevindingen = draft.bevindingen ?? { verdict: null, deficiencies: [], recommendations: [] };

  const setVerdict = (v: Verdict) => onChange({ bevindingen: { ...bev, verdict: v } });
  const updateList = (key: "deficiencies" | "recommendations", idx: number, value: string) => {
    const next = [...bev[key]]; next[idx] = value;
    onChange({ bevindingen: { ...bev, [key]: next } });
  };
  const addItem = (key: "deficiencies" | "recommendations") => onChange({ bevindingen: { ...bev, [key]: [...bev[key], ""] } });
  const removeItem = (key: "deficiencies" | "recommendations", idx: number) =>
    onChange({ bevindingen: { ...bev, [key]: bev[key].filter((_, i) => i !== idx) } });

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <Label>Eindoordeel</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {VERDICTS.map((v) => (
            <button key={v.value} type="button" onClick={() => setVerdict(v.value)}
              className={`rounded-lg border px-3 py-3 text-sm font-medium ${bev.verdict === v.value ? v.tone : "bg-background border-border"}`}>
              {v.label}
            </button>
          ))}
        </div>
      </section>

      {(["deficiencies", "recommendations"] as const).map((key) => (
        <section key={key} className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{key === "deficiencies" ? "Tekortkomingen" : "Hersteladviezen"}</Label>
            <Button type="button" variant="outline" size="sm" onClick={() => addItem(key)}><Plus className="h-4 w-4" /> Toevoegen</Button>
          </div>
          {bev[key].map((v, idx) => (
            <div key={idx} className="flex gap-2">
              <Textarea rows={2} value={v} onChange={(e) => updateList(key, idx, e.target.value)} />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(key, idx)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </section>
      ))}

      <section className="space-y-2">
        <Label>Conformiteitsverklaring</Label>
        <Textarea rows={4} value={draft.conformiteitstekst ?? ""} onChange={(e) => onChange({ conformiteitstekst: e.target.value })} />
      </section>
    </div>
  );
}