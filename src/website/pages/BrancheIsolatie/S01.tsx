
export const S01 = () => (
    <section
      className="mh-secpad"
      style={{ position: "relative", overflow: "hidden", padding: "0px", background: "linear-gradient(152deg, var(--indigo-700) 0%, var(--night-indigo) 58%)", color: "rgb(255, 255, 255)" }}
    >
      <div aria-hidden="true" style={{ position: "absolute", top: "-420px", right: "-340px", width: "1400px", height: "1400px", pointerEvents: "none", background: "repeating-radial-gradient(circle, transparent 0px, transparent 100px, rgba(255, 255, 255, 0.12) 100px, rgba(255, 255, 255, 0.12) 102px)", maskImage: "radial-gradient(circle, rgb(0, 0, 0) 0%, transparent 70%)" }}></div>
      <div aria-hidden="true" style={{ position: "absolute", left: "-160px", bottom: "-240px", width: "640px", height: "640px", pointerEvents: "none", borderRadius: "50%", background: "radial-gradient(circle, rgba(91, 92, 232, 0.5) 0%, transparent 68%)" }}></div>
      <div className="mh-container" style={{ position: "relative", padding: "28px 24px 0px" }}>
        <div
          style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "rgba(255, 255, 255, 0.66)" }}
        >
          <a href="/" style={{ color: "rgba(255, 255, 255, 0.66)", fontWeight: "500" }}>
            {"Home"}
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
            style={{ width: "14px", height: "14px" }}
            className="lucide lucide-chevron-right"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          <a href="/branches" style={{ color: "rgba(255, 255, 255, 0.66)", fontWeight: "500" }}>
            {"Branches"}
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
            style={{ width: "14px", height: "14px" }}
            className="lucide lucide-chevron-right"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          <span style={{ color: "rgb(255, 255, 255)", fontWeight: "600" }}>
            <span className="sc-interp">
              {"Isolatie"}
            </span>
          </span>
        </div>
      </div>
      <div className="mh-container" style={{ position: "relative", padding: "40px 24px 0px" }}>
        <div
          className="mh-herogrid"
          style={{ display: "grid", gridTemplateColumns: "1.02fr 0.98fr", gap: "56px", alignItems: "center" }}
        >
          <div>
            <div
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 14px", borderRadius: "99px", background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.22)", color: "rgb(255, 255, 255)", fontSize: "13px", fontWeight: "600", marginBottom: "20px" }}
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
                style={{ width: "15px", height: "15px" }}
                className="lucide lucide-sun"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" />
                <path d="m19.07 4.93-1.41 1.41" />
              </svg>
              <span className="sc-interp">
                {"Isolatie"}
              </span>
            </div>
            <h1 style={{ fontSize: "54px", lineHeight: "1.06", margin: "0px 0px 18px", color: "rgb(255, 255, 255)" }}>
              <span className="sc-interp">
                {"Isolatie"}
              </span>
              {", van eerste lead tot "}
              <span style={{ color: "var(--indigo-400)" }}>
                {"ondertekend dossier"}
              </span>
            </h1>
            <p
              style={{ fontSize: "19px", lineHeight: "1.55", color: "rgb(255, 255, 255)", fontWeight: "500", margin: "0px 0px 12px" }}
            >
              <span className="sc-interp">
                {"Rc-waarden, subsidie en oplevering, netjes onderbouwd."}
              </span>
            </p>
            <p
              style={{ fontSize: "17px", lineHeight: "1.6", color: "rgba(255, 255, 255, 0.8)", maxWidth: "56ch", margin: "0px 0px 28px" }}
            >
              <span className="sc-interp">
                {"Bepaal de Rc-verbetering, onderbouw de subsidie en lever onderbouwd op, met foto\u2019s en details in het dossier."}
              </span>
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
                  <span>
                    {"Plan een demo voor "}
                    <span className="sc-interp">
                      {"Isolatie"}
                    </span>
                  </span>
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
              style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginTop: "20px", fontSize: "14px", color: "rgba(255, 255, 255, 0.78)" }}
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
                {"Ingericht voor jouw vakgebied"}
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
            </div>
          </div>
          <div style={{ position: "relative" }}>
            <div
              style={{ borderRadius: "16px", overflow: "hidden", background: "rgb(255, 255, 255)", boxShadow: "rgba(9, 8, 30, 0.55) 0px 40px 80px", border: "1px solid rgba(255, 255, 255, 0.14)" }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "11px 14px", background: "var(--neutral-50)", borderBottom: "1px solid var(--border-subtle)" }}
              >
                <span style={{ width: "10px", height: "10px", borderRadius: "99px", background: "rgb(229, 120, 139)" }}></span>
                <span style={{ width: "10px", height: "10px", borderRadius: "99px", background: "rgb(235, 193, 91)" }}></span>
                <span style={{ width: "10px", height: "10px", borderRadius: "99px", background: "rgb(127, 199, 154)" }}></span>
                <span
                  style={{ marginLeft: "10px", flex: "1 1 0%", height: "22px", borderRadius: "6px", background: "rgb(255, 255, 255)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", padding: "0px 10px", fontFamily: "\"IBM Plex Mono\", ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "11px", color: "var(--neutral-600)" }}
                >
                  {"app.mijnhuis.nu/dossier"}
                </span>
              </div>
              <div style={{ padding: "20px 22px" }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "18px" }}
                >
                  <div style={{ display: "flex", gap: "11px", alignItems: "center" }}>
                    <span
                      style={{ width: "38px", height: "38px", borderRadius: "10px", background: "var(--indigo-50)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)" }}
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
                        className="lucide lucide-sun"
                      >
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2v2" />
                        <path d="M12 20v2" />
                        <path d="m4.93 4.93 1.41 1.41" />
                        <path d="m17.66 17.66 1.41 1.41" />
                        <path d="M2 12h2" />
                        <path d="M20 12h2" />
                        <path d="m6.34 17.66-1.41 1.41" />
                        <path d="m19.07 4.93-1.41 1.41" />
                      </svg>
                    </span>
                    <div>
                      <div
                        style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "16px", color: "var(--text-heading)", lineHeight: "1.2" }}
                      >
                        <span className="sc-interp">
                          {"Isolatie"}
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--neutral-600)" }}>
                        {"Dossier \u00b7 fam. De Vries"}
                      </div>
                    </div>
                  </div>
                  <span
                    style={{ fontSize: "11px", color: "rgb(255, 255, 255)", background: "var(--green-500)", padding: "5px 10px", borderRadius: "8px", fontWeight: "600", whiteSpace: "nowrap", flex: "0 0 auto" }}
                  >
                    {"Compleet"}
                  </span>
                </div>
                <div
                  style={{ fontFamily: "\"IBM Plex Mono\", ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "10px", letterSpacing: "0.1em", color: "var(--neutral-600)", marginBottom: "9px" }}
                >
                  {"SCHOUW OP LOCATIE"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "18px" }}>
                  <div
                    style={{ display: "flex", gap: "9px", alignItems: "flex-start", padding: "9px 11px", border: "1px solid var(--border-subtle)", borderRadius: "8px" }}
                  >
                    <span
                      style={{ flex: "0 0 auto", width: "16px", height: "16px", borderRadius: "5px", background: "var(--green-500)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: "1px" }}
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
                        style={{ width: "11px", height: "11px", color: "rgb(255, 255, 255)" }}
                        className="lucide lucide-check"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    <span style={{ fontSize: "12.5px", color: "var(--text-body)", lineHeight: "1.4" }}>
                      <span className="sc-interp">
                        {"Bestaande constructie en Rc-waarde bepaald"}
                      </span>
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", gap: "9px", alignItems: "flex-start", padding: "9px 11px", border: "1px solid var(--border-subtle)", borderRadius: "8px" }}
                  >
                    <span
                      style={{ flex: "0 0 auto", width: "16px", height: "16px", borderRadius: "5px", background: "var(--green-500)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: "1px" }}
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
                        style={{ width: "11px", height: "11px", color: "rgb(255, 255, 255)" }}
                        className="lucide lucide-check"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    <span style={{ fontSize: "12.5px", color: "var(--text-body)", lineHeight: "1.4" }}>
                      <span className="sc-interp">
                        {"Vocht, ventilatie en aansluitdetails beoordeeld"}
                      </span>
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", gap: "9px", alignItems: "flex-start", padding: "9px 11px", border: "1px solid var(--border-subtle)", borderRadius: "8px" }}
                  >
                    <span
                      style={{ flex: "0 0 auto", width: "16px", height: "16px", borderRadius: "5px", background: "var(--green-500)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: "1px" }}
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
                        style={{ width: "11px", height: "11px", color: "rgb(255, 255, 255)" }}
                        className="lucide lucide-check"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    <span style={{ fontSize: "12.5px", color: "var(--text-body)", lineHeight: "1.4" }}>
                      <span className="sc-interp">
                        {"Oppervlakten ingemeten op de tablet"}
                      </span>
                    </span>
                  </div>
                </div>
                <div
                  style={{ fontFamily: "\"IBM Plex Mono\", ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "10px", letterSpacing: "0.1em", color: "var(--neutral-600)", marginBottom: "9px" }}
                >
                  {"OPGELEVERD VOLGENS"}
                </div>
                <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "16px" }}>
                  <span
                    style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "6px 11px", borderRadius: "99px", background: "var(--indigo-50)", fontSize: "11.5px", fontWeight: "600", color: "var(--indigo-700)", whiteSpace: "nowrap" }}
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
                      style={{ width: "12px", height: "12px" }}
                      className="lucide lucide-badge-check"
                    >
                      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                      <path d="m16 9-5.5 5.5L8 12" />
                    </svg>
                    <span className="sc-interp">
                      {"NEN 1068"}
                    </span>
                  </span>
                  <span
                    style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "6px 11px", borderRadius: "99px", background: "var(--indigo-50)", fontSize: "11.5px", fontWeight: "600", color: "var(--indigo-700)", whiteSpace: "nowrap" }}
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
                      style={{ width: "12px", height: "12px" }}
                      className="lucide lucide-badge-check"
                    >
                      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                      <path d="m16 9-5.5 5.5L8 12" />
                    </svg>
                    <span className="sc-interp">
                      {"ISSO-publicaties"}
                    </span>
                  </span>
                  <span
                    style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "6px 11px", borderRadius: "99px", background: "var(--indigo-50)", fontSize: "11.5px", fontWeight: "600", color: "var(--indigo-700)", whiteSpace: "nowrap" }}
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
                      style={{ width: "12px", height: "12px" }}
                      className="lucide lucide-badge-check"
                    >
                      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                      <path d="m16 9-5.5 5.5L8 12" />
                    </svg>
                    <span className="sc-interp">
                      {"Subsidie-eisen"}
                    </span>
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", paddingTop: "14px", borderTop: "1px solid var(--border-subtle)" }}
                >
                  <span
                    style={{ fontFamily: "\"IBM Plex Mono\", ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "9.5px", color: "var(--neutral-600)" }}
                  >
                    {"SHA-256 \u00b7 9f2c4a8b\u2026"}
                  </span>
                  <span
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "600", color: "var(--green-700)" }}
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
                      className="lucide lucide-pen-line"
                    >
                      <path d="M13 21h8" />
                      <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                    </svg>
                    {"Tweezijdig getekend"}
                  </span>
                </div>
              </div>
            </div>
            <div
              className="mh-herophone"
              style={{ position: "absolute", left: "-34px", bottom: "-30px", width: "190px", borderRadius: "14px", overflow: "hidden", boxShadow: "rgba(9, 8, 30, 0.55) 0px 24px 48px", border: "2px solid rgba(255, 255, 255, 0.18)" }}
            >
              <img src="/__l5e/assets-v1/d1334cfd-ddcc-41d4-909c-d875f42bf7fb/img04.jpg" alt="" loading="lazy" style={{ width: "100%", aspectRatio: "4 / 3", display: "block", objectFit: "cover", borderRadius: "12px" }} />
            </div>
          </div>
        </div>
        <div
          className="mh-grid3"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "18px", marginTop: "56px", padding: "26px 0px 30px", borderTop: "1px solid rgba(255, 255, 255, 0.18)" }}
        >
          <div>
            <div
              style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "30px", color: "rgb(255, 255, 255)", lineHeight: "1.05", marginBottom: "6px" }}
            >
              <span className="sc-interp">
                {"1 dossier"}
              </span>
            </div>
            <div style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.76)", lineHeight: "1.45" }}>
              <span className="sc-interp">
                {"voor alle maatregelen op \u00e9\u00e9n adres"}
              </span>
            </div>
          </div>
          <div>
            <div
              style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "30px", color: "rgb(255, 255, 255)", lineHeight: "1.05", marginBottom: "6px" }}
            >
              <span className="sc-interp">
                {"\u221260%"}
              </span>
            </div>
            <div style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.76)", lineHeight: "1.45" }}>
              <span className="sc-interp">
                {"tijd aan subsidiepapierwerk"}
              </span>
            </div>
          </div>
          <div>
            <div
              style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "30px", color: "rgb(255, 255, 255)", lineHeight: "1.05", marginBottom: "6px" }}
            >
              <span className="sc-interp">
                {"0"}
              </span>
            </div>
            <div style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.76)", lineHeight: "1.45" }}>
              <span className="sc-interp">
                {"afgekeurde aanvragen door ontbrekend bewijs*"}
              </span>
            </div>
          </div>
        </div>
        <p
          style={{ margin: "-14px 0px 0px", paddingBottom: "26px", fontSize: "12.5px", color: "rgba(255, 255, 255, 0.66)" }}
        >
          {"*Illustratief; jouw resultaat hangt af van je huidige werkwijze."}
        </p>
      </div>
    </section>
);
