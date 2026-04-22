// =====================================================================
// HELP-ASSISTANT — thin wrapper rond auto-generated kennis
// =====================================================================
// MODULE_HELP wordt gegenereerd uit src/lib/modules.ts via
// scripts/generate-help-knowledge.ts (npm predev/prebuild).
// Bij nieuwe modules: voeg entry toe aan src/lib/modules.ts en
// het ENRICHMENT-object in het generate-script. Niet handmatig hier.
// =====================================================================

import { MODULE_HELP, type ModuleHelp } from "./help-knowledge.generated.ts";

export { MODULE_HELP };
export type { ModuleHelp };

const ALWAYS_AVAILABLE = new Set(["profiel", "feedback"]);

function renderModuleLine(m: ModuleHelp): string {
  const extra = m.extraPaths.length
    ? "\n  Extra paden: " +
      m.extraPaths
        .map((p) => `\`${p.path}\` (${p.label}${p.howTo ? ` — ${p.howTo}` : ""})`)
        .join(", ")
    : "";
  return `- **${m.label}** — pad: \`${m.primaryPath}\` — ${m.howTo}${extra}`;
}

export function buildHelpSystemPrompt(rol: string, moduleKeys: string[]): string {
  const beschikbaar = MODULE_HELP.filter(
    (m) => m.roles.includes(rol) && (moduleKeys.includes(m.key) || ALWAYS_AVAILABLE.has(m.key)),
  );

  const tabel = beschikbaar.map(renderModuleLine).join("\n");

  return `Je bent de Hulp-assistent van mijnhuis.nu, een Nederlands platform voor woningverduurzaming. Je beantwoordt vragen van gebruikers over hoe het platform werkt en waar ze functies kunnen vinden.

REGELS:
1. Antwoord altijd in het Nederlands, zakelijk en kort (max 4-6 zinnen).
2. Verwijs naar functies met een markdown-link in de vorm [Naam](/pad). Gebruik UITSLUITEND interne paden uit onderstaande tabel — verzin nooit een URL.
3. Als de gebruiker vraagt naar iets dat niet in de tabel staat (geen toegang of bestaat niet), zeg dat eerlijk en stel een alternatief voor.
4. Geef korte, concrete stappen wanneer relevant ("ga naar X, klik op Y, vul Z in").
5. Geen marketing-taal, geen uitroeptekens, geen emoji's.
6. De gebruiker heeft rol "${rol}" en heeft toegang tot de onderstaande modules.

BESCHIKBARE MODULES VOOR DEZE GEBRUIKER:
${tabel || "(geen modules beschikbaar)"}

Voorbeeld:
Vraag: "Waar kan ik een nieuwe offerte maken?"
Antwoord: "Je kunt een nieuwe offerte aanmaken via [Offertes → Nieuw](/offertes/nieuw). Vul daar de klant, productregels en het betalingstermijnplan in. Na opslaan kom je op de detailpagina waar je direct kunt ondertekenen en versturen."`;
}
