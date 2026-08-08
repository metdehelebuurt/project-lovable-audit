// Bouwt en valideert een interactief tutorialplan op basis van de vraag van de
// gebruiker, de beschikbare modules en de bekende UI-ankers.

import { TOUR_ANCHORS, type TourAnchor } from "./tour-anchors.generated.ts";
import { MODULE_HELP } from "./help-knowledge.generated.ts";

export interface TourStep {
  id: string;
  route?: string;
  anchor?: string;
  textMatch?: string;
  elementType?: "button" | "link" | "input" | "any";
  titel: string;
  uitleg: string;
  wacht: "klik" | "invoer" | "lezen";
}

export interface TourPlan {
  titel: string;
  samenvatting: string;
  stappen: TourStep[];
}

const WACHT = new Set(["klik", "invoer", "lezen"]);
const TYPES = new Set(["button", "link", "input", "any"]);

export function beschikbareAnkers(rol: string, moduleKeys: string[]): TourAnchor[] {
  const toegestaan = new Set(
    MODULE_HELP.filter((m) => m.roles.includes(rol) && moduleKeys.includes(m.key)).map((m) => m.key),
  );
  return TOUR_ANCHORS.filter((a) => a.moduleKey === null || toegestaan.has(a.moduleKey));
}

export function beschikbareRoutes(rol: string, moduleKeys: string[]): string[] {
  const routes: string[] = [];
  for (const m of MODULE_HELP) {
    if (!m.roles.includes(rol) || !moduleKeys.includes(m.key)) continue;
    routes.push(m.primaryPath, ...m.extraPaths.map((p) => p.path));
  }
  return Array.from(new Set(routes));
}

function saneerStap(raw: unknown, i: number, ankerIds: Set<string>, routes: Set<string>): TourStep | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const titel = typeof o.titel === "string" ? o.titel.trim() : "";
  const uitleg = typeof o.uitleg === "string" ? o.uitleg.trim() : "";
  if (!titel || !uitleg) return null;
  const anchor = typeof o.anchor === "string" && ankerIds.has(o.anchor) ? o.anchor : undefined;
  const route = typeof o.route === "string" && routes.has(o.route) ? o.route : undefined;
  const textMatch = typeof o.textMatch === "string" && o.textMatch.trim() ? o.textMatch.trim() : undefined;
  if (!anchor && !textMatch && !route) return null;
  const wacht = typeof o.wacht === "string" && WACHT.has(o.wacht) ? (o.wacht as TourStep["wacht"]) : "lezen";
  const elementType = typeof o.elementType === "string" && TYPES.has(o.elementType)
    ? (o.elementType as TourStep["elementType"]) : "any";
  return {
    id: `stap-${i + 1}`,
    ...(route ? { route } : {}),
    ...(anchor ? { anchor } : {}),
    ...(textMatch ? { textMatch } : {}),
    elementType,
    titel,
    uitleg,
    wacht: !anchor && !textMatch ? "lezen" : wacht,
  };
}

/** Filtert verzonnen ankers/routes en stappen buiten de rechten van de gebruiker. */
export function valideerPlan(raw: unknown, rol: string, moduleKeys: string[]): TourPlan | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const ankerIds = new Set(beschikbareAnkers(rol, moduleKeys).map((a) => a.id));
  const routes = new Set(beschikbareRoutes(rol, moduleKeys));
  const ruw = Array.isArray(o.stappen) ? o.stappen : [];
  const stappen = ruw
    .map((s, i) => saneerStap(s, i, ankerIds, routes))
    .filter((s): s is TourStep => s !== null)
    .slice(0, 12)
    .map((s, i) => ({ ...s, id: `stap-${i + 1}` }));
  if (stappen.length === 0) return null;
  return {
    titel: typeof o.titel === "string" && o.titel.trim() ? o.titel.trim() : "Tutorial",
    samenvatting: typeof o.samenvatting === "string" ? o.samenvatting.trim() : "",
    stappen,
  };
}

export function buildTutorialPrompt(rol: string, moduleKeys: string[]): string {
  const ankers = beschikbareAnkers(rol, moduleKeys)
    .map((a) => `- ${a.id} | ${a.label} | route ${a.route} | ${a.omschrijving}`)
    .join("\n");
  const routes = beschikbareRoutes(rol, moduleKeys).join(", ");

  return `Je bouwt een interactieve tutorial in het platform mijnhuis.nu voor een gebruiker met rol "${rol}".
Zet de vraag om in concrete klikstappen die de gebruiker zelf uitvoert.

REGELS:
1. Nederlands, zakelijk, kort. Per stap maximaal twee zinnen uitleg.
2. Gebruik bij voorkeur een anker-id uit de lijst. Bestaat er geen anker, gebruik dan "textMatch"
   met de exacte zichtbare knop- of veldtekst.
3. Gebruik uitsluitend routes uit de lijst met toegestane routes.
4. Zet "wacht" op "klik" voor knoppen en links, "invoer" voor formuliervelden, "lezen" voor uitleg zonder actie.
5. Maximaal 8 stappen. Begin bij de navigatie en eindig bij de afrondende actie.
6. Verzin nooit een anker-id of route die niet in de lijsten staat.

BESCHIKBARE ANKERS:
${ankers || "(geen)"}

TOEGESTANE ROUTES: ${routes || "(geen)"}`;
}
