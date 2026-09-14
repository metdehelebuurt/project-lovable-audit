
export const S02 = () => (
    <div
      style={{ background: "rgb(255, 255, 255)", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)" }}
    >
      <div
        className="mh-container"
        style={{ padding: "22px 24px", display: "flex", alignItems: "center", gap: "28px", flexWrap: "wrap" }}
      >
        <span style={{ fontSize: "14px", fontWeight: "500", color: "var(--text-muted)", maxWidth: "220px" }}>
          {"Vertrouwd door installatiebedrijven, en gekoppeld met:"}
        </span>
        <div
          style={{ display: "flex", gap: "30px", flexWrap: "wrap", flex: "1 1 0%", justifyContent: "space-around", opacity: "0.55" }}
        >
          <span
            style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "18px", color: "var(--neutral-600)", filter: "grayscale(1)" }}
          >
            {"SolarEdge"}
          </span>
          <span
            style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "18px", color: "var(--neutral-600)", filter: "grayscale(1)" }}
          >
            {"Enphase"}
          </span>
          <span
            style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "18px", color: "var(--neutral-600)", filter: "grayscale(1)" }}
          >
            {"Exact"}
          </span>
          <span
            style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "18px", color: "var(--neutral-600)", filter: "grayscale(1)" }}
          >
            {"Twinfield"}
          </span>
          <span
            style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "18px", color: "var(--neutral-600)", filter: "grayscale(1)" }}
          >
            {"Snelstart"}
          </span>
          <span
            style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "18px", color: "var(--neutral-600)", filter: "grayscale(1)" }}
          >
            {"Mollie"}
          </span>
        </div>
      </div>
    </div>
);
