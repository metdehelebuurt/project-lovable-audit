
export const S05 = () => (
    <section className="mh-secpad" style={{ padding: "88px 0px", background: "var(--surface-tint)" }}>
      <div className="mh-container">
        <div className="mh-reveal mh-hidden" style={{ maxWidth: "660px", marginBottom: "38px" }}>
          <div
            style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--indigo-600)", marginBottom: "14px" }}
          >
            {"Altijd inbegrepen"}
          </div>
          <h2 style={{ margin: "0px 0px 10px" }}>
            {"Waar je niet extra voor betaalt"}
          </h2>
          <p style={{ margin: "0px", fontSize: "17px", color: "var(--neutral-600)", lineHeight: "1.6" }}>
            {"De kosten die bij andere pakketten pas in de offerte opduiken, zitten hier gewoon bij de prijs."}
          </p>
        </div>
        <div
          className="mh-grid3 mh-reveal mh-hidden"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "40px 34px" }}
        >
          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
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
              style={{ width: "26px", height: "26px", color: "var(--color-primary)", strokeWidth: "1.5", flex: "0 0 auto", marginTop: "2px" }}
              className="lucide lucide-rocket"
            >
              <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
              <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09" />
              <path d="M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z" />
              <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05" />
            </svg>
            <div>
              <h3 style={{ fontSize: "17.5px", margin: "0px 0px 7px", lineHeight: "1.3" }}>
                <span className="sc-interp">
                  {"Geen implementatiekosten"}
                </span>
              </h3>
              <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                <span className="sc-interp">
                  {"Je account staat klaar en je richt het zelf in. Wil je hulp, dan doen we het samen, zonder projectfactuur achteraf."}
                </span>
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
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
              style={{ width: "26px", height: "26px", color: "var(--color-primary)", strokeWidth: "1.5", flex: "0 0 auto", marginTop: "2px" }}
              className="lucide lucide-database"
            >
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M3 5V19A9 3 0 0 0 21 19V5" />
              <path d="M3 12A9 3 0 0 0 21 12" />
            </svg>
            <div>
              <h3 style={{ fontSize: "17.5px", margin: "0px 0px 7px", lineHeight: "1.3" }}>
                <span className="sc-interp">
                  {"Datamigratie standaard inbegrepen"}
                </span>
              </h3>
              <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                <span className="sc-interp">
                  {"Klanten, producten en lopende projecten uit Excel of je huidige pakket nemen we mee tijdens de onboarding."}
                </span>
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
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
              style={{ width: "26px", height: "26px", color: "var(--color-primary)", strokeWidth: "1.5", flex: "0 0 auto", marginTop: "2px" }}
              className="lucide lucide-plug"
            >
              <path d="M12 22v-5" />
              <path d="M15 8V2" />
              <path d="M17 8a1 1 0 0 1 1 1v4a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1z" />
              <path d="M9 8V2" />
            </svg>
            <div>
              <h3 style={{ fontSize: "17.5px", margin: "0px 0px 7px", lineHeight: "1.3" }}>
                <span className="sc-interp">
                  {"Koppelingen zonder meerprijs"}
                </span>
              </h3>
              <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                <span className="sc-interp">
                  {"Exact, Twinfield en Snelstart zitten erbij. Geen losse licentie, geen koppelkosten per transactie."}
                </span>
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
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
              style={{ width: "26px", height: "26px", color: "var(--color-primary)", strokeWidth: "1.5", flex: "0 0 auto", marginTop: "2px" }}
              className="lucide lucide-headset"
            >
              <path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z" />
              <path d="M21 16v2a4 4 0 0 1-4 4h-5" />
            </svg>
            <div>
              <h3 style={{ fontSize: "17.5px", margin: "0px 0px 7px", lineHeight: "1.3" }}>
                <span className="sc-interp">
                  {"Nederlandse support"}
                </span>
              </h3>
              <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                <span className="sc-interp">
                  {"Je krijgt iemand aan de lijn die het vak kent, ook vroeg in de ochtend als de bus al rijdt."}
                </span>
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
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
              style={{ width: "26px", height: "26px", color: "var(--color-primary)", strokeWidth: "1.5", flex: "0 0 auto", marginTop: "2px" }}
              className="lucide lucide-infinity"
            >
              <path d="M6 16c5 0 7-8 12-8a4 4 0 0 1 0 8c-5 0-7-8-12-8a4 4 0 1 0 0 8" />
            </svg>
            <div>
              <h3 style={{ fontSize: "17.5px", margin: "0px 0px 7px", lineHeight: "1.3" }}>
                <span className="sc-interp">
                  {"Onbeperkt projecten en dossiers"}
                </span>
              </h3>
              <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                <span className="sc-interp">
                  {"Je betaalt voor je plan, niet per klus, per dossier of per opgeslagen document."}
                </span>
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
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
              style={{ width: "26px", height: "26px", color: "var(--color-primary)", strokeWidth: "1.5", flex: "0 0 auto", marginTop: "2px" }}
              className="lucide lucide-calendar-x"
            >
              <path d="M8 2v3" />
              <path d="M16 2v3" />
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
              <path d="m14 13-4 4" />
              <path d="m10 13 4 4" />
            </svg>
            <div>
              <h3 style={{ fontSize: "17.5px", margin: "0px 0px 7px", lineHeight: "1.3" }}>
                <span className="sc-interp">
                  {"Maandelijks opzegbaar"}
                </span>
              </h3>
              <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                <span className="sc-interp">
                  {"Geen jaarcontract als je dat niet wilt. Je data blijft van jou en exporteer je op elk moment."}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
);
