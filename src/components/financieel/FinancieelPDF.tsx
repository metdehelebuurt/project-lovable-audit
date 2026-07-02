import { Fragment } from "react";
import { formatCurrency, type OfferteRegel, regelSubtotaal } from "@/types/offerte";
import { useProductMetaMap } from "@/hooks/producten/useProductMetaMap";

interface Props {
  doc: {
    documentnummer: string;
    type: string;
    status: string;
    factuurdatum: string;
    vervaldatum?: string;
    regels: OfferteRegel[];
    subtotaal: number;
    btw_bedrag: number;
    totaal_bedrag: number;
    korting_totaal: number;
    notities?: string;
    betalingstermijn_dagen: number;
    leveringsdatum?: string;
    referentie_documentnummer?: string;
    factuur_subtype?: "regulier" | "voorschot" | "eindafrekening";
    termijn_volgnummer?: number | null;
    termijn_totaal?: number | null;
    termijn_percentage?: number | null;
    offerte_nummer?: string;
  };
  klant?: {
    voornaam?: string;
    achternaam?: string;
    bedrijfsnaam?: string;
    email?: string;
    adres?: string;
    postcode?: string;
    plaats?: string;
    telefoon?: string;
    btw_nummer?: string;
    kvk_nummer?: string;
  } | null;
  leverancier?: {
    naam?: string;
    email?: string;
    adres?: string;
    postcode?: string;
    plaats?: string;
    btw_nummer?: string;
    kvk_nummer?: string;
    telefoon?: string;
  } | null;
  partner?: {
    naam?: string;
    adres?: string;
    postcode?: string;
    plaats?: string;
    email?: string;
    telefoonnummer?: string;
    kvk?: string;
    btw?: string;
    iban?: string;
    iban_tnv?: string;
    bic?: string;
    logo_url?: string;
    primaire_kleur?: string;
  } | null;
  installatie?: {
    consument_naam?: string;
    geplande_startdatum?: string;
    geplande_einddatum?: string;
    status?: string;
  } | null;
}

const typeLabels: Record<string, string> = {
  verkoopfactuur: "FACTUUR",
  creditnota: "CREDITNOTA",
  inkoopfactuur: "INKOOPFACTUUR",
  inkooporder: "INKOOPORDER",
  pakbon: "PAKBON",
};

function getDocLabel(doc: Props["doc"]): string {
  if (doc.type === "verkoopfactuur") {
    if (doc.factuur_subtype === "voorschot") return "VOORSCHOTFACTUUR";
    if (doc.factuur_subtype === "eindafrekening") return "EINDAFREKENING";
  }
  return typeLabels[doc.type] || "DOCUMENT";
}

const isPakbon = (t: string) => t === "pakbon";
const isInkoopOrder = (t: string) => t === "inkooporder";
const showPricing = (t: string) => !isPakbon(t);

/** Group VAT by percentage for legal compliance (Art. 35a Wet OB) */
function buildBtwOverzicht(regels: OfferteRegel[]) {
  const map: Record<number, { grondslag: number; bedrag: number }> = {};
  for (const r of regels) {
    const pct = r.btw_percentage ?? 21;
    if (!map[pct]) map[pct] = { grondslag: 0, bedrag: 0 };
    const sub = regelSubtotaal(r);
    map[pct].grondslag += sub;
    map[pct].bedrag += sub * (pct / 100);
  }
  return Object.entries(map)
    .map(([pct, v]) => ({ percentage: Number(pct), ...v }))
    .sort((a, b) => b.percentage - a.percentage);
}

/** Splits regels in 'positief' (originele werk) en 'negatief' (verrekende voorschotten). */
function splitVerrekening(regels: OfferteRegel[]) {
  const positief = regels.filter((r) => regelSubtotaal(r) >= 0);
  const negatief = regels.filter((r) => regelSubtotaal(r) < 0);
  return { positief, negatief };
}

export function FinancieelPDF({ doc, klant, leverancier, partner, installatie }: Props) {
  const regels = doc.regels || [];
  const isKlant = !!klant;
  const relatie = klant
    ? { naam: klant.bedrijfsnaam || `${klant.voornaam || ""} ${klant.achternaam || ""}`.trim(), ...klant }
    : leverancier
    ? { naam: leverancier.naam || "", ...leverancier }
    : null;

  const primaryColor = partner?.primaire_kleur || "#1a56db";
  const productIds = Array.from(new Set(regels.map((r) => r.product_id).filter((id): id is string => !!id)));
  const { data: metaMap = {} } = useProductMetaMap(productIds);
  const priceCols = isPakbon(doc.type) ? 0 : 3;
  const totalCols = 2 + priceCols;
  const brutoTotaal = regels.reduce((s, r) => s + r.aantal * r.prijs_per_stuk, 0);
  const nettoTotaal = regels.reduce((s, r) => s + regelSubtotaal(r), 0);
  const kortingTotaal = brutoTotaal - nettoTotaal;
  const btwOverzicht = buildBtwOverzicht(regels);
  const hasMultipleBtwRates = btwOverzicht.length > 1;
  const hasZeroBtw = btwOverzicht.some((b) => b.percentage === 0);

  // Eindafrekening: splits werk vs verrekende voorschotten voor het verreken-overzicht.
  const isEindafrekening = doc.factuur_subtype === "eindafrekening";
  const { positief: werkRegels, negatief: verrekenRegels } = isEindafrekening
    ? splitVerrekening(regels)
    : { positief: regels, negatief: [] as OfferteRegel[] };
  const totaalWerkExclBtw = werkRegels.reduce((s, r) => s + regelSubtotaal(r), 0);
  const verrekendExclBtw = Math.abs(verrekenRegels.reduce((s, r) => s + regelSubtotaal(r), 0));
  const verrekendInclBtw = Math.abs(
    verrekenRegels.reduce((s, r) => {
      const sub = regelSubtotaal(r);
      return s + sub * (1 + (r.btw_percentage ?? 21) / 100);
    }, 0),
  );

  return (
    <div
      className="bg-white text-black font-sans print:p-0 relative"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "20mm 20mm 30mm 20mm",
        fontSize: "9pt",
        lineHeight: "1.4",
        boxSizing: "border-box",
        margin: "0 auto",
      }}
    >
      {/* === HEADER === */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15mm" }}>
        <div>
          {partner?.logo_url ? (
            <img src={partner.logo_url} alt="Logo" style={{ height: "40px", marginBottom: "8px", objectFit: "contain" }} />
          ) : (
            <div style={{ fontSize: "16pt", fontWeight: 700, color: primaryColor, marginBottom: "8px" }}>
              {partner?.naam || "Bedrijfsnaam"}
            </div>
          )}
          <div style={{ fontSize: "7.5pt", color: "#6b7280", lineHeight: "1.5" }}>
            {partner?.adres && <div>{partner.adres}</div>}
            {(partner?.postcode || partner?.plaats) && (
              <div>{[partner.postcode, partner.plaats].filter(Boolean).join(" ")}</div>
            )}
            {partner?.telefoonnummer && <div>Tel: {partner.telefoonnummer}</div>}
            {partner?.email && <div>{partner.email}</div>}
            {partner?.kvk && <div>KvK: {partner.kvk}</div>}
            {partner?.btw && <div>BTW-nr: {partner.btw}</div>}
            {partner?.iban && <div>IBAN: {partner.iban}</div>}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "20pt", fontWeight: 700, color: primaryColor, letterSpacing: "0" }}>
            {getDocLabel(doc)}
          </div>
          <div style={{ fontSize: "11pt", fontFamily: "monospace", marginTop: "4px", color: "#374151" }}>
            {doc.documentnummer}
          </div>
          {doc.factuur_subtype === "voorschot" && doc.termijn_volgnummer && doc.termijn_totaal && (
            <div style={{ fontSize: "8pt", color: "#6b7280", marginTop: "2px" }}>
              Termijn {doc.termijn_volgnummer} van {doc.termijn_totaal}
              {doc.termijn_percentage ? ` (${doc.termijn_percentage}%)` : ""}
            </div>
          )}
          {doc.offerte_nummer && (doc.factuur_subtype === "voorschot" || doc.factuur_subtype === "eindafrekening") && (
            <div style={{ fontSize: "8pt", color: "#6b7280", marginTop: "2px" }}>
              Bij offerte: {doc.offerte_nummer}
            </div>
          )}
          {/* Creditnota: referentie naar origineel (Art. 35b Wet OB) */}
          {doc.type === "creditnota" && doc.referentie_documentnummer && (
            <div style={{ fontSize: "8pt", color: "#6b7280", marginTop: "2px" }}>
              Ref: {doc.referentie_documentnummer}
            </div>
          )}
        </div>
      </div>

      {/* === DOCUMENT META + RELATIE === */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12mm", gap: "10mm" }}>
        {/* Relatie */}
        {relatie && (
          <div style={{ flex: 1, padding: "12px 16px", backgroundColor: "#f9fafb", borderRadius: "6px", border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: "7pt", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
              {isKlant ? (isPakbon(doc.type) ? "Afleveradres" : "Factuuradres") : "Leverancier"}
            </div>
            <div style={{ fontWeight: 600, fontSize: "10pt" }}>{relatie.naam}</div>
            {relatie.adres && <div>{relatie.adres}</div>}
            {(relatie.postcode || relatie.plaats) && (
              <div>{[relatie.postcode, relatie.plaats].filter(Boolean).join(" ")}</div>
            )}
            {relatie.email && <div style={{ color: "#6b7280" }}>{relatie.email}</div>}
            {"telefoon" in relatie && relatie.telefoon && <div style={{ color: "#6b7280" }}>Tel: {relatie.telefoon}</div>}
            {/* Klant/Leverancier BTW & KvK (Art. 35a Wet OB, Handelsregisterwet) */}
            {"btw_nummer" in relatie && relatie.btw_nummer && (
              <div style={{ color: "#6b7280", marginTop: "4px" }}>BTW-nr: {relatie.btw_nummer}</div>
            )}
            {"kvk_nummer" in relatie && relatie.kvk_nummer && (
              <div style={{ color: "#6b7280" }}>KvK: {relatie.kvk_nummer}</div>
            )}
          </div>
        )}

        {/* Meta info */}
        <div style={{ width: "60mm", fontSize: "8pt" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ padding: "3px 0", color: "#6b7280" }}>
                  {isInkoopOrder(doc.type) ? "Besteldatum" : "Factuurdatum"}
                </td>
                <td style={{ padding: "3px 0", textAlign: "right", fontWeight: 500 }}>
                  {new Date(doc.factuurdatum).toLocaleDateString("nl-NL", { day: "2-digit", month: "long", year: "numeric" })}
                </td>
              </tr>
              {/* Leveringsdatum (Art. 35a lid 1f Wet OB) */}
              {doc.leveringsdatum && (
                <tr>
                  <td style={{ padding: "3px 0", color: "#6b7280" }}>Leveringsdatum</td>
                  <td style={{ padding: "3px 0", textAlign: "right", fontWeight: 500 }}>
                    {new Date(doc.leveringsdatum).toLocaleDateString("nl-NL", { day: "2-digit", month: "long", year: "numeric" })}
                  </td>
                </tr>
              )}
              {isInkoopOrder(doc.type) && doc.gewenste_leverdatum && (
                <tr>
                  <td style={{ padding: "3px 0", color: "#6b7280" }}>Gewenste levering</td>
                  <td style={{ padding: "3px 0", textAlign: "right", fontWeight: 500 }}>
                    {new Date(doc.gewenste_leverdatum).toLocaleDateString("nl-NL", { day: "2-digit", month: "long", year: "numeric" })}
                  </td>
                </tr>
              )}
              {!isInkoopOrder(doc.type) && doc.vervaldatum && showPricing(doc.type) && (
                <tr>
                  <td style={{ padding: "3px 0", color: "#6b7280" }}>Vervaldatum</td>
                  <td style={{ padding: "3px 0", textAlign: "right", fontWeight: 500 }}>
                    {new Date(doc.vervaldatum).toLocaleDateString("nl-NL", { day: "2-digit", month: "long", year: "numeric" })}
                  </td>
                </tr>
              )}
              {isInkoopOrder(doc.type) && doc.leverancier_referentie && (
                <tr>
                  <td style={{ padding: "3px 0", color: "#6b7280" }}>Onze referentie</td>
                  <td style={{ padding: "3px 0", textAlign: "right", fontWeight: 500, fontFamily: "monospace" }}>
                    {doc.leverancier_referentie}
                  </td>
                </tr>
              )}
              {showPricing(doc.type) && (
                <tr>
                  <td style={{ padding: "3px 0", color: "#6b7280" }}>Betalingstermijn</td>
                  <td style={{ padding: "3px 0", textAlign: "right", fontWeight: 500 }}>{doc.betalingstermijn_dagen} dagen</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* === AFLEVERADRES (inkooporder) === */}
      {isInkoopOrder(doc.type) && doc.leveringsadres && (
        <div style={{ marginBottom: "8mm", padding: "10px 16px", backgroundColor: "#f0fdf4", borderRadius: "6px", border: "1px solid #bbf7d0", fontSize: "8pt" }}>
          <div style={{ fontSize: "7pt", color: "#15803d", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px", fontWeight: 600 }}>
            Afleveradres
          </div>
          {doc.leveringsadres.contactpersoon && (
            <div style={{ fontWeight: 600 }}>T.a.v. {doc.leveringsadres.contactpersoon}</div>
          )}
          {doc.leveringsadres.straat && <div>{doc.leveringsadres.straat}</div>}
          {(doc.leveringsadres.postcode || doc.leveringsadres.plaats) && (
            <div>{[doc.leveringsadres.postcode, doc.leveringsadres.plaats].filter(Boolean).join(" ")}</div>
          )}
          {doc.leveringsadres.land && doc.leveringsadres.land !== "NL" && (
            <div>{doc.leveringsadres.land}</div>
          )}
          {(doc.leveringsadres.telefoon || doc.leveringsadres.email) && (
            <div style={{ color: "#6b7280", marginTop: "3px" }}>
              {doc.leveringsadres.telefoon && <span>Tel: {doc.leveringsadres.telefoon}</span>}
              {doc.leveringsadres.telefoon && doc.leveringsadres.email && <span> · </span>}
              {doc.leveringsadres.email && <span>{doc.leveringsadres.email}</span>}
            </div>
          )}
        </div>
      )}

      {/* === INSTALLATIE INFO (pakbon) === */}
      {isPakbon(doc.type) && installatie && (
        <div style={{ marginBottom: "10mm", padding: "10px 16px", backgroundColor: "#eff6ff", borderRadius: "6px", border: "1px solid #bfdbfe", fontSize: "8pt" }}>
          <div style={{ fontSize: "7pt", color: "#3b82f6", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px", fontWeight: 600 }}>
            Gekoppelde installatie
          </div>
          {installatie.consument_naam && <div>Klant: <strong>{installatie.consument_naam}</strong></div>}
          {installatie.geplande_startdatum && (
            <div>Geplande start: {new Date(installatie.geplande_startdatum).toLocaleDateString("nl-NL")}</div>
          )}
          {installatie.geplande_einddatum && (
            <div>Geplande einde: {new Date(installatie.geplande_einddatum).toLocaleDateString("nl-NL")}</div>
          )}
        </div>
      )}

      {/* === INKOOPORDER INTRO === */}
      {isInkoopOrder(doc.type) && (
        <div style={{ marginBottom: "8mm", fontSize: "9pt" }}>
          <p>Geachte {relatie?.naam || "leverancier"},</p>
          <p style={{ marginTop: "4px" }}>
            Hierbij bestellen wij de volgende artikelen. Wij verzoeken u vriendelijk deze bestelling te bevestigen en te leveren conform de onderstaande specificaties.
          </p>
        </div>
      )}

      {/* === REGELS TABEL === */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "8mm" }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${primaryColor}` }}>
            <th style={{ textAlign: "left", padding: "6px 4px", fontWeight: 600, fontSize: "8pt" }}>Omschrijving</th>
            <th style={{ textAlign: "right", padding: "6px 4px", fontWeight: 600, fontSize: "8pt", width: "50px" }}>Aantal</th>
            {!isPakbon(doc.type) && (
              <>
                <th style={{ textAlign: "right", padding: "6px 4px", fontWeight: 600, fontSize: "8pt", width: "70px" }}>Prijs excl.</th>
                <th style={{ textAlign: "right", padding: "6px 4px", fontWeight: 600, fontSize: "8pt", width: "45px" }}>BTW</th>
                <th style={{ textAlign: "right", padding: "6px 4px", fontWeight: 600, fontSize: "8pt", width: "75px" }}>Totaal</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {regels.map((r, i) => {
            const meta = r.product_id ? metaMap[r.product_id] : undefined;
            const componenten = meta?.is_assemblage ? meta.componenten : [];
            return (
              <Fragment key={`r-${i}`}>
                <tr style={{ borderBottom: componenten.length ? "none" : "1px solid #f3f4f6" }}>
                  <td style={{ padding: "6px 4px" }}>
                    {r.omschrijving}
                    {componenten.length > 0 && (
                      <span style={{ fontSize: "7pt", color: "#6b7280", marginLeft: "6px" }}>(samengesteld)</span>
                    )}
                    {!isPakbon(doc.type) && (r.btw_percentage === 0) && (
                      <span style={{ fontSize: "7pt", color: "#dc2626", marginLeft: "6px", fontStyle: "italic" }}>
                        BTW verlegd
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "6px 4px", textAlign: "right" }}>{r.aantal}</td>
                  {!isPakbon(doc.type) && (
                    <>
                      <td style={{ padding: "6px 4px", textAlign: "right" }}>{formatCurrency(r.prijs_per_stuk)}</td>
                      <td style={{ padding: "6px 4px", textAlign: "right" }}>{r.btw_percentage}%</td>
                      <td style={{ padding: "6px 4px", textAlign: "right", fontWeight: 500 }}>{formatCurrency(regelSubtotaal(r))}</td>
                    </>
                  )}
                </tr>
                {componenten.map((c) => (
                  <tr key={`r-${i}-c-${c.component_id}`} style={{ borderBottom: "1px solid #f9fafb" }}>
                    <td style={{ padding: "3px 4px 3px 16px", fontSize: "7.5pt", color: "#6b7280" }}>
                      ↳ {[c.merk, c.naam].filter(Boolean).join(" ")}
                      {c.heeft_serienummer && (
                        <span style={{ fontSize: "6.5pt", marginLeft: "6px", padding: "1px 4px", borderRadius: "3px", background: "#eef2ff", color: primaryColor }}>SN</span>
                      )}
                    </td>
                    <td style={{ padding: "3px 4px", textAlign: "right", fontSize: "7.5pt", color: "#6b7280" }}>
                      {c.aantal * r.aantal}
                    </td>
                    {!isPakbon(doc.type) && (
                      <>
                        <td colSpan={3} />
                      </>
                    )}
                  </tr>
                ))}
                {componenten.length > 0 && (
                  <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td colSpan={totalCols} style={{ height: 0, padding: 0 }} />
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>

      {/* === TOTALEN (niet voor pakbon) === */}
      {showPricing(doc.type) && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12mm" }}>
          <div style={{ width: "75mm" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: "8.5pt" }}>
              <span style={{ color: "#6b7280" }}>Subtotaal excl. BTW</span>
              <span>{formatCurrency(brutoTotaal)}</span>
            </div>
            {kortingTotaal > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: "8.5pt", color: "#16a34a" }}>
                <span>Korting</span>
                <span>-{formatCurrency(kortingTotaal)}</span>
              </div>
            )}

            {/* BTW-specificatie per tarief (Art. 35a Wet OB) */}
            {btwOverzicht.map((b) => (
              <div key={b.percentage} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: "8.5pt" }}>
                <span style={{ color: "#6b7280" }}>
                  {b.percentage === 0 ? "BTW verlegd (0%)" : `BTW ${b.percentage}% over ${formatCurrency(b.grondslag)}`}
                </span>
                <span>{formatCurrency(b.bedrag)}</span>
              </div>
            ))}

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 0 0",
              marginTop: "4px",
              borderTop: `2px solid ${primaryColor}`,
              fontSize: "12pt",
              fontWeight: 700,
            }}>
              <span>Totaal incl. BTW</span>
              <span>{formatCurrency(doc.totaal_bedrag)}</span>
            </div>
          </div>
        </div>
      )}

      {/* === EINDAFREKENING — VERREKEN-OVERZICHT === */}
      {isEindafrekening && verrekenRegels.length > 0 && showPricing(doc.type) && (
        <div style={{
          marginBottom: "10mm",
          padding: "10px 16px",
          backgroundColor: "#fefce8",
          borderRadius: "6px",
          border: "1px solid #fde68a",
          fontSize: "8.5pt",
        }}>
          <div style={{ fontSize: "7pt", color: "#92400e", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", fontWeight: 600 }}>
            Verrekening voorschotten
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
            <span>Totaal werkzaamheden (excl. BTW)</span>
            <span>{formatCurrency(totaalWerkExclBtw + verrekendExclBtw)}</span>
          </div>
          {verrekenRegels.map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", color: "#6b7280" }}>
              <span>− {r.omschrijving}</span>
              <span>{formatCurrency(regelSubtotaal(r))}</span>
            </div>
          ))}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "6px 0 0",
            marginTop: "4px",
            borderTop: "1px solid #fde68a",
            fontWeight: 700,
          }}>
            <span>Nog te betalen (incl. BTW)</span>
            <span>{formatCurrency(doc.totaal_bedrag)}</span>
          </div>
        </div>
      )}

      {/* === PAKBON ONDERTEKENING === */}
      {isPakbon(doc.type) && (
        <div style={{ marginTop: "15mm", marginBottom: "12mm" }}>
          <div style={{ fontSize: "8pt", color: "#6b7280", marginBottom: "6px" }}>
            Ontvangen in goede orde:
          </div>
          <div style={{ display: "flex", gap: "20mm" }}>
            <div style={{ flex: 1 }}>
              <div style={{ borderBottom: "1px solid #d1d5db", height: "20mm", marginBottom: "4px" }} />
              <div style={{ fontSize: "7pt", color: "#9ca3af" }}>Naam ontvanger</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ borderBottom: "1px solid #d1d5db", height: "20mm", marginBottom: "4px" }} />
              <div style={{ fontSize: "7pt", color: "#9ca3af" }}>Handtekening</div>
            </div>
            <div style={{ width: "30mm" }}>
              <div style={{ borderBottom: "1px solid #d1d5db", height: "20mm", marginBottom: "4px" }} />
              <div style={{ fontSize: "7pt", color: "#9ca3af" }}>Datum</div>
            </div>
          </div>
        </div>
      )}

      {/* === BETALINGSGEGEVENS (facturen) === */}
      {(doc.type === "verkoopfactuur" || doc.type === "creditnota") && (
        <div style={{ padding: "10px 16px", backgroundColor: "#f9fafb", borderRadius: "6px", border: "1px solid #e5e7eb", marginBottom: "8mm", fontSize: "8pt" }}>
          <div style={{ fontSize: "7pt", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
            Betalingsgegevens
          </div>
          <div style={{ display: "flex", gap: "15mm", flexWrap: "wrap" }}>
            <div>
              <span style={{ color: "#6b7280" }}>T.n.v.:</span> {partner?.iban_tnv || partner?.naam || "—"}
            </div>
            {partner?.iban && (
              <div>
                <span style={{ color: "#6b7280" }}>IBAN:</span> <strong>{partner.iban}</strong>
              </div>
            )}
            {partner?.bic && (
              <div>
                <span style={{ color: "#6b7280" }}>BIC:</span> <strong>{partner.bic}</strong>
              </div>
            )}
            <div>
              <span style={{ color: "#6b7280" }}>Kenmerk:</span> <strong>{doc.documentnummer}</strong>
            </div>
          </div>
        </div>
      )}

      {/* === "BTW verlegd" wettelijke vermelding === */}
      {hasZeroBtw && showPricing(doc.type) && (
        <div style={{ fontSize: "7.5pt", color: "#6b7280", fontStyle: "italic", marginBottom: "6mm" }}>
          * BTW verlegd: de BTW wordt verlegd naar de afnemer conform art. 12 lid 5 Wet OB 1968.
        </div>
      )}

      {/* === NOTITIES === */}
      {doc.notities && (
        <div style={{ fontSize: "8pt", color: "#6b7280", marginBottom: "8mm" }}>
          <span style={{ fontWeight: 600 }}>Opmerking: </span>{doc.notities}
        </div>
      )}

      {/* === Voorschot wettelijke vermelding === */}
      {doc.factuur_subtype === "voorschot" && (
        <div style={{ fontSize: "7.5pt", color: "#6b7280", fontStyle: "italic", marginBottom: "6mm" }}>
          Dit is een voorschotfactuur. De definitieve afrekening volgt na oplevering en verrekent dit voorschot.
        </div>
      )}
      {doc.factuur_subtype === "eindafrekening" && (
        <div style={{ fontSize: "7.5pt", color: "#6b7280", fontStyle: "italic", marginBottom: "6mm" }}>
          Dit is de eindafrekening. Reeds betaalde voorschotten zijn verrekend in bovenstaande regels (negatieve bedragen).
        </div>
      )}

      {/* === FOOTER === */}
      <div
        style={{
          position: "absolute",
          bottom: "12mm",
          left: "20mm",
          right: "20mm",
          textAlign: "center",
          fontSize: "7pt",
          color: "#9ca3af",
          borderTop: "1px solid #e5e7eb",
          paddingTop: "6px",
        }}
      >
        {partner?.naam}
        {partner?.kvk ? ` • KvK ${partner.kvk}` : ""}
        {partner?.btw ? ` • BTW ${partner.btw}` : ""}
        {partner?.iban ? ` • IBAN ${partner.iban}` : ""}
      </div>
    </div>
  );
}
