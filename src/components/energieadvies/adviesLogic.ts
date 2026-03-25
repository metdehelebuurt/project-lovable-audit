import type { WizardData, AdviesResultaat, ProductMatch } from "./types";
import type { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["producten"]["Row"];

const STROOMPRIJS = 0.40;
const TERUGLEVER = 0.07;
const GASPRIJS = 1.50;
const DYNAMISCH_BONUS = 0.15;
const CO2_PER_KWH = 0.4;
const BENZINEPRIJS_PER_KM = 0.12;
const STROOM_PER_KM = 0.18; // kWh

const ORIENTATIE_FACTOR: Record<string, number> = {
  zuid: 1.0, oost_west: 0.92, plat: 0.90, oost: 0.85, west: 0.85, noord: 0.65,
};

const WONINGTYPE_WARMTECAPACITEIT: Record<string, number> = {
  vrijstaand: 12, twee_onder_een_kap: 10, hoekwoning: 8, tussenwoning: 6, appartement: 5,
};

function getMatchLabel(score: number): ProductMatch["matchLabel"] {
  if (score >= 80) return "Beste keuze";
  if (score >= 60) return "Goede match";
  if (score >= 40) return "Alternatief";
  return "Beperkt geschikt";
}

function extractKernSpecs(p: Product): Record<string, string> {
  const specs = p.specs as Record<string, any> | null;
  if (!specs) return {};
  const kern: Record<string, string> = {};
  // Zonnepanelen
  if (specs.vermogen_wp) kern["Vermogen"] = `${specs.vermogen_wp} Wp`;
  if (specs.rendement_percentage) kern["Rendement"] = `${specs.rendement_percentage}%`;
  if (specs.celtype) kern["Celtype"] = specs.celtype;
  // Batterij
  if (specs.bruikbare_capaciteit_kwh || specs.capaciteit_kwh || specs.capaciteit) {
    kern["Capaciteit"] = `${specs.bruikbare_capaciteit_kwh || specs.capaciteit_kwh || specs.capaciteit} kWh`;
  }
  if (specs.aantal_cycli) kern["Cycli"] = `${specs.aantal_cycli}`;
  // Warmtepomp
  if (specs.verwarmingscapaciteit_kw) kern["Vermogen"] = `${specs.verwarmingscapaciteit_kw} kW`;
  if (specs.cop || specs.scop) kern["COP"] = `${specs.cop || specs.scop}`;
  // Laadpaal
  if (specs.laadvermogen_kw) kern["Laadvermogen"] = `${specs.laadvermogen_kw} kW`;
  if (specs.smart_charging !== undefined) kern["Smart charging"] = specs.smart_charging ? "Ja" : "Nee";
  // Omvormer
  if (specs.nominaal_vermogen_kw) kern["Vermogen"] = `${specs.nominaal_vermogen_kw} kW`;
  // Garantie
  if (p.garantie_jaren) kern["Garantie"] = `${p.garantie_jaren} jaar`;
  return kern;
}

export function berekenAdviezen(data: WizardData): AdviesResultaat[] {
  const adviezen: AdviesResultaat[] = [];
  const orientatieFactor = ORIENTATIE_FACTOR[data.dakOrientatie] || 0.85;

  // Zonnepanelen
  if (data.interesseCategorieen.includes("zonnepanelen") && !data.heeftZonnepanelen) {
    const verbruik = data.jaarverbruikKwh || 3500;
    const wpPerPaneel = 420;
    let geschatWp = Math.ceil(verbruik / (0.85 * orientatieFactor)) * 1000;
    const maxPanelen = data.dakOppervlakte ? Math.floor(data.dakOppervlakte / 1.7) : 999;
    const geschatteAantalPanelen = Math.min(Math.ceil(geschatWp / wpPerPaneel), maxPanelen);
    geschatWp = geschatteAantalPanelen * wpPerPaneel;
    const jaarOpwekking = geschatWp * 0.85 * orientatieFactor / 1000;
    const besparing = Math.round(jaarOpwekking * STROOMPRIJS * 0.7);
    const co2 = Math.round(jaarOpwekking * CO2_PER_KWH);
    const zelfvoorzieningsgraad = Math.min(100, Math.round((jaarOpwekking / verbruik) * 100));
    const bouwjaarWarning = data.bouwjaar && data.bouwjaar < 1980
      ? " Let op: bij woningen van vóór 1980 adviseren wij een dakconstructie-check."
      : "";

    adviezen.push({
      categorie: "zonnepanelen",
      aanbevolen: true,
      prioriteit: "hoog",
      titel: "Zonnepanelen",
      toelichting: `Op basis van uw verbruik (${verbruik} kWh) en dakoriëntatie (${data.dakOrientatie || "onbekend"}, factor ${orientatieFactor}) adviseren wij ca. ${geschatteAantalPanelen} panelen (${geschatWp} Wp). Geschatte jaaropbrengst: ${Math.round(jaarOpwekking)} kWh.${bouwjaarWarning}`,
      geschatteCapaciteit: `${geschatWp} Wp (${geschatteAantalPanelen} panelen)`,
      geschatteBesparing: besparing,
      geschatteInvestering: `€ ${geschatteAantalPanelen * 300} - € ${geschatteAantalPanelen * 450}`,
      terugverdientijd: `${Math.round(geschatteAantalPanelen * 375 / besparing)} jaar`,
      co2BesparingKg: co2,
      zelfvoorzieningsgraad,
    });
  }

  // Thuisbatterij
  if (data.interesseCategorieen.includes("thuisbatterij")) {
    const wp = data.heeftZonnepanelen ? (data.zonnepanelenWp || 5000) : 6000;
    const jaarOpwekking = wp * 0.85 / 1000;
    const dagOverschot = (jaarOpwekking * 0.7) / 365;
    const capaciteit = Math.min(Math.max(Math.ceil(dagOverschot), 3), 20);
    const extraZelf = jaarOpwekking * 0.4 * 0.9;
    let besparing = Math.round(extraZelf * (STROOMPRIJS - TERUGLEVER));
    // Salderingsafbouw bonus
    besparing = Math.round(besparing * 1.3);
    if (data.contractType === "dynamisch") besparing = Math.round(besparing * (1 + DYNAMISCH_BONUS));
    const investering = capaciteit * 500;
    const co2 = Math.round(extraZelf * CO2_PER_KWH);
    const faseInfo = data.aansluitwaarde === "1-fase"
      ? " Let op: bij een 1-fase aansluiting is het ontlaadvermogen beperkt tot ca. 3,7 kW."
      : "";
    const zelfvoorzieningsgraad = Math.min(95, Math.round(((jaarOpwekking * 0.7 + extraZelf) / (data.jaarverbruikKwh || 3500)) * 100));

    adviezen.push({
      categorie: "thuisbatterij",
      aanbevolen: data.heeftZonnepanelen || data.interesseCategorieen.includes("zonnepanelen"),
      prioriteit: (data.heeftZonnepanelen || data.interesseCategorieen.includes("zonnepanelen")) ? "hoog" : "middel",
      titel: "Thuisbatterij",
      toelichting: `Een batterij van ${capaciteit} kWh maximaliseert uw zelfconsumptie. Door de afbouw van de salderingsregeling wordt een batterij steeds rendabeler.${data.contractType === "dynamisch" ? " Met uw dynamisch contract profiteert u extra van slim laden/ontladen." : ""}${faseInfo}`,
      geschatteCapaciteit: `${capaciteit} kWh`,
      geschatteBesparing: besparing,
      geschatteInvestering: `€ ${investering}`,
      terugverdientijd: besparing > 0 ? `${Math.round(investering / besparing * 10) / 10} jaar` : "n.v.t.",
      co2BesparingKg: co2,
      zelfvoorzieningsgraad,
    });
  }

  // Warmtepomp
  if (data.interesseCategorieen.includes("warmtepomp") && !data.heeftWarmtepomp) {
    const gas = data.gasverbruikM3 || 1500;
    const gasVoorVerwarming = Math.max(0, gas - 50); // koken aftrekken
    const isolatie = data.isolatieNiveau || "matig";
    const isFullElectricMogelijk = isolatie === "goed" && gasVoorVerwarming > 800;
    const typeAdvies = isFullElectricMogelijk ? "Full-electric of hybride" : "Hybride warmtepomp";
    const besparingsPercentage = isFullElectricMogelijk ? 0.85 : 0.60;
    const cop = isFullElectricMogelijk ? 4 : 3.5;
    const gasBesparing = Math.round(gasVoorVerwarming * besparingsPercentage * GASPRIJS);
    const extraStroom = Math.round(gasVoorVerwarming * besparingsPercentage * 8.8 / cop);
    const netBesparing = gasBesparing - Math.round(extraStroom * STROOMPRIJS);
    const co2 = Math.round(gasVoorVerwarming * besparingsPercentage * 1.8 - extraStroom * CO2_PER_KWH);
    const benodigdeCapaciteit = WONINGTYPE_WARMTECAPACITEIT[data.woningType] || 8;
    const isolatieWarning = isolatie === "slecht"
      ? " Wij adviseren eerst te isoleren voor een optimaal rendement."
      : "";

    adviezen.push({
      categorie: "warmtepomp",
      aanbevolen: gasVoorVerwarming > 800,
      prioriteit: gasVoorVerwarming > 1200 ? "hoog" : gasVoorVerwarming > 800 ? "middel" : "laag",
      titel: "Warmtepomp",
      toelichting: `Bij een gasverbruik van ${gas} m³/jaar (${gasVoorVerwarming} m³ voor verwarming) adviseren wij een ${typeAdvies.toLowerCase()} (ca. ${benodigdeCapaciteit} kW). Isolatieniveau: ${isolatie}.${isolatieWarning}`,
      geschatteCapaciteit: `${typeAdvies} (${benodigdeCapaciteit} kW)`,
      geschatteBesparing: netBesparing,
      geschatteInvestering: isFullElectricMogelijk ? "€ 8.000 - € 15.000" : "€ 4.000 - € 8.000",
      terugverdientijd: netBesparing > 0 ? `${Math.round(10000 / netBesparing)} - ${Math.round(14000 / netBesparing)} jaar` : "n.v.t.",
      co2BesparingKg: Math.max(0, co2),
      prioriteit: gasVoorVerwarming > 1200 ? "hoog" : gasVoorVerwarming > 800 ? "middel" : "laag",
    });
  }

  // Laadpaal
  if (data.interesseCategorieen.includes("laadpaal") && !data.heeftLaadpaal) {
    const km = data.kmPerJaar || 15000;
    const benzineKosten = km * BENZINEPRIJS_PER_KM;
    const stroomKosten = km * STROOM_PER_KM * STROOMPRIJS;
    const besparing = Math.round(benzineKosten - stroomKosten);
    const co2 = Math.round(km * 0.12 - km * STROOM_PER_KM * CO2_PER_KWH); // ~120g/km benzine
    const aanbevolenVermogen = data.aansluitwaarde === "3-fase" ? "11 kW (3-fase)" : "7,4 kW (1-fase)";
    const solarBonus = (data.heeftZonnepanelen || data.interesseCategorieen.includes("zonnepanelen"))
      ? " In combinatie met zonnepanelen laadt u grotendeels met eigen stroom."
      : "";

    adviezen.push({
      categorie: "laadpaal",
      aanbevolen: data.heeftElektrischeAuto,
      prioriteit: data.heeftElektrischeAuto ? "hoog" : "middel",
      titel: "Laadpaal",
      toelichting: `Op basis van ${km.toLocaleString("nl-NL")} km/jaar bespaart u ca. ${formatCurrency(besparing)}/jaar ten opzichte van benzine. Aanbevolen: ${aanbevolenVermogen}.${solarBonus}`,
      geschatteCapaciteit: aanbevolenVermogen,
      geschatteBesparing: besparing,
      geschatteInvestering: "€ 1.200 - € 2.500",
      terugverdientijd: besparing > 0 ? `${Math.round(1800 / besparing * 10) / 10} jaar` : "n.v.t.",
      co2BesparingKg: Math.max(0, co2),
    });
  }

  // Omvormer
  if (data.interesseCategorieen.includes("omvormer")) {
    const leeftijd = data.zonnepanelenLeeftijd || 0;
    adviezen.push({
      categorie: "omvormer",
      aanbevolen: data.heeftZonnepanelen && leeftijd > 10,
      prioriteit: leeftijd > 12 ? "hoog" : leeftijd > 8 ? "middel" : "laag",
      titel: "Omvormer",
      toelichting: data.heeftZonnepanelen && leeftijd > 10
        ? `Uw omvormer is ${leeftijd} jaar oud. Een nieuwe omvormer kan de opbrengst met 5-15% verhogen en biedt vaak batterij-compatibiliteit.`
        : "Een moderne hybride omvormer maximaliseert de opbrengst en maakt toekomstige batterijkoppeling mogelijk.",
      geschatteCapaciteit: `${Math.ceil((data.zonnepanelenWp || 5000) / 1000)} kW`,
    });
  }

  return adviezen;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

export function matchProducten(
  producten: Product[],
  data: WizardData,
  adviezen: AdviesResultaat[]
): ProductMatch[] {
  const categorieenInAdvies = adviezen.map(a => a.categorie);
  const relevantProducten = producten.filter(p => categorieenInAdvies.includes(p.categorie));

  const results = relevantProducten.map(p => {
    const specs = p.specs as Record<string, any> | null;
    let score = 0;
    const reden: string[] = [];

    // === Budget match (max 20) ===
    const prijs = p.prijs_excl_btw * 1.21;
    if (data.budgetMax) {
      if (prijs <= data.budgetMax) { score += 20; reden.push("Past binnen budget"); }
      else if (prijs <= data.budgetMax * 1.2) { score += 8; reden.push("Net boven budget"); }
      else { reden.push("Boven budget"); }
    } else {
      score += 10; // no budget = neutral
    }

    // === Merkvoorkeur (max 10) ===
    if (data.merkvoorkeur && p.merk?.toLowerCase().includes(data.merkvoorkeur.toLowerCase())) {
      score += 10; reden.push("Merkvoorkeur");
    }

    // === Category-specific scoring ===
    if (p.categorie === "zonnepanelen") {
      score += scoreZonnepanelen(specs, data, adviezen, reden);
    } else if (p.categorie === "thuisbatterij") {
      score += scoreThuisbatterij(specs, data, adviezen, reden);
    } else if (p.categorie === "warmtepomp") {
      score += scoreWarmtepomp(specs, data, adviezen, reden);
    } else if (p.categorie === "laadpaal") {
      score += scoreLaadpaal(specs, data, reden);
    } else if (p.categorie === "omvormer") {
      score += scoreOmvormer(specs, data, reden);
    } else {
      // accessoires etc
      score += 30;
      if (p.garantie_jaren && p.garantie_jaren >= 5) { score += 10; reden.push(`${p.garantie_jaren}j garantie`); }
    }

    const finalScore = Math.min(100, Math.max(0, score));

    return {
      id: p.id,
      naam: p.naam,
      merk: p.merk,
      model: p.model,
      categorie: p.categorie,
      prijs_excl_btw: p.prijs_excl_btw,
      btw_percentage: p.btw_percentage,
      specs,
      garantie_jaren: p.garantie_jaren,
      geschiktheidScore: finalScore,
      scoreReden: reden.join(" • ") || "Standaard product",
      matchLabel: getMatchLabel(finalScore),
      afbeelding_url: p.afbeelding_url || null,
      kernSpecs: extractKernSpecs(p),
    };
  })
    .filter(p => p.geschiktheidScore >= 40)
    .sort((a, b) => b.geschiktheidScore - a.geschiktheidScore);

  return results;
}

// === Category scorers (max ~70 each, + 20 budget + 10 merk = 100) ===

function scoreZonnepanelen(specs: Record<string, any> | null, data: WizardData, adviezen: AdviesResultaat[], reden: string[]): number {
  let s = 0;
  if (!specs) return 20;

  // Vermogen match (+30)
  const vermogen = specs.vermogen_wp;
  if (vermogen) {
    if (vermogen >= 400) { s += 30; reden.push(`${vermogen} Wp — hoog vermogen`); }
    else if (vermogen >= 350) { s += 20; reden.push(`${vermogen} Wp`); }
    else { s += 10; reden.push(`${vermogen} Wp — lager vermogen`); }
  }

  // Celtype + dakoriëntatie (+15)
  const celtype = specs.celtype?.toLowerCase();
  if (celtype) {
    const isBifacial = celtype.includes("bifacial") || celtype.includes("n-type");
    if (isBifacial && (data.dakOrientatie === "plat" || data.dakOrientatie === "oost_west")) {
      s += 15; reden.push("Bifacial — ideaal voor uw dak");
    } else if (isBifacial) {
      s += 10; reden.push("Bifacial paneel");
    } else {
      s += 5;
    }
  }

  // Garantie (+15)
  const vermogensgarantie = specs.vermogensgarantie_jaar || specs.productgarantie_jaar;
  if (vermogensgarantie && vermogensgarantie >= 25) { s += 15; reden.push(`${vermogensgarantie}j vermogensgarantie`); }
  else if (vermogensgarantie && vermogensgarantie >= 20) { s += 8; }

  // Efficiency (+10)
  const rendement = specs.rendement_percentage;
  if (rendement && rendement > 21) { s += 10; reden.push(`${rendement}% rendement`); }
  else if (rendement && rendement > 19) { s += 5; }

  return s;
}

function scoreThuisbatterij(specs: Record<string, any> | null, data: WizardData, adviezen: AdviesResultaat[], reden: string[]): number {
  let s = 0;
  if (!specs) return 20;
  const advies = adviezen.find(a => a.categorie === "thuisbatterij");

  // Capaciteit match (+30)
  const cap = specs.bruikbare_capaciteit_kwh || specs.capaciteit_kwh || specs.capaciteit;
  if (advies?.geschatteCapaciteit && cap) {
    const aanbevolen = parseFloat(advies.geschatteCapaciteit);
    const verschil = Math.abs(cap - aanbevolen) / aanbevolen;
    if (verschil < 0.15) { s += 30; reden.push("Ideale capaciteit"); }
    else if (verschil < 0.35) { s += 20; reden.push("Goede capaciteit"); }
    else if (verschil < 0.6) { s += 10; reden.push("Afwijkende capaciteit"); }
  } else if (cap) {
    s += 15;
  }

  // Fase compatibiliteit (+15)
  const faseProduct = specs.aantal_fases || specs.fase;
  if (data.aansluitwaarde === "3-fase" && faseProduct === 3) { s += 15; reden.push("3-fase compatibel"); }
  else if (data.aansluitwaarde === "1-fase" && (faseProduct === 1 || !faseProduct)) { s += 10; }
  else if (!data.aansluitwaarde) { s += 8; }

  // Cycli (+10)
  const cycli = specs.aantal_cycli;
  if (cycli && cycli >= 6000) { s += 10; reden.push(`${cycli} cycli`); }
  else if (cycli && cycli >= 4000) { s += 5; }

  // Noodstroom (+5)
  if (specs.noodstroom || specs.backup_functie) { s += 5; reden.push("Noodstroom"); }

  // Uitbreidbaar (+5)
  if (specs.uitbreidbaar || specs.modulair) { s += 5; reden.push("Uitbreidbaar"); }

  return s;
}

function scoreWarmtepomp(specs: Record<string, any> | null, data: WizardData, adviezen: AdviesResultaat[], reden: string[]): number {
  let s = 0;
  if (!specs) return 20;
  const advies = adviezen.find(a => a.categorie === "warmtepomp");

  // Type match (+25)
  const isFullElectric = data.isolatieNiveau === "goed" && (data.gasverbruikM3 || 1500) > 800;
  const productType = (specs.type || specs.warmtepomp_type || "").toLowerCase();
  if (isFullElectric && (productType.includes("full") || productType.includes("mono"))) {
    s += 25; reden.push("Full-electric — past bij uw situatie");
  } else if (!isFullElectric && productType.includes("hybride")) {
    s += 25; reden.push("Hybride — past bij uw isolatie");
  } else if (productType) {
    s += 10;
  } else {
    s += 12;
  }

  // Verwarmingscapaciteit (+20)
  const benodigdKw = WONINGTYPE_WARMTECAPACITEIT[data.woningType] || 8;
  const productKw = specs.verwarmingscapaciteit_kw;
  if (productKw) {
    const ratio = productKw / benodigdKw;
    if (ratio >= 0.8 && ratio <= 1.4) { s += 20; reden.push(`${productKw} kW — passend vermogen`); }
    else if (ratio >= 0.6 && ratio <= 1.8) { s += 10; }
    else { s += 3; }
  }

  // COP (+15)
  const cop = specs.cop || specs.scop;
  if (cop && cop >= 4.5) { s += 15; reden.push(`COP ${cop}`); }
  else if (cop && cop >= 4) { s += 10; }
  else if (cop && cop >= 3.5) { s += 5; }

  // Geluidsniveau (+10)
  const geluid = specs.geluidsniveau_db || specs.geluid_db;
  if (geluid && geluid < 45) { s += 10; reden.push("Zeer stil"); }
  else if (geluid && geluid < 55) { s += 5; }

  return s;
}

function scoreLaadpaal(specs: Record<string, any> | null, data: WizardData, reden: string[]): number {
  let s = 0;
  if (!specs) return 25;

  // Laadvermogen match (+25)
  const aanbevolenKw = data.aansluitwaarde === "3-fase" ? 11 : 7.4;
  const productKw = specs.laadvermogen_kw || specs.vermogen_kw;
  if (productKw) {
    if (Math.abs(productKw - aanbevolenKw) < 1) { s += 25; reden.push(`${productKw} kW — ideaal`); }
    else if (productKw >= 7) { s += 15; reden.push(`${productKw} kW`); }
    else { s += 8; }
  } else {
    s += 10;
  }

  // Smart charging (+15)
  if (specs.smart_charging || specs.slimme_functies) { s += 15; reden.push("Smart charging"); }

  // Load balancing (+10)
  if (specs.load_balancing || specs.dynamisch_vermogen) { s += 10; reden.push("Load balancing"); }

  // Solar charging (+10)
  if (specs.solar_charging || specs.zonne_energie) { s += 10; reden.push("Solar laden"); }

  // Connector type 2 (+10)
  const connector = (specs.connector || specs.aansluiting || "").toLowerCase();
  if (connector.includes("type 2") || connector.includes("type2")) { s += 10; reden.push("Type 2 connector"); }

  return s;
}

function scoreOmvormer(specs: Record<string, any> | null, data: WizardData, reden: string[]): number {
  let s = 0;
  if (!specs) return 25;

  const benodigdKw = (data.zonnepanelenWp || 5000) / 1000;
  const productKw = specs.nominaal_vermogen_kw || specs.vermogen_kw;
  if (productKw) {
    const ratio = productKw / benodigdKw;
    if (ratio >= 0.85 && ratio <= 1.3) { s += 30; reden.push(`${productKw} kW — passend`); }
    else if (ratio >= 0.6 && ratio <= 1.6) { s += 15; }
    else { s += 5; }
  }

  // Hybride (batterij-ready) (+15)
  if (specs.hybride || specs.batterij_compatibel) { s += 15; reden.push("Batterij-ready"); }

  // Monitoring (+10)
  if (specs.monitoring || specs.wifi) { s += 10; reden.push("Monitoring"); }

  // Garantie
  const garantie = specs.garantie_jaar;
  if (garantie && garantie >= 12) { s += 10; reden.push(`${garantie}j garantie`); }
  else if (garantie && garantie >= 10) { s += 5; }

  return s;
}
