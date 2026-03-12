import type { WizardData, AdviesResultaat, ProductMatch } from "./types";
import type { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["producten"]["Row"];

const STROOMPRIJS = 0.40;
const TERUGLEVER = 0.07;
const GASPRIJS = 1.50;
const DYNAMISCH_BONUS = 0.15;

export function berekenAdviezen(data: WizardData): AdviesResultaat[] {
  const adviezen: AdviesResultaat[] = [];

  // Zonnepanelen advies
  if (data.interesseCategorieen.includes("zonnepanelen") && !data.heeftZonnepanelen) {
    const verbruik = data.jaarverbruikKwh || 3500;
    const geschatWp = Math.ceil(verbruik / 0.85) * 1000;
    const geschatteAantalPanelen = Math.ceil(geschatWp / 420);
    const jaarOpwekking = geschatWp * 0.85 / 1000;
    const besparing = Math.round(jaarOpwekking * STROOMPRIJS * 0.7);
    adviezen.push({
      categorie: "zonnepanelen",
      aanbevolen: true,
      titel: "Zonnepanelen",
      toelichting: `Op basis van uw verbruik van ${verbruik} kWh adviseren wij ca. ${geschatteAantalPanelen} panelen (${geschatWp} Wp). Geschatte opbrengst: ${Math.round(jaarOpwekking)} kWh/jaar.`,
      geschatteCapaciteit: `${geschatWp} Wp (${geschatteAantalPanelen} panelen)`,
      geschatteBesparing: besparing,
      geschatteInvestering: `€ ${geschatteAantalPanelen * 300} - € ${geschatteAantalPanelen * 450}`,
      terugverdientijd: `${Math.round(geschatteAantalPanelen * 375 / besparing)} jaar`,
    });
  }

  // Thuisbatterij advies
  if (data.interesseCategorieen.includes("thuisbatterij")) {
    const wp = data.heeftZonnepanelen ? (data.zonnepanelenWp || 5000) : 6000;
    const jaarOpwekking = wp * 0.85 / 1000;
    const dagOverschot = (jaarOpwekking * 0.7) / 365;
    const capaciteit = Math.min(Math.max(Math.ceil(dagOverschot), 3), 20);
    const extraZelf = jaarOpwekking * 0.4 * 0.9;
    let besparing = Math.round(extraZelf * (STROOMPRIJS - TERUGLEVER));
    if (data.contractType === "dynamisch") besparing = Math.round(besparing * (1 + DYNAMISCH_BONUS));
    const investering = capaciteit * 500;
    adviezen.push({
      categorie: "thuisbatterij",
      aanbevolen: data.heeftZonnepanelen || data.interesseCategorieen.includes("zonnepanelen"),
      titel: "Thuisbatterij",
      toelichting: `Een batterij van ${capaciteit} kWh maximaliseert uw zelfconsumptie. ${data.contractType === "dynamisch" ? "Met uw dynamisch contract profiteert u extra van slim laden/ontladen." : ""}`,
      geschatteCapaciteit: `${capaciteit} kWh`,
      geschatteBesparing: besparing,
      geschatteInvestering: `€ ${investering}`,
      terugverdientijd: besparing > 0 ? `${Math.round(investering / besparing * 10) / 10} jaar` : "n.v.t.",
    });
  }

  // Warmtepomp advies
  if (data.interesseCategorieen.includes("warmtepomp") && !data.heeftWarmtepomp) {
    const gas = data.gasverbruikM3 || 1500;
    const gasBesparing = Math.round(gas * 0.75 * GASPRIJS);
    const extraStroom = Math.round(gas * 0.75 * 8.8 / 4); // COP 4
    const netBesparing = gasBesparing - Math.round(extraStroom * STROOMPRIJS);
    adviezen.push({
      categorie: "warmtepomp",
      aanbevolen: gas > 1000,
      titel: "Warmtepomp",
      toelichting: `Bij een gasverbruik van ${gas} m³/jaar kan een warmtepomp tot 75% hiervan vervangen. ${gas < 800 ? "Uw gasverbruik is relatief laag, de terugverdientijd kan lang zijn." : ""}`,
      geschatteCapaciteit: gas > 1200 ? "Hybride of full-electric" : "Hybride warmtepomp",
      geschatteBesparing: netBesparing,
      geschatteInvestering: gas > 1200 ? "€ 6.000 - € 15.000" : "€ 4.000 - € 8.000",
      terugverdientijd: netBesparing > 0 ? `${Math.round(8000 / netBesparing)} - ${Math.round(12000 / netBesparing)} jaar` : "n.v.t.",
    });
  }

  // Laadpaal advies
  if (data.interesseCategorieen.includes("laadpaal") && !data.heeftLaadpaal) {
    adviezen.push({
      categorie: "laadpaal",
      aanbevolen: true,
      titel: "Laadpaal",
      toelichting: `Een thuislaadpaal bespaart gemiddeld 50% ten opzichte van publiek laden. ${data.heeftZonnepanelen || data.interesseCategorieen.includes("zonnepanelen") ? "In combinatie met zonnepanelen laadt u grotendeels gratis." : ""}`,
      geschatteCapaciteit: "11 kW (3-fase)",
      geschatteBesparing: 600,
      geschatteInvestering: "€ 1.200 - € 2.500",
      terugverdientijd: "2 - 4 jaar",
    });
  }

  // Omvormer advies
  if (data.interesseCategorieen.includes("omvormer")) {
    adviezen.push({
      categorie: "omvormer",
      aanbevolen: data.heeftZonnepanelen && (data.zonnepanelenLeeftijd || 0) > 10,
      titel: "Omvormer",
      toelichting: data.heeftZonnepanelen && (data.zonnepanelenLeeftijd || 0) > 10
        ? "Uw omvormer is ouder dan 10 jaar. Een nieuwe omvormer kan de opbrengst met 5-15% verhogen."
        : "Een moderne omvormer maximaliseert de opbrengst van uw zonnepanelen.",
      geschatteCapaciteit: `${Math.ceil((data.zonnepanelenWp || 5000) / 1000)} kW`,
    });
  }

  return adviezen;
}

export function matchProducten(
  producten: Product[],
  data: WizardData,
  adviezen: AdviesResultaat[]
): ProductMatch[] {
  const categorieenInAdvies = adviezen.map(a => a.categorie);
  const relevantProducten = producten.filter(p => categorieenInAdvies.includes(p.categorie));

  return relevantProducten.map(p => {
    let score = 50;
    let reden: string[] = [];

    // Budget match
    const prijs = p.prijs_excl_btw * 1.21;
    if (data.budgetMax && prijs <= data.budgetMax) {
      score += 20;
      reden.push("Past binnen budget");
    } else if (data.budgetMax && prijs <= data.budgetMax * 1.2) {
      score += 5;
      reden.push("Net boven budget");
    } else if (data.budgetMax && prijs > data.budgetMax * 1.2) {
      score -= 15;
      reden.push("Boven budget");
    }

    // Merkvoorkeur
    if (data.merkvoorkeur && p.merk?.toLowerCase().includes(data.merkvoorkeur.toLowerCase())) {
      score += 15;
      reden.push("Merkvoorkeur match");
    }

    // Garantie bonus
    if (p.garantie_jaren && p.garantie_jaren >= 10) {
      score += 10;
      reden.push(`${p.garantie_jaren} jaar garantie`);
    }

    // Capaciteit match voor batterij
    if (p.categorie === "thuisbatterij") {
      const advies = adviezen.find(a => a.categorie === "thuisbatterij");
      const specs = p.specs as Record<string, any> | null;
      const capaciteit = specs?.capaciteit_kwh || specs?.capaciteit;
      if (advies?.geschatteCapaciteit && capaciteit) {
        const aanbevolen = parseFloat(advies.geschatteCapaciteit);
        const verschil = Math.abs(capaciteit - aanbevolen) / aanbevolen;
        if (verschil < 0.2) { score += 15; reden.push("Ideale capaciteit"); }
        else if (verschil < 0.5) { score += 5; reden.push("Acceptabele capaciteit"); }
      }
    }

    return {
      id: p.id,
      naam: p.naam,
      merk: p.merk,
      model: p.model,
      categorie: p.categorie,
      prijs_excl_btw: p.prijs_excl_btw,
      btw_percentage: p.btw_percentage,
      specs: p.specs as Record<string, any> | null,
      garantie_jaren: p.garantie_jaren,
      geschiktheidScore: Math.min(100, Math.max(0, score)),
      scoreReden: reden.join(" • ") || "Standaard product",
    };
  }).sort((a, b) => b.geschiktheidScore - a.geschiktheidScore);
}
