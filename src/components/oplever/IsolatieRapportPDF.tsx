import { forwardRef } from "react";
import { ChecklistRows, Row, Section, SignBlock, tableStyle, tdStyle, thStyle } from "./pdf/primitives";
import { gemiddeldeRd, toetsIsde, totaalOppervlakte } from "./isolatieConfig";
import type { Opleverrapport, Verdict } from "./types";

const VERDICT_COLOR: Record<string, string> = {
  goedgekeurd: "#16a34a",
  goedgekeurd_met_opmerkingen: "#f59e0b",
  afgekeurd: "#dc2626",
};

const VERDICT_LABEL: Record<string, string> = {
  goedgekeurd: "OPGELEVERD",
  goedgekeurd_met_opmerkingen: "OPGELEVERD MET OPMERKINGEN",
  afgekeurd: "AFGEKEURD",
};

export interface IsolatiePdfProps {
  rapport: Opleverrapport;
  partnerNaam?: string;
  klantNaam?: string;
  klantContact?: string;
  partnerLogoUrl?: string;
  partnerContact?: string;
  ordernummer?: string;
  meegeleverdeDocumenten?: { naam: string; bestandsnaam: string; url: string }[];
  installateurSigDataUrl?: string | null;
  klantSigDataUrl?: string | null;
  partnerLogoDataUrl?: string | null;
}

const IsolatieRapportPDF = forwardRef<HTMLDivElement, IsolatiePdfProps>(function IsolatieRapportPDF(
  {
    rapport,
    partnerNaam,
    klantNaam,
    klantContact,
    partnerLogoUrl,
    partnerContact,
    ordernummer,
    meegeleverdeDocumenten,
    installateurSigDataUrl,
    klantSigDataUrl,
    partnerLogoDataUrl,
  },
  ref,
) {
  const verdict = (rapport.bevindingen?.verdict ?? "goedgekeurd") as Verdict;
  const extra = rapport.extra_velden ?? {};
  const vlakken = extra.isolatie_vlakken ?? [];
  const logoSrc = partnerLogoDataUrl ?? partnerLogoUrl ?? null;
  const totaal = totaalOppervlakte(vlakken);
  const gemRd = gemiddeldeRd(vlakken);

  return (
    <div
      ref={ref}
      style={{
        width: "210mm",
        background: "#ffffff",
        color: "#0f172a",
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "11pt",
        padding: "20mm",
        boxSizing: "border-box",
      }}
    >
      <header style={{ borderBottom: "2px solid #6d28d9", paddingBottom: "10mm", marginBottom: "10mm" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4mm" }}>
            {logoSrc ? (
              <img src={logoSrc} alt={partnerNaam ?? "Partner logo"} crossOrigin="anonymous" style={{ maxHeight: "25mm", maxWidth: "70mm", objectFit: "contain" }} />
            ) : partnerNaam ? (
              <div style={{ fontSize: "16pt", fontWeight: 700, color: "#111827" }}>{partnerNaam}</div>
            ) : null}
            <div>
              <div style={{ fontSize: "10pt", color: "#6b7280" }}>Opleverrapport isolatie</div>
              <h1 style={{ fontSize: "22pt", margin: "4px 0 0", color: "#111827" }}>{rapport.rapportnummer}</h1>
              <div style={{ fontSize: "10pt", color: "#6b7280", marginTop: "4px" }}>Templateversie: {rapport.template_versie}</div>
            </div>
          </div>
          <div
            style={{
              border: `3px solid ${VERDICT_COLOR[verdict]}`,
              color: VERDICT_COLOR[verdict],
              padding: "6px 14px",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "12pt",
              transform: "rotate(-4deg)",
            }}
          >
            {VERDICT_LABEL[verdict]}
          </div>
        </div>
      </header>

      <Section title="Algemene gegevens">
        <Row label="Klant" value={klantNaam ?? "—"} />
        {klantContact ? <Row label="Contact klant" value={klantContact} /> : null}
        <Row label="Uitvoerder" value={partnerNaam ?? "—"} />
        <Row label="Projectnummer" value={extra.projectnummer ?? "—"} />
        <Row label="Verkoopordernummer" value={ordernummer ?? "—"} />
        <Row label="Datum uitvoering" value={extra.installatiedatum ?? "—"} />
        <Row label="Opleverdatum" value={rapport.opleverdatum ?? "—"} />
        <Row label="Omvang werkzaamheden" value={rapport.scope_omschrijving ?? "—"} />
      </Section>

      <Section title="Samenvatting isolatiemaatregelen">
        <Row label="Aantal bouwdelen" value={String(vlakken.length)} />
        <Row label="Totaal geïsoleerd oppervlak" value={`${totaal.toFixed(1)} m²`} />
        <Row label="Gewogen gemiddelde Rd" value={gemRd != null ? `${gemRd} m²K/W` : "—"} />
        <Row
          label="Verwachte gasbesparing"
          value={extra.isolatie_besparing_m3_gas != null ? `${extra.isolatie_besparing_m3_gas} m³ per jaar` : "—"}
        />
        <Row
          label="Verwachte CO₂-besparing"
          value={extra.isolatie_co2_besparing_kg != null ? `${extra.isolatie_co2_besparing_kg} kg per jaar` : "—"}
        />
      </Section>

      <Section title="Toegepaste isolatie per bouwdeel">
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Bouwdeel</th>
              <th style={thStyle}>Materiaal / type</th>
              <th style={thStyle}>Verwerking</th>
              <th style={thStyle}>m²</th>
              <th style={thStyle}>Dikte</th>
              <th style={thStyle}>Rd / U</th>
              <th style={thStyle}>ISDE-eis</th>
            </tr>
          </thead>
          <tbody>
            {vlakken.map((v) => {
              const toets = toetsIsde(v);
              return (
                <tr key={v.id}>
                  <td style={tdStyle}>
                    {v.vlak_type}
                    {v.omschrijving ? <div style={{ color: "#6b7280", fontSize: "9pt" }}>{v.omschrijving}</div> : null}
                  </td>
                  <td style={tdStyle}>
                    {v.materiaal ?? "—"}
                    {v.merk_type ? <div style={{ color: "#6b7280", fontSize: "9pt" }}>{v.merk_type}</div> : null}
                  </td>
                  <td style={tdStyle}>{v.verwerking ?? "—"}</td>
                  <td style={tdStyle}>{v.oppervlakte_m2 ?? "—"}</td>
                  <td style={tdStyle}>{v.dikte_mm ? `${v.dikte_mm} mm` : "—"}</td>
                  <td style={tdStyle}>{toets.gemeten}</td>
                  <td style={{ ...tdStyle, color: toets.voldoet === false ? "#dc2626" : "#16a34a", fontWeight: 600 }}>
                    {toets.voldoet == null ? toets.eis : toets.voldoet ? `Voldoet (${toets.eis})` : `Voldoet niet (${toets.eis})`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {vlakken.some((v) => v.opmerking) ? (
          <div style={{ marginTop: "3mm", fontSize: "9pt", color: "#475569" }}>
            {vlakken
              .filter((v) => v.opmerking)
              .map((v) => (
                <div key={v.id}>
                  <strong>{v.vlak_type}:</strong> {v.opmerking}
                </div>
              ))}
          </div>
        ) : null}
      </Section>

      {extra.isolatie_controle?.length ? (
        <Section title="Controle uitvoering">
          <ChecklistRows items={extra.isolatie_controle} />
        </Section>
      ) : null}

      <Section title="Bouwfysische controle">
        <Row label="Thermografische controle" value={extra.isolatie_thermografie_uitgevoerd ? "Uitgevoerd" : "Niet uitgevoerd"} />
        {extra.isolatie_thermografie_notitie ? <Row label="Bevindingen" value={extra.isolatie_thermografie_notitie} /> : null}
        <Row
          label="Luchtdichtheid qv10"
          value={extra.isolatie_luchtdichtheid_qv10 != null ? `${extra.isolatie_luchtdichtheid_qv10} dm³/s per m²` : "—"}
        />
        <Row label="Dampremmende laag" value={vlakken.some((v) => v.dampremmer) ? "Aangebracht" : "Niet van toepassing"} />
      </Section>

      <Section title="Subsidie (ISDE)">
        <Row label="Aanvraag ingediend" value={extra.isde_aanvraag_ingediend ? "Ja" : "Nee"} />
        <Row label="Aanvraagnummer" value={extra.isde_aanvraagnummer ?? "—"} />
      </Section>

      {extra.isolatie_documenten?.length ? (
        <Section title="Documenten & overdracht">
          <ChecklistRows items={extra.isolatie_documenten} />
        </Section>
      ) : null}

      <Section title="Bevindingen & verklaring">
        <p style={{ marginTop: 0 }}>
          <strong>Eindoordeel:</strong> {VERDICT_LABEL[verdict]}
        </p>
        {rapport.bevindingen?.deficiencies?.length ? (
          <div>
            <strong>Tekortkomingen:</strong>
            <ul>{rapport.bevindingen.deficiencies.map((d, i) => <li key={i}>{d}</li>)}</ul>
          </div>
        ) : null}
        {rapport.bevindingen?.recommendations?.length ? (
          <div>
            <strong>Adviezen:</strong>
            <ul>{rapport.bevindingen.recommendations.map((d, i) => <li key={i}>{d}</li>)}</ul>
          </div>
        ) : null}
        {extra.opmerkingen_afwijkingen ? (
          <div style={{ marginTop: "3mm" }}>
            <strong>Opmerkingen / afwijkingen:</strong>
            <p style={{ whiteSpace: "pre-wrap", marginTop: "1mm" }}>{extra.opmerkingen_afwijkingen}</p>
          </div>
        ) : null}
        <p style={{ marginTop: "6mm", whiteSpace: "pre-wrap" }}>{rapport.conformiteitstekst}</p>
      </Section>

      <Section title="Ondertekening">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10mm" }}>
          <SignBlock title="Uitvoerder" sig={rapport.installateur_handtekening} dataUrl={installateurSigDataUrl ?? null} />
          <SignBlock title="Klant" sig={rapport.klant_handtekening} dataUrl={klantSigDataUrl ?? null} />
        </div>
      </Section>

      {meegeleverdeDocumenten && meegeleverdeDocumenten.length > 0 ? (
        <Section title="Meegeleverde documenten">
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Product</th>
                <th style={thStyle}>Document</th>
              </tr>
            </thead>
            <tbody>
              {meegeleverdeDocumenten.map((d, i) => (
                <tr key={i}>
                  <td style={tdStyle}>{d.naam}</td>
                  <td style={tdStyle}>{d.bestandsnaam}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      ) : null}

      <footer style={{ marginTop: "10mm", borderTop: "1px solid #e5e7eb", paddingTop: "4mm", fontSize: "9pt", color: "#6b7280" }}>
        <div>Rapport {rapport.rapportnummer} • Gegenereerd op {new Date().toLocaleString("nl-NL")}</div>
        {partnerNaam ? <div style={{ marginTop: "1mm" }}>{partnerNaam}{partnerContact ? ` • ${partnerContact}` : ""}</div> : null}
      </footer>
    </div>
  );
});

export default IsolatieRapportPDF;
