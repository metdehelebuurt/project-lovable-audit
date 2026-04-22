import { forwardRef } from "react";
import type { Opleverrapport, Verdict } from "./types";

const VERDICT_COLOR: Record<string, string> = {
  goedgekeurd: "#16a34a",
  goedgekeurd_met_opmerkingen: "#f59e0b",
  afgekeurd: "#dc2626",
};

const VERDICT_LABEL: Record<string, string> = {
  goedgekeurd: "GOEDGEKEURD",
  goedgekeurd_met_opmerkingen: "GOEDGEKEURD MET OPMERKINGEN",
  afgekeurd: "AFGEKEURD",
};

interface Props {
  rapport: Opleverrapport;
  partnerNaam?: string;
  klantNaam?: string;
}

const OpleverRapportPDF = forwardRef<HTMLDivElement, Props>(({ rapport, partnerNaam, klantNaam }, ref) => {
  const verdict = (rapport.bevindingen?.verdict ?? "goedgekeurd") as Verdict;
  const stempelColor = VERDICT_COLOR[verdict];
  const stempelLabel = VERDICT_LABEL[verdict];

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
      {/* Voorblad */}
      <header style={{ borderBottom: "2px solid #6d28d9", paddingBottom: "10mm", marginBottom: "10mm" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "10pt", color: "#6b7280" }}>NEN 1010 Opleverrapport</div>
            <h1 style={{ fontSize: "22pt", margin: "4px 0 0", color: "#111827" }}>{rapport.rapportnummer}</h1>
            <div style={{ fontSize: "10pt", color: "#6b7280", marginTop: "4px" }}>
              Templateversie: {rapport.template_versie}
            </div>
          </div>
          <div
            style={{
              border: `3px solid ${stempelColor}`,
              color: stempelColor,
              padding: "6px 14px",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "12pt",
              transform: "rotate(-4deg)",
            }}
          >
            {stempelLabel}
          </div>
        </div>
      </header>

      <Section title="Algemene gegevens">
        <Row label="Klant" value={klantNaam ?? "—"} />
        <Row label="Installateur" value={partnerNaam ?? "—"} />
        <Row label="Opleverdatum" value={rapport.opleverdatum ?? "—"} />
        <Row label="Omvang" value={rapport.scope_omschrijving ?? "—"} />
      </Section>

      <Section title="Installatie-omschrijving">
        <Row label="Batterij" value={`${rapport.batterij_spec?.merk ?? ""} ${rapport.batterij_spec?.type ?? ""} (${rapport.batterij_spec?.capaciteit_kwh ?? "?"} kWh) — sn: ${rapport.batterij_spec?.serienummer ?? "—"}`} />
        <Row label="Omvormer" value={`${rapport.omvormer_spec?.merk ?? ""} ${rapport.omvormer_spec?.type ?? ""} (${rapport.omvormer_spec?.vermogen_kw ?? "?"} kW, ${rapport.omvormer_spec?.fasen ?? "?"}-fase) — sn: ${rapport.omvormer_spec?.serienummer ?? "—"}`} />
        <Row label="CE-markering" value={rapport.omvormer_spec?.ce_markering ? "Ja" : "Nee"} />
        <Row label="RfG-klasse" value={rapport.omvormer_spec?.rfg_klasse ?? "—"} />
      </Section>

      <Section title="Visuele inspectie">
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Punt</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Opmerking</th>
            </tr>
          </thead>
          <tbody>
            {(rapport.visuele_inspectie ?? []).map((c) => (
              <tr key={c.key}>
                <td style={tdStyle}>{c.label}</td>
                <td style={tdStyle}>{c.status ?? "—"}</td>
                <td style={tdStyle}>{c.opmerking ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Metingen & beproevingen">
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Groep</th>
              <th style={thStyle}>Waarde</th>
              <th style={thStyle}>Eenheid</th>
              <th style={thStyle}>Resultaat</th>
            </tr>
          </thead>
          <tbody>
            {(rapport.metingen ?? []).map((m) => (
              <tr key={m.id}>
                <td style={tdStyle}>{m.type}</td>
                <td style={tdStyle}>{m.groep ?? "—"}</td>
                <td style={tdStyle}>{String(m.waarde ?? "—")}</td>
                <td style={tdStyle}>{m.eenheid ?? ""}</td>
                <td style={{ ...tdStyle, color: m.passed ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                  {m.passed ? "PASS" : "FAIL"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ fontSize: "9pt", color: "#6b7280", marginTop: "4mm" }}>
          Meetapparatuur: {rapport.meetapparatuur?.merk ?? "—"} {rapport.meetapparatuur?.type ?? ""} (sn: {rapport.meetapparatuur?.serienummer ?? "—"}, kalibratie: {rapport.meetapparatuur?.laatste_kalibratie ?? "—"})
        </div>
      </Section>

      <Section title="Groepenverdeling">
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Nr.</th>
              <th style={thStyle}>Functie</th>
              <th style={thStyle}>Kabel</th>
              <th style={thStyle}>Ø mm²</th>
              <th style={thStyle}>Beveiliging A</th>
              <th style={thStyle}>Aardlek mA</th>
            </tr>
          </thead>
          <tbody>
            {(rapport.groepenverdeling ?? []).map((g, i) => (
              <tr key={i}>
                <td style={tdStyle}>{g.nummer}</td>
                <td style={tdStyle}>{g.functie}</td>
                <td style={tdStyle}>{g.kabeltype ?? ""}</td>
                <td style={tdStyle}>{g.diameter_mm2 ?? ""}</td>
                <td style={tdStyle}>{g.beveiliging_a ?? ""}</td>
                <td style={tdStyle}>{g.aardlek_ma ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Bevindingen & conformiteitsverklaring">
        <p style={{ marginTop: 0 }}>
          <strong>Eindoordeel:</strong> {stempelLabel}
        </p>
        {rapport.bevindingen?.deficiencies?.length ? (
          <div>
            <strong>Tekortkomingen:</strong>
            <ul>{rapport.bevindingen.deficiencies.map((d, i) => <li key={i}>{d}</li>)}</ul>
          </div>
        ) : null}
        {rapport.bevindingen?.recommendations?.length ? (
          <div>
            <strong>Hersteladviezen:</strong>
            <ul>{rapport.bevindingen.recommendations.map((d, i) => <li key={i}>{d}</li>)}</ul>
          </div>
        ) : null}
        <p style={{ marginTop: "6mm", whiteSpace: "pre-wrap" }}>{rapport.conformiteitstekst}</p>
      </Section>

      <Section title="Ondertekening">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10mm" }}>
          <SignBlock title="Installateur" sig={rapport.installateur_handtekening} />
          <SignBlock title="Klant" sig={rapport.klant_handtekening} />
        </div>
      </Section>

      <footer style={{ marginTop: "10mm", borderTop: "1px solid #e5e7eb", paddingTop: "4mm", fontSize: "9pt", color: "#6b7280" }}>
        Rapport {rapport.rapportnummer} • Gegenereerd op {new Date().toLocaleString("nl-NL")}
      </footer>
    </div>
  );
});
OpleverRapportPDF.displayName = "OpleverRapportPDF";
export default OpleverRapportPDF;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "8mm", pageBreakInside: "avoid" }}>
      <h2 style={{ fontSize: "13pt", color: "#111827", borderBottom: "1px solid #e5e7eb", paddingBottom: "2mm", marginBottom: "3mm" }}>{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "45mm 1fr", gap: "4mm", marginBottom: "1mm" }}>
      <div style={{ color: "#6b7280" }}>{label}</div>
      <div>{value}</div>
    </div>
  );
}

function SignBlock({ title, sig }: { title: string; sig: { image_url: string; name: string; signed_at: string } | null }) {
  return (
    <div>
      <div style={{ fontSize: "10pt", color: "#6b7280", marginBottom: "2mm" }}>{title}</div>
      <div style={{ height: "30mm", border: "1px dashed #cbd5e1", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {sig?.image_url ? <img src={sig.image_url} alt="handtekening" style={{ maxHeight: "28mm" }} /> : <span style={{ color: "#94a3b8" }}>Niet ondertekend</span>}
      </div>
      {sig ? (
        <div style={{ fontSize: "9pt", color: "#475569", marginTop: "2mm" }}>
          {sig.name} — {new Date(sig.signed_at).toLocaleString("nl-NL")}
        </div>
      ) : null}
    </div>
  );
}

const tableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: "10pt" };
const thStyle: React.CSSProperties = { textAlign: "left", padding: "4px 6px", borderBottom: "1px solid #cbd5e1", background: "#f8fafc", color: "#475569", fontWeight: 600 };
const tdStyle: React.CSSProperties = { padding: "4px 6px", borderBottom: "1px solid #f1f5f9", verticalAlign: "top" };
