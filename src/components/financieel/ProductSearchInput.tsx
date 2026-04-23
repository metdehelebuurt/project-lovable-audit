import { useEffect, useRef, useState } from "react";
import { Search, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/types/offerte";

export interface ProductHit {
  id: string;
  naam: string;
  merk: string | null;
  model: string | null;
  prijs_excl_btw: number | null;
  btw_percentage: number | null;
  offerte_tekst: string | null;
}

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onPickProduct: (p: ProductHit) => void;
  placeholder?: string;
}

export function ProductSearchInput({ value, onChangeText, onPickProduct, placeholder }: Props) {
  const { profile } = useAuth();
  const partnerId = profile?.partner_id;
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<ProductHit[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const term = value.trim();
    setLoading(true);
    const timer = setTimeout(async () => {
      let query = supabase
        .from("producten")
        .select("id, naam, merk, model, prijs_excl_btw, btw_percentage, offerte_tekst")
        .limit(15);
      if (partnerId) {
        if (term.length > 0) {
          query = query.or(
            `and(or(partner_id.eq.${partnerId},partner_id.is.null),or(naam.ilike.%${term}%,merk.ilike.%${term}%,model.ilike.%${term}%,artikelnummer.ilike.%${term}%))`,
          );
        } else {
          query = query.or(`partner_id.eq.${partnerId},partner_id.is.null`);
        }
      } else if (term.length > 0) {
        query = query.or(`naam.ilike.%${term}%,merk.ilike.%${term}%,model.ilike.%${term}%`);
      }
      const { data } = await query;
      setHits((data ?? []) as ProductHit[]);
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [value, open, partnerId]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => {
              onChangeText(e.target.value);
              if (!open) setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder ?? "Zoek product of typ vrij..."}
            className="pl-8"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[360px] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="max-h-72 overflow-y-auto">
          {loading && hits.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">Zoeken...</p>
          ) : hits.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground space-y-1">
              <p>Geen producten gevonden.</p>
              <p className="text-xs">Je kunt de tekst hierboven gebruiken als handmatige regel.</p>
            </div>
          ) : (
            hits.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onPickProduct(p);
                  setOpen(false);
                }}
                className="block w-full text-left px-3 py-2 hover:bg-muted text-sm border-b last:border-b-0"
              >
                <div className="flex items-start gap-2">
                  <Package className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{p.naam}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {[p.merk, p.model].filter(Boolean).join(" • ") || "—"}
                    </div>
                  </div>
                  {p.prijs_excl_btw != null && (
                    <div className="text-xs font-medium shrink-0">
                      {formatCurrency(Number(p.prijs_excl_btw))}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}