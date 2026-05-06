import { useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useCatalogusData } from "./useCatalogusData";
import { CatalogusOverview } from "./CatalogusOverview";
import { ProductDetailView } from "./ProductDetailView";
import type { EmbedProduct } from "./types";

const EmbedCatalogus = () => {
  const { widgetId } = useParams<{ widgetId: string }>();
  const { loading, error, widget, partner, producten, merken, categorieen } =
    useCatalogusData(widgetId);
  const [selected, setSelected] = useState<EmbedProduct | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !widget || !partner) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-muted-foreground">{error || "Catalogus niet beschikbaar"}</p>
      </div>
    );
  }

  const primaryColor = partner.primaire_kleur || "#5B58E1";
  const titel = (widget.config.titel as string) || "Productcatalogus";

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        <header className="flex items-center justify-between border-b pb-4">
          {partner.logo_url ? (
            <img src={partner.logo_url} alt={partner.naam} className="h-10 object-contain" />
          ) : (
            <span className="font-semibold">{partner.naam}</span>
          )}
          <h1 className="text-lg font-semibold" style={{ color: primaryColor }}>
            {titel}
          </h1>
        </header>

        {selected ? (
          <ProductDetailView
            product={selected}
            widgetId={widgetId!}
            primaryColor={primaryColor}
            onBack={() => setSelected(null)}
          />
        ) : (
          <CatalogusOverview
            producten={producten}
            merken={merken}
            categorieen={categorieen}
            primaryColor={primaryColor}
            onSelect={setSelected}
          />
        )}

        <p className="text-xs text-muted-foreground text-center pt-6 border-t">
          Aangedreven door {partner.naam}
        </p>
      </div>
    </div>
  );
};

export default EmbedCatalogus;