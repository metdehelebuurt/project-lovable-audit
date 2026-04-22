import { useEffect, useState } from "react";
import { Plus, Trash2, Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface InstallatieProductRegel {
  product_id?: string | null;
  omschrijving: string;
  aantal: number;
}

interface ProductHit {
  id: string;
  naam: string;
  merk: string | null;
  model: string | null;
}

interface Props {
  partnerId: string;
  value: InstallatieProductRegel[];
  onChange: (regels: InstallatieProductRegel[]) => void;
}

export default function InstallatieProductenEditor({ partnerId, value, onChange }: Props) {
  const update = (i: number, patch: Partial<InstallatieProductRegel>) => {
    const next = [...value];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const addLeeg = () =>
    onChange([...value, { omschrijving: "", aantal: 1, product_id: null }]);

  return (
    <div className="space-y-3">
      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nog geen producten gekoppeld.</p>
      ) : (
        <div className="space-y-2">
          {value.map((r, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-end gap-2">
              <div className="flex-1 min-w-0">
                <Label className="text-xs">Omschrijving</Label>
                <Input
                  value={r.omschrijving}
                  onChange={(e) => update(i, { omschrijving: e.target.value })}
                  placeholder="Productnaam of werkzaamheid"
                />
              </div>
              <div className="w-full sm:w-20 min-w-[80px]">
                <Label className="text-xs">Aantal</Label>
                <Input
                  type="number"
                  min={1}
                  value={r.aantal}
                  onChange={(e) => update(i, { aantal: Number(e.target.value) || 1 })}
                />
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(i)} aria-label="Regel verwijderen" className="self-end min-h-[44px] min-w-[44px]">
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <ProductPickerButton
          partnerId={partnerId}
          onPick={(p) =>
            onChange([
              ...value,
              {
                product_id: p.id,
                omschrijving: [p.merk, p.model ?? p.naam].filter(Boolean).join(" "),
                aantal: 1,
              },
            ])
          }
        />
        <Button variant="outline" size="sm" onClick={addLeeg}>
          <Plus className="h-4 w-4 mr-1" /> Lege regel
        </Button>
      </div>
    </div>
  );
}

function ProductPickerButton({ partnerId, onPick }: { partnerId: string; onPick: (p: ProductHit) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<ProductHit[]>([]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(async () => {
      const term = q.trim();
      let query = supabase
        .from("producten")
        .select("id, naam, merk, model")
        .limit(15);
      if (term.length > 0) {
        // Combineer partner-scope + tekst-search via een enkele compound `or`
        query = query.or(
          `and(or(partner_id.eq.${partnerId},partner_id.is.null),or(naam.ilike.%${term}%,merk.ilike.%${term}%,model.ilike.%${term}%))`,
        );
      } else {
        query = query.or(`partner_id.eq.${partnerId},partner_id.is.null`);
      }
      const { data } = await query;
      setHits((data ?? []) as ProductHit[]);
    }, 200);
    return () => clearTimeout(timer);
  }, [q, open, partnerId]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Package className="h-4 w-4 mr-1" /> Product zoeken
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek op naam, merk of model"
              className="pl-8 h-9"
            />
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto">
          {hits.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">Geen producten gevonden.</p>
          ) : (
            hits.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onPick(p);
                  setOpen(false);
                  setQ("");
                }}
                className="block w-full text-left px-3 py-2 hover:bg-muted text-sm"
              >
                <div className="font-medium">{p.naam}</div>
                <div className="text-xs text-muted-foreground">
                  {[p.merk, p.model].filter(Boolean).join(" • ") || "—"}
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}