/**
 * Codegen: leest src/lib/tour/anchors.ts en schrijft de ankerlijst weg voor de
 * Edge Function `help-assistant` (die niet uit src/ mag importeren).
 *
 * Run handmatig:  npx tsx scripts/generate-tour-knowledge.ts
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SRC = resolve(ROOT, "src/lib/tour/anchors.ts");
const DEST = resolve(ROOT, "supabase/functions/help-assistant/tour-anchors.generated.ts");

const mod = (await import(pathToFileURL(SRC).href)) as {
  TOUR_ANCHORS: { id: string; label: string; route: string; moduleKey: string | null; omschrijving: string }[];
};

const ids = new Set<string>();
for (const anker of mod.TOUR_ANCHORS) {
  if (ids.has(anker.id)) throw new Error(`Dubbel tutorial-anker: ${anker.id}`);
  ids.add(anker.id);
}

const body = `// =====================================================================
// AUTO-GENERATED — DO NOT EDIT
// Bron: src/lib/tour/anchors.ts + scripts/generate-tour-knowledge.ts
// =====================================================================

export interface TourAnchor {
  id: string;
  label: string;
  route: string;
  moduleKey: string | null;
  omschrijving: string;
}

export const TOUR_ANCHORS: TourAnchor[] = ${JSON.stringify(mod.TOUR_ANCHORS, null, 2)};
`;

mkdirSync(dirname(DEST), { recursive: true });
writeFileSync(DEST, body, "utf8");
console.log(`tour-anchors.generated.ts geschreven (${mod.TOUR_ANCHORS.length} ankers)`);
