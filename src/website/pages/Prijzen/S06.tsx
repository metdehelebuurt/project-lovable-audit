
export const S06 = () => (
    <section className="mh-secpad" style={{ padding: "88px 0px", background: "var(--surface-page)" }}>
      <div className="mh-container">
        <div className="mh-reveal mh-hidden" style={{ maxWidth: "660px", margin: "0px auto 44px", textAlign: "center" }}>
          <div
            style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--indigo-600)", marginBottom: "14px" }}
          >
            {"Welk plan past bij jou?"}
          </div>
          <h2 style={{ margin: "0px 0px 12px" }}>
            {"Kies op basis van je bedrijf, niet op basis van een feature-lijst"}
          </h2>
          <p style={{ margin: "0px", fontSize: "18px", color: "var(--neutral-600)", lineHeight: "1.6" }}>
            {"Alle modules krijg je toch. De vraag is alleen hoe groot je team is en hoe zichtbaar je eigen merk moet zijn."}
          </p>
        </div>
        <div
          className="mh-grid3 mh-reveal mh-hidden"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", alignItems: "stretch" }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", height: "100%", padding: "30px 28px", borderRadius: "18px", background: "var(--surface-page)", border: "1px solid var(--border-subtle)", boxShadow: "rgba(33, 31, 84, 0.06) 0px 10px 26px" }}
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
              style={{ width: "30px", height: "30px", color: "var(--color-primary)", strokeWidth: "1.5", marginBottom: "18px" }}
              className="lucide lucide-user-round"
            >
              <circle cx="12" cy="8" r="5" />
              <path d="M20 21a8 8 0 0 0-16 0" />
            </svg>
            <h3 style={{ fontSize: "20px", margin: "0px 0px 12px" }}>
              <span className="sc-interp">
                {"Starter"}
              </span>
            </h3>
            <p
              style={{ margin: "0px 0px 20px", fontSize: "15px", color: "var(--neutral-600)", lineHeight: "1.6", flex: "1 1 0%" }}
            >
              <span className="sc-interp">
                {"Je werkt met \u00e9\u00e9n of twee man en doet alles zelf. Je wilt van losse Excel-bestanden en WhatsApp af, en je offertes er professioneel uit laten zien."}
              </span>
            </p>
            <div
              style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "17px", color: "var(--indigo-700)", marginBottom: "16px" }}
            >
              <span className="sc-interp">
                {"\u20ac 75 per maand bij jaarbetaling"}
              </span>
            </div>
            <a
              href="/proefperiode"
              style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "15px", fontWeight: "600", color: "var(--indigo-700)" }}
            >
              <span className="sc-interp">
                {"Begin met Starter"}
              </span>
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
          <div
            style={{ display: "flex", flexDirection: "column", height: "100%", padding: "30px 28px", borderRadius: "18px", background: "var(--surface-page)", border: "1px solid var(--border-subtle)", boxShadow: "rgba(33, 31, 84, 0.06) 0px 10px 26px" }}
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
              style={{ width: "30px", height: "30px", color: "var(--color-primary)", strokeWidth: "1.5", marginBottom: "18px" }}
              className="lucide lucide-users-round"
            >
              <path d="M18 21a8 8 0 0 0-16 0" />
              <circle cx="10" cy="8" r="5" />
              <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" />
            </svg>
            <h3 style={{ fontSize: "20px", margin: "0px 0px 12px" }}>
              <span className="sc-interp">
                {"Professional"}
              </span>
            </h3>
            <p
              style={{ margin: "0px 0px 20px", fontSize: "15px", color: "var(--neutral-600)", lineHeight: "1.6", flex: "1 1 0%" }}
            >
              <span className="sc-interp">
                {"Je hebt kantoorbezetting en meerdere ploegen buiten. Je wilt planning, marge en klantcommunicatie op orde, plus webtools op je eigen site."}
              </span>
            </p>
            <div
              style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "17px", color: "var(--indigo-700)", marginBottom: "16px" }}
            >
              <span className="sc-interp">
                {"\u20ac 142 per maand bij jaarbetaling"}
              </span>
            </div>
            <a
              href="/proefperiode"
              style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "15px", fontWeight: "600", color: "var(--indigo-700)" }}
            >
              <span className="sc-interp">
                {"Begin met Professional"}
              </span>
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
          <div
            style={{ display: "flex", flexDirection: "column", height: "100%", padding: "30px 28px", borderRadius: "18px", background: "var(--surface-page)", border: "1px solid var(--border-subtle)", boxShadow: "rgba(33, 31, 84, 0.06) 0px 10px 26px" }}
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
              style={{ width: "30px", height: "30px", color: "var(--color-primary)", strokeWidth: "1.5", marginBottom: "18px" }}
              className="lucide lucide-building-2"
            >
              <path d="M10 12h4" />
              <path d="M10 8h4" />
              <path d="M14 21v-3a2 2 0 0 0-4 0v3" />
              <path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" />
              <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
            </svg>
            <h3 style={{ fontSize: "20px", margin: "0px 0px 12px" }}>
              <span className="sc-interp">
                {"Enterprise"}
              </span>
            </h3>
            <p
              style={{ margin: "0px 0px 20px", fontSize: "15px", color: "var(--neutral-600)", lineHeight: "1.6", flex: "1 1 0%" }}
            >
              <span className="sc-interp">
                {"Je hebt meerdere vestigingen of een eigen merk naar de klant toe. Je wilt white-label, een eigen domein en koppelingen met je eigen systemen."}
              </span>
            </p>
            <div
              style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "17px", color: "var(--indigo-700)", marginBottom: "16px" }}
            >
              <span className="sc-interp">
                {"\u20ac 200 per maand bij jaarbetaling"}
              </span>
            </div>
            <a
              href="/demo"
              style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "15px", fontWeight: "600", color: "var(--indigo-700)" }}
            >
              <span className="sc-interp">
                {"Overleg over Enterprise"}
              </span>
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
        <div
          className="mh-reveal mh-hidden"
          style={{ marginTop: "36px", padding: "26px 30px", borderRadius: "18px", background: "var(--surface-tint)", border: "1px solid var(--indigo-200)", display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}
        >
          <p
            style={{ margin: "0px", fontSize: "16.5px", color: "var(--text-body)", lineHeight: "1.55", maxWidth: "60ch" }}
          >
            {"Weet je het niet zeker? Begin gewoon met de proefperiode. Je kunt op elk moment omhoog schakelen en je verliest daarbij geen enkel project of dossier."}
          </p>
          <span className="mh-cta" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div className="sc-host-x" style={{ display: "contents" }}>
              <a
                href="/proefperiode"
                className="mh-btn"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "var(--font-body)", fontWeight: "var(--fw-semibold)", lineHeight: "1", border: "1px solid transparent", borderRadius: "var(--radius-md)", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)", height: "var(--control-h)", padding: "0px 22px", fontSize: "16px", background: "var(--color-accent)", color: "var(--white)" }}
              >
                <span className="sc-interp">
                  {"Start gratis"}
                </span>
              </a>
            </div>
          </span>
        </div>
      </div>
    </section>
);
