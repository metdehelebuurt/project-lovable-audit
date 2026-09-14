export const MobileMenu = () => (
      <div
        style={{ padding: "8px 20px 20px", borderTop: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: "2px" }}
      >
        <a href="/functionaliteiten" style={{ padding: "11px 8px", fontWeight: "600", color: "var(--text-body)" }}>
          <span className="sc-interp">
            {"Oplossingen"}
          </span>
        </a>
        <a href="/branches" style={{ padding: "11px 8px", fontWeight: "600", color: "var(--text-body)" }}>
          <span className="sc-interp">
            {"Branches"}
          </span>
        </a>
        <a href="/prijzen" style={{ padding: "11px 8px", fontWeight: "600", color: "var(--text-body)" }}>
          <span className="sc-interp">
            {"Prijzen"}
          </span>
        </a>
        <a href="/succesverhalen" style={{ padding: "11px 8px", fontWeight: "600", color: "var(--text-body)" }}>
          <span className="sc-interp">
            {"Succesverhalen"}
          </span>
        </a>
        <a href="/contact" style={{ padding: "11px 8px", fontWeight: "600", color: "var(--text-body)" }}>
          <span className="sc-interp">
            {"Contact"}
          </span>
        </a>
        <a href="/login" style={{ padding: "11px 8px", fontWeight: "600", color: "var(--text-body)" }}>
          {"Inloggen"}
        </a>
        <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="sc-host-x" style={{ display: "contents" }}>
            <a
              href="/demo"
              className="mh-btn"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "var(--font-body)", fontWeight: "var(--fw-semibold)", lineHeight: "1", border: "1px solid transparent", borderRadius: "var(--radius-md)", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)", height: "var(--control-h)", padding: "0px 22px", fontSize: "16px", background: "var(--color-primary)", color: "var(--white)", width: "100%" }}
            >
              {"Plan een demo"}
            </a>
          </div>
          <div className="sc-host-x" style={{ display: "contents" }}>
            <a
              href="/proefperiode"
              className="mh-btn"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "var(--font-body)", fontWeight: "var(--fw-semibold)", lineHeight: "1", border: "1px solid transparent", borderRadius: "var(--radius-md)", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)", height: "var(--control-h)", padding: "0px 22px", fontSize: "16px", background: "var(--color-accent)", color: "var(--white)", width: "100%" }}
            >
              <span className="sc-interp">
                {"Start gratis"}
              </span>
            </a>
          </div>
        </div>
      </div>
);
