
export const S01 = () => (
    <section
      className="mh-secpad"
      style={{ position: "relative", overflow: "hidden", background: "linear-gradient(152deg, var(--indigo-700) 0%, var(--night-indigo) 58%)", color: "rgb(255, 255, 255)" }}
    >
      <div aria-hidden="true" style={{ position: "absolute", top: "-460px", right: "-380px", width: "1500px", height: "1500px", pointerEvents: "none", background: "repeating-radial-gradient(circle, transparent 0px, transparent 106px, rgba(255, 255, 255, 0.13) 106px, rgba(255, 255, 255, 0.13) 108px)", maskImage: "radial-gradient(circle, rgb(0, 0, 0) 0%, transparent 70%)" }}></div>
      <div aria-hidden="true" style={{ position: "absolute", left: "-140px", bottom: "-220px", width: "620px", height: "620px", pointerEvents: "none", borderRadius: "50%", background: "radial-gradient(circle, rgba(91, 92, 232, 0.5) 0%, transparent 68%)" }}></div>
      <div aria-hidden="true" style={{ position: "absolute", left: "0px", right: "0px", bottom: "0px", height: "2px", background: "repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.34) 0px, rgba(255, 255, 255, 0.34) 6px, transparent 6px, transparent 14px)" }}></div>
      <div className="mh-container" style={{ position: "relative", padding: "64px 24px 76px" }}>
        <div
          className="mh-heroslide mh-herogrid"
          style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: "56px", alignItems: "center", minHeight: "520px" }}
        >
          <div>
            <div
              style={{ fontFamily: "\"IBM Plex Mono\", ui-monospace, SFMono-Regular, Menlo, monospace", fontWeight: "500", fontSize: "12.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255, 255, 255, 0.7)", marginBottom: "18px" }}
            >
              {"Offertes \u00b7 schouw \u00b7 subsidie"}
            </div>
            <h1 style={{ fontSize: "60px", lineHeight: "1.06", margin: "0px 0px 20px", color: "rgb(255, 255, 255)" }}>
              {"Een offerte in 5 minuten."}
              <br />
              <span style={{ color: "var(--indigo-400)" }}>
                {"Door iedereen op kantoor."}
              </span>
            </h1>
            <p
              style={{ fontSize: "19px", lineHeight: "1.6", color: "rgba(255, 255, 255, 0.86)", maxWidth: "52ch", margin: "0px 0px 28px" }}
            >
              {"Schouw en offerte in \u00e9\u00e9n bezoek. De rekenmodules van jouw branche en het actuele subsidiebedrag zitten er al in, de klant tekent digitaal aan de keukentafel. Geen Excel, geen dubbele invoer."}
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
              style={{ display: "flex", gap: "20px", flexWrap: "wrap", margin: "22px 0px 0px", fontSize: "14px", color: "rgba(255, 255, 255, 0.78)" }}
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
          </div>
          <div style={{ position: "relative" }}>
            <div
              style={{ borderRadius: "16px", background: "rgb(255, 255, 255)", boxShadow: "rgba(9, 8, 30, 0.55) 0px 40px 80px", border: "1px solid rgba(255, 255, 255, 0.14)", padding: "24px" }}
            >
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "18px" }}
              >
                <div>
                  <div
                    style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "17px", color: "var(--text-heading)" }}
                  >
                    {"Offerte \u00b7 Warmtepomp"}
                  </div>
                  <div style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                    {"Jansen BV \u00b7 uit de schouw van vanmorgen"}
                  </div>
                </div>
                <span
                  style={{ fontSize: "11.5px", color: "var(--color-primary)", background: "var(--indigo-50)", border: "1px solid var(--indigo-200)", padding: "6px 11px", borderRadius: "8px", fontWeight: "600", whiteSpace: "nowrap", flex: "0 0 auto" }}
                >
                  {"4 min"}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "9px", marginBottom: "16px" }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between", gap: "10px", paddingBottom: "9px", borderBottom: "1px solid var(--border-subtle)" }}
                >
                  <span style={{ fontSize: "13px", color: "var(--text-body)" }}>
                    {"Warmtepomp 8 kW (monoblok)"}
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-heading)" }}>
                    {"\u20ac 5.450"}
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between", gap: "10px", paddingBottom: "9px", borderBottom: "1px solid var(--border-subtle)" }}
                >
                  <span style={{ fontSize: "13px", color: "var(--text-body)" }}>
                    {"Buffervat 50 L + inregelen"}
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-heading)" }}>
                    {"\u20ac 890"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-body)" }}>
                    {"Leidingwerk, elektra & montage"}
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-heading)" }}>
                    {"\u20ac 2.160"}
                  </span>
                </div>
              </div>
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", padding: "11px 13px", borderRadius: "10px", background: "rgba(31, 169, 124, 0.09)", border: "1px solid rgba(31, 169, 124, 0.3)", marginBottom: "14px" }}
              >
                <span
                  style={{ fontSize: "13px", color: "var(--text-body)", display: "inline-flex", alignItems: "center", gap: "7px" }}
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
                    style={{ width: "15px", height: "15px", color: "var(--success)" }}
                    className="lucide lucide-badge-check"
                  >
                    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                    <path d="m16 9-5.5 5.5L8 12" />
                  </svg>
                  {"Subsidie automatisch verrekend"}
                </span>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--green-700)", whiteSpace: "nowrap" }}>
                  {"\u2212 \u20ac 2.925"}
                </span>
              </div>
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: "12px", borderTop: "1px solid var(--border-subtle)", marginBottom: "16px" }}
              >
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  {"Netto voor de klant"}
                </span>
                <span
                  style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "26px", color: "var(--text-heading)" }}
                >
                  {"\u20ac 5.575"}
                </span>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <div
                  style={{ flex: "1 1 0%", border: "1px dashed var(--border-strong)", borderRadius: "8px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "var(--text-muted)" }}
                >
                  {"Klant tekent digitaal"}
                </div>
                <div
                  style={{ background: "var(--color-primary)", color: "rgb(255, 255, 255)", borderRadius: "8px", padding: "13px 16px", fontSize: "13px", fontWeight: "600", whiteSpace: "nowrap" }}
                >
                  {"Versturen"}
                </div>
              </div>
            </div>
            <div
              className="mh-herophone"
              style={{ position: "absolute", left: "-26px", bottom: "-30px", background: "rgb(255, 255, 255)", borderRadius: "14px", boxShadow: "rgba(9, 8, 30, 0.5) 0px 22px 46px", border: "1px solid var(--border-subtle)", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px", maxWidth: "250px" }}
            >
              <span
                style={{ flex: "0 0 auto", width: "38px", height: "38px", borderRadius: "10px", background: "rgba(31, 169, 124, 0.12)", color: "var(--success)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
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
                  style={{ width: "19px", height: "19px" }}
                  className="lucide lucide-pen-line"
                >
                  <path d="M13 21h8" />
                  <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                </svg>
              </span>
              <div>
                <div
                  style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "13.5px", color: "var(--text-heading)", lineHeight: "1.3" }}
                >
                  {"Getekend om 14:12"}
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--text-muted)", lineHeight: "1.4" }}>
                  {"Direct in de planning"}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "18px", marginTop: "44px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "9px", alignItems: "center" }}>
            <button
              aria-label="Ga naar slide 1"
              style={{ position: "relative", width: "11px", height: "11px", padding: "0px", borderRadius: "999px", border: "none", cursor: "pointer", background: "rgba(255, 255, 255, 0.36)", transition: "width var(--dur-base) var(--ease-standard), background var(--dur-base) var(--ease-standard)" }}
            >
              <span
                style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0px, 0px, 0px, 0px)" }}
              >
                {"1"}
              </span>
            </button>
            <button
              aria-label="Ga naar slide 2"
              style={{ position: "relative", width: "34px", height: "11px", padding: "0px", borderRadius: "999px", border: "none", cursor: "pointer", background: "rgb(255, 255, 255)", transition: "width var(--dur-base) var(--ease-standard), background var(--dur-base) var(--ease-standard)" }}
            >
              <span
                style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0px, 0px, 0px, 0px)" }}
              >
                {"2"}
              </span>
            </button>
            <button
              aria-label="Ga naar slide 3"
              style={{ position: "relative", width: "11px", height: "11px", padding: "0px", borderRadius: "999px", border: "none", cursor: "pointer", background: "rgba(255, 255, 255, 0.36)", transition: "width var(--dur-base) var(--ease-standard), background var(--dur-base) var(--ease-standard)" }}
            >
              <span
                style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0px, 0px, 0px, 0px)" }}
              >
                {"3"}
              </span>
            </button>
          </div>
          <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
            <button
              aria-label="Vorige slide"
              style={{ width: "44px", height: "44px", borderRadius: "99px", border: "1px solid rgba(255, 255, 255, 0.28)", background: "rgba(255, 255, 255, 0.08)", color: "rgb(255, 255, 255)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
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
                className="lucide lucide-arrow-left"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
            </button>
            <button
              aria-label="Volgende slide"
              style={{ width: "44px", height: "44px", borderRadius: "99px", border: "1px solid rgba(255, 255, 255, 0.28)", background: "rgba(255, 255, 255, 0.08)", color: "rgb(255, 255, 255)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
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
                className="lucide lucide-arrow-right"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
);
