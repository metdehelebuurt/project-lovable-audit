import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Hash, Save } from "lucide-react";
import { toast } from "sonner";

interface Reeks {
  type: string;
  subtype: string;
  prefix: string;
  padding: number;
  jaarformaat: string;
  reset_per_jaar: boolean;
  volgende_nummer: number;
}

const REEKSEN: Array<{ type: string; subtype: string; label: string; defaultPrefix: string }> = [
  { type: "verkoopfactuur", subtype: "regulier", label: "Verkoopfactuur", defaultPrefix: "VF" },
  { type: "verkoopfactuur", subtype: "voorschot", label: "Voorschotfactuur", defaultPrefix: "VS" },
  { type: "creditnota", subtype: "regulier", label: "Creditnota", defaultPrefix: "CN" },
  { type: "inkoopfactuur", subtype: "regulier", label: "Inkoopfactuur", defaultPrefix: "IF" },
  { type: "inkooporder", subtype: "regulier", label: "Inkooporder", defaultPrefix: "IO" },
  { type: "pakbon", subtype: "regulier", label: "Pakbon", defaultPrefix: "PB" },
  { type: "installatie", subtype: "regulier", label: "Installatie", defaultPrefix: "INST" },
  { type: "oplevering", subtype: "regulier", label: "Opleverrapport", defaultPrefix: "OP" },
];

function key(type: string, subtype: string) {
  return `${type}::${subtype}`;
}

export default function NummerreeksConfig({ partnerId }: { partnerId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [reeksen, setReeksen] = useState<Record<string, Reeks>>({});

  useEffect(() => {
    void supabase
      .from("nummerreeks_config")
      .select("type, subtype, prefix, padding, jaarformaat, reset_per_jaar, volgende_nummer")
      .eq("partner_id", partnerId)
      .then(({ data }) => {
        const map: Record<string, Reeks> = {};
        const huidigJaar = new Date().getFullYear();
        for (const r of REEKSEN) {
          const bestaand = data?.find((d) => d.type === r.type && d.subtype === r.subtype);
          map[key(r.type, r.subtype)] = bestaand
            ? (bestaand as Reeks)
            : {
                type: r.type,
                subtype: r.subtype,
                prefix: r.defaultPrefix,
                padding: 4,
                jaarformaat: "YYYY",
                reset_per_jaar: true,
                volgende_nummer: 1,
              };
          // Negeer huidigJaar in state — server beheert dat
          void huidigJaar;
        }
        setReeksen(map);
        setLoading(false);
      });
  }, [partnerId]);

  const update = (type: string, subtype: string, patch: Partial<Reeks>) => {
    setReeksen((prev) => ({
      ...prev,
      [key(type, subtype)]: { ...prev[key(type, subtype)], ...patch },
    }));
  };

  const opslaan = async (type: string, subtype: string) => {
    const r = reeksen[key(type, subtype)];
    if (!r.prefix.trim()) {
      toast.error("Prefix is verplicht");
      return;
    }
    setSaving(key(type, subtype));
    const { error } = await supabase
      .from("nummerreeks_config")
      .upsert(
        {
          partner_id: partnerId,
          type: r.type,
          subtype: r.subtype,
          prefix: r.prefix.trim().toUpperCase(),
          padding: Math.max(1, Math.min(8, r.padding)),
          jaarformaat: r.jaarformaat,
          reset_per_jaar: r.reset_per_jaar,
          volgende_nummer: Math.max(1, r.volgende_nummer),
          huidig_jaar: new Date().getFullYear(),
        },
        { onConflict: "partner_id,type,subtype" },
      );
    setSaving(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Nummerreeks ${type === "verkoopfactuur" && subtype === "voorschot" ? "voorschot" : type} opgeslagen`);
  };

  if (loading) return <p className="text-sm text-muted-foreground">Laden…</p>;

  const voorbeeld = (r: Reeks) => {
    const jaar =
      r.jaarformaat === "YYYY"
        ? String(new Date().getFullYear())
        : r.jaarformaat === "YY"
          ? String(new Date().getFullYear()).slice(-2)
          : "";
    const num = String(r.volgende_nummer).padStart(r.padding, "0");
    return jaar ? `${r.prefix}-${jaar}-${num}` : `${r.prefix}-${num}`;
  };

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Hash className="h-5 w-5 text-primary" /> Nummerreeksen
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Pas prefix, padding en jaarformaat aan voor elk documenttype. Het volgnummer wordt automatisch verhoogd bij elk nieuw document.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {REEKSEN.map((meta) => {
          const r = reeksen[key(meta.type, meta.subtype)];
          if (!r) return null;
          return (
            <div key={key(meta.type, meta.subtype)} className="rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h4 className="font-medium">{meta.label}</h4>
                  <p className="text-xs text-muted-foreground">Voorbeeld: <span className="font-mono text-foreground">{voorbeeld(r)}</span></p>
                </div>
                <Button size="sm" onClick={() => opslaan(meta.type, meta.subtype)} disabled={saving === key(meta.type, meta.subtype)}>
                  <Save className="h-4 w-4 mr-1" /> {saving === key(meta.type, meta.subtype) ? "…" : "Opslaan"}
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">Prefix</Label>
                  <Input
                    value={r.prefix}
                    onChange={(e) => update(meta.type, meta.subtype, { prefix: e.target.value })}
                    maxLength={6}
                  />
                </div>
                <div>
                  <Label className="text-xs">Volgend nr.</Label>
                  <Input
                    type="number"
                    min={1}
                    value={r.volgende_nummer}
                    onChange={(e) =>
                      update(meta.type, meta.subtype, { volgende_nummer: Number(e.target.value) || 1 })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Padding</Label>
                  <Input
                    type="number"
                    min={1}
                    max={8}
                    value={r.padding}
                    onChange={(e) => update(meta.type, meta.subtype, { padding: Number(e.target.value) || 4 })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Jaarformaat</Label>
                  <Select
                    value={r.jaarformaat}
                    onValueChange={(v) => update(meta.type, meta.subtype, { jaarformaat: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YYYY">YYYY (2025)</SelectItem>
                      <SelectItem value="YY">YY (25)</SelectItem>
                      <SelectItem value="geen">Geen jaar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <label className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                <span className="text-sm">Reset volgnummer per jaar</span>
                <Switch
                  checked={r.reset_per_jaar}
                  onCheckedChange={(v) => update(meta.type, meta.subtype, { reset_per_jaar: v })}
                />
              </label>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}