export interface EmbedProduct {
  id: string;
  naam: string | null;
  merk: string | null;
  categorie: string | null;
  afbeelding_url: string | null;
  afbeeldingen: unknown;
  prijs_excl_btw: number | null;
  btw_percentage: number | null;
  website_slug: string | null;
  website_pitch: string | null;
  website_omschrijving: string | null;
  website_usps: unknown;
  website_faq: unknown;
  garantie_jaren: number | null;
  specs: unknown;
}

export interface EmbedPartner {
  naam: string;
  logo_url: string | null;
  primaire_kleur: string | null;
}

export interface EmbedWidget {
  partner_id: string;
  config: Record<string, unknown>;
}