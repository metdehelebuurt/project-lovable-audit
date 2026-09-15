import { Zap } from "lucide-react";
import type { TourKolom, TourStap } from "./tourStappen";

const MENU = ["Dashboard", "Leads", "Offertes", "Planning", "Oplevering", "Kennisbank"];

const menuStyle = (actief: boolean) => ({
  fontSize: "12px",
  padding: "8px 10px",
  borderRadius: "8px",
  color: actief ? "rgb(255, 255, 255)" : "var(--text-on-dark-muted)",
  background: actief ? "rgba(255, 255, 255, 0.12)" : "transparent",
  fontWeight: actief ? "600" : "400",
});

const Kolom = ({ kolom }: { kolom: TourKolom }) => (
  <div
    style={{ background: "rgb(255, 255, 255)", border: "1px solid var(--border-subtle)", borderRadius: "10px", padding: "10px" }}
  >
    <div
      style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "9px" }}
    >
      <span>{kolom.titel}</span>
      <span>{kolom.telling}</span>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {kolom.items.map((item) => (
        <div
          key={item.titel}
          style={{ border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "9px 10px", background: "var(--neutral-50)" }}
        >
          <div style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-heading)", marginBottom: "3px" }}>
            {item.titel}
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--text-muted)", lineHeight: "1.45", marginBottom: "6px" }}>
            {item.regel}
          </div>
          <div
            style={{ fontSize: "10.5px", color: "var(--indigo-600)", fontWeight: "600", letterSpacing: "0.03em" }}
          >
            {item.meta}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const TourScherm = ({ stap }: { stap: TourStap }) => (
  <div>
    <div
      style={{ borderRadius: "14px", overflow: "hidden", background: "rgb(255, 255, 255)", boxShadow: "var(--shadow-product)", border: "1px solid var(--border-subtle)" }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: "8px", padding: "11px 14px", background: "var(--neutral-50)", borderBottom: "1px solid var(--border-subtle)" }}
      >
        <span style={{ width: "10px", height: "10px", borderRadius: "99px", background: "rgb(229, 120, 139)" }}></span>
        <span style={{ width: "10px", height: "10px", borderRadius: "99px", background: "rgb(235, 193, 91)" }}></span>
        <span style={{ width: "10px", height: "10px", borderRadius: "99px", background: "rgb(127, 199, 154)" }}></span>
        <span
          style={{ marginLeft: "10px", flex: "1 1 0%", maxWidth: "340px", height: "22px", borderRadius: "6px", background: "rgb(255, 255, 255)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", padding: "0px 10px", fontFamily: "\"IBM Plex Mono\", ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "11px", color: "var(--text-muted)" }}
        >
          {stap.url}
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", minHeight: "452px" }}>
        <div
          style={{ background: "var(--night-indigo)", padding: "16px 12px", display: "flex", flexDirection: "column", gap: "5px" }}
        >
          {MENU.map((item) => (
            <span key={item} style={menuStyle(item === stap.menuActief)}>{item}</span>
          ))}
          <span
            style={{ marginTop: "auto", fontFamily: "\"IBM Plex Mono\", ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "9.5px", color: "var(--text-on-dark-muted)", letterSpacing: "0.06em" }}
          >
            {"EU-HOSTED \u00b7 AVG"}
          </span>
        </div>
        <div style={{ padding: "20px 22px", background: "var(--neutral-50)" }}>
          <div
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}
          >
            <div>
              <div
                style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "17px", color: "var(--text-heading)" }}
              >
                {stap.titel}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{stap.ondertitel}</div>
            </div>
            <span
              style={{ fontSize: "11.5px", color: "rgb(255, 255, 255)", background: "var(--green-500)", padding: "6px 11px", borderRadius: "8px", fontWeight: "600", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Zap aria-hidden="true" style={{ width: "12px", height: "12px" }} />
              {stap.badge}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
            {stap.kolommen.map((kolom) => (
              <Kolom key={kolom.titel} kolom={kolom} />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);
