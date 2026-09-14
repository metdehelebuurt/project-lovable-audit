
export const S04 = () => (
    <section className="mh-secpad" style={{ padding: "88px 0px", background: "var(--surface-page)" }}>
      <div className="mh-container">
        <div className="mh-reveal mh-hidden" style={{ maxWidth: "660px", marginBottom: "38px" }}>
          <div
            style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--indigo-600)", marginBottom: "14px" }}
          >
            {"Wat je van ons krijgt"}
          </div>
          <h2 style={{ margin: "0px 0px 10px" }}>
            {"Je hoeft het niet zelf uit te vinden"}
          </h2>
          <p style={{ margin: "0px", fontSize: "17px", color: "var(--neutral-600)", lineHeight: "1.6" }}>
            {"Alles waarmee je kunt doorverwijzen zonder dat het werk voor jou wordt."}
          </p>
        </div>
        <div
          className="mh-grid3 mh-reveal mh-hidden"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "38px 34px" }}
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
              className="lucide lucide-link"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <div>
              <h3 style={{ fontSize: "17.5px", margin: "0px 0px 7px", lineHeight: "1.3" }}>
                <span className="sc-interp">
                  {"Je eigen aanmeldlink"}
                </span>
              </h3>
              <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                <span className="sc-interp">
                  {"Elke aanmelding wordt aan jou gekoppeld, ook als iemand later terugkomt."}
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
              className="lucide lucide-layout-dashboard"
            >
              <rect width="7" height="9" x="3" y="3" rx="1" />
              <rect width="7" height="5" x="14" y="3" rx="1" />
              <rect width="7" height="9" x="14" y="12" rx="1" />
              <rect width="7" height="5" x="3" y="16" rx="1" />
            </svg>
            <div>
              <h3 style={{ fontSize: "17.5px", margin: "0px 0px 7px", lineHeight: "1.3" }}>
                <span className="sc-interp">
                  {"Inzicht in je resultaat"}
                </span>
              </h3>
              <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                <span className="sc-interp">
                  {"Zie wie je hebt doorverwezen, wat de status is en wat er klaarstaat om uitbetaald te worden."}
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
              className="lucide lucide-image"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
            <div>
              <h3 style={{ fontSize: "17.5px", margin: "0px 0px 7px", lineHeight: "1.3" }}>
                <span className="sc-interp">
                  {"Materiaal dat klaar is voor gebruik"}
                </span>
              </h3>
              <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                <span className="sc-interp">
                  {"Teksten, banners, een productoverzicht en een presentatie die je zelf mag gebruiken."}
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
              className="lucide lucide-user-round-check"
            >
              <path d="M2 21a8 8 0 0 1 13.292-6" />
              <circle cx="10" cy="8" r="5" />
              <path d="m16 19 2 2 4-4" />
            </svg>
            <div>
              <h3 style={{ fontSize: "17.5px", margin: "0px 0px 7px", lineHeight: "1.3" }}>
                <span className="sc-interp">
                  {"Een vast aanspreekpunt"}
                </span>
              </h3>
              <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                <span className="sc-interp">
                  {"Bas is je contactpersoon. E\u00e9n nummer, geen ticketsysteem."}
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
              className="lucide lucide-graduation-cap"
            >
              <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
              <path d="M22 10v6" />
              <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
            </svg>
            <div>
              <h3 style={{ fontSize: "17.5px", margin: "0px 0px 7px", lineHeight: "1.3" }}>
                <span className="sc-interp">
                  {"Uitleg over het product"}
                </span>
              </h3>
              <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                <span className="sc-interp">
                  {"We nemen je mee door het platform, zodat je weet wat je aanbeveelt."}
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
              className="lucide lucide-shield-check"
            >
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <div>
              <h3 style={{ fontSize: "17.5px", margin: "0px 0px 7px", lineHeight: "1.3" }}>
                <span className="sc-interp">
                  {"Nette afspraken"}
                </span>
              </h3>
              <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                <span className="sc-interp">
                  {"Heldere voorwaarden, geen exclusiviteit en je kunt op elk moment stoppen."}
                </span>
              </p>
            </div>
          </div>
        </div>
        <div
          className="mh-reveal mh-hidden"
          style={{ marginTop: "44px", padding: "28px 32px", borderRadius: "18px", background: "var(--surface-tint)", border: "1px solid var(--indigo-200)", display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}
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
            style={{ width: "24px", height: "24px", color: "var(--color-primary)", flex: "0 0 auto" }}
            className="lucide lucide-info"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          <p
            style={{ margin: "0px", flex: "1 1 0%", minWidth: "280px", fontSize: "16px", color: "var(--text-body)", lineHeight: "1.6" }}
          >
            {"Weet je nog niet precies wat het platform doet? Bekijk eerst "}
            <a href="/functionaliteiten" style={{ fontWeight: "600" }}>
              {"de functionaliteiten"}
            </a>
            {" of lees "}
            <a href="/succesverhalen" style={{ fontWeight: "600" }}>
              {"een succesverhaal"}
            </a>
            {". Dan weet je waar je iemand naartoe stuurt."}
          </p>
        </div>
      </div>
    </section>
);
