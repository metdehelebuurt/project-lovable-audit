
export const S01 = () => (
    <section
      className="mh-secpad"
      style={{ position: "relative", overflow: "hidden", padding: "76px 0px 64px", background: "radial-gradient(90% 75% at 88% -12%, var(--indigo-200) 0%, rgba(238,240,253,0) 58%), linear-gradient(162deg, #EEEBFE 0%, #F4F3FE 36%, var(--white) 78%)" }}
    >
      <div aria-hidden="true" style={{ position: "absolute", inset: "0px", backgroundImage: "radial-gradient(var(--indigo-300) 1.2px, transparent 1.2px)", backgroundSize: "26px 26px", opacity: "0.26", maskImage: "radial-gradient(110% 80% at 82% -5%, rgb(0, 0, 0) 0%, transparent 60%)" }}></div>
      <div className="mh-container" style={{ position: "relative" }}>
        <div
          style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: "var(--neutral-600)", marginBottom: "26px" }}
        >
          <a href="/functionaliteiten" style={{ color: "var(--indigo-700)", fontWeight: "600" }}>
            {"Oplossingen"}
          </a>
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
            style={{ width: "14px", height: "14px", color: "var(--indigo-300)" }}
            className="lucide lucide-chevron-right"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          <span>
            <span className="sc-interp">
              {"Rapportages & marge"}
            </span>
          </span>
        </div>
        <div
          className="mh-herogrid"
          style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: "52px", alignItems: "center" }}
        >
          <div>
            <div
              style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "7px 14px 7px 8px", borderRadius: "999px", background: "rgb(255, 255, 255)", border: "1px solid var(--indigo-200)", marginBottom: "20px" }}
            >
              <span
                style={{ width: "30px", height: "30px", borderRadius: "999px", background: "var(--indigo-600)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "rgb(255, 255, 255)" }}
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
                  style={{ width: "16px", height: "16px" }}
                  className="lucide lucide-inbox"
                >
                  <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                  <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                </svg>
              </span>
              <span
                style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--indigo-700)" }}
              >
                <span className="sc-interp">
                  {"Fase 3 \u00b7 Nazorg & inzicht"}
                </span>
              </span>
            </div>
            <h1 style={{ fontSize: "50px", lineHeight: "1.08", margin: "0px 0px 18px" }}>
              <span className="sc-interp">
                {"Zie je marge terwijl het project loopt, niet pas bij de jaarrekening"}
              </span>
            </h1>
            <p
              style={{ fontSize: "18.5px", lineHeight: "1.6", color: "var(--text-body)", maxWidth: "56ch", margin: "0px 0px 24px" }}
            >
              <span className="sc-interp">
                {"Omzet, marge per project, doorlooptijd en de bezetting van je monteurs, live uit het werk zelf. Omdat uren en materiaal in dezelfde flow geboekt worden, kloppen de cijfers zonder maandelijkse exercitie."}
              </span>
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "30px" }}>
              <span
                style={{ display: "flex", gap: "11px", alignItems: "flex-start", fontSize: "16px", color: "var(--text-heading)", fontWeight: "500" }}
              >
                <span
                  style={{ flex: "0 0 auto", width: "22px", height: "22px", borderRadius: "999px", background: "rgba(31, 169, 124, 0.14)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: "1px" }}
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
                    style={{ width: "13px", height: "13px", color: "var(--green-700)" }}
                    className="lucide lucide-check"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <span className="sc-interp">
                  {"Marge per project, live bijgewerkt"}
                </span>
              </span>
              <span
                style={{ display: "flex", gap: "11px", alignItems: "flex-start", fontSize: "16px", color: "var(--text-heading)", fontWeight: "500" }}
              >
                <span
                  style={{ flex: "0 0 auto", width: "22px", height: "22px", borderRadius: "999px", background: "rgba(31, 169, 124, 0.14)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: "1px" }}
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
                    style={{ width: "13px", height: "13px", color: "var(--green-700)" }}
                    className="lucide lucide-check"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <span className="sc-interp">
                  {"Bezetting en doorlooptijd in beeld"}
                </span>
              </span>
              <span
                style={{ display: "flex", gap: "11px", alignItems: "flex-start", fontSize: "16px", color: "var(--text-heading)", fontWeight: "500" }}
              >
                <span
                  style={{ flex: "0 0 auto", width: "22px", height: "22px", borderRadius: "999px", background: "rgba(31, 169, 124, 0.14)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: "1px" }}
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
                    style={{ width: "13px", height: "13px", color: "var(--green-700)" }}
                    className="lucide lucide-check"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <span className="sc-interp">
                  {"Koppeling met je boekhouding"}
                </span>
              </span>
            </div>
            <div className="mh-cta" style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
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
                {"Nederlandse support"}
              </span>
            </div>
          </div>
          <div
            style={{ borderRadius: "14px", overflow: "hidden", background: "rgb(255, 255, 255)", boxShadow: "var(--shadow-product)", border: "1px solid var(--border-subtle)" }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "11px 14px", background: "var(--neutral-50)", borderBottom: "1px solid var(--border-subtle)" }}
            >
              <span style={{ width: "10px", height: "10px", borderRadius: "99px", background: "rgb(229, 120, 139)" }}></span>
              <span style={{ width: "10px", height: "10px", borderRadius: "99px", background: "rgb(235, 193, 91)" }}></span>
              <span style={{ width: "10px", height: "10px", borderRadius: "99px", background: "rgb(127, 199, 154)" }}></span>
              <span
                style={{ marginLeft: "10px", flex: "1 1 0%", height: "22px", borderRadius: "6px", background: "rgb(255, 255, 255)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", padding: "0px 10px", fontSize: "11px", color: "var(--text-muted)" }}
              >
                <span className="sc-interp">
                  {"app.mijnhuis.nu/rapportage"}
                </span>
              </span>
            </div>
            <div style={{ padding: "20px" }}>
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", gap: "12px" }}
              >
                <span
                  style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "16px", color: "var(--text-heading)" }}
                >
                  <span className="sc-interp">
                    {"Marge \u00b7 deze maand"}
                  </span>
                </span>
                <span
                  style={{ fontSize: "11px", color: "var(--color-primary)", background: "var(--indigo-50)", padding: "5px 10px", borderRadius: "8px", fontWeight: "600", whiteSpace: "nowrap" }}
                >
                  <span className="sc-interp">
                    {"Live"}
                  </span>
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "11px 13px", border: "1px solid var(--border-subtle)", borderRadius: "10px", fontSize: "13px" }}
                >
                  <span style={{ color: "var(--text-body)" }}>
                    <span className="sc-interp">
                      {"Zonnepanelen (14 projecten)"}
                    </span>
                  </span>
                  <span
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--green-700)", fontWeight: "600", whiteSpace: "nowrap" }}
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
                      className="lucide lucide-check"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    <span className="sc-interp">
                      {"Marge 22%"}
                    </span>
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "11px 13px", border: "1px solid var(--border-subtle)", borderRadius: "10px", fontSize: "13px" }}
                >
                  <span style={{ color: "var(--text-body)" }}>
                    <span className="sc-interp">
                      {"Warmtepompen (6 projecten)"}
                    </span>
                  </span>
                  <span
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--green-700)", fontWeight: "600", whiteSpace: "nowrap" }}
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
                      className="lucide lucide-check"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    <span className="sc-interp">
                      {"Marge 19%"}
                    </span>
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "11px 13px", border: "1px solid var(--border-subtle)", borderRadius: "10px", fontSize: "13px" }}
                >
                  <span style={{ color: "var(--text-body)" }}>
                    <span className="sc-interp">
                      {"Laadpalen (9 projecten)"}
                    </span>
                  </span>
                  <span
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--neutral-600)", whiteSpace: "nowrap" }}
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
                      className="lucide lucide-clock"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    <span className="sc-interp">
                      {"Marge 12%"}
                    </span>
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "11px 13px", border: "1px solid var(--border-subtle)", borderRadius: "10px", fontSize: "13px" }}
                >
                  <span style={{ color: "var(--text-body)" }}>
                    <span className="sc-interp">
                      {"Bezetting monteurs"}
                    </span>
                  </span>
                  <span
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--green-700)", fontWeight: "600", whiteSpace: "nowrap" }}
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
                      className="lucide lucide-check"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    <span className="sc-interp">
                      {"86%"}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
);
