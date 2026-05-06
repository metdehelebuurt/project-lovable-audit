export interface PartnerMerk {
  id: string;
  partner_id: string;
  merk: string;
  slug: string;
  logo_url: string | null;
  intro_html: string | null;
  toon_op_website: boolean;
  volgorde: number;
}