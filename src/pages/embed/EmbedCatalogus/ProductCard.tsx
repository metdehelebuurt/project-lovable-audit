import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, GitCompare } from "lucide-react";
import type { EmbedProduct } from "./types";

interface Props {
  product: EmbedProduct;
  primaryColor: string;
  onClick: () => void;
  onToggleCompare: () => void;
  isComparing: boolean;
  compareDisabled: boolean;
}

export const ProductCard = ({
  product,
  primaryColor,
  onClick,
  onToggleCompare,
  isComparing,
  compareDisabled,
}: Props) => {
  const prijs = Number(product.prijs_excl_btw ?? 0);
  return (
    <Card
      className="p-4 hover:shadow-md transition-shadow flex flex-col gap-3"
    >
      <div
        onClick={onClick}
        className="aspect-square w-full bg-muted rounded-md overflow-hidden flex items-center justify-center cursor-pointer"
      >
        {product.afbeelding_url ? (
          <img
            src={product.afbeelding_url}
            alt={product.naam ?? ""}
            className="object-contain w-full h-full"
            loading="lazy"
          />
        ) : (
          <span className="text-xs text-muted-foreground">Geen afbeelding</span>
        )}
      </div>
      <div className="space-y-1 cursor-pointer" onClick={onClick}>
        {product.merk && (
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{product.merk}</p>
        )}
        <h3 className="font-semibold text-sm leading-tight line-clamp-2">{product.naam}</h3>
        {product.website_pitch && (
          <p className="text-xs text-muted-foreground line-clamp-2">{product.website_pitch}</p>
        )}
      </div>
      <div className="mt-auto space-y-2">
        {prijs > 0 && (
          <p className="text-sm font-semibold" style={{ color: primaryColor }}>
            vanaf € {prijs.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
          </p>
        )}
        <Button
          variant={isComparing ? "default" : "outline"}
          size="sm"
          className="w-full rounded-[40px] gap-1.5"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCompare();
          }}
          disabled={!isComparing && compareDisabled}
          style={isComparing ? { backgroundColor: primaryColor } : undefined}
        >
          {isComparing ? (
            <>
              <Check className="h-3.5 w-3.5" /> In vergelijker
            </>
          ) : (
            <>
              <GitCompare className="h-3.5 w-3.5" /> Vergelijken
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};