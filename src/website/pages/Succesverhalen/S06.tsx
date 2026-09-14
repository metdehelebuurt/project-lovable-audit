
export const S06 = () => (
    <section className="mh-secpad" style={{ padding: "88px 0px", background: "var(--surface-page)" }}>
      <div className="mh-container">
        <div className="sc-host-x" style={{ display: "contents" }}>
          <div
            className="mh-card"
            style={{ boxSizing: "border-box", background: "var(--surface-card)", borderRadius: "var(--radius-lg)", padding: "32px", transition: "transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard)", border: "1px solid var(--color-primary)", boxShadow: "0 0 0 3px var(--indigo-50)" }}
          >
            <div
              className="mh-grid2"
              style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "32px", alignItems: "center" }}
            >
              <div>
                <h2 style={{ margin: "0px 0px 10px" }}>
                  {"Ook zo\u2019n verhaal schrijven?"}
                </h2>
                <p
                  style={{ margin: "0px 0px 14px", fontSize: "16.5px", color: "var(--text-body)", lineHeight: "1.6", maxWidth: "52ch" }}
                >
                  {"We laten in 20 minuten zien wat er in jouw keten verandert, met jouw soort projecten. Daarna beslis je zelf."}
                </p>
                <p style={{ margin: "0px", fontSize: "15px", color: "var(--neutral-600)" }}>
                  {"Liever even appen? "}
                  <strong style={{ color: "var(--text-heading)" }}>
                    {"06-44666645"}
                  </strong>
                  {" \u00b7 Bas, salesmanager"}
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="sc-host-x" style={{ display: "contents" }}>
                  <a
                    href="/demo"
                    className="mh-btn"
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "var(--font-body)", fontWeight: "var(--fw-semibold)", lineHeight: "1", border: "1px solid transparent", borderRadius: "var(--radius-md)", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)", height: "var(--control-h-hero)", padding: "0px 28px", fontSize: "17px", background: "var(--color-primary)", color: "var(--white)", width: "100%" }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      style={{ width: "18px", height: "18px" }}
                      className="lucide lucide-calendar-check"
                    >
                      <path d="M8 2v3" />
                      <path d="M16 2v3" />
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M3 9h18" />
                      <path d="m9 15 2 2 4-4" />
                    </svg>
                    {"Plan een gratis demo"}
                  </a>
                </div>
                <div className="sc-host-x" style={{ display: "contents" }}>
                  <a
                    href="/proefperiode"
                    className="mh-btn"
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "var(--font-body)", fontWeight: "var(--fw-semibold)", lineHeight: "1", border: "1px solid transparent", borderRadius: "var(--radius-md)", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)", height: "var(--control-h-hero)", padding: "0px 28px", fontSize: "17px", background: "var(--color-accent)", color: "var(--white)", width: "100%" }}
                  >
                    <span className="sc-interp">
                      {"Start gratis"}
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
);
