import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ContactForm } from "@/components/webtools/ContactForm";
import type { EmbedProduct } from "./types";

interface Props {
  product: EmbedProduct;
  widgetId: string;
  primaryColor: string;
  onBack: () => void;
}

export const ProductDetailView = ({ product, widgetId, primaryColor, onBack }: Props) => {
  const usps = Array.isArray(product.website_usps) ? (product.website_usps as string[]) : [];
  const faq = Array.isArray(product.website_faq)
    ? (product.website_faq as { vraag: string; antwoord: string }[])
    : [];
  const prijs = Number(product.prijs_excl_btw ?? 0);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Terug naar overzicht
      </Button>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="aspect-square bg-muted rounded-md overflow-hidden flex items-center justify-center">
          {product.afbeelding_url ? (
            <img
              src={product.afbeelding_url}
              alt={product.naam ?? ""}
              className="object-contain w-full h-full"
            />
          ) : (
            <span className="text-sm text-muted-foreground">Geen afbeelding</span>
          )}
        </div>
        <div className="space-y-3">
          {product.merk && (
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{product.merk}</p>
          )}
          <h1 className="text-2xl font-semibold">{product.naam}</h1>
          {product.website_pitch && <p className="text-base">{product.website_pitch}</p>}
          {prijs > 0 && (
            <p className="text-xl font-semibold" style={{ color: primaryColor }}>
              vanaf € {prijs.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
            </p>
          )}
          {usps.length > 0 && (
            <ul className="list-disc list-inside text-sm space-y-1 pt-2">
              {usps.map((u, i) => (
                <li key={i}>{u}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {product.website_omschrijving && (
        <section className="prose prose-sm max-w-none">
          <h2 className="text-lg font-semibold">Omschrijving</h2>
          <div dangerouslySetInnerHTML={{ __html: product.website_omschrijving }} />
        </section>
      )}

      {faq.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Veelgestelde vragen</h2>
          {faq.map((f, i) => (
            <div key={i} className="border-l-2 pl-4" style={{ borderColor: primaryColor }}>
              <p className="font-medium text-sm">{f.vraag}</p>
              <p className="text-sm text-muted-foreground mt-1">{f.antwoord}</p>
            </div>
          ))}
        </section>
      )}

      <section className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-1">Vraag een offerte aan</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Wij nemen binnen één werkdag contact op met een persoonlijk voorstel.
        </p>
        <ContactForm
          widgetId={widgetId}
          primaryColor={primaryColor}
          ctaText="Vraag offerte aan"
          productId={product.id}
          productNaam={product.naam ?? undefined}
        />
      </section>
    </div>
  );
};