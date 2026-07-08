/**
 * Zet een "wide" bedrijvenlijst (één rij per bedrijf, met kolommen als
 * "Persoon 1 naam", "Persoon 1 e-mail", …) om in een "flat" lijst met één
 * rij per contactpersoon. Overige bedrijfsvelden worden gedupliceerd.
 *
 * Wanneer er geen persoons-kolommen worden gedetecteerd, wordt de lijst
 * ongewijzigd teruggegeven.
 */
export function expandWideRows(
  rijen: Record<string, unknown>[],
): Record<string, unknown>[] {
  if (rijen.length === 0) return rijen;
  const kolommen = Object.keys(rijen[0]);
  const persoonKolommen = kolommen.filter((k) => /persoon\s*\d+/i.test(k));
  if (persoonKolommen.length === 0) return rijen;

  const bedrijfsKolommen = kolommen.filter((k) => !/persoon\s*\d+/i.test(k));
  const suffixen = new Set<string>();
  for (const k of persoonKolommen) {
    const m = k.match(/persoon\s*(\d+)\s*(.*)$/i);
    if (m) suffixen.add(m[2].trim().toLowerCase());
  }
  const nummers = Array.from(
    new Set(
      persoonKolommen
        .map((k) => k.match(/persoon\s*(\d+)/i)?.[1])
        .filter((n): n is string => !!n),
    ),
  ).sort((a, b) => Number(a) - Number(b));

  const nieuw: Record<string, unknown>[] = [];
  for (const rij of rijen) {
    const basis: Record<string, unknown> = {};
    for (const k of bedrijfsKolommen) basis[k] = rij[k];

    let toegevoegd = 0;
    for (const nr of nummers) {
      const contact: Record<string, unknown> = {};
      let heeftWaarde = false;
      for (const suf of suffixen) {
        // Vind de matchende kolom voor dit persoons-nummer en suffix.
        const kol = persoonKolommen.find(
          (k) => new RegExp(`persoon\\s*${nr}\\s*${suf}$`, "i").test(k),
        );
        if (!kol) continue;
        const val = rij[kol];
        const label = suf.length > 0 ? `Persoon ${suf}` : "Persoon naam";
        contact[label] = val;
        if (val !== null && val !== undefined && String(val).trim() !== "") {
          heeftWaarde = true;
        }
      }
      if (heeftWaarde) {
        nieuw.push({ ...basis, ...contact });
        toegevoegd++;
      }
    }
    if (toegevoegd === 0) nieuw.push(basis);
  }
  return nieuw;
}