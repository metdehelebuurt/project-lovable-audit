
export const S06 = () => (
    <section className="mh-secpad" style={{ padding: "96px 0px", background: "var(--surface-page)" }}>
      <div className="mh-container">
        <div className="mh-reveal" style={{ maxWidth: "620px", marginBottom: "12px" }}>
          <div
            style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-primary)", marginBottom: "14px" }}
          >
            {"Hoe het werkt"}
          </div>
          <h2 style={{ margin: "0px" }}>
            {"Zo werkt het: van lead tot service"}
          </h2>
        </div>
        <div className="mh-reveal" style={{ margin: "10px 0px -2px" }}>
          <div className="sc-host-x" style={{ display: "contents" }}>
            <svg
              viewBox="0 0 1000 80"
              width="100%"
              height="80"
              preserveAspectRatio="none"
              aria-hidden="true"
              style={{ overflow: "visible" }}
            >
              <path d="M0 40 L1000 40" fill="none" stroke="var(--dossier-line)" strokeWidth="var(--dossier-line-width)" strokeLinecap="round" strokeDasharray="6 8" style={{ strokeDasharray: "1000", strokeDashoffset: "1000" }} />
              <g>
                <circle cx="0" cy="40" r="11" fill="var(--white)" stroke="var(--indigo-500)" strokeWidth="2" />
                <text
                  x="0"
                  y="44"
                  textAnchor="middle"
                  fontFamily="var(--font-display)"
                  fontSize="11"
                  fontWeight="700"
                  fill="var(--indigo-500)"
                >
                  {"1"}
                </text>
              </g>
              <g>
                <circle cx="333.3333333333333" cy="40" r="11" fill="var(--white)" stroke="var(--indigo-500)" strokeWidth="2" />
                <text
                  x="333.3333333333333"
                  y="44"
                  textAnchor="middle"
                  fontFamily="var(--font-display)"
                  fontSize="11"
                  fontWeight="700"
                  fill="var(--indigo-500)"
                >
                  {"2"}
                </text>
              </g>
              <g>
                <circle cx="666.6666666666666" cy="40" r="11" fill="var(--white)" stroke="var(--indigo-500)" strokeWidth="2" />
                <text
                  x="666.6666666666666"
                  y="44"
                  textAnchor="middle"
                  fontFamily="var(--font-display)"
                  fontSize="11"
                  fontWeight="700"
                  fill="var(--indigo-500)"
                >
                  {"3"}
                </text>
              </g>
              <g>
                <circle cx="1000" cy="40" r="11" fill="var(--green-500)" stroke="var(--green-500)" strokeWidth="2" />
                <path d="M996 40 l3 3 l6 -6" fill="none" stroke="var(--white)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </svg>
          </div>
        </div>
        <div
          className="mh-grid4 mh-reveal"
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}
        >
          <div className="mh-step">
            <div
              style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "15px", color: "var(--color-primary)", marginBottom: "8px" }}
            >
              {"Stap 1"}
            </div>
            <h3 style={{ fontSize: "19px", margin: "0px 0px 8px" }}>
              {"Lead komt binnen"}
            </h3>
            <p style={{ margin: "0px", fontSize: "15px", color: "var(--text-muted)", lineHeight: "1.55" }}>
              {"Vanuit je website of campagne, automatisch in je sales-CRM, gekwalificeerd en toegewezen aan een adviseur."}
            </p>
          </div>
          <div className="mh-step">
            <div
              style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "15px", color: "var(--color-primary)", marginBottom: "8px" }}
            >
              {"Stap 2"}
            </div>
            <h3 style={{ fontSize: "19px", margin: "0px 0px 8px" }}>
              {"Schouw & offerte in \u00e9\u00e9n bezoek"}
            </h3>
            <p style={{ margin: "0px", fontSize: "15px", color: "var(--text-muted)", lineHeight: "1.55" }}>
              {"Foto's, metingen en dakvlak op de tablet; offerte met subsidie in 5 minuten, digitaal ondertekend."}
            </p>
          </div>
          <div className="mh-step">
            <div
              style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "15px", color: "var(--color-primary)", marginBottom: "8px" }}
            >
              {"Stap 3"}
            </div>
            <h3 style={{ fontSize: "19px", margin: "0px 0px 8px" }}>
              {"Plannen en uitvoeren"}
            </h3>
            <p style={{ margin: "0px", fontSize: "15px", color: "var(--text-muted)", lineHeight: "1.55" }}>
              {"De planning vult zich, de monteur krijgt de werkbon op zijn telefoon, ook zonder bereik."}
            </p>
          </div>
          <div className="mh-step">
            <div
              style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "15px", color: "var(--color-primary)", marginBottom: "8px" }}
            >
              {"Stap 4"}
            </div>
            <h3 style={{ fontSize: "19px", margin: "0px 0px 8px" }}>
              {"Opleveren & service"}
            </h3>
            <p style={{ margin: "0px", fontSize: "15px", color: "var(--text-muted)", lineHeight: "1.55" }}>
              {"Digitaal opleverdossier met tweezijdige handtekening; onderhoud stroomt automatisch de planning in."}
            </p>
          </div>
        </div>
        <div className="mh-reveal" style={{ marginTop: "40px" }}>
          <div className="mh-cta" style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center" }}>
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
            style={{ display: "flex", gap: "18px", flexWrap: "wrap", marginTop: "16px", fontSize: "14px", color: "var(--text-muted)" }}
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
                style={{ width: "15px", height: "15px", color: "var(--success)" }}
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
                style={{ width: "15px", height: "15px", color: "var(--success)" }}
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
                style={{ width: "15px", height: "15px", color: "var(--success)" }}
                className="lucide lucide-check"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {"Data veilig in de EU"}
            </span>
          </div>
        </div>
      </div>
    </section>
);
