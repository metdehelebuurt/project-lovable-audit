import type { SeoMeta } from "@/lib/seo/useDocumentSeo";

const BASE_URL = "https://app.mijnhuis.nu";

interface PageSeo {
  title: string;
  description: string;
}

const PAGE_SEO: Record<string, PageSeo> = {
  "/": {
    title: "mijnhuis.nu — Een offerte in 5 minuten, door iedereen",
    description:
      "Het alles-in-één platform voor installateurs en adviseurs in de verduurzamingsbranche. Van eerste lead tot ondertekend opleverdossier.",
  },
  "/functionaliteiten": {
    title: "Functionaliteiten — mijnhuis.nu",
    description:
      "Elke functie voor je hele klantreis in één platform: leads, schouw, offertes, planning, monteursapp, oplevering en rapportage.",
  },
  "/prijzen": {
    title: "Prijzen — mijnhuis.nu",
    description:
      "Heldere prijzen, geen verrassingen. Bekijk de abonnementen van mijnhuis.nu voor installateurs en adviseurs.",
  },
  "/demo": {
    title: "Demo aanvragen — mijnhuis.nu",
    description:
      "Zie mijnhuis.nu live in 30 minuten. Vraag een demo aan en ontdek hoe het platform werkt voor jouw installatiebedrijf.",
  },
  "/proefperiode": {
    title: "Start je proefperiode — mijnhuis.nu",
    description:
      "Start vandaag met een gratis proefperiode van 14 dagen. Alle functies van mijnhuis.nu uitproberen zonder verplichtingen.",
  },
  "/kennismaking": {
    title: "Kennismaking — mijnhuis.nu",
    description:
      "Even kennismaken, zonder verkooppraat. Plan een vrijblijvend gesprek met iemand die het vak kent.",
  },
  "/contact": {
    title: "Contact — mijnhuis.nu",
    description:
      "Je spreekt iemand die het vak kent. Neem contact op met mijnhuis.nu via info@mijnhuis.nu of 085-8000272.",
  },
  "/over": {
    title: "Over ons — mijnhuis.nu",
    description:
      "Wij bouwen het platform dat we zelf wilden hebben. Lees het verhaal achter mijnhuis.nu.",
  },
  "/klantverhalen": {
    title: "Klantverhalen — mijnhuis.nu",
    description:
      "Zo ziet het eruit als de keten wél klopt. Lees hoe installatiebedrijven werken met mijnhuis.nu.",
  },
  "/affiliate": {
    title: "Word affiliate — mijnhuis.nu",
    description:
      "Verdien aan de installatiebedrijven die je toch al adviseert. Meld je aan als affiliate van mijnhuis.nu.",
  },
  "/juridisch": {
    title: "Voorwaarden, privacy & cookies — mijnhuis.nu",
    description:
      "Alle juridische documenten van mijnhuis.nu: algemene voorwaarden, privacybeleid en cookiebeleid.",
  },
  "/branches": {
    title: "Branches — mijnhuis.nu",
    description:
      "Software voor de verduurzamingsbranche, per vakgebied ingericht: zonnepanelen, thuisbatterijen, warmtepompen, isolatie en laadpalen.",
  },
  "/branches/isolatie": {
    title: "Software voor isolatiebedrijven — mijnhuis.nu",
    description:
      "Isolatie, van eerste lead tot ondertekend dossier. Schouw, offerte en oplevering volledig ingericht voor isolatiebedrijven.",
  },
  "/branches/laadpalen": {
    title: "Software voor laadpalen-installateurs — mijnhuis.nu",
    description:
      "Laadpalen, van eerste lead tot ondertekend dossier. Alles voor laadpaal-installateurs in één platform.",
  },
  "/branches/thuisbatterijen": {
    title: "Software voor thuisbatterij-installateurs — mijnhuis.nu",
    description:
      "Thuisbatterijen, van eerste lead tot ondertekend dossier. Schouw, offerte en oplevering voor batterij-installateurs.",
  },
  "/branches/warmtepompen": {
    title: "Software voor warmtepomp-installateurs — mijnhuis.nu",
    description:
      "Warmtepompen, van eerste lead tot ondertekend dossier. Inregelen en opleveren volgens ISSO, alles in één platform.",
  },
  "/branches/zonnepanelen": {
    title: "Software voor zonnepanelen-installateurs — mijnhuis.nu",
    description:
      "Zonnepanelen, van eerste lead tot ondertekend dossier. Dakanalyse, offerte en oplevering in één platform.",
  },
  "/oplossingen/schouw": {
    title: "Digitale schouw — mijnhuis.nu",
    description:
      "In één bezoek alles goed vastgelegd, volgens de norm. Digitale schouw met foto's, checklist en metingen.",
  },
  "/oplossingen/offerte": {
    title: "Offerte software — mijnhuis.nu",
    description:
      "Een professionele offerte in vijf minuten, door iedereen op kantoor. Met digitale handtekening en klantportaal.",
  },
  "/oplossingen/lead": {
    title: "Leadopvolging — mijnhuis.nu",
    description:
      "Elke aanvraag opgevolgd, geen enkele lead die blijft liggen. Volledige leadopvolging voor installatiebedrijven.",
  },
  "/oplossingen/planning": {
    title: "Planning software — mijnhuis.nu",
    description:
      "Je weekplanning staat in minuten, en elke wijziging staat direct op de telefoon van de monteur.",
  },
  "/oplossingen/monteursapp": {
    title: "Monteursapp — mijnhuis.nu",
    description:
      "Alles wat de monteur nodig heeft, op zijn telefoon. Ook zonder bereik. Werkbons, foto's en checklists.",
  },
  "/oplossingen/oplevering": {
    title: "Digitale oplevering — mijnhuis.nu",
    description:
      "Het opleverdossier is compleet vóór de bus wegrijdt. Digitale oplevering met handtekening en foto's.",
  },
  "/oplossingen/klantportaal": {
    title: "Klantportaal — mijnhuis.nu",
    description:
      "De klant volgt het zelf, jij houdt je telefoon vrij. Offertes, planning en opleverdossier in één portaal.",
  },
  "/oplossingen/rapportage": {
    title: "Rapportage & marge — mijnhuis.nu",
    description:
      "Zie je marge terwijl het project loopt, niet pas bij de jaarrekening. Rapportages voor installatiebedrijven.",
  },
  "/kennisbank": {
    title: "Kennisbank — mijnhuis.nu",
    description:
      "Vakkennis over subsidies, normen en opleveren voor installateurs en adviseurs in de verduurzamingsbranche.",
  },
  "/kennisbank/load-balancing-laadpalen": {
    title: "Load balancing bij laadpalen — mijnhuis.nu",
    description:
      "Wat je op de schouw checkt bij load balancing voor laadpalen. Praktische uitleg voor installateurs.",
  },
  "/kennisbank/nen-1010-veelgemaakte-fouten": {
    title: "NEN 1010: de tien meestgemaakte fouten — mijnhuis.nu",
    description:
      "NEN 1010 in de praktijk: de tien meestgemaakte fouten bij laagspanningsinstallaties en hoe je ze voorkomt.",
  },
  "/kennisbank/offerte-in-vijf-minuten": {
    title: "Een offerte in vijf minuten — mijnhuis.nu",
    description:
      "In vijf minuten een offerte die de klant meteen tekent. Zo richt je je offerteproces slim in.",
  },
  "/kennisbank/overstappen-in-drie-weken": {
    title: "Overstappen naar mijnhuis.nu in drie weken",
    description:
      "Overstappen naar mijnhuis.nu in drie weken. Zo verloopt de migratie van je huidige software, stap voor stap.",
  },
  "/kennisbank/subsidies-2026-zon-pv": {
    title: "Subsidies 2026: wat verandert er voor zon-PV? — mijnhuis.nu",
    description:
      "Subsidies 2026: wat verandert er voor zonnepanelen en thuisbatterijen? Een overzicht voor installateurs.",
  },
  "/kennisbank/warmtepomp-inregelen-opleveren": {
    title: "Warmtepomp inregelen en opleveren volgens ISSO — mijnhuis.nu",
    description:
      "Warmtepomp inregelen en opleveren volgens ISSO. Checklist en werkwijze voor installateurs.",
  },
};

export function getPageSeo(pathname: string): SeoMeta {
  const page = PAGE_SEO[pathname];
  const canonical = `${BASE_URL}${pathname === "/" ? "/" : pathname}`;
  const base: SeoMeta = page
    ? { title: page.title, description: page.description }
    : {
        title: "mijnhuis.nu — Duurzame Woningverbeteringen",
        description:
          "Platform voor duurzame woningverbeteringen. Beheer schouwen, offertes en installaties.",
      };
  return { ...base, canonical, type: "website" };
}
