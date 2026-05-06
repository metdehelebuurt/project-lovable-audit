/**
 * Genereert een URL-veilige slug uit een willekeurige string.
 * Verwijdert diakrieten, vervangt spaties/symbolen door koppeltekens.
 * Max 80 karakters om DB-index lengte beperkt te houden.
 */
export function maakSlug(input: string): string {
  if (!input) return "";
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Plakt -2, -3, ... aan een slug om uniek te maken binnen een set. */
export function uniekeSlug(basis: string, bestaande: Set<string>): string {
  const slug = maakSlug(basis) || "product";
  if (!bestaande.has(slug)) return slug;
  let n = 2;
  while (bestaande.has(`${slug}-${n}`)) n++;
  return `${slug}-${n}`;
}