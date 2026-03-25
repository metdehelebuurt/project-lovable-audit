import type { Database } from "@/integrations/supabase/types";

export type ProductCategorie = Database["public"]["Enums"]["product_categorie"];

export interface WizardData {
  // Stap 1: Woningsituatie
  woningType: "vrijstaand" | "twee_onder_een_kap" | "hoekwoning" | "tussenwoning" | "appartement" | "";
  bouwjaar: number | null;
  dakOrientatie: "zuid" | "oost" | "west" | "oost_west" | "noord" | "plat" | "";
  dakOppervlakte: number | null;
  aantalPersonen: number | null;
  energielabel: "A++++" | "A+++" | "A++" | "A+" | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "onbekend" | "";
  aansluitwaarde: "1-fase" | "3-fase" | "";
  isolatieNiveau: "goed" | "matig" | "slecht" | "";

  // Stap 2: Huidige installatie
  heeftZonnepanelen: boolean;
  zonnepanelenWp: number | null;
  zonnepanelenLeeftijd: number | null;
  omvormerType: string;
  heeftWarmtepomp: boolean;
  heeftLaadpaal: boolean;
  heeftThuisbatterij: boolean;
  heeftElektrischeAuto: boolean;
  kmPerJaar: number | null;

  // Stap 3: Verbruik & contract
  jaarverbruikKwh: number | null;
  gasverbruikM3: number | null;
  terugleveringKwh: number | null;
  contractType: "vast" | "dynamisch" | "";
  maandelijkseKosten: number | null;

  // Stap 4: Wensen & budget
  interesseCategorieen: ProductCategorie[];
  budgetMin: number | null;
  budgetMax: number | null;
  merkvoorkeur: string;
  motivatie: ("kostenbesparing" | "duurzaamheid" | "onafhankelijkheid" | "woningwaarde")[];
}

export interface AdviesResultaat {
  categorie: ProductCategorie;
  aanbevolen: boolean;
  titel: string;
  toelichting: string;
  geschatteCapaciteit?: string;
  geschatteBesparing?: number;
  geschatteInvestering?: string;
  terugverdientijd?: string;
  co2BesparingKg?: number;
  zelfvoorzieningsgraad?: number;
  prioriteit: "hoog" | "middel" | "laag";
}

export interface ProductMatch {
  id: string;
  naam: string;
  merk: string | null;
  model: string | null;
  categorie: ProductCategorie;
  prijs_excl_btw: number;
  btw_percentage: number | null;
  specs: Record<string, any> | null;
  garantie_jaren: number | null;
  geschiktheidScore: number;
  scoreReden: string;
  matchLabel: "Beste keuze" | "Goede match" | "Alternatief" | "Beperkt geschikt";
  afbeelding_url: string | null;
  kernSpecs: Record<string, string>;
}

export const initialWizardData: WizardData = {
  woningType: "",
  bouwjaar: null,
  dakOrientatie: "",
  dakOppervlakte: null,
  aantalPersonen: null,
  energielabel: "",
  aansluitwaarde: "",
  isolatieNiveau: "",
  heeftZonnepanelen: false,
  zonnepanelenWp: null,
  zonnepanelenLeeftijd: null,
  omvormerType: "",
  heeftWarmtepomp: false,
  heeftLaadpaal: false,
  heeftThuisbatterij: false,
  heeftElektrischeAuto: false,
  kmPerJaar: null,
  jaarverbruikKwh: null,
  gasverbruikM3: null,
  terugleveringKwh: null,
  contractType: "",
  maandelijkseKosten: null,
  budgetMin: null,
  budgetMax: null,
  merkvoorkeur: "",
  motivatie: [],
  interesseCategorieen: [],
};
