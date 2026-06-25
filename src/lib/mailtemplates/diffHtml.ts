/** Eenvoudige tekst-diff op blok-niveau (paragraaf/regel). Geen externe dependency. */
export function splitBlokken(input: string): string[] {
  if (!input) return [];
  // Behandel HTML-tags als blok-grenzen.
  const ruw = input
    .replace(/<\s*(p|div|h[1-6]|li|br|hr)[^>]*>/gi, "\n")
    .replace(/<\/[^>]+>/g, "")
    .replace(/<[^>]+>/g, "");
  return ruw
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export type DiffBlok = { type: "same" | "removed" | "added"; tekst: string };

export function diffBlokken(oud: string, nieuw: string): DiffBlok[] {
  const o = splitBlokken(oud);
  const n = splitBlokken(nieuw);
  const result: DiffBlok[] = [];
  const nSet = new Set(n);
  const oSet = new Set(o);

  for (const blok of o) {
    if (nSet.has(blok)) result.push({ type: "same", tekst: blok });
    else result.push({ type: "removed", tekst: blok });
  }
  for (const blok of n) {
    if (!oSet.has(blok)) result.push({ type: "added", tekst: blok });
  }
  return result;
}