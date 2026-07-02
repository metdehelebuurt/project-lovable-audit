import { forwardRef } from "react";
import type { ChecklistItem, Opleverrapport, Verdict } from "./types";

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

function formatSns(lijst?: string[], legacy?: string): string {
  const set = new Set<string>();
  (lijst ?? []).forEach((s) => {
    const v = (s ?? "").trim();
    if (v) set.add(v);
  });
  if (legacy && legacy.trim()) set.add(legacy.trim());
  if (set.size === 0) return "—";
  return Array.from(set).join(", ");
}

interface Props {
  rapport: Opleverrapport;
  partnerNaam?: string;
  klantNaam?: string;
  klantContact?: string;
  partnerLogoUrl?: string;
  partnerContact?: string;
  ordernummer?: string;
  meegeleverdeDocumenten?: { naam: string; bestandsnaam: string; url: string }[];
  /** DataURL-versies van assets zodat html2canvas geen CORS/relatieve-URL-issues krijgt. */
  installateurSigDataUrl?: string | null;
  klantSigDataUrl?: string | null;
  partnerLogoDataUrl?: string | null;
}

const OpleverRapportPDF = forwardRef<HTMLDivElement, Props>(({ rapport, partnerNaam, klantNaam, klantContact, partnerLogoUrl, partnerContact, ordernummer, meegeleverdeDocumenten, installateurSigDataUrl, klantSigDataUrl, partnerLogoDataUrl }, ref) => {
  const verdict = (rapport.bevindingen?.verdict ?? "goedgekeurd") as Verdict;
  const stempelColor = VERDICT_COLOR[verdict];
  const stempelLabel = VERDICT_LABEL[verdict];
  const logoSrc = partnerLogoDataUrl ?? partnerLogoUrl ?? null;

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
          <div style={{ display: "flex", flexDirection: "column", gap: "4mm" }}>
            {logoSrc ? (
              <img
                src={logoSrc}
                alt={partnerNaam ?? "Partner logo"}
                crossOrigin="anonymous"
                style={{ maxHeight: "25mm", maxWidth: "70mm", objectFit: "contain" }}
              />
            ) : partnerNaam ? (
              <div style={{ fontSize: "16pt", fontWeight: 700, color: "#111827" }}>{partnerNaam}</div>
            ) : null}
            <div>
            <div style={{ fontSize: "10pt", color: "#6b7280" }}>NEN 1010 / NEN 3140 Opleverrapport</div>
            <h1 style={{ fontSize: "22pt", margin: "4px 0 0", color: "#111827" }}>{rapport.rapportnummer}</h1>
            <div style={{ fontSize: "10pt", color: "#6b7280", marginTop: "4px" }}>
              Templateversie: {rapport.template_versie}
            </div>
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
        {klantContact ? <Row label="Contact klant" value={klantContact} /> : null}
        <Row label="Installateur" value={partnerNaam ?? "—"} />
        <Row label="Projectnummer" value={rapport.extra_velden?.projectnummer ?? "—"} />
        <Row label="Verkoopordernummer" value={ordernummer ?? "—"} />
        <Row label="Datum installatie" value={rapport.extra_velden?.installatiedatum ?? "—"} />
        <Row label="Opleverdatum" value={rapport.opleverdatum ?? "—"} />
        <Row label="Omvang" value={rapport.scope_omschrijving ?? "—"} />
      </Section>

      {rapport.extra_velden?.scope_normen ? (
        <Section title="Normen & scope">
          <Row label="NEN 1010" value={rapport.extra_velden.scope_normen.nen1010 ? "Ja" : "Nee"} />
          <Row label="NEN 3140" value={rapport.extra_velden.scope_normen.nen3140 ? "Ja" : "Nee"} />
          <Row label="Fabrikantrichtlijnen" value={rapport.extra_velden.scope_normen.fabrikant ? "Ja" : "Nee"} />
          <Row label="Eisen netbeheerder" value={rapport.extra_velden.scope_normen.netbeheerder ? "Ja" : "Nee"} />
        </Section>
      ) : null}

      <Section title="Installatie-omschrijving">
        <Row label="Type systeem" value={rapport.extra_velden?.systeem_type ? `${rapport.extra_velden.systeem_type}-gekoppeld` : "—"} />
        <Row label="Aansluitwaarde woning" value={rapport.extra_velden?.aansluitwaarde ?? "—"} />
        <Row
          label="Batterij"
          value={`${rapport.batterij_spec?.merk ?? ""} ${rapport.batterij_spec?.type ?? ""} (${rapport.batterij_spec?.capaciteit_kwh ?? "?"} kWh) — sn: ${formatSns(rapport.batterij_spec?.serienummers, rapport.batterij_spec?.serienummer)}`}
        />
        <Row
          label="Omvormer"
          value={`${rapport.omvormer_spec?.merk ?? ""} ${rapport.omvormer_spec?.type ?? ""} (${rapport.omvormer_spec?.vermogen_kw ?? "?"} kW, ${rapport.omvormer_spec?.fasen ?? "?"}-fase) — sn: ${formatSns(rapport.omvormer_spec?.serienummers, rapport.omvormer_spec?.serienummer)}`}
        />
        {rapport.extra_velden?.heeft_backup_box || rapport.backup_box_spec?.merk || rapport.backup_box_spec?.serienummer || (rapport.backup_box_spec?.serienummers?.length ?? 0) > 0 ? (
          <Row
            label="Backup box"
            value={`${rapport.backup_box_spec?.merk ?? ""} ${rapport.backup_box_spec?.type ?? ""} — sn: ${formatSns(rapport.backup_box_spec?.serienummers, rapport.backup_box_spec?.serienummer)}`}
          />
        ) : null}
        <Row label="Gateway / ATS sn" value={formatSns(rapport.extra_velden?.gateway_serienummers, rapport.extra_velden?.gateway_serienummer)} />
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

      {rapport.extra_velden?.bekabeling_meterkast?.length ? (
        <ChecklistTable title="Bekabeling & meterkast" items={rapport.extra_velden.bekabeling_meterkast} />
      ) : null}

      {rapport.extra_velden?.aarding_beveiliging?.length ? (
        <Section title="Aarding & beveiligingen">
          <ChecklistRows items={rapport.extra_velden.aarding_beveiliging} />
          {typeof rapport.extra_velden.aardweerstand_ohm === "number" ? (
            <div style={{ marginTop: "3mm" }}>
              <Row label="Aardweerstand" value={`${rapport.extra_velden.aardweerstand_ohm} Ω`} />
            </div>
          ) : null}
        </Section>
      ) : null}

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

      {rapport.extra_velden?.heeft_backup && rapport.extra_velden?.backup_check?.length ? (
        <ChecklistTable title="Backup / noodstroom" items={rapport.extra_velden.backup_check} />
      ) : null}

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

      {rapport.extra_velden?.doc_labels?.length ? (
        <ChecklistTable title="Documenten & labels op locatie" items={rapport.extra_velden.doc_labels} />
      ) : null}

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
        {rapport.extra_velden?.opmerkingen_afwijkingen ? (
          <div style={{ marginTop: "3mm" }}>
            <strong>Opmerkingen / afwijkingen:</strong>
            <p style={{ whiteSpace: "pre-wrap", marginTop: "1mm" }}>{rapport.extra_velden.opmerkingen_afwijkingen}</p>
          </div>
        ) : null}
        <p style={{ marginTop: "6mm", whiteSpace: "pre-wrap" }}>{rapport.conformiteitstekst}</p>
      </Section>

      <Section title="Ondertekening" avoidBreak>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10mm" }}>
          <SignBlock title="Installateur" sig={rapport.installateur_handtekening} dataUrl={installateurSigDataUrl ?? null} />
          <SignBlock title="Klant" sig={rapport.klant_handtekening} dataUrl={klantSigDataUrl ?? null} />
        </div>
      </Section>

      {meegeleverdeDocumenten && meegeleverdeDocumenten.length > 0 ? (
        <Section title="Meegeleverde documenten">
          <p style={{ marginTop: 0, marginBottom: "3mm", fontSize: "10pt", color: "#475569" }}>
            De volgende gebruikershandleidingen zijn met dit opleverrapport meegestuurd en zijn online beschikbaar.
          </p>
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

function statusLabel(s: ChecklistItem["status"]): string {
  if (s === "pass") return "OK";
  if (s === "fail") return "Niet OK";
  if (s === "nvt") return "n.v.t.";
  return "—";
}

function ChecklistRows({ items }: { items: ChecklistItem[] }) {
  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={thStyle}>Punt</th>
          <th style={{ ...thStyle, width: "25mm" }}>Status</th>
          <th style={thStyle}>Opmerking</th>
        </tr>
      </thead>
      <tbody>
        {items.map((c) => (
          <tr key={c.key}>
            <td style={tdStyle}>{c.label}</td>
            <td style={{ ...tdStyle, color: c.status === "fail" ? "#dc2626" : c.status === "pass" ? "#16a34a" : "#475569", fontWeight: 600 }}>
              {statusLabel(c.status)}
            </td>
            <td style={tdStyle}>{c.opmerking ?? ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ChecklistTable({ title, items }: { title: string; items: ChecklistItem[] }) {
  return (
    <Section title={title}>
      <ChecklistRows items={items} />
    </Section>
  );
}
