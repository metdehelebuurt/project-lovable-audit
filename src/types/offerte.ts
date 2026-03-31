// B1: Gedeeld OfferteRegel type - centraal gedefinieerd
export interface OfferteRegel {
  product_id?: string;
  omschrijving: string;
  offerte_tekst?: string;
  aantal: number;
  prijs_per_stuk: number;
  btw_percentage: number;
  korting_percentage: number;
  korting_bedrag: number;
  korting_type: "percentage" | "bedrag";
}

export const emptyOfferteRegel: OfferteRegel = {
  omschrijving: "",
  aantal: 1,
  prijs_per_stuk: 0,
  btw_percentage: 21,
  korting_percentage: 0,
  korting_bedrag: 0,
  korting_type: "percentage",
};

// Platte tekst → HTML fallback (voor oudere offertes zonder WYSIWYG)
export const ensureHtml = (text: string): string => {
  if (!text) return "";
  if (/<[a-z][\s\S]*>/i.test(text)) return text;
  return text.split(/\n\n+/).map(p => `<p>${p.replace(/\n/g, "<br/>")}</p>`).join("");
};

// B2 + B3: Gedeelde utility functies
export const formatCurrency = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

export const regelSubtotaal = (r: OfferteRegel) => {
  const bruto = r.aantal * r.prijs_per_stuk;
  if (r.korting_type === "bedrag") return bruto - (r.korting_bedrag || 0);
  return bruto * (1 - (r.korting_percentage || 0) / 100);
};

export const generateOfferteNummer = () => {
  const d = new Date();
  const yy = d.getFullYear().toString().slice(2);
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  const dd = d.getDate().toString().padStart(2, "0");
  const rand = Math.floor(Math.random() * 9999).toString().padStart(4, "0");
  return `OF-${yy}${mm}${dd}-${rand}`;
};
