
export const S15 = () => (
    <section
      className="mh-secpad"
      style={{ background: "var(--surface-dark)", color: "var(--text-on-dark)", padding: "96px 0px" }}
    >
      <div className="mh-container">
        <div
          className="mh-grid2 mh-reveal"
          style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "48px", alignItems: "center" }}
        >
          <div>
            <h2 style={{ color: "rgb(255, 255, 255)", fontSize: "44px", margin: "0px 0px 16px" }}>
              {"Klaar om het zelf te zien?"}
            </h2>
            <p
              style={{ fontSize: "18px", color: "var(--text-on-dark-muted)", lineHeight: "1.6", margin: "0px 0px 28px", maxWidth: "48ch" }}
            >
              {"In een demo van 30 minuten laten we zien hoe mijnhuis.nu werkt voor jouw bedrijf, met jouw soort projecten. Geen verplichtingen, geen gladde verkooppraat."}
            </p>
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
            <div
              style={{ display: "flex", gap: "18px", flexWrap: "wrap", marginTop: "18px", fontSize: "14px", color: "var(--text-on-dark-muted)" }}
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
                {"Data veilig in de EU"}
              </span>
            </div>
            <p style={{ marginTop: "22px", fontSize: "15px", color: "var(--text-on-dark-muted)" }}>
              {"Liever eerst even bellen? "}
              <strong style={{ color: "rgb(255, 255, 255)" }}>
                {"085-8000272"}
              </strong>
              {" \u00b7 info@mijnhuis.nu"}
            </p>
          </div>
          <div
            style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid var(--border-on-dark)", borderRadius: "16px", padding: "28px" }}
          >
            <div style={{ fontWeight: "600", color: "rgb(255, 255, 255)", marginBottom: "16px" }}>
              {"Wat je kunt verwachten"}
            </div>
            <ul
              style={{ listStyle: "none", margin: "0px", padding: "0px", display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <li
                style={{ display: "flex", gap: "12px", alignItems: "flex-start", fontSize: "15.5px", color: "var(--text-on-dark)" }}
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
                  style={{ width: "18px", height: "18px", color: "var(--green-500)", flex: "0 0 auto", marginTop: "2px" }}
                  className="lucide lucide-check"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {"30 minuten, online of bij jou op de zaak"}
              </li>
              <li
                style={{ display: "flex", gap: "12px", alignItems: "flex-start", fontSize: "15.5px", color: "var(--text-on-dark)" }}
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
                  style={{ width: "18px", height: "18px", color: "var(--green-500)", flex: "0 0 auto", marginTop: "2px" }}
                  className="lucide lucide-check"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {"Afgestemd op jouw branche"}
              </li>
              <li
                style={{ display: "flex", gap: "12px", alignItems: "flex-start", fontSize: "15.5px", color: "var(--text-on-dark)" }}
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
                  style={{ width: "18px", height: "18px", color: "var(--green-500)", flex: "0 0 auto", marginTop: "2px" }}
                  className="lucide lucide-check"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {"Al je vragen beantwoord"}
              </li>
              <li
                style={{ display: "flex", gap: "12px", alignItems: "flex-start", fontSize: "15.5px", color: "var(--text-on-dark)" }}
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
                  style={{ width: "18px", height: "18px", color: "var(--green-500)", flex: "0 0 auto", marginTop: "2px" }}
                  className="lucide lucide-check"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {"Geheel vrijblijvend"}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
);
