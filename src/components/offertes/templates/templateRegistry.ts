export interface TemplateVariant {
  id: string;
  naam: string;
  beschrijving: string;
}

export interface TemplateSectie {
  id: string;
  naam: string;
  varianten: TemplateVariant[];
}

export const templateSecties: TemplateSectie[] = [
  {
    id: "voorblad",
    naam: "Voorblad",
    varianten: [
      { id: "hero-dark", naam: "Donker & Bold", beschrijving: "Donkere hero met accent kleur" },
      { id: "hero-split", naam: "Gesplitst", beschrijving: "Twee kolommen met beeld en tekst" },
      { id: "hero-minimal", naam: "Minimalistisch", beschrijving: "Clean wit met subtiele accenten" },
      { id: "hero-gradient", naam: "Gradient", beschrijving: "Kleurverloop als achtergrond" },
      { id: "hero-photo", naam: "Foto-focus", beschrijving: "Grote afbeelding als achtergrond" },
    ],
  },
  {
    id: "producten",
    naam: "Producten",
    varianten: [
      { id: "product-list", naam: "Lijst", beschrijving: "Compacte lijst met details" },
      { id: "product-cards", naam: "Kaarten", beschrijving: "Productkaarten met afbeeldingen" },
      { id: "product-grid", naam: "Grid", beschrijving: "2-koloms grid layout" },
      { id: "product-spotlight", naam: "Spotlight", beschrijving: "Elk product op volle breedte" },
      { id: "product-showcase", naam: "Commercieel", beschrijving: "Volledige pagina per product, grote foto & USPs" },
    ],
  },
  {
    id: "prijstabel",
    naam: "Prijstabel",
    varianten: [
      { id: "price-classic", naam: "Klassiek", beschrijving: "Traditionele tabelopmaak" },
      { id: "price-modern", naam: "Modern", beschrijving: "Afgeronde hoeken, zachte kleuren" },
      { id: "price-compact", naam: "Compact", beschrijving: "Beknopte weergave" },
      { id: "price-detailed", naam: "Gedetailleerd", beschrijving: "Uitgebreide specificaties" },
    ],
  },
  {
    id: "energieadvies",
    naam: "Energieadvies",
    varianten: [
      { id: "energy-cards", naam: "Kaarten", beschrijving: "Besparingskaarten met iconen" },
      { id: "energy-infographic", naam: "Infographic", beschrijving: "Visuele grafieken en bars" },
      { id: "energy-minimal", naam: "Minimaal", beschrijving: "Alleen kerncijfers" },
      { id: "energy-dashboard", naam: "Dashboard", beschrijving: "KPI dashboard met progress bars" },
      { id: "energy-timeline", naam: "Tijdlijn", beschrijving: "Cumulatieve besparing over 15 jaar" },
    ],
  },
  {
    id: "voorwaarden",
    naam: "Voorwaarden & Akkoord",
    varianten: [
      { id: "terms-simple", naam: "Eenvoudig", beschrijving: "Tekst met handtekeningvak" },
      { id: "terms-boxed", naam: "Omkaderd", beschrijving: "Voorwaarden in kaders" },
      { id: "terms-sidebar", naam: "Zijbalk", beschrijving: "Voorwaarden naast handtekeningvak" },
    ],
  },
];

export type TemplateConfig = {
  // Design variant per sectie
  voorblad: string;
  producten: string;
  prijstabel: string;
  energieadvies: string;
  voorwaarden: string;
  // Section toggles
  secties_voorblad?: boolean;
  secties_producten?: boolean;
  secties_energieadvies?: boolean;
  secties_schouwrapport?: boolean;
  // Custom text overrides
  badge_1?: string;
  badge_2?: string;
  badge_3?: string;
  akkoord_tekst?: string;
  // Hero customization
  hero_image_url?: string;
  hero_title?: string;
  // Logo variant: 'auto' (default, context-aware), 'light', 'dark'
  voorblad_logo_variant?: "auto" | "light" | "dark";
  // Section ordering
  section_order?: string[];
};

export const DEFAULT_SECTION_ORDER = [
  "voorblad",
  "inhoudsopgave",
  "producten",
  "prijstabel",
  "energieadvies",
  "schouwrapport",
  "datasheets",
];

export const defaultTemplateConfig: TemplateConfig = {
  voorblad: "hero-dark",
  producten: "product-cards",
  prijstabel: "price-modern",
  energieadvies: "energy-cards",
  voorwaarden: "terms-simple",
  secties_voorblad: true,
  secties_producten: true,
  secties_energieadvies: true,
  secties_schouwrapport: true,
  badge_1: "Gecertificeerd installateur",
  badge_2: "Persoonlijk advies",
  badge_3: "Professionele installatie",
  akkoord_tekst: "",
  hero_image_url: "",
  hero_title: "Offerte",
  section_order: DEFAULT_SECTION_ORDER,
};
