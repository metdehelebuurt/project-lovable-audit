import { forwardRef } from "react";
import type { Keuring, ChecklistItem } from "./types";
import { RESULTAAT_LABELS, TYPE_LABELS } from "./types";

interface Props {
  keuring: Keuring;
  checklist: ChecklistItem[];
  partnerNaam?: string;
  partnerLogoUrl?: string;
  partnerContact?: string;
  klantNaam?: string;
  klantContact?: string;
}

const KeuringRapportPDF = forwardRef<HTMLDivElement, Props>(function KeuringRapportPDF(
  { keuring, checklist, partnerNaam, partnerLogoUrl, partnerContact, klantNaam, klantContact },
  ref,
) {
  const grouped = new Map<string, ChecklistItem[]>();
  for (const it of [...checklist].sort((a, b) => a.volgorde - b.volgorde)) {
    const arr = grouped.get(it.categorie) ?? [];
    arr.push(it);
    grouped.set(it.categorie, arr);
  }

  const stats = {
    ok: checklist.filter((i) => i.antwoord === "ok").length,
    nok: checklist.filter((i) => i.antwoord === "nok").length,
    nvt: checklist.filter((i) => i.antwoord === "nvt").length,
    open: checklist.filter((i) => !i.antwoord).length,
  };

  return (
    <div
      ref={ref}
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "16mm",
        background: "white",
        color: "#0f172a",
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: "10pt",
        lineHeight: 1.4,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", borderBottom: "2px solid #6d28d9", paddingBottom: 12, marginBottom: 16 }}>
        <div>
          {partnerLogoUrl ? <img src={partnerLogoUrl} alt={partnerNaam ?? ""} style={{ maxHeight: 50, marginBottom: 6 }} /> : null}
          <div style={{ fontSize: 11, fontWeight: 600 }}>{partnerNaam}</div>
          {partnerContact ? <div style={{ fontSize: 9, color: "#475569" }}>{partnerContact}</div> : null}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#6d28d9" }}>Keuringsrapport</div>
          <div style={{ fontSize: 11, fontWeight: 600 }}>{keuring.keuringnummer}</div>
          <div style={{ fontSize: 9, color: "#475569" }}>{TYPE_LABELS[keuring.type]}</div>
          <div style={{ fontSize: 9, color: "#475569", marginTop: 4 }}>
            Normenkader: {keuring.normenkader.join(" · ")}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ background: "#fef3c7", border: "1px solid #fde68a", padding: 8, borderRadius: 6, fontSize: 8.5, marginBottom: 12, color: "#78350f" }}>
        <strong>Let op:</strong> Deze specificatie is met zorg samengesteld maar kan fouten bevatten. Controleer alle gegevens zelf zorgvuldig. Aan deze rapportage kunnen geen rechten worden ontleend.
      </div>

      {/* Klant + datums */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <Block title="Object / klant">
          <div style={{ fontWeight: 600 }}>{klantNaam ?? keuring.object_omschrijving ?? "—"}</div>
          {klantContact ? <div style={{ fontSize: 9, color: "#475569" }}>{klantContact}</div> : null}
          <div style={{ fontSize: 9, marginTop: 4 }}>
            {[keuring.locatie_adres, keuring.locatie_postcode, keuring.locatie_plaats].filter(Boolean).join(" · ") || "—"}
          </div>
        </Block>
        <Block title="Keuring">
          <Row label="Geplande datum" value={fmtDate(keuring.geplande_datum)} />
          <Row label="Uitgevoerd op" value={keuring.uitgevoerd_op ? fmtDateTime(keuring.uitgevoerd_op) : "—"} />
          <Row label="Uitgevoerd door" value={keuring.uitgevoerd_door_naam ?? "—"} />
          {keuring.uitgevoerd_door_certificering ? (
            <Row label="Certificering" value={keuring.uitgevoerd_door_certificering} />
          ) : null}
          <Row label="Volgende keuring" value={keuring.volgende_keuring_datum ? fmtDate(keuring.volgende_keuring_datum) : "—"} />
        </Block>
      </div>

      {/* Resultaat */}
      <div style={{ background: "#f1f5f9", padding: 12, borderRadius: 6, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 }}>Eindresultaat</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: resultaatColor(keuring.resultaat) }}>
              {keuring.resultaat ? RESULTAAT_LABELS[keuring.resultaat] : "Nog niet bepaald"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 9 }}>
            <Stat label="OK" value={stats.ok} color="#16a34a" />
            <Stat label="Niet OK" value={stats.nok} color="#dc2626" />
            <Stat label="N.v.t." value={stats.nvt} color="#64748b" />
            <Stat label="Open" value={stats.open} color="#a16207" />
            {keuring.score_percentage !== null ? (
              <Stat label="Score" value={`${keuring.score_percentage}%`} color="#6d28d9" />
            ) : null}
          </div>
        </div>
      </div>

      {/* Checklist */}
      {Array.from(grouped.entries()).map(([cat, list]) => (
        <div key={cat} style={{ marginBottom: 12, breakInside: "avoid" as const }}>
          <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 4, color: "#6d28d9" }}>{cat}</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
            <thead>
              <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                <th style={th}>#</th>
                <th style={th}>Inspectiepunt</th>
                <th style={th}>Norm</th>
                <th style={{ ...th, width: 60 }}>Resultaat</th>
                <th style={th}>Opmerking / meetwaarde</th>
              </tr>
            </thead>
            <tbody>
              {list.map((it, i) => (
                <tr key={it.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={td}>{i + 1}</td>
                  <td style={td}>
                    {it.label}
                    {it.blokkerend ? <span style={{ color: "#dc2626", marginLeft: 4 }}>*</span> : null}
                  </td>
                  <td style={{ ...td, color: "#475569" }}>{it.norm_referentie ?? "—"}</td>
                  <td style={{ ...td, fontWeight: 600, color: antwoordColor(it.antwoord) }}>
                    {it.antwoord ? it.antwoord.toUpperCase() : "—"}
                  </td>
                  <td style={td}>
                    {[it.meetwaarde, it.opmerking].filter(Boolean).join(" — ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Conclusie */}
      {(keuring.conclusie || keuring.aanbevelingen) && (
        <div style={{ marginTop: 12, padding: 10, border: "1px solid #e2e8f0", borderRadius: 6, breakInside: "avoid" as const }}>
          {keuring.conclusie ? (
            <>
              <div style={{ fontWeight: 700, fontSize: 10, marginBottom: 4 }}>Conclusie</div>
              <div style={{ fontSize: 9, whiteSpace: "pre-wrap", marginBottom: 8 }}>{keuring.conclusie}</div>
            </>
          ) : null}
          {keuring.aanbevelingen ? (
            <>
              <div style={{ fontWeight: 700, fontSize: 10, marginBottom: 4 }}>Aanbevelingen</div>
              <div style={{ fontSize: 9, whiteSpace: "pre-wrap" }}>{keuring.aanbevelingen}</div>
            </>
          ) : null}
        </div>
      )}

      {/* Handtekeningen */}
      <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, breakInside: "avoid" as const }}>
        <SignatureBlock title="Inspecteur" naam={keuring.uitgevoerd_door_naam} signature={keuring.handtekening_monteur} datum={keuring.uitgevoerd_op} />
        <SignatureBlock title="Klant / opdrachtgever" naam={keuring.handtekening_klant_naam} signature={keuring.handtekening_klant} datum={keuring.uitgevoerd_op} />
      </div>

      <div style={{ marginTop: 16, fontSize: 8, color: "#64748b", textAlign: "center" }}>
        Rapport gegenereerd op {new Date().toLocaleString("nl-NL")} · {keuring.keuringnummer}
      </div>
    </div>
  );
});

const th: React.CSSProperties = { padding: "4px 6px", fontSize: 8.5, fontWeight: 600, borderBottom: "1px solid #cbd5e1" };
const td: React.CSSProperties = { padding: "4px 6px", verticalAlign: "top" };

function fmtDate(s: string) { return new Date(s).toLocaleDateString("nl-NL"); }
function fmtDateTime(s: string) { return new Date(s).toLocaleString("nl-NL"); }
function antwoordColor(a: string | null) {
  if (a === "ok") return "#16a34a";
  if (a === "nok") return "#dc2626";
  if (a === "nvt") return "#64748b";
  return "#a16207";
}
function resultaatColor(r: Keuring["resultaat"]) {
  if (r === "goedgekeurd") return "#16a34a";
  if (r === "afgekeurd") return "#dc2626";
  if (r === "goedgekeurd_met_opmerkingen") return "#a16207";
  return "#475569";
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 6, padding: 8 }}>
      <div style={{ fontSize: 8.5, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{title}</div>
      {children}
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, marginBottom: 2 }}>
      <span style={{ color: "#475569" }}>{label}</span><span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}
function Stat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 14, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 8, color: "#64748b" }}>{label}</div>
    </div>
  );
}
function SignatureBlock({ title, naam, signature, datum }: { title: string; naam: string | null; signature: string | null; datum: string | null }) {
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 6, padding: 10, minHeight: 100 }}>
      <div style={{ fontSize: 8.5, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{title}</div>
      {signature ? (
        <img src={signature} alt={`Handtekening ${title}`} style={{ maxHeight: 60, maxWidth: "100%" }} />
      ) : (
        <div style={{ height: 60, borderBottom: "1px dashed #cbd5e1" }} />
      )}
      <div style={{ fontSize: 9, marginTop: 6 }}>{naam ?? "—"}</div>
      <div style={{ fontSize: 8, color: "#64748b" }}>{datum ? fmtDateTime(datum) : ""}</div>
    </div>
  );
}

export default KeuringRapportPDF;