import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, BookOpen, Wrench, Download } from "lucide-react";
import { ContactForm } from "@/components/webtools/ContactForm";
import type { EmbedProduct } from "./types";
import { useState } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

function buildStorageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
}

function normalizeGallery(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val
    .map((v) => {
      if (typeof v === "string") return buildStorageUrl(v);
      if (v && typeof v === "object") {
        const obj = v as Record<string, unknown>;
        const cand = obj.url ?? obj.path ?? obj.src;
        return typeof cand === "string" ? buildStorageUrl(cand) : null;
      }
      return null;
    })
    .filter((u): u is string => Boolean(u));
}

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

  const mainImage = product.afbeelding_url ?? null;
  const gallery = normalizeGallery(product.afbeeldingen);
  const allImages = [mainImage, ...gallery].filter((u): u is string => Boolean(u));
  const [activeImage, setActiveImage] = useState<string | null>(allImages[0] ?? null);

  const downloads: Array<{ url: string; label: string; filename: string; icon: typeof FileText }> = [];
  if (product.datasheet_url && product.datasheet_type === "fabrikant") {
    const url = buildStorageUrl(product.datasheet_url);
    if (url) downloads.push({ url, label: "Datasheet", filename: `${product.naam ?? "datasheet"}.pdf`, icon: FileText });
  }
  if (product.installatie_handleiding_url) {
    const url = buildStorageUrl(product.installatie_handleiding_url);
    if (url) downloads.push({ url, label: "Installatiehandleiding", filename: product.installatie_handleiding_naam ?? "installatiehandleiding.pdf", icon: Wrench });
  }
  if (product.gebruiker_handleiding_url) {
    const url = buildStorageUrl(product.gebruiker_handleiding_url);
    if (url) downloads.push({ url, label: "Gebruikershandleiding", filename: product.gebruiker_handleiding_naam ?? "gebruikershandleiding.pdf", icon: BookOpen });
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Terug naar overzicht
      </Button>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="aspect-square bg-muted rounded-md overflow-hidden flex items-center justify-center">
            {activeImage ? (
              <img
                src={activeImage}
                alt={product.naam ?? ""}
                className="object-contain w-full h-full"
              />
            ) : (
              <span className="text-sm text-muted-foreground">Geen afbeelding</span>
            )}
          </div>
          {allImages.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {allImages.map((img) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => setActiveImage(img)}
                  className={`aspect-square bg-muted rounded-md overflow-hidden border-2 transition-colors ${
                    activeImage === img ? "border-primary" : "border-transparent hover:border-border"
                  }`}
                  style={activeImage === img ? { borderColor: primaryColor } : undefined}
                >
                  <img src={img} alt="" className="object-contain w-full h-full" />
                </button>
              ))}
            </div>
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

      {downloads.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Documenten</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {downloads.map((d) => {
              const Icon = d.icon;
              return (
                <a
                  key={d.url}
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={d.filename}
                  className="flex items-center gap-3 rounded-lg border bg-card p-3 hover:border-primary/50 transition-colors"
                  style={{ borderColor: undefined }}
                >
                  <Icon className="h-5 w-5 shrink-0" style={{ color: primaryColor }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{d.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{d.filename}</p>
                  </div>
                  <Download className="h-4 w-4 text-muted-foreground shrink-0" />
                </a>
              );
            })}
          </div>
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