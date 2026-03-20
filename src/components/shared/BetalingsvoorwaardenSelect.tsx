import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface Voorwaarde {
  label: string;
  standaard: boolean;
}

interface BetalingsvoorwaardenSelectProps {
  partnerId: string | null | undefined;
  value: string;
  onChange: (value: string) => void;
  customValue?: string;
  onCustomChange?: (value: string) => void;
}

const BetalingsvoorwaardenSelect = ({
  partnerId,
  value,
  onChange,
  customValue = "",
  onCustomChange,
}: BetalingsvoorwaardenSelectProps) => {
  const [voorwaarden, setVoorwaarden] = useState<Voorwaarde[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!partnerId) { setLoaded(true); return; }
    supabase
      .from("partners")
      .select("betalingsvoorwaarden_config")
      .eq("id", partnerId)
      .single()
      .then(({ data }) => {
        if (data && Array.isArray((data as any).betalingsvoorwaarden_config)) {
          const items = (data as any).betalingsvoorwaarden_config as Voorwaarde[];
          setVoorwaarden(items);
          // Set default if no value chosen yet
          if (!value) {
            const standaard = items.find(v => v.standaard);
            if (standaard) onChange(standaard.label);
          }
        }
        setLoaded(true);
      });
  }, [partnerId]);

  if (!loaded) return <Input value={value} onChange={e => onChange(e.target.value)} className="rounded-xl" />;

  if (voorwaarden.length === 0) {
    return <Input value={value} onChange={e => onChange(e.target.value)} className="rounded-xl" placeholder="bijv. 30 dagen netto" />;
  }

  const isCustom = value === "__custom__";

  return (
    <div className="space-y-2">
      <Select
        value={voorwaarden.some(v => v.label === value) ? value : isCustom ? "__custom__" : "__custom__"}
        onValueChange={v => {
          onChange(v);
          if (v !== "__custom__" && onCustomChange) onCustomChange("");
        }}
      >
        <SelectTrigger className="rounded-xl">
          <SelectValue placeholder="Selecteer betaalvoorwaarde" />
        </SelectTrigger>
        <SelectContent>
          {voorwaarden.map((vw, idx) => (
            <SelectItem key={idx} value={vw.label}>
              {vw.label}{vw.standaard ? " (standaard)" : ""}
            </SelectItem>
          ))}
          <SelectItem value="__custom__">Anders...</SelectItem>
        </SelectContent>
      </Select>
      {isCustom && (
        <Input
          value={customValue}
          onChange={e => onCustomChange?.(e.target.value)}
          placeholder="Voer betaalvoorwaarde in..."
          className="rounded-xl"
        />
      )}
    </div>
  );
};

export default BetalingsvoorwaardenSelect;
