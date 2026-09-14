
export const S09 = () => (
    <section
      className="mh-secpad"
      style={{ background: "var(--surface-dark)", color: "var(--text-on-dark)", padding: "80px 0px" }}
    >
      <div className="mh-container" style={{ textAlign: "center" }}>
        <h2 className="mh-reveal mh-hidden" style={{ color: "rgb(255, 255, 255)", margin: "0px 0px 14px" }}>
          {"Zie het voor jouw branche"}
        </h2>
        <p
          className="mh-reveal mh-hidden"
          style={{ fontSize: "18px", color: "var(--text-on-dark-muted)", maxWidth: "52ch", margin: "0px auto 28px" }}
        >
          {"In een demo laten we jouw schouw, offerte en oplevering live zien, met jouw soort projecten."}
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
        <div
          className="mh-reveal mh-hidden"
          style={{ display: "flex", gap: "18px", flexWrap: "wrap", justifyContent: "center", marginTop: "18px", fontSize: "14px", color: "var(--text-on-dark-muted)" }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
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
              style={{ width: "15px", height: "15px", color: "var(--green-500)" }}
              className="lucide lucide-check"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {"14 dagen gratis"}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
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
              style={{ width: "15px", height: "15px", color: "var(--green-500)" }}
              className="lucide lucide-check"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {"Geen creditcard nodig"}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
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
              style={{ width: "15px", height: "15px", color: "var(--green-500)" }}
              className="lucide lucide-check"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {"Ingericht voor jouw vakgebied"}
          </span>
        </div>
        <p
          className="mh-reveal mh-hidden"
          style={{ margin: "22px 0px 0px", fontSize: "15px", color: "var(--text-on-dark-muted)" }}
        >
          {"Liever eerst even bellen? "}
          <strong style={{ color: "rgb(255, 255, 255)" }}>
            {"085-8000272"}
          </strong>
          {" \u00b7 info@mijnhuis.nu"}
        </p>
      </div>
    </section>
);
