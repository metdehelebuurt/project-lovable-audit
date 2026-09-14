
export const S05 = () => (
    <section
      className="mh-secpad"
      style={{ padding: "80px 0px", background: "var(--surface-dark)", color: "var(--text-on-dark)" }}
    >
      <div className="mh-container" style={{ textAlign: "center" }}>
        <h2 className="mh-reveal mh-hidden" style={{ color: "rgb(255, 255, 255)", margin: "0px 0px 14px" }}>
          {"Liever gewoon zien hoe het werkt?"}
        </h2>
        <p
          className="mh-reveal mh-hidden"
          style={{ fontSize: "18px", color: "var(--text-on-dark-muted)", maxWidth: "52ch", margin: "0px auto 28px" }}
        >
          {"Plan een demo van 20 minuten of start meteen zelf. Je zit nergens aan vast."}
        </p>
        <div
          className="mh-cta mh-reveal mh-hidden"
          style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}
        >
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
    </section>
);
