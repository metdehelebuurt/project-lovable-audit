/**
 * CI-check: detecteert permissieve break-glass RLS-policies op gevoelige tabellen.
 *
 * Live-modus (PGHOST gezet): controleert de database via psql.
 * Statische modus: controleert de migratie-SQL in supabase/migrations.
 *
 * Exit 1 zodra er een permissieve policy wordt gevonden.
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const GEVOELIGE_TABELLEN = ["users", "contactpersonen"] as const;
const BREAK_GLASS_POLICY = "break_glass_superadmin_restrict";
const MIGRATIES_DIR = join(process.cwd(), "supabase", "migrations");

type Bevinding = { tabel: string; policy: string; bron: string };

const heeftDbToegang = (): boolean => Boolean(process.env.PGHOST);

function queryPermissievePolicies(): Bevinding[] {
  const lijst = GEVOELIGE_TABELLEN.map((t) => `'${t}'`).join(", ");
  const sql = `select tablename || '|' || policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (${lijst})
      and permissive = 'PERMISSIVE'
      and policyname ilike '%break_glass%'`;
  const uitvoer = execFileSync("psql", ["-At", "-c", sql], { encoding: "utf8" });
  return uitvoer
    .split("\n")
    .map((regel) => regel.trim())
    .filter(Boolean)
    .map((regel) => {
      const [tabel, policy] = regel.split("|");
      return { tabel, policy, bron: "database" };
    });
}

function leesMigraties(): { bestand: string; sql: string }[] {
  return readdirSync(MIGRATIES_DIR)
    .filter((naam) => naam.endsWith(".sql"))
    .sort()
    .map((naam) => ({ bestand: naam, sql: readFileSync(join(MIGRATIES_DIR, naam), "utf8") }));
}

function laatsteDefinitiePerTabel(): Map<string, { bestand: string; restrictief: boolean }> {
  const laatste = new Map<string, { bestand: string; restrictief: boolean }>();
  for (const { bestand, sql } of leesMigraties()) {
    for (const statement of sql.split(";")) {
      const genormaliseerd = statement.replace(/\s+/g, " ").toLowerCase();
      if (!genormaliseerd.includes("create policy")) continue;
      if (!genormaliseerd.includes(BREAK_GLASS_POLICY)) continue;
      const tabel = GEVOELIGE_TABELLEN.find((t) => genormaliseerd.includes(`on public.${t} `));
      if (!tabel) continue;
      laatste.set(tabel, { bestand, restrictief: genormaliseerd.includes("as restrictive") });
    }
  }
  return laatste;
}

function scanMigraties(): Bevinding[] {
  const bevindingen: Bevinding[] = [];
  for (const [tabel, definitie] of laatsteDefinitiePerTabel()) {
    if (definitie.restrictief) continue;
    bevindingen.push({ tabel, policy: BREAK_GLASS_POLICY, bron: definitie.bestand });
  }
  return bevindingen;
}

function rapporteer(bevindingen: Bevinding[], modus: string): void {
  if (bevindingen.length === 0) {
    console.log(`RLS-check (${modus}): geen permissieve break-glass policies gevonden.`);
    return;
  }
  console.error(`RLS-check (${modus}) GEFAALD — permissieve break-glass policies gevonden:`);
  for (const b of bevindingen) {
    console.error(`  - ${b.tabel}.${b.policy} (bron: ${b.bron})`);
  }
  console.error(
    "Een permissieve policy wordt met OR gecombineerd en omzeilt partner-scoping. " +
      "Herstel dit met AS RESTRICTIVE inclusief WITH CHECK.",
  );
  process.exit(1);
}

function main(): void {
  const statisch = scanMigraties();
  if (!heeftDbToegang()) {
    rapporteer(statisch, "statisch");
    return;
  }
  rapporteer([...statisch, ...queryPermissievePolicies()], "database + statisch");
}

main();
