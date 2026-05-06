import { useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, GitCompare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCatalogusData } from "./useCatalogusData";
import { CatalogusOverview } from "./CatalogusOverview";
import { ProductDetailView } from "./ProductDetailView";
import { CompareDialog } from "./CompareDialog";
import type { EmbedProduct } from "./types";

const EmbedCatalogus = () => {
  const { widgetId } = useParams<{ widgetId: string }>();
  const { loading, error, widget, partner, producten, merken, categorieen } =
    useCatalogusData(widgetId);
  const [selected, setSelected] = useState<EmbedProduct | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const compareProducts = producten.filter((p) => compareIds.includes(p.id));

  const handleToggleCompare = (p: EmbedProduct) => {
    if (compareIds.includes(p.id)) {
      setCompareIds(compareIds.filter((id) => id !== p.id));
      return;
    }
    if (compareIds.length >= 3) {
      toast.error("Maximaal 3 producten vergelijken");
      return;
    }
    if (compareProducts.length > 0 && compareProducts[0].categorie !== p.categorie) {
      toast.error("Alleen producten binnen dezelfde categorie kunnen vergeleken worden");
      return;
    }
    setCompareIds([...compareIds, p.id]);
  };

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
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 pb-24">
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
            compareIds={compareIds}
            onToggleCompare={handleToggleCompare}
          />
        )}

        <p className="text-xs text-muted-foreground text-center pt-6 border-t">
          Aangedreven door {partner.naam}
        </p>
      </div>

      {compareIds.length > 0 && !selected && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-3 flex items-center justify-between gap-3 z-50">
          <div className="flex items-center gap-2 text-sm min-w-0">
            <GitCompare className="h-4 w-4 shrink-0" style={{ color: primaryColor }} />
            <span className="truncate">
              {compareIds.length} {compareIds.length === 1 ? "product" : "producten"} geselecteerd
              {compareProducts[0]?.categorie ? ` (${compareProducts[0].categorie})` : ""}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => setCompareIds([])}>
              <X className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              className="rounded-[40px]"
              style={{ backgroundColor: primaryColor }}
              onClick={() => setCompareOpen(true)}
              disabled={compareIds.length < 2}
            >
              Vergelijken
            </Button>
          </div>
        </div>
      )}

      <CompareDialog
        open={compareOpen}
        onOpenChange={setCompareOpen}
        producten={compareProducts}
        primaryColor={primaryColor}
        onRemove={(id) => setCompareIds(compareIds.filter((x) => x !== id))}
        onRequestQuote={(p) => {
          setCompareOpen(false);
          setSelected(p);
        }}
      />
    </div>
  );
};

export default EmbedCatalogus;