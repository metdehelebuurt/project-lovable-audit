
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
            <form style={{ display: "flex", flexDirection: "column", gap: "16px", flex: "1 1 0%" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="sc-host-x" style={{ display: "contents" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                    <label
                      htmlFor=":r8:"
                      style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: "var(--fw-medium)", color: "var(--text-heading)" }}
                    >
                      {"Naam"}
                      <span style={{ color: "var(--color-primary)" }}>
                        {" *"}
                      </span>
                    </label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <input id=":r8:" type="text" required aria-invalid="false" style={{ width: "100%", boxSizing: "border-box", height: "var(--control-h)", padding: "0px 14px", fontFamily: "var(--font-body)", fontSize: "16px", color: "var(--text-body)", background: "var(--white)", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-md)", outline: "none", boxShadow: "none", transition: "border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)" }} />
                    </div>
                  </div>
                </div>
                <div className="sc-host-x" style={{ display: "contents" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                    <label
                      htmlFor=":r9:"
                      style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: "var(--fw-medium)", color: "var(--text-heading)" }}
                    >
                      {"Bedrijfsnaam"}
                    </label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <input id=":r9:" type="text" aria-invalid="false" style={{ width: "100%", boxSizing: "border-box", height: "var(--control-h)", padding: "0px 14px", fontFamily: "var(--font-body)", fontSize: "16px", color: "var(--text-body)", background: "var(--white)", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-md)", outline: "none", boxShadow: "none", transition: "border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)" }} />
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="sc-host-x" style={{ display: "contents" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                    <label
                      htmlFor=":ra:"
                      style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: "var(--fw-medium)", color: "var(--text-heading)" }}
                    >
                      {"E-mailadres"}
                      <span style={{ color: "var(--color-primary)" }}>
                        {" *"}
                      </span>
                    </label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <input id=":ra:" type="email" required aria-invalid="false" style={{ width: "100%", boxSizing: "border-box", height: "var(--control-h)", padding: "0px 14px", fontFamily: "var(--font-body)", fontSize: "16px", color: "var(--text-body)", background: "var(--white)", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-md)", outline: "none", boxShadow: "none", transition: "border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)" }} />
                    </div>
                  </div>
                </div>
                <div className="sc-host-x" style={{ display: "contents" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                    <label
                      htmlFor=":rb:"
                      style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: "var(--fw-medium)", color: "var(--text-heading)" }}
                    >
                      {"Telefoonnummer"}
                    </label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <input id=":rb:" type="tel" aria-invalid="false" style={{ width: "100%", boxSizing: "border-box", height: "var(--control-h)", padding: "0px 14px", fontFamily: "var(--font-body)", fontSize: "16px", color: "var(--text-body)", background: "var(--white)", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-md)", outline: "none", boxShadow: "none", transition: "border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)" }} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="sc-host-x" style={{ display: "contents" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                  <label
                    htmlFor=":rc:"
                    style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: "var(--fw-medium)", color: "var(--text-heading)" }}
                  >
                    {"Onderwerp"}
                  </label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <select
                      id=":rc:"
                      aria-invalid="false"
                      style={{ width: "100%", boxSizing: "border-box", height: "var(--control-h)", padding: "0px 40px 0px 14px", fontFamily: "var(--font-body)", fontSize: "16px", color: "var(--text-muted)", background: "var(--white)", appearance: "none", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-md)", outline: "none", cursor: "pointer", boxShadow: "none", transition: "border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)" }}
                    >
                      <option value="" disabled>
                        {"Kies\u2026"}
                      </option>
                      <option value="Demo aanvragen">
                        {"Demo aanvragen"}
                      </option>
                      <option value="Vraag over prijzen">
                        {"Vraag over prijzen"}
                      </option>
                      <option value="Technische vraag">
                        {"Technische vraag"}
                      </option>
                      <option value="Iets anders">
                        {"Iets anders"}
                      </option>
                    </select>
                    <span
                      aria-hidden="true"
                      style={{ position: "absolute", right: "14px", pointerEvents: "none", color: "var(--text-muted)", display: "inline-flex" }}
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
                        className="lucide lucide-chevron-down"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
              <div className="sc-host-x" style={{ display: "contents" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                  <label
                    htmlFor=":rd:"
                    style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: "var(--fw-medium)", color: "var(--text-heading)" }}
                  >
                    {"Je bericht"}
                    <span style={{ color: "var(--color-primary)" }}>
                      {" *"}
                    </span>
                  </label>
                  <textarea id=":rd:" rows={6} required aria-invalid="false" style={{ width: "100%", boxSizing: "border-box", resize: "vertical", padding: "12px 14px", fontFamily: "var(--font-body)", fontSize: "16px", lineHeight: "1.5", color: "var(--text-body)", background: "var(--white)", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-md)", outline: "none", boxShadow: "none", transition: "border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)" }}></textarea>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                    <span style={{ fontSize: "13px", color: "var(--text-muted)" }}></span>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="sc-host-x" style={{ display: "contents" }}>
                  <button
                    type="submit"
                    className="mh-btn"
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "var(--font-body)", fontWeight: "var(--fw-semibold)", lineHeight: "1", border: "1px solid transparent", borderRadius: "var(--radius-md)", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)", height: "var(--control-h-hero)", padding: "0px 28px", fontSize: "17px", background: "var(--color-primary)", color: "var(--white)", width: "100%" }}
                  >
                    {"Verstuur bericht"}
                  </button>
                </div>
                <p
                  style={{ margin: "0px", fontSize: "12.5px", color: "var(--neutral-600)", display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}
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
                    style={{ width: "13px", height: "13px" }}
                    className="lucide lucide-lock"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  {"Je gegevens zijn veilig \u00b7 AVG-conform \u00b7 data in de EU"}
                </p>
              </div>
            </form>
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
