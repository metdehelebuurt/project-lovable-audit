
export const S02 = () => (
    <section className="mh-secpad" style={{ padding: "80px 0px", background: "var(--surface-page)" }}>
      <div className="mh-container">
        <div
          className="mh-split"
          style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: "28px", alignItems: "stretch" }}
        >
          <div
            style={{ background: "var(--surface-page)", borderRadius: "20px", boxShadow: "var(--shadow-lg)", border: "1px solid var(--border-subtle)", padding: "32px", display: "flex", flexDirection: "column" }}
          >
            <h2 style={{ margin: "0px 0px 8px", fontSize: "28px" }}>
              {"Stuur ons een bericht"}
            </h2>
            <p style={{ margin: "0px 0px 24px", fontSize: "15.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
              {"Vertel kort waar je tegenaan loopt. Hoe concreter je vraag, hoe scherper ons antwoord."}
            </p>
            <ContactForm />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div
              style={{ borderRadius: "20px", border: "1px solid var(--indigo-200)", background: "var(--indigo-50)", padding: "26px 24px" }}
            >
              <div style={{ display: "flex", alignItems: "center", margin: "0px 0px 16px 10px" }}>
                <span
                  style={{ width: "44px", height: "44px", borderRadius: "99px", background: "var(--indigo-500)", color: "rgb(255, 255, 255)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "14px", border: "2px solid var(--surface-page)", marginLeft: "-10px" }}
                >
                  {"TH"}
                </span>
                <span
                  style={{ width: "44px", height: "44px", borderRadius: "99px", background: "var(--indigo-600)", color: "rgb(255, 255, 255)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "14px", border: "2px solid var(--surface-page)", marginLeft: "-10px" }}
                >
                  {"SD"}
                </span>
                <span
                  style={{ width: "44px", height: "44px", borderRadius: "99px", background: "var(--indigo-700)", color: "rgb(255, 255, 255)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "14px", border: "2px solid var(--surface-page)", marginLeft: "-10px" }}
                >
                  {"RJ"}
                </span>
                <span
                  style={{ width: "44px", height: "44px", borderRadius: "99px", background: "var(--surface-page)", color: "var(--indigo-700)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "13px", border: "2px solid var(--surface-page)", marginLeft: "-10px", boxShadow: "var(--shadow-sm)" }}
                >
                  {"+6"}
                </span>
              </div>
              <div
                style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "18px", color: "var(--text-heading)", marginBottom: "8px" }}
              >
                {"Wie je aan de lijn krijgt"}
              </div>
              <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                {"Ons team komt uit de installatiebranche: monteurs, werkvoorbereiders en adviseurs. Word je klant, dan krijg je een vaste accountmanager die je bedrijf kent en je wensen omzet in nieuwe functies."}
              </p>
            </div>
            <div
              style={{ borderRadius: "20px", border: "1px solid var(--border-subtle)", background: "var(--surface-page)", padding: "26px 24px" }}
            >
              <div
                style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "12px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--indigo-600)", marginBottom: "16px" }}
              >
                {"Wat je van ons mag verwachten"}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
                <span
                  style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.5" }}
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
                    style={{ width: "16px", height: "16px", color: "var(--success)", flex: "0 0 auto", marginTop: "2px" }}
                    className="lucide lucide-check"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  {"Antwoord binnen 1 werkdag, ook op inhoudelijke vragen"}
                </span>
                <span
                  style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.5" }}
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
                    style={{ width: "16px", height: "16px", color: "var(--success)", flex: "0 0 auto", marginTop: "2px" }}
                    className="lucide lucide-check"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  {"Nederlandse support, geen buitenlands servicedesknummer"}
                </span>
                <span
                  style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.5" }}
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
                    style={{ width: "16px", height: "16px", color: "var(--success)", flex: "0 0 auto", marginTop: "2px" }}
                    className="lucide lucide-check"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  {"Geen verkooppraat, wel een eerlijk advies of we bij je passen"}
                </span>
              </div>
            </div>
            <div
              style={{ flex: "1 1 0%", display: "flex", flexDirection: "column", borderRadius: "20px", border: "1px solid var(--indigo-200)", background: "var(--indigo-50)", padding: "26px 24px" }}
            >
              <div
                style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "12px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--indigo-600)", marginBottom: "8px" }}
              >
                {"Liever even praten?"}
              </div>
              <div
                style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "18px", color: "var(--text-heading)", lineHeight: "1.3", marginBottom: "8px" }}
              >
                {"Plan een kennismaking van 20 minuten"}
              </div>
              <p style={{ margin: "0px 0px 16px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.5" }}>
                {"Geen demo en geen verkooppraat: gewoon jouw situatie doornemen en eerlijk kijken of we bij elkaar passen."}
              </p>
              <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "9px" }}>
                <div className="sc-host-x" style={{ display: "contents" }}>
                  <a
                    href="/kennismaking"
                    className="mh-btn"
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "var(--font-body)", fontWeight: "var(--fw-semibold)", lineHeight: "1", border: "1px solid transparent", borderRadius: "var(--radius-md)", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)", height: "var(--control-h)", padding: "0px 22px", fontSize: "16px", background: "var(--color-primary)", color: "var(--white)", width: "100%" }}
                  >
                    {"Plan een kennismaking"}
                  </a>
                </div>
                <a href="/demo" style={{ textAlign: "center", fontSize: "13.5px", fontWeight: "600" }}>
                  {"Of bekijk het platform in een demo"}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
);
