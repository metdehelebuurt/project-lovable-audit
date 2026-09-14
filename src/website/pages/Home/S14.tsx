
export const S14 = () => (
    <section className="mh-secpad" style={{ padding: "96px 0px", background: "var(--surface-tint)" }}>
      <div className="mh-container">
        <div
          className="mh-faqgrid mh-reveal"
          style={{ display: "grid", gridTemplateColumns: "0.8fr 1.2fr", gap: "40px", alignItems: "start" }}
        >
          <div className="mh-reveal">
            <div
              style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--indigo-600)", marginBottom: "14px" }}
            >
              {"FAQ"}
            </div>
            <h2 style={{ margin: "0px 0px 16px" }}>
              {"Veelgestelde vragen"}
            </h2>
            <div className="sc-host-x" style={{ display: "contents" }}>
              <div
                className="mh-card"
                style={{ boxSizing: "border-box", background: "var(--surface-card)", borderRadius: "var(--radius-lg)", padding: "24px", transition: "transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard)", border: "1px solid var(--border-subtle)", boxShadow: "none" }}
              >
                <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                  {"Andere vraag?"}
                </div>
                <p style={{ margin: "0px 0px 8px", fontSize: "14.5px", color: "var(--neutral-600)" }}>
                  {"Bel of mail ons, we helpen je graag."}
                </p>
                <a href="/demo" style={{ fontWeight: "600" }}>
                  {"085-8000272"}
                </a>
              </div>
            </div>
          </div>
          <div className="mh-reveal" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div
              style={{ border: "1px solid var(--border-subtle)", borderRadius: "14px", background: "rgb(255, 255, 255)", overflow: "hidden" }}
            >
              <button
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "20px 24px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "18px", color: "var(--text-heading)" }}
              >
                <span className="sc-interp">
                  {"Wat kost mijnhuis.nu?"}
                </span>
                <span
                  style={{ display: "inline-flex", flex: "0 0 auto", color: "var(--color-primary)", transform: "rotate(45deg)", transition: "transform var(--dur-base) var(--ease-standard)" }}
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
                    style={{ width: "20px", height: "20px" }}
                    className="lucide lucide-plus"
                  >
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                </span>
              </button>
              <div
                style={{ maxHeight: "640px", overflow: "hidden", transition: "max-height var(--dur-slow) var(--ease-standard)" }}
              >
                <div style={{ padding: "0px 24px 22px", fontSize: "16px", lineHeight: "1.6", color: "var(--text-body)" }}>
                  <span className="sc-interp">
                    {"Je betaalt per gebruiker per maand: Start \u20ac 39, Groei \u20ac 59, Compleet \u20ac 79 (bij jaarbetaling). Inclusief onbeperkte projecten, Nederlandse support en begeleide onboarding, zonder setupkosten."}
                  </span>
                </div>
              </div>
            </div>
            <div
              style={{ border: "1px solid var(--border-subtle)", borderRadius: "14px", background: "rgb(255, 255, 255)", overflow: "hidden" }}
            >
              <button
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "20px 24px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "18px", color: "var(--text-heading)" }}
              >
                <span className="sc-interp">
                  {"Hoe snel kunnen we live?"}
                </span>
                <span
                  style={{ display: "inline-flex", flex: "0 0 auto", color: "var(--color-primary)", transform: "none", transition: "transform var(--dur-base) var(--ease-standard)" }}
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
                    style={{ width: "20px", height: "20px" }}
                    className="lucide lucide-plus"
                  >
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                </span>
              </button>
              <div
                style={{ maxHeight: "0px", overflow: "hidden", transition: "max-height var(--dur-slow) var(--ease-standard)" }}
              >
                <div style={{ padding: "0px 24px 22px", fontSize: "16px", lineHeight: "1.6", color: "var(--text-body)" }}>
                  <span className="sc-interp">
                    {"De meeste bedrijven draaien binnen twee tot drie weken volledig in mijnhuis.nu. Wij richten je account in, importeren je gegevens en trainen je team, je hebt er geen IT-afdeling voor nodig."}
                  </span>
                </div>
              </div>
            </div>
            <div
              style={{ border: "1px solid var(--border-subtle)", borderRadius: "14px", background: "rgb(255, 255, 255)", overflow: "hidden" }}
            >
              <button
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "20px 24px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "18px", color: "var(--text-heading)" }}
              >
                <span className="sc-interp">
                  {"Kunnen we onze bestaande data meenemen?"}
                </span>
                <span
                  style={{ display: "inline-flex", flex: "0 0 auto", color: "var(--color-primary)", transform: "none", transition: "transform var(--dur-base) var(--ease-standard)" }}
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
                    style={{ width: "20px", height: "20px" }}
                    className="lucide lucide-plus"
                  >
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                </span>
              </button>
              <div
                style={{ maxHeight: "0px", overflow: "hidden", transition: "max-height var(--dur-slow) var(--ease-standard)" }}
              >
                <div style={{ padding: "0px 24px 22px", fontSize: "16px", lineHeight: "1.6", color: "var(--text-body)" }}>
                  <span className="sc-interp">
                    {"Ja. Klanten, producten en lopende projecten importeren we samen tijdens de onboarding, meestal vanuit Excel of je huidige pakket."}
                  </span>
                </div>
              </div>
            </div>
            <div
              style={{ border: "1px solid var(--border-subtle)", borderRadius: "14px", background: "rgb(255, 255, 255)", overflow: "hidden" }}
            >
              <button
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "20px 24px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "18px", color: "var(--text-heading)" }}
              >
                <span className="sc-interp">
                  {"Werkt de monteursapp ook zonder internet?"}
                </span>
                <span
                  style={{ display: "inline-flex", flex: "0 0 auto", color: "var(--color-primary)", transform: "none", transition: "transform var(--dur-base) var(--ease-standard)" }}
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
                    style={{ width: "20px", height: "20px" }}
                    className="lucide lucide-plus"
                  >
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                </span>
              </button>
              <div
                style={{ maxHeight: "0px", overflow: "hidden", transition: "max-height var(--dur-slow) var(--ease-standard)" }}
              >
                <div style={{ padding: "0px 24px 22px", fontSize: "16px", lineHeight: "1.6", color: "var(--text-body)" }}>
                  <span className="sc-interp">
                    {"Ja. Werkbonnen, checklists en foto\u2019s werken offline en synchroniseren automatisch zodra er weer bereik is, ook in de meterkast of op het platteland."}
                  </span>
                </div>
              </div>
            </div>
            <div
              style={{ border: "1px solid var(--border-subtle)", borderRadius: "14px", background: "rgb(255, 255, 255)", overflow: "hidden" }}
            >
              <button
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "20px 24px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "18px", color: "var(--text-heading)" }}
              >
                <span className="sc-interp">
                  {"Voldoet het opleverdossier aan de regels?"}
                </span>
                <span
                  style={{ display: "inline-flex", flex: "0 0 auto", color: "var(--color-primary)", transform: "none", transition: "transform var(--dur-base) var(--ease-standard)" }}
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
                    style={{ width: "20px", height: "20px" }}
                    className="lucide lucide-plus"
                  >
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                </span>
              </button>
              <div
                style={{ maxHeight: "0px", overflow: "hidden", transition: "max-height var(--dur-slow) var(--ease-standard)" }}
              >
                <div style={{ padding: "0px 24px 22px", fontSize: "16px", lineHeight: "1.6", color: "var(--text-body)" }}>
                  <span className="sc-interp">
                    {"Het digitale opleverrapport volgt de relevante NEN-normen per branche, krijgt een tijdstempel en hash, en wordt door installateur \u00e9n klant digitaal ondertekend."}
                  </span>
                </div>
              </div>
            </div>
            <div
              style={{ border: "1px solid var(--border-subtle)", borderRadius: "14px", background: "rgb(255, 255, 255)", overflow: "hidden" }}
            >
              <button
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "20px 24px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "18px", color: "var(--text-heading)" }}
              >
                <span className="sc-interp">
                  {"Waar staat onze data en hoe veilig is die?"}
                </span>
                <span
                  style={{ display: "inline-flex", flex: "0 0 auto", color: "var(--color-primary)", transform: "none", transition: "transform var(--dur-base) var(--ease-standard)" }}
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
                    style={{ width: "20px", height: "20px" }}
                    className="lucide lucide-plus"
                  >
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                </span>
              </button>
              <div
                style={{ maxHeight: "0px", overflow: "hidden", transition: "max-height var(--dur-slow) var(--ease-standard)" }}
              >
                <div style={{ padding: "0px 24px 22px", fontSize: "16px", lineHeight: "1.6", color: "var(--text-body)" }}>
                  <span className="sc-interp">
                    {"In de Europese Unie, versleuteld en AVG-conform. Jij bepaalt per rol wie wat ziet, en je data blijft van jou, ook als je ooit vertrekt."}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
);
