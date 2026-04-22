/**
 * Codegen: leest src/lib/modules.ts en schrijft een platte module-lijst die
 * de Supabase Edge Function `help-assistant` kan importeren. Edge Functions
 * mogen niet uit src/ importeren, dus we genereren dit bestand bij elke
 * build/dev-start.
 *
 * Run handmatig:  npx tsx scripts/generate-help-knowledge.ts
 * Auto via `predev` en `prebuild` in package.json.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SRC = resolve(ROOT, "src/lib/modules.ts");
const DEST = resolve(ROOT, "supabase/functions/help-assistant/help-knowledge.generated.ts");

interface ModuleHelpEntry {
  key: string;
  label: string;
  groep: string;
  roles: string[];
  primaryPath: string;
  extraPaths: { path: string; label: string; howTo?: string }[];
  howTo: string;
}

/** Per-module verrijking: route + how-to + extra deeplinks. Eén bron van waarheid. */
const ENRICHMENT: Record<string, { primaryPath: string; howTo: string; extraPaths?: { path: string; label: string; howTo?: string }[] }> = {
  leads: { primaryPath: "/leads", howTo: "Beheer leads in Kanban of lijst met afspraken, notities en pipeline-status.", extraPaths: [{ path: "/leads/nieuw", label: "Nieuwe lead" }] },
  klanten: { primaryPath: "/klanten", howTo: "Beheer klanten met offertes, installaties en communicatiehistorie." },
  berichten: { primaryPath: "/berichten", howTo: "Centrale inbox voor e-mailcommunicatie via gekoppelde Gmail/Outlook-accounts." },
  schouwen: {
    primaryPath: "/schouwen",
    howTo: "Plan en voer schouwen uit met dakvlakken, meterkast-info, foto's en digitale handtekening.",
    extraPaths: [
      { path: "/schouwen/snelstart", label: "Snelstart schouw" },
      { path: "/schouwen/nieuw", label: "Nieuwe schouw" },
    ],
  },
  offertes: {
    primaryPath: "/offertes",
    howTo: "Beheer offertes; op de detailpagina kun je direct ondertekenen en versturen.",
    extraPaths: [{ path: "/offertes/nieuw", label: "Nieuwe offerte", howTo: "Kies klant, voeg productregels toe, selecteer betalingstermijnplan." }],
  },
  opdrachten: { primaryPath: "/opdrachten", howTo: "Geaccepteerde offertes worden opdrachten. Plan levering, voorraad en orderbevestiging." },
  installaties: {
    primaryPath: "/installaties",
    howTo: "Plan installaties, wijs monteurs toe en volg de status.",
    extraPaths: [{ path: "/installaties/nieuw", label: "Nieuwe installatie" }],
  },
  opleveringen: {
    primaryPath: "/opleveringen",
    howTo: "NEN1010-opleverrapport via 7-staps wizard met dubbele digitale handtekening.",
    extraPaths: [{ path: "/opleveren/nieuw", label: "Nieuw opleverrapport" }],
  },
  helpdesk: {
    primaryPath: "/helpdesk",
    howTo: "Support-tickets met SLA, prioriteiten en kennisbank.",
    extraPaths: [
      { path: "/helpdesk/nieuw", label: "Nieuw ticket" },
      { path: "/helpdesk/kennisbank", label: "Kennisbank" },
    ],
  },
  planning: { primaryPath: "/planning", howTo: "Interactieve kalender voor schouwen, installaties en afspraken." },
  producten: { primaryPath: "/producten", howTo: "Productcatalogus met specificaties, datasheets en AI-import." },
  voorraad: { primaryPath: "/voorraad", howTo: "Voorraadoverzicht per product met mutaties, reserveringen en correcties." },
  inkoop_ontvangsten: { primaryPath: "/voorraad", howTo: "Registreer ontvangsten van inkooporders. Voorraad wordt automatisch bijgeboekt." },
  retouren: { primaryPath: "/retouren", howTo: "Retouraanvragen (RMA) richting leverancier met statusopvolging." },
  tools: { primaryPath: "/tools", howTo: "Verzameling tools: thuisbatterij-selector, energieadvies en webtools." },
  energieadvies: { primaryPath: "/tools/energieadvies", howTo: "Wizard voor woningverduurzamingsadvies met scoring en PDF-rapport." },
  documenten: { primaryPath: "/documenten", howTo: "Centrale documentenbibliotheek per entiteit (klant, offerte, installatie)." },
  analytics: { primaryPath: "/analytics", howTo: "KPI-dashboards voor leads, conversie, omzet en operationele performance." },
  financieel_verkoop: {
    primaryPath: "/financieel",
    howTo: "Verkoopfacturen met termijnen, voorschotten, e-mail en Mollie-betaallinks.",
    extraPaths: [{ path: "/financieel/nieuw", label: "Nieuwe factuur" }],
  },
  financieel_inkoop: { primaryPath: "/financieel", howTo: "Inkoopfacturen en inkooporders, gekoppeld aan voorraadmutaties." },
  financieel_pakbonnen: { primaryPath: "/financieel", howTo: "Genereer pakbonnen voor leveringen." },
  financieel_btw: { primaryPath: "/financieel", howTo: "BTW-overzicht per kwartaal voor de aangifte." },
  financieel_openstaand: { primaryPath: "/financieel", howTo: "Debiteuren- en crediteurenoverzicht met aanmaningen." },
  leveranciers: { primaryPath: "/leveranciers", howTo: "Beheer leveranciers en prijslijsten; voorkeursleverancier per product." },
  partners: { primaryPath: "/partners", howTo: "Beheer alle partners op het platform (superadmin)." },
  adviseurs: { primaryPath: "/adviseurs", howTo: "Beheer adviseurs binnen je organisatie." },
  gebruikers: { primaryPath: "/gebruikers", howTo: "Nodig gebruikers uit, beheer rollen, permissies en module-toegang." },
  instellingen: { primaryPath: "/instellingen", howTo: "Organisatie-instellingen: huisstijl, e-mail, betalingsvoorwaarden, nummerreeksen, rolmatrix." },
  affiliate_beheer: { primaryPath: "/affiliate-beheer", howTo: "Beheer affiliate-programma, kortingen en commissies (superadmin)." },
  admin_abonnementen: { primaryPath: "/admin/abonnementen", howTo: "Beheer abonnementsplannen, addons en facturatie (superadmin)." },
};

/** Extra modules die niet in src/lib/modules.ts staan. */
const EXTRA_ENTRIES: ModuleHelpEntry[] = [
  { key: "profiel", label: "Profiel", groep: "Account", roles: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur", "affiliate"], primaryPath: "/profiel", extraPaths: [], howTo: "Persoonlijk profiel: naam, foto, handtekening, e-mailkoppeling en wachtwoord." },
  { key: "feedback", label: "Feedback", groep: "Account", roles: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"], primaryPath: "/feedback", extraPaths: [{ path: "/feedback/nieuw", label: "Nieuwe feedback" }], howTo: "Geef feedback of dien een functieverzoek in via een korte AI-wizard." },
  { key: "affiliates", label: "Affiliates", groep: "Account", roles: ["superadmin", "affiliate"], primaryPath: "/affiliates", extraPaths: [], howTo: "Affiliate-dashboard met referral-links, kortingscodes en commissies." },
];

interface RawModule { key: string; label: string; groep: string; defaultRoles: string[] }

function parseModulesFile(): RawModule[] {
  const src = readFileSync(SRC, "utf-8");
  const arrMatch = src.match(/export const MODULES:[^=]*=\s*\[([\s\S]*?)\];/);
  if (!arrMatch) throw new Error("Kon MODULES array niet vinden in src/lib/modules.ts");
  const body = arrMatch[1];
  const entries: RawModule[] = [];
  const re = /\{\s*key:\s*"([^"]+)",\s*label:\s*"([^"]+)",\s*groep:\s*"([^"]+)",\s*defaultRoles:\s*\[([^\]]+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const roles = m[4].split(",").map((s) => s.trim().replace(/^"|"$/g, "")).filter(Boolean);
    entries.push({ key: m[1], label: m[2], groep: m[3], defaultRoles: roles });
  }
  if (entries.length === 0) throw new Error("Geen MODULES-entries geparsed");
  return entries;
}

function build(): ModuleHelpEntry[] {
  const raw = parseModulesFile();
  const result: ModuleHelpEntry[] = raw.map((mod) => {
    const enr = ENRICHMENT[mod.key];
    if (!enr) console.warn(`[help-knowledge] geen enrichment voor module "${mod.key}"`);
    return {
      key: mod.key,
      label: mod.label,
      groep: mod.groep,
      roles: mod.defaultRoles,
      primaryPath: enr?.primaryPath ?? `/${mod.key}`,
      extraPaths: enr?.extraPaths ?? [],
      howTo: enr?.howTo ?? `Module ${mod.label}.`,
    };
  });
  return [...result, ...EXTRA_ENTRIES];
}

function emit(entries: ModuleHelpEntry[]): void {
  const header = `// =====================================================================
// AUTO-GENERATED — DO NOT EDIT
// Bron: src/lib/modules.ts + scripts/generate-help-knowledge.ts
// Regenereer met: npx tsx scripts/generate-help-knowledge.ts
// =====================================================================

export interface ModuleHelp {
  key: string;
  label: string;
  groep: string;
  roles: string[];
  primaryPath: string;
  extraPaths: { path: string; label: string; howTo?: string }[];
  howTo: string;
}

export const MODULE_HELP: ModuleHelp[] = ${JSON.stringify(entries, null, 2)};
`;
  mkdirSync(dirname(DEST), { recursive: true });
  writeFileSync(DEST, header, "utf-8");
  console.log(`[help-knowledge] ${entries.length} entries → ${DEST}`);
}

emit(build());