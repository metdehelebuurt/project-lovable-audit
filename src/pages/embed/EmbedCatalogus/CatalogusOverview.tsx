import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "./ProductCard";
import type { EmbedProduct } from "./types";

interface Props {
  producten: EmbedProduct[];
  merken: string[];
  categorieen: string[];
  primaryColor: string;
  onSelect: (p: EmbedProduct) => void;
}

export const CatalogusOverview = ({
  producten,
  merken,
  categorieen,
  primaryColor,
  onSelect,
}: Props) => {
  const [zoek, setZoek] = useState("");
  const [merkFilter, setMerkFilter] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState<string | null>(null);

  const gefilterd = producten.filter((p) => {
    if (merkFilter && p.merk !== merkFilter) return false;
    if (catFilter && p.categorie !== catFilter) return false;
    if (zoek && !`${p.naam} ${p.merk}`.toLowerCase().includes(zoek.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Zoek op product of merk..."
        value={zoek}
        onChange={(e) => setZoek(e.target.value)}
      />

      {(merken.length > 0 || categorieen.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {merken.map((m) => (
            <Badge
              key={m}
              variant={merkFilter === m ? "default" : "outline"}
              className="cursor-pointer"
              style={merkFilter === m ? { backgroundColor: primaryColor } : undefined}
              onClick={() => setMerkFilter(merkFilter === m ? null : m)}
            >
              {m}
            </Badge>
          ))}
          {categorieen.map((c) => (
            <Badge
              key={c}
              variant={catFilter === c ? "default" : "outline"}
              className="cursor-pointer"
              style={catFilter === c ? { backgroundColor: primaryColor } : undefined}
              onClick={() => setCatFilter(catFilter === c ? null : c)}
            >
              {c}
            </Badge>
          ))}
        </div>
      )}

      {gefilterd.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Geen producten gevonden.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {gefilterd.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              primaryColor={primaryColor}
              onClick={() => onSelect(p)}
            />
          ))}
        </div>
      )}
    </div>
  );
};