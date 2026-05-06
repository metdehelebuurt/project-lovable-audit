import { Card } from "@/components/ui/card";
import type { EmbedProduct } from "./types";

interface Props {
  product: EmbedProduct;
  primaryColor: string;
  onClick: () => void;
}

export const ProductCard = ({ product, primaryColor, onClick }: Props) => {
  const prijs = Number(product.prijs_excl_btw ?? 0);
  return (
    <Card
      onClick={onClick}
      className="p-4 cursor-pointer hover:shadow-md transition-shadow flex flex-col gap-3"
    >
      <div className="aspect-square w-full bg-muted rounded-md overflow-hidden flex items-center justify-center">
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
      <div className="space-y-1">
        {product.merk && (
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{product.merk}</p>
        )}
        <h3 className="font-semibold text-sm leading-tight line-clamp-2">{product.naam}</h3>
        {product.website_pitch && (
          <p className="text-xs text-muted-foreground line-clamp-2">{product.website_pitch}</p>
        )}
      </div>
      {prijs > 0 && (
        <p className="text-sm font-semibold mt-auto" style={{ color: primaryColor }}>
          vanaf € {prijs.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
        </p>
      )}
    </Card>
  );
};