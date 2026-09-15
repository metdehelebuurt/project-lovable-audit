import { Play } from "lucide-react";
import { TOUR_STAPPEN } from "./tourStappen";

interface Props {
  actief: string;
  onKies: (id: string) => void;
}

const railStyle = (actief: boolean) => ({
  display: "flex",
  gap: "12px",
  alignItems: "flex-start",
  width: "100%",
  padding: "14px 16px",
  borderRadius: "12px",
  cursor: "pointer",
  textAlign: "left" as const,
  transition: "background 0.18s, border-color 0.18s",
  background: actief ? "var(--indigo-50)" : "rgb(255, 255, 255)",
  border: `1px solid ${actief ? "var(--indigo-400)" : "var(--border-subtle)"}`,
  boxShadow: actief ? "inset 3px 0 0 var(--color-primary)" : "none",
});

const icoonStyle = (actief: boolean) => ({
  flex: "0 0 auto",
  width: "34px",
  height: "34px",
  borderRadius: "9px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: actief ? "var(--color-primary)" : "var(--indigo-50)",
  color: actief ? "rgb(255, 255, 255)" : "var(--color-primary)",
});

export const TourRail = ({ actief, onKies }: Props) => (
  <div role="tablist" aria-label="Stappen in de keten" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
    {TOUR_STAPPEN.map((stap) => {
      const isActief = stap.id === actief;
      return (
        <button
          key={stap.id}
          type="button"
          role="tab"
          aria-selected={isActief}
          className="mh-railtab"
          style={railStyle(isActief)}
          onClick={() => onKies(stap.id)}
        >
          <span style={icoonStyle(isActief)}>
            <stap.Icoon aria-hidden="true" style={{ width: "19px", height: "19px" }} />
          </span>
          <span style={{ display: "block", textAlign: "left" }}>
            <span
              style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "15.5px", color: "var(--text-heading)", marginBottom: "2px" }}
            >
              {stap.label}
            </span>
            <span style={{ display: "block", fontSize: "13px", color: "var(--neutral-600)", lineHeight: "1.45" }}>
              {stap.omschrijving}
            </span>
          </span>
        </button>
      );
    })}
    <div
      style={{ marginTop: "12px", padding: "16px 18px", borderRadius: "12px", background: "var(--indigo-50)", border: "1px solid var(--indigo-200)" }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "14.5px", color: "var(--text-heading)", marginBottom: "6px" }}
      >
        <Play aria-hidden="true" style={{ width: "15px", height: "15px", color: "var(--color-primary)", fill: "currentcolor" }} />
        {"Liever live meekijken?"}
      </div>
      <p style={{ margin: "0px 0px 12px", fontSize: "13.5px", color: "var(--neutral-600)", lineHeight: "1.5" }}>
        {"In 20 minuten laten we je hele keten zien met je eigen soort projecten."}
      </p>
      <a
        href="/demo"
        className="mh-btn"
        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "var(--font-body)", fontWeight: "var(--fw-semibold)", lineHeight: "1", border: "1px solid transparent", borderRadius: "var(--radius-md)", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)", height: "var(--control-h-sm)", padding: "0px 16px", fontSize: "14px", background: "var(--color-primary)", color: "var(--white)" }}
      >
        {"Plan een gratis demo"}
      </a>
    </div>
  </div>
);
