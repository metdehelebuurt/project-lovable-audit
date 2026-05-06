import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { CatalogusOverview } from "@/pages/embed/EmbedCatalogus/CatalogusOverview";
import { ProductDetailView } from "@/pages/embed/EmbedCatalogus/ProductDetailView";
import type { EmbedProduct } from "@/pages/embed/EmbedCatalogus/types";
import { usePublicCatalogus } from "./usePublicCatalogus";
import { useDocumentSeo, type SeoMeta } from "@/lib/seo/useDocumentSeo";

function buildProductSeo(
  product: EmbedProduct,
  partnerNaam: string,
  canonical: string,
): SeoMeta {
  const title = `${product.naam ?? "Product"}${product.merk ? ` — ${product.merk}` : ""} | ${partnerNaam}`;
  const description = product.website_pitch
    || product.website_omschrijving
    || `Bekijk ${product.naam ?? "dit product"}${product.merk ? ` van ${product.merk}` : ""} bij ${partnerNaam}.`;
  const image = product.afbeelding_url ?? undefined;
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.naam,
    brand: product.merk ? { "@type": "Brand", name: product.merk } : undefined,
    description,
    image: image ? [image] : undefined,
    offers: product.prijs_excl_btw != null ? {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: Number(product.prijs_excl_btw).toFixed(2),
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: partnerNaam },
    } : undefined,
  };
  return { title, description, canonical, image, type: "product", jsonLd };
}

export default function PublicCatalogus() {
  const { partnerSlug, productSlug } = useParams<{ partnerSlug: string; productSlug?: string }>();
  const navigate = useNavigate();
  const { loading, error, partner, producten, merken, categorieen } = usePublicCatalogus(partnerSlug);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const selected = useMemo<EmbedProduct | null>(() => {
    if (!productSlug) return null;
    return producten.find((p) => p.website_slug === productSlug) ?? null;
  }, [producten, productSlug]);

  // Redirect to overview if product slug invalid (after load)
  useEffect(() => {
    if (!loading && productSlug && producten.length > 0 && !selected) {
      navigate(`/c/${partnerSlug}`, { replace: true });
    }
  }, [loading, productSlug, producten, selected, navigate, partnerSlug]);

  const canonicalBase = typeof window !== "undefined" ? window.location.origin : "";
  const overviewSeo: SeoMeta | null = partner ? {
    title: `Productcatalogus — ${partner.naam}`,
    description: `Bekijk het productaanbod van ${partner.naam}: zonnepanelen, warmtepompen, thuisbatterijen en meer.`,
    canonical: `${canonicalBase}/c/${partner.partner_slug}`,
    type: "website",
    image: partner.logo_url ?? undefined,
  } : null;

  const seo: SeoMeta | null = selected && partner
    ? buildProductSeo(selected, partner.naam, `${canonicalBase}/c/${partner.partner_slug}/${selected.website_slug}`)
    : overviewSeo;

  useDocumentSeo(seo);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !partner) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-muted-foreground">{error || "Catalogus niet beschikbaar"}</p>
      </main>
    );
  }

  const primaryColor = partner.primaire_kleur || "#5B58E1";

  const handleSelect = (p: EmbedProduct) => {
    if (p.website_slug) navigate(`/c/${partner.partner_slug}/${p.website_slug}`);
  };

  const handleToggleCompare = (p: EmbedProduct) => {
    setCompareIds((prev) => {
      if (prev.includes(p.id)) return prev.filter((id) => id !== p.id);
      if (prev.length >= 3) return prev;
      return [...prev, p.id];
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 pb-24">
        <header className="flex items-center justify-between border-b pb-4">
          <a href={`/c/${partner.partner_slug}`} className="flex items-center gap-3">
            {partner.logo_url ? (
              <img src={partner.logo_url} alt={partner.naam} className="h-10 object-contain" />
            ) : (
              <span className="font-semibold text-foreground">{partner.naam}</span>
            )}
          </a>
          <h1 className="text-lg font-semibold" style={{ color: primaryColor }}>
            {selected ? selected.naam : "Productcatalogus"}
          </h1>
        </header>

        {selected ? (
          <ProductDetailView
            product={selected}
            widgetId={`public:${partner.partner_slug}`}
            primaryColor={primaryColor}
            onBack={() => navigate(`/c/${partner.partner_slug}`)}
          />
        ) : (
          <CatalogusOverview
            producten={producten}
            merken={merken}
            categorieen={categorieen}
            primaryColor={primaryColor}
            onSelect={handleSelect}
            compareIds={compareIds}
            onToggleCompare={handleToggleCompare}
          />
        )}

        <p className="text-xs text-muted-foreground text-center pt-6 border-t">
          {partner.website ? (
            <a href={partner.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {partner.naam}
            </a>
          ) : partner.naam}
        </p>
      </div>
    </div>
  );
}