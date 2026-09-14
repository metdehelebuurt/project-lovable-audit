
export const S12 = () => (
    <section
      className="mh-secpad"
      style={{ background: "var(--surface-dark)", color: "var(--text-on-dark)", padding: "88px 0px" }}
    >
      <div className="mh-container" style={{ textAlign: "center" }}>
        <h2 className="mh-reveal" style={{ color: "rgb(255, 255, 255)", margin: "0px 0px 14px" }}>
          {"Zie "}
          <span className="sc-interp">
            {"Planning & werkbonnen"}
          </span>
          {" werken met jouw projecten"}
        </h2>
        <p
          className="mh-reveal"
          style={{ fontSize: "18px", color: "var(--text-on-dark-muted)", maxWidth: "52ch", margin: "0px auto 28px" }}
        >
          {"In een demo van 30 minuten laten we het live zien. Liever zelf proberen? Dat kan 14 dagen gratis."}
        </p>
        <div className="mh-reveal" style={{ display: "flex", justifyContent: "center" }}>
          <div className="mh-cta" style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <div className="sc-host-x" style={{ display: "contents" }}>
              <a
                href="/demo"
                className="mh-btn"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "var(--font-body)", fontWeight: "var(--fw-semibold)", lineHeight: "1", border: "1px solid transparent", borderRadius: "var(--radius-md)", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)", height: "var(--control-h-hero)", padding: "0px 28px", fontSize: "17px", background: "var(--white)", color: "var(--night-indigo)" }}
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
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "var(--font-body)", fontWeight: "var(--fw-semibold)", lineHeight: "1", border: "1px solid transparent", borderRadius: "var(--radius-md)", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)", height: "var(--control-h-hero)", padding: "0px 28px", fontSize: "17px", background: "var(--color-accent)", color: "var(--white)" }}
              >
                <span className="sc-interp">
                  {"Start gratis"}
                </span>
              </a>
            </div>
          </div>
        </div>
        <p
          className="mh-reveal"
          style={{ margin: "22px 0px 0px", fontSize: "15px", color: "var(--text-on-dark-muted)" }}
        >
          {"Liever eerst even sparren? App Bas op "}
          <a
            href="https://wa.me/31644666645"
            target="_blank"
            rel="noopener"
            style={{ color: "rgb(255, 255, 255)", fontWeight: "600" }}
          >
            {"06-44666645"}
          </a>
          {" of bel 085-8000272."}
        </p>
      </div>
    </section>
);
