import type { ChecklistItem, Handtekening } from "../types";

export const tableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: "10pt" };
export const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "4px 6px",
  borderBottom: "1px solid #cbd5e1",
  background: "#f8fafc",
  color: "#475569",
};
export const tdStyle: React.CSSProperties = { padding: "4px 6px", borderBottom: "1px solid #e5e7eb", verticalAlign: "top" };

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "8mm", pageBreakInside: "avoid", breakInside: "avoid" }}>
      <h2 style={{ fontSize: "13pt", color: "#111827", borderBottom: "1px solid #e5e7eb", paddingBottom: "2mm", marginBottom: "3mm" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "45mm 1fr", gap: "4mm", marginBottom: "1mm" }}>
      <div style={{ color: "#6b7280" }}>{label}</div>
      <div>{value}</div>
    </div>
  );
}

export function statusLabel(s: ChecklistItem["status"]): string {
  if (s === "pass") return "OK";
  if (s === "fail") return "Niet OK";
  if (s === "nvt") return "n.v.t.";
  return "—";
}

export function ChecklistRows({ items }: { items: ChecklistItem[] }) {
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
            <td
              style={{
                ...tdStyle,
                color: c.status === "fail" ? "#dc2626" : c.status === "pass" ? "#16a34a" : "#475569",
                fontWeight: 600,
              }}
            >
              {statusLabel(c.status)}
            </td>
            <td style={tdStyle}>{c.opmerking ?? ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function SignBlock({ title, sig, dataUrl }: { title: string; sig: Handtekening | null; dataUrl?: string | null }) {
  return (
    <div>
      <div style={{ fontSize: "10pt", color: "#6b7280", marginBottom: "2mm" }}>{title}</div>
      <div style={{ height: "30mm", border: "1px dashed #cbd5e1", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {dataUrl ? (
          <img src={dataUrl} alt="handtekening" crossOrigin="anonymous" style={{ maxHeight: "28mm", maxWidth: "100%", objectFit: "contain" }} />
        ) : sig ? (
          <div style={{ textAlign: "center", padding: "0 4mm" }}>
            <div style={{ fontFamily: "'Segoe Script', 'Brush Script MT', cursive", fontSize: "18pt", color: "#111827", lineHeight: 1 }}>
              {sig.name}
            </div>
            <div style={{ fontSize: "8pt", color: "#16a34a", marginTop: "2mm", fontWeight: 600 }}>Digitaal ondertekend</div>
          </div>
        ) : (
          <span style={{ color: "#94a3b8" }}>Niet ondertekend</span>
        )}
      </div>
      {sig ? (
        <div style={{ fontSize: "9pt", color: "#475569", marginTop: "2mm" }}>
          {sig.name} — {new Date(sig.signed_at).toLocaleString("nl-NL")}
        </div>
      ) : null}
    </div>
  );
}
