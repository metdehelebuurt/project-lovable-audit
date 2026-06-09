import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import InfoCallout from "./InfoCallout";

interface Row { id?: string; type: string; label: string; prefix: string; volgende_nummer: number; padding: number; }

const DEFAULTS: Row[] = [
  { type: "offerte", label: "Offertes", prefix: "OF", volgende_nummer: 1, padding: 4 },
  { type: "factuur", label: "Facturen", prefix: "FA", volgende_nummer: 1, padding: 4 },
  { type: "schouw", label: "Schouwen", prefix: "SCH", volgende_nummer: 1, padding: 4 },
  { type: "installatie", label: "Installaties", prefix: "INST", volgende_nummer: 1, padding: 4 },
];

interface Props {
  partnerId: string;
  onNext: () => void;
  onPrev: () => void;
}

export const StepNummerreeksen = ({ partnerId, onNext, onPrev }: Props) => {
  const [rows, setRows] = useState<Row[]>(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("nummerreeks_config")
        .select("id, type, prefix, volgende_nummer, padding")
        .eq("partner_id", partnerId);
      if (data && data.length) {
        setRows(prev => prev.map(p => {
          const found = data.find((d: any) => d.type === p.type);
          return found ? { ...p, id: found.id, prefix: found.prefix, volgende_nummer: found.volgende_nummer, padding: found.padding } : p;
        }));
      }
    })();
  }, [partnerId]);

  const update = (i: number, patch: Partial<Row>) => setRows(r => r.map((x, idx) => idx === i ? { ...x, ...patch } : x));

  const preview = (r: Row) => `${r.prefix}-${new Date().getFullYear()}-${String(r.volgende_nummer).padStart(r.padding, "0")}`;

  const next = async () => {
    setSaving(true);
    for (const r of rows) {
      await supabase.from("nummerreeks_config").upsert({
        partner_id: partnerId,
        type: r.type,
        subtype: "regulier",
        prefix: r.prefix,
        volgende_nummer: r.volgende_nummer,
        padding: r.padding,
      } as any, { onConflict: "partner_id,type,subtype" });
    }
    setSaving(false);
    toast.success("Nummerreeksen opgeslagen");
    onNext();
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2"><Hash className="h-5 w-5 text-primary" /> Nummerreeksen</h2>
        <p className="text-sm text-muted-foreground mt-1">Bepaal hoe je documenten genummerd worden. De jaartal wordt automatisch ververst.</p>
      </div>

      <InfoCallout title="Tip">
        Houd het kort en herkenbaar. Bijvoorbeeld OF voor offerte en FA voor factuur — zo zijn documenten makkelijk te scannen in je administratie.
      </InfoCallout>

      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={r.type} className="rounded-xl border p-3 grid grid-cols-12 gap-3 items-end">
            <div className="col-span-3"><p className="text-sm font-medium">{r.label}</p></div>
            <div className="col-span-3">
              <Label className="text-xs">Prefix</Label>
              <Input value={r.prefix} onChange={e => update(i, { prefix: e.target.value.toUpperCase().slice(0, 6) })} className="rounded-xl mt-1 font-mono uppercase" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Start#</Label>
              <Input type="number" min={1} value={r.volgende_nummer} onChange={e => update(i, { volgende_nummer: Math.max(1, parseInt(e.target.value) || 1) })} className="rounded-xl mt-1" />
            </div>
            <div className="col-span-4">
              <Label className="text-xs">Voorbeeld</Label>
              <p className="text-sm font-mono mt-2 px-3 py-1.5 rounded-pill bg-muted/50 inline-block">{preview(r)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onPrev} className="rounded-pill gap-2"><ArrowLeft className="h-4 w-4" /> Terug</Button>
        <Button onClick={next} disabled={saving} className="rounded-pill gap-2">Volgende <ArrowRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
};

export default StepNummerreeksen;