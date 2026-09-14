
export const S03 = () => (
    <section className="mh-secpad" style={{ padding: "96px 0px", background: "var(--surface-page)" }}>
      <div className="mh-container">
        <div className="mh-reveal mh-hidden" style={{ maxWidth: "620px", margin: "0px auto 56px", textAlign: "center" }}>
          <div
            style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--indigo-600)", marginBottom: "14px" }}
          >
            {"Het resultaat in cijfers"}
          </div>
          <h2 style={{ margin: "0px 0px 12px" }}>
            {"Drie dingen die meteen opvielen"}
          </h2>
          <p style={{ fontSize: "17.5px", color: "var(--neutral-600)", margin: "0px", lineHeight: "1.6" }}>
            {"Geen theorie: dit merkte het team van Smart Accu binnen een paar weken."}
          </p>
        </div>
        <div
          className="mh-grid3 mh-reveal mh-hidden"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "52px 40px" }}
        >
          <div
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
              style={{ width: "38px", height: "38px", color: "var(--color-primary)", strokeWidth: "1.5", marginBottom: "18px" }}
              className="lucide lucide-users"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <path d="M16 3.128a4 4 0 0 1 0 7.744" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            <div
              style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "32px", lineHeight: "1.1", letterSpacing: "-0.02em", color: "var(--text-heading)", marginBottom: "8px" }}
            >
              {"4 \u2192 14"}
            </div>
            <p
              style={{ margin: "0px", fontSize: "15.5px", color: "var(--neutral-600)", lineHeight: "1.6", maxWidth: "30ch" }}
            >
              {"Medewerkers in twee jaar, terwijl de administratiedruk gelijk bleef."}
            </p>
          </div>
          <div
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
              style={{ width: "38px", height: "38px", color: "var(--color-primary)", strokeWidth: "1.5", marginBottom: "18px" }}
              className="lucide lucide-zap"
            >
              <path d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z" />
            </svg>
            <div
              style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "32px", lineHeight: "1.1", letterSpacing: "-0.02em", color: "var(--text-heading)", marginBottom: "8px" }}
            >
              {"Zelfde dag"}
            </div>
            <p
              style={{ margin: "0px", fontSize: "15.5px", color: "var(--neutral-600)", lineHeight: "1.6", maxWidth: "30ch" }}
            >
              {"Elke lead opgevolgd. Aanvragen blijven niet meer liggen in een gedeelde mailbox."}
            </p>
          </div>
          <div
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
              style={{ width: "38px", height: "38px", color: "var(--color-primary)", strokeWidth: "1.5", marginBottom: "18px" }}
              className="lucide lucide-database"
            >
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M3 5V19A9 3 0 0 0 21 19V5" />
              <path d="M3 12A9 3 0 0 0 21 12" />
            </svg>
            <div
              style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "32px", lineHeight: "1.1", letterSpacing: "-0.02em", color: "var(--text-heading)", marginBottom: "8px" }}
            >
              {"1 plek"}
            </div>
            <p
              style={{ margin: "0px", fontSize: "15.5px", color: "var(--neutral-600)", lineHeight: "1.6", maxWidth: "30ch" }}
            >
              {"Assortiment bijhouden. De website haalt het automatisch op via de API."}
            </p>
          </div>
        </div>
        <div
          className="mh-reveal mh-hidden"
          style={{ marginTop: "60px", borderRadius: "20px", border: "1px solid var(--indigo-200)", background: "var(--surface-tint)", padding: "32px 36px" }}
        >
          <div
            className="mh-grid2"
            style={{ display: "grid", gridTemplateColumns: "0.8fr 1.2fr", gap: "32px", alignItems: "center" }}
          >
            <div>
              <h3 style={{ fontSize: "22px", margin: "0px 0px 8px" }}>
                {"En verder"}
              </h3>
              <p style={{ margin: "0px", fontSize: "15.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                {"De verschuivingen die het dagelijks werk lichter maakten."}
              </p>
            </div>
            <ul
              style={{ listStyle: "none", margin: "0px", padding: "0px", display: "grid", gridTemplateColumns: "1fr", gap: "13px" }}
            >
              <li
                style={{ display: "flex", gap: "11px", alignItems: "flex-start", fontSize: "15.5px", color: "var(--text-body)", lineHeight: "1.55" }}
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
                  style={{ width: "18px", height: "18px", color: "var(--success)", flex: "0 0 auto", marginTop: "2px" }}
                  className="lucide lucide-check"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {"Offertes gemaakt door het hele kantoor, niet alleen door de eigenaar"}
              </li>
              <li
                style={{ display: "flex", gap: "11px", alignItems: "flex-start", fontSize: "15.5px", color: "var(--text-body)", lineHeight: "1.55" }}
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
                  style={{ width: "18px", height: "18px", color: "var(--success)", flex: "0 0 auto", marginTop: "2px" }}
                  className="lucide lucide-check"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {"Leads automatisch toegewezen, met een opvolgherinnering erbij"}
              </li>
              <li
                style={{ display: "flex", gap: "11px", alignItems: "flex-start", fontSize: "15.5px", color: "var(--text-body)", lineHeight: "1.55" }}
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
                  style={{ width: "18px", height: "18px", color: "var(--success)", flex: "0 0 auto", marginTop: "2px" }}
                  className="lucide lucide-check"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {"Vaste pakketten en actuele prijzen, dus geen verouderde offertes meer"}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
);
