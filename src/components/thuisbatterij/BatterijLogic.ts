import type { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["producten"]["Row"];

export interface BatterijSituatie {
  heeftZonnepanelen: boolean;
  zonnepanelenWp: number | null;
  zonnepanelenLeeftijd: number | null;
  jaarverbruikKwh: number | null;
  terugleveringKwh: number | null;
  contractType: "vast" | "dynamisch" | "";
  aantalFasen: 1 | 3;
  heeftOmvormer: boolean;
  omvormerMerk: string;
}

export interface BatterijWensen {
  budgetMin: number | null;
  budgetMax: number | null;
  merkvoorkeur: string;
  gewensteCapaciteitKwh: number | null; // null = automatisch
  motivatie: ("zelfconsumptie" | "piekshaving" | "noodstroom" | "dynamisch_laden")[];
}

export interface BatterijAdvies {
  aanbevolenCapaciteitKwh: number;
  dagelijksOverschot: number;
  geschatteBesparingJaar: number;
  terugverdientijdJaar: number | null;
  toelichting: string;
}

export interface BatterijProductMatch {
  product: Product;
  score: number;
  redenen: string[];
  capaciteitKwh: number | null;
}

const STROOMPRIJS = 0.40;
const TERUGLEVER = 0.07;
const DYNAMISCH_BONUS = 0.15;

export function berekenBatterijAdvies(situatie: BatterijSituatie, wensen: BatterijWensen): BatterijAdvies {
  const wp = situatie.zonnepanelenWp || 5000;
  const jaarOpwekking = wp * 0.85 / 1000; // kWh
  const verbruik = situatie.jaarverbruikKwh || 3500;
  const teruglevering = situatie.terugleveringKwh || jaarOpwekking * 0.5;
  
  // Dagelijks overschot
  const dagOverschot = teruglevering / 365;
  
  // Aanbevolen capaciteit
  let capaciteit: number;
  if (wensen.gewensteCapaciteitKwh) {
    capaciteit = wensen.gewensteCapaciteitKwh;
  } else {
    capaciteit = Math.min(Math.max(Math.ceil(dagOverschot * 1.2), 3), 20);
    // Extra voor dynamisch contract
    if (situatie.contractType === "dynamisch") {
      capaciteit = Math.min(capaciteit * 1.3, 20);
      capaciteit = Math.ceil(capaciteit);
    }
    // Extra voor noodstroom
    if (wensen.motivatie.includes("noodstroom")) {
      capaciteit = Math.max(capaciteit, 10);
    }
  }

  // Besparing
  const nuttigOpgeslagen = Math.min(dagOverschot * 0.9, capaciteit * 0.9) * 365;
  let besparingJaar = Math.round(nuttigOpgeslagen * (STROOMPRIJS - TERUGLEVER));
  if (situatie.contractType === "dynamisch") {
    besparingJaar = Math.round(besparingJaar * (1 + DYNAMISCH_BONUS));
  }
  if (wensen.motivatie.includes("dynamisch_laden")) {
    besparingJaar += Math.round(capaciteit * 50); // Extra arbitrage
  }

  const investering = capaciteit * 500;
  const terugverdientijd = besparingJaar > 0 ? Math.round(investering / besparingJaar * 10) / 10 : null;

  const parts: string[] = [];
  parts.push(`Op basis van ${Math.round(teruglevering)} kWh jaarlijkse teruglevering adviseren wij een batterij van ${capaciteit} kWh.`);
  if (situatie.contractType === "dynamisch") {
    parts.push("Met uw dynamisch contract kunt u extra profiteren van slim laden bij lage tarieven.");
  }
  if (wensen.motivatie.includes("noodstroom")) {
    parts.push("Voor noodstroomfunctionaliteit adviseren wij minimaal 10 kWh.");
  }

  return {
    aanbevolenCapaciteitKwh: capaciteit,
    dagelijksOverschot: Math.round(dagOverschot * 10) / 10,
    geschatteBesparingJaar: besparingJaar,
    terugverdientijdJaar: terugverdientijd,
    toelichting: parts.join(" "),
  };
}

export function matchBatterijProducten(
  producten: Product[],
  advies: BatterijAdvies,
  situatie: BatterijSituatie,
  wensen: BatterijWensen
): BatterijProductMatch[] {
  const batterijen = producten.filter(p => p.categorie === "thuisbatterij" && p.status === "actief");

  return batterijen.map(p => {
    let score = 50;
    const redenen: string[] = [];
    const specs = p.specs as Record<string, any> | null;
    const capaciteit = specs?.capaciteit_kwh || specs?.capaciteit || null;

    // Capaciteit match
    if (capaciteit) {
      const verschil = Math.abs(capaciteit - advies.aanbevolenCapaciteitKwh) / advies.aanbevolenCapaciteitKwh;
      if (verschil < 0.15) { score += 25; redenen.push("Ideale capaciteit"); }
      else if (verschil < 0.3) { score += 15; redenen.push("Goede capaciteit"); }
      else if (verschil < 0.5) { score += 5; redenen.push("Acceptabele capaciteit"); }
      else { score -= 10; redenen.push("Capaciteit wijkt af"); }
    }

    // Budget
    const prijs = p.prijs_excl_btw * 1.21;
    if (wensen.budgetMax && prijs <= wensen.budgetMax) {
      score += 15; redenen.push("Past binnen budget");
    } else if (wensen.budgetMax && prijs <= wensen.budgetMax * 1.2) {
      score += 5; redenen.push("Net boven budget");
    } else if (wensen.budgetMax && prijs > wensen.budgetMax * 1.5) {
      score -= 15; redenen.push("Boven budget");
    }

    // Merkvoorkeur
    if (wensen.merkvoorkeur && p.merk?.toLowerCase().includes(wensen.merkvoorkeur.toLowerCase())) {
      score += 15; redenen.push("Merkvoorkeur");
    }

    // Garantie
    if (p.garantie_jaren && p.garantie_jaren >= 10) {
      score += 10; redenen.push(`${p.garantie_jaren}j garantie`);
    }

    // Fasen compatibiliteit
    if (specs?.fasen && situatie.aantalFasen === 3 && specs.fasen === 3) {
      score += 5; redenen.push("3-fase compatibel");
    }

    // Noodstroom
    if (wensen.motivatie.includes("noodstroom") && specs?.noodstroom) {
      score += 10; redenen.push("Noodstroom mogelijk");
    }

    // Omvormer compatibiliteit
    if (situatie.omvormerMerk && specs?.compatibele_omvormers) {
      const compat = String(specs.compatibele_omvormers).toLowerCase();
      if (compat.includes(situatie.omvormerMerk.toLowerCase())) {
        score += 10; redenen.push("Compatibel met omvormer");
      }
    }

    return {
      product: p,
      score: Math.min(100, Math.max(0, score)),
      redenen,
      capaciteitKwh: capaciteit,
    };
  }).sort((a, b) => b.score - a.score);
}
