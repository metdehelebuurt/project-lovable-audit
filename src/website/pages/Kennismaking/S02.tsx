
export const S02 = () => (
    <section className="mh-secpad" style={{ padding: "88px 0px", background: "var(--surface-tint)" }}>
      <div className="mh-container">
        <div style={{ maxWidth: "660px", margin: "0px auto 44px", textAlign: "center" }}>
          <div
            style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--indigo-600)", marginBottom: "14px" }}
          >
            {"Wat past bij jou?"}
          </div>
          <h2 style={{ margin: "0px 0px 12px" }}>
            {"Kennismaking of demo?"}
          </h2>
          <p style={{ fontSize: "17.5px", color: "var(--neutral-600)", margin: "0px", lineHeight: "1.6" }}>
            {"Allebei vrijblijvend en gratis. Het verschil zit in wat je eruit wilt halen."}
          </p>
        </div>
        <div className="mh-grid2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "22px" }}>
          <div
            style={{ borderRadius: "20px", border: "1px solid var(--indigo-300)", background: "var(--surface-page)", boxShadow: "0 0 0 3px var(--indigo-50)", padding: "32px" }}
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
              style={{ width: "32px", height: "32px", color: "var(--color-primary)", strokeWidth: "1.5", flex: "0 0 auto", display: "block", marginBottom: "18px" }}
              className="lucide lucide-coffee"
            >
              <path d="M10 2v2" />
              <path d="M14 2v2" />
              <path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1" />
              <path d="M6 2v2" />
            </svg>
            <h3 style={{ fontSize: "22px", margin: "0px 0px 8px" }}>
              {"Kennismaking \u00b7 20 minuten"}
            </h3>
            <p style={{ margin: "0px 0px 18px", fontSize: "15.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
              {"Voor als je nog ori\u00ebnteert. We bespreken je werkwijze en waar het misloopt, zonder dat je software hoeft te bekijken."}
            </p>
            <ul
              style={{ listStyle: "none", margin: "0px 0px 22px", padding: "0px", display: "flex", flexDirection: "column", gap: "11px" }}
            >
              <li
                style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "15px", color: "var(--text-body)", lineHeight: "1.5" }}
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
                  style={{ width: "17px", height: "17px", color: "var(--success)", flex: "0 0 auto", marginTop: "2px" }}
                  className="lucide lucide-check"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {"Telefonisch of videobellen"}
              </li>
              <li
                style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "15px", color: "var(--text-body)", lineHeight: "1.5" }}
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
                  style={{ width: "17px", height: "17px", color: "var(--success)", flex: "0 0 auto", marginTop: "2px" }}
                  className="lucide lucide-check"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {"Geen schermdelen of presentatie"}
              </li>
              <li
                style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "15px", color: "var(--text-body)", lineHeight: "1.5" }}
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
                  style={{ width: "17px", height: "17px", color: "var(--success)", flex: "0 0 auto", marginTop: "2px" }}
                  className="lucide lucide-check"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {"Eerlijk antwoord of we bij je passen"}
              </li>
            </ul>
            <div className="sc-host-x" style={{ display: "contents" }}>
              <a
                href="/kennismaking"
                className="mh-btn"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "var(--font-body)", fontWeight: "var(--fw-semibold)", lineHeight: "1", border: "1px solid transparent", borderRadius: "var(--radius-md)", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)", height: "var(--control-h)", padding: "0px 22px", fontSize: "16px", background: "var(--color-primary)", color: "var(--white)", width: "100%" }}
              >
                {"Je bent hier"}
              </a>
            </div>
          </div>
          <div
            style={{ borderRadius: "20px", border: "1px solid var(--border-subtle)", background: "var(--surface-page)", padding: "32px" }}
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
              style={{ width: "32px", height: "32px", color: "var(--color-primary)", strokeWidth: "1.5", flex: "0 0 auto", display: "block", marginBottom: "18px" }}
              className="lucide lucide-monitor-play"
            >
              <path d="M15.033 9.44a.647.647 0 0 1 0 1.12l-4.065 2.352a.645.645 0 0 1-.968-.56V7.648a.645.645 0 0 1 .967-.56z" />
              <path d="M12 17v4" />
              <path d="M8 21h8" />
              <rect x="2" y="3" width="20" height="14" rx="2" />
            </svg>
            <h3 style={{ fontSize: "22px", margin: "0px 0px 8px" }}>
              {"Demo \u00b7 30 minuten"}
            </h3>
            <p style={{ margin: "0px 0px 18px", fontSize: "15.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
              {"Voor als je het platform wilt zien werken. We lopen de hele keten door met jouw soort projecten in beeld."}
            </p>
            <ul
              style={{ listStyle: "none", margin: "0px 0px 22px", padding: "0px", display: "flex", flexDirection: "column", gap: "11px" }}
            >
              <li
                style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "15px", color: "var(--text-body)", lineHeight: "1.5" }}
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
                  style={{ width: "17px", height: "17px", color: "var(--success)", flex: "0 0 auto", marginTop: "2px" }}
                  className="lucide lucide-check"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {"Live door schouw, offerte en oplevering"}
              </li>
              <li
                style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "15px", color: "var(--text-body)", lineHeight: "1.5" }}
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
                  style={{ width: "17px", height: "17px", color: "var(--success)", flex: "0 0 auto", marginTop: "2px" }}
                  className="lucide lucide-check"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {"Afgestemd op jouw branche"}
              </li>
              <li
                style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "15px", color: "var(--text-body)", lineHeight: "1.5" }}
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
                  style={{ width: "17px", height: "17px", color: "var(--success)", flex: "0 0 auto", marginTop: "2px" }}
                  className="lucide lucide-check"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {"Neem gerust je kantoor of monteurs mee"}
              </li>
            </ul>
            <div className="sc-host-x" style={{ display: "contents" }}>
              <a
                href="/demo"
                className="mh-btn"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "var(--font-body)", fontWeight: "var(--fw-semibold)", lineHeight: "1", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border-strong)", borderImage: "initial", borderRadius: "var(--radius-md)", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)", height: "var(--control-h)", padding: "0px 22px", fontSize: "16px", background: "var(--white)", color: "var(--color-primary)", width: "100%" }}
              >
                {"Plan liever een demo"}
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
                  style={{ width: "16px", height: "16px" }}
                  className="lucide lucide-arrow-right"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
);
