
export const S07 = () => (
    <section id="s-functies" className="mh-secpad" style={{ padding: "96px 0px", background: "var(--surface-tint)" }}>
      <div className="mh-container">
        <div className="mh-reveal" style={{ maxWidth: "640px", margin: "0px auto 56px", textAlign: "center" }}>
          <div
            style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--indigo-600)", marginBottom: "14px" }}
          >
            {"Wat je krijgt"}
          </div>
          <h2 style={{ margin: "0px 0px 12px" }}>
            {"Alles wat in "}
            <span className="sc-interp">
              {"Offertes & subsidie"}
            </span>
            {" zit"}
          </h2>
          <p style={{ fontSize: "18px", color: "var(--neutral-600)", margin: "0px", lineHeight: "1.6" }}>
            {"Geen module die je erbij koopt: dit hoort standaard bij het platform."}
          </p>
        </div>
        <div
          className="mh-grid3 mh-reveal"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "56px 40px" }}
        >
          <div
            className="mh-outcome"
            style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0px 12px" }}
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
              style={{ width: "38px", height: "38px", color: "var(--color-primary)", strokeWidth: "1.5", marginBottom: "20px" }}
              className="lucide lucide-globe"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
            <h3 style={{ fontSize: "20px", margin: "0px 0px 10px", lineHeight: "1.25" }}>
              <span className="sc-interp">
                {"Klaar in minuten"}
              </span>
            </h3>
            <p
              style={{ margin: "0px", fontSize: "15.5px", color: "var(--neutral-600)", lineHeight: "1.6", maxWidth: "34ch" }}
            >
              <span className="sc-interp">
                {"Van schouwgegevens naar een verstuurde offerte zonder tussenstappen."}
              </span>
            </p>
          </div>
          <div
            className="mh-outcome"
            style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0px 12px" }}
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
              style={{ width: "38px", height: "38px", color: "var(--color-primary)", strokeWidth: "1.5", marginBottom: "20px" }}
              className="lucide lucide-user-round-check"
            >
              <path d="M2 21a8 8 0 0 1 13.292-6" />
              <circle cx="10" cy="8" r="5" />
              <path d="m16 19 2 2 4-4" />
            </svg>
            <h3 style={{ fontSize: "20px", margin: "0px 0px 10px", lineHeight: "1.25" }}>
              <span className="sc-interp">
                {"Subsidiemodule"}
              </span>
            </h3>
            <p
              style={{ margin: "0px", fontSize: "15.5px", color: "var(--neutral-600)", lineHeight: "1.6", maxWidth: "34ch" }}
            >
              <span className="sc-interp">
                {"Actuele bedragen en voorwaarden, automatisch bijgewerkt door ons."}
              </span>
            </p>
          </div>
          <div
            className="mh-outcome"
            style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0px 12px" }}
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
              style={{ width: "38px", height: "38px", color: "var(--color-primary)", strokeWidth: "1.5", marginBottom: "20px" }}
              className="lucide lucide-bell"
            >
              <path d="M10.268 21a2 2 0 0 0 3.464 0" />
              <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
            </svg>
            <h3 style={{ fontSize: "20px", margin: "0px 0px 10px", lineHeight: "1.25" }}>
              <span className="sc-interp">
                {"Pakketten en staffels"}
              </span>
            </h3>
            <p
              style={{ margin: "0px", fontSize: "15.5px", color: "var(--neutral-600)", lineHeight: "1.6", maxWidth: "34ch" }}
            >
              <span className="sc-interp">
                {"Vaste combinaties met je eigen inkoopprijzen en marge per regel."}
              </span>
            </p>
          </div>
          <div
            className="mh-outcome"
            style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0px 12px" }}
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
              style={{ width: "38px", height: "38px", color: "var(--color-primary)", strokeWidth: "1.5", marginBottom: "20px" }}
              className="lucide lucide-layout-grid"
            >
              <rect width="7" height="7" x="3" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="14" rx="1" />
              <rect width="7" height="7" x="3" y="14" rx="1" />
            </svg>
            <h3 style={{ fontSize: "20px", margin: "0px 0px 10px", lineHeight: "1.25" }}>
              <span className="sc-interp">
                {"Jouw huisstijl"}
              </span>
            </h3>
            <p
              style={{ margin: "0px", fontSize: "15.5px", color: "var(--neutral-600)", lineHeight: "1.6", maxWidth: "34ch" }}
            >
              <span className="sc-interp">
                {"Logo, kleuren en voorwaarden. Elke offerte ziet er hetzelfde uit."}
              </span>
            </p>
          </div>
          <div
            className="mh-outcome"
            style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0px 12px" }}
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
              style={{ width: "38px", height: "38px", color: "var(--color-primary)", strokeWidth: "1.5", marginBottom: "20px" }}
              className="lucide lucide-notebook-pen"
            >
              <path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4" />
              <path d="M2 6h4" />
              <path d="M2 10h4" />
              <path d="M2 14h4" />
              <path d="M2 18h4" />
              <path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" />
            </svg>
            <h3 style={{ fontSize: "20px", margin: "0px 0px 10px", lineHeight: "1.25" }}>
              <span className="sc-interp">
                {"Digitale handtekening"}
              </span>
            </h3>
            <p
              style={{ margin: "0px", fontSize: "15.5px", color: "var(--neutral-600)", lineHeight: "1.6", maxWidth: "34ch" }}
            >
              <span className="sc-interp">
                {"Rechtsgeldig ondertekend, met tijdstempel in het dossier."}
              </span>
            </p>
          </div>
          <div
            className="mh-outcome"
            style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0px 12px" }}
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
              style={{ width: "38px", height: "38px", color: "var(--color-primary)", strokeWidth: "1.5", marginBottom: "20px" }}
              className="lucide lucide-pie-chart"
            >
              <path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z" />
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
            </svg>
            <h3 style={{ fontSize: "20px", margin: "0px 0px 10px", lineHeight: "1.25" }}>
              <span className="sc-interp">
                {"Zien wanneer hij geopend is"}
              </span>
            </h3>
            <p
              style={{ margin: "0px", fontSize: "15.5px", color: "var(--neutral-600)", lineHeight: "1.6", maxWidth: "34ch" }}
            >
              <span className="sc-interp">
                {"Je weet wanneer je moet nabellen, en met welk argument."}
              </span>
            </p>
          </div>
        </div>
        <div
          className="mh-cta mh-reveal"
          style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap", marginTop: "56px" }}
        >
          <div className="sc-host-x" style={{ display: "contents" }}>
            <a
              href="/demo"
              className="mh-btn"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "var(--font-body)", fontWeight: "var(--fw-semibold)", lineHeight: "1", border: "1px solid transparent", borderRadius: "var(--radius-md)", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)", height: "var(--control-h-hero)", padding: "0px 28px", fontSize: "17px", background: "var(--color-primary)", color: "var(--white)" }}
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
              {"Laat dit live zien"}
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
