
export const MegaPanelP1P1 = () => (
    <div className="mh-megagrid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 300px", gap: "36px" }}>
      <div>
        <a
          href="/functionaliteiten"
          style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", color: "var(--indigo-700)" }}
        >
          <span
            style={{ width: "26px", height: "26px", borderRadius: "8px", background: "var(--indigo-50)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
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
              style={{ width: "15px", height: "15px", color: "var(--color-primary)" }}
              className="lucide lucide-handshake"
            >
              <path d="m11 17 2 2a1 1 0 1 0 3-3" />
              <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
              <path d="m21 3 1 11h-2" />
              <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
              <path d="M3 4h8" />
            </svg>
          </span>
          <span
            style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "12px", letterSpacing: "0.08em", textTransform: "uppercase" }}
          >
            {"Verkopen"}
          </span>
        </a>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <a
            href="/oplossingen/lead"
            className="scp1"
            style={{ display: "flex", gap: "11px", padding: "10px 12px", borderRadius: "10px", color: "var(--text-heading)" }}
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
              style={{ width: "19px", height: "19px", color: "var(--color-primary)", flex: "0 0 auto", marginTop: "2px" }}
              className="lucide lucide-inbox"
            >
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
              <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </svg>
            <span>
              <span style={{ display: "block", fontWeight: "600", fontSize: "14.5px", marginBottom: "2px" }}>
                {"Leadbeheer & sales-CRM"}
              </span>
              <span style={{ display: "block", fontSize: "12.5px", color: "var(--neutral-600)", lineHeight: "1.45" }}>
                {"Elke aanvraag direct in de pijplijn"}
              </span>
            </span>
          </a>
          <a
            href="/oplossingen/schouw"
            className="scp1"
            style={{ display: "flex", gap: "11px", padding: "10px 12px", borderRadius: "10px", color: "var(--text-heading)" }}
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
              style={{ width: "19px", height: "19px", color: "var(--color-primary)", flex: "0 0 auto", marginTop: "2px" }}
              className="lucide lucide-ruler"
            >
              <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" />
              <path d="m14.5 12.5 2-2" />
              <path d="m11.5 9.5 2-2" />
              <path d="m8.5 6.5 2-2" />
              <path d="m17.5 15.5 2-2" />
            </svg>
            <span>
              <span style={{ display: "block", fontWeight: "600", fontSize: "14.5px", marginBottom: "2px" }}>
                {"Branchespecifieke schouw"}
              </span>
              <span style={{ display: "block", fontSize: "12.5px", color: "var(--neutral-600)", lineHeight: "1.45" }}>
                {"De juiste velden en metingen per vak"}
              </span>
            </span>
          </a>
          <a
            href="/oplossingen/offerte"
            className="scp1"
            style={{ display: "flex", gap: "11px", padding: "10px 12px", borderRadius: "10px", color: "var(--text-heading)" }}
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
              style={{ width: "19px", height: "19px", color: "var(--color-primary)", flex: "0 0 auto", marginTop: "2px" }}
              className="lucide lucide-file-signature"
            >
              <path d="M14.364 13.634a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506l4.013-4.009a1 1 0 0 0-3.004-3.004z" />
              <path d="M14.487 7.858A1 1 0 0 1 14 7V2" />
              <path d="M20 19.645V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l2.516 2.516" />
              <path d="M8 18h1" />
            </svg>
            <span>
              <span style={{ display: "block", fontWeight: "600", fontSize: "14.5px", marginBottom: "2px" }}>
                {"Offertes & subsidie"}
              </span>
              <span style={{ display: "block", fontSize: "12.5px", color: "var(--neutral-600)", lineHeight: "1.45" }}>
                {"In 5 minuten klaar, digitaal getekend"}
              </span>
            </span>
          </a>
        </div>
      </div>
      <div>
        <a
          href="/functionaliteiten"
          style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", color: "var(--indigo-700)" }}
        >
          <span
            style={{ width: "26px", height: "26px", borderRadius: "8px", background: "var(--indigo-50)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
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
              style={{ width: "15px", height: "15px", color: "var(--color-primary)" }}
              className="lucide lucide-hard-hat"
            >
              <path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" />
              <path d="M14 6a6 6 0 0 1 6 6v3" />
              <path d="M4 15v-3a6 6 0 0 1 6-6" />
              <rect x="2" y="15" width="20" height="4" rx="1" />
            </svg>
          </span>
          <span
            style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "12px", letterSpacing: "0.08em", textTransform: "uppercase" }}
          >
            {"Uitvoeren"}
          </span>
        </a>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <a
            href="/oplossingen/planning"
            className="scp1"
            style={{ display: "flex", gap: "11px", padding: "10px 12px", borderRadius: "10px", color: "var(--text-heading)" }}
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
              style={{ width: "19px", height: "19px", color: "var(--color-primary)", flex: "0 0 auto", marginTop: "2px" }}
              className="lucide lucide-calendar-range"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M16 2v3" />
              <path d="M3 9h18" />
              <path d="M8 2v3" />
              <path d="M17 13h-6" />
              <path d="M13 17H7" />
              <path d="M7 13h.01" />
              <path d="M17 17h.01" />
            </svg>
            <span>
              <span style={{ display: "block", fontWeight: "600", fontSize: "14.5px", marginBottom: "2px" }}>
                {"Planning & werkbonnen"}
              </span>
              <span style={{ display: "block", fontSize: "12.5px", color: "var(--neutral-600)", lineHeight: "1.45" }}>
                {"Wijziging direct bij de monteur"}
              </span>
            </span>
          </a>
          <a
            href="/oplossingen/monteursapp"
            className="scp1"
            style={{ display: "flex", gap: "11px", padding: "10px 12px", borderRadius: "10px", color: "var(--text-heading)" }}
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
              style={{ width: "19px", height: "19px", color: "var(--color-primary)", flex: "0 0 auto", marginTop: "2px" }}
              className="lucide lucide-smartphone"
            >
              <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
              <path d="M12 18h.01" />
            </svg>
            <span>
              <span style={{ display: "block", fontWeight: "600", fontSize: "14.5px", marginBottom: "2px" }}>
                {"Monteursapp"}
              </span>
              <span style={{ display: "block", fontSize: "12.5px", color: "var(--neutral-600)", lineHeight: "1.45" }}>
                {"Werkt offline, synct vanzelf"}
              </span>
            </span>
          </a>
          <a
            href="/oplossingen/oplevering"
            className="scp1"
            style={{ display: "flex", gap: "11px", padding: "10px 12px", borderRadius: "10px", color: "var(--text-heading)" }}
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
              style={{ width: "19px", height: "19px", color: "var(--color-primary)", flex: "0 0 auto", marginTop: "2px" }}
              className="lucide lucide-stamp"
            >
              <path d="M14 13V8.5C14 7 15 7 15 5a3 3 0 0 0-6 0c0 2 1 2 1 3.5V13" />
              <path d="M20 15.5a2.5 2.5 0 0 0-2.5-2.5h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1z" />
              <path d="M5 22h14" />
            </svg>
            <span>
              <span style={{ display: "block", fontWeight: "600", fontSize: "14.5px", marginBottom: "2px" }}>
                {"Oplevering & handtekening"}
              </span>
              <span style={{ display: "block", fontSize: "12.5px", color: "var(--neutral-600)", lineHeight: "1.45" }}>
                {"Volgens NEN, gehasht en getekend"}
              </span>
            </span>
          </a>
        </div>
      </div>
      <div>
        <a
          href="/functionaliteiten"
          style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", color: "var(--indigo-700)" }}
        >
          <span
            style={{ width: "26px", height: "26px", borderRadius: "8px", background: "var(--indigo-50)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
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
              style={{ width: "15px", height: "15px", color: "var(--color-primary)" }}
              className="lucide lucide-life-buoy"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m4.93 4.93 4.24 4.24" />
              <path d="m14.83 9.17 4.24-4.24" />
              <path d="m14.83 14.83 4.24 4.24" />
              <path d="m9.17 14.83-4.24 4.24" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          </span>
          <span
            style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "12px", letterSpacing: "0.08em", textTransform: "uppercase" }}
          >
            {"Nazorg & inzicht"}
          </span>
        </a>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <a
            href="/oplossingen/klantportaal"
            className="scp1"
            style={{ display: "flex", gap: "11px", padding: "10px 12px", borderRadius: "10px", color: "var(--text-heading)" }}
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
              style={{ width: "19px", height: "19px", color: "var(--color-primary)", flex: "0 0 auto", marginTop: "2px" }}
              className="lucide lucide-user-round"
            >
              <circle cx="12" cy="8" r="5" />
              <path d="M20 21a8 8 0 0 0-16 0" />
            </svg>
            <span>
              <span style={{ display: "block", fontWeight: "600", fontSize: "14.5px", marginBottom: "2px" }}>
                {"Klantportaal"}
              </span>
              <span style={{ display: "block", fontSize: "12.5px", color: "var(--neutral-600)", lineHeight: "1.45" }}>
                {"Minder statustelefoontjes"}
              </span>
            </span>
          </a>
          <a
            href="/kennisbank"
            className="scp1"
            style={{ display: "flex", gap: "11px", padding: "10px 12px", borderRadius: "10px", color: "var(--text-heading)" }}
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
              style={{ width: "19px", height: "19px", color: "var(--color-primary)", flex: "0 0 auto", marginTop: "2px" }}
              className="lucide lucide-sparkles"
            >
              <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
              <path d="M20 2v4" />
              <path d="M22 4h-4" />
              <circle cx="4" cy="20" r="2" />
            </svg>
            <span>
              <span style={{ display: "block", fontWeight: "600", fontSize: "14.5px", marginBottom: "2px" }}>
                {"AI-kennisbank"}
              </span>
              <span style={{ display: "block", fontSize: "12.5px", color: "var(--neutral-600)", lineHeight: "1.45" }}>
                {"Antwoord uit je eigen projecten"}
              </span>
            </span>
          </a>
          <a
            href="/oplossingen/rapportage"
            className="scp1"
            style={{ display: "flex", gap: "11px", padding: "10px 12px", borderRadius: "10px", color: "var(--text-heading)" }}
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
              style={{ width: "19px", height: "19px", color: "var(--color-primary)", flex: "0 0 auto", marginTop: "2px" }}
              className="lucide lucide-bar-chart-3"
            >
              <path d="M3 3v16a2 2 0 0 0 2 2h16" />
              <path d="M18 17V9" />
              <path d="M13 17V5" />
              <path d="M8 17v-3" />
            </svg>
            <span>
              <span style={{ display: "block", fontWeight: "600", fontSize: "14.5px", marginBottom: "2px" }}>
                {"Rapportages & marge"}
              </span>
              <span style={{ display: "block", fontSize: "12.5px", color: "var(--neutral-600)", lineHeight: "1.45" }}>
                {"Live inzicht per project"}
              </span>
            </span>
          </a>
        </div>
      </div>
      <div
        style={{ position: "relative", overflow: "hidden", borderRadius: "16px", background: "linear-gradient(150deg, var(--indigo-600) 0%, var(--night-indigo) 100%)", color: "rgb(255, 255, 255)", padding: "24px" }}
      >
        <div aria-hidden="true" style={{ position: "absolute", top: "-120px", right: "-120px", width: "340px", height: "340px", pointerEvents: "none", background: "repeating-radial-gradient(circle, transparent 0px, transparent 44px, rgba(255, 255, 255, 0.16) 44px, rgba(255, 255, 255, 0.16) 45px)", maskImage: "radial-gradient(circle, rgb(0, 0, 0) 0%, transparent 70%)" }}></div>
        <div style={{ position: "relative" }}>
          <div
            style={{ fontFamily: "\"IBM Plex Mono\", ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255, 255, 255, 0.72)", marginBottom: "12px" }}
          >
            {"Het hele platform"}
          </div>
          <div
            style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "19px", lineHeight: "1.25", marginBottom: "10px" }}
          >
            {"Van lead tot ondertekend opleverdossier"}
          </div>
          <p style={{ margin: "0px 0px 18px", fontSize: "13.5px", color: "rgba(255, 255, 255, 0.84)", lineHeight: "1.5" }}>
            {"Zie in 20 minuten hoe de hele keten werkt met jouw soort projecten."}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
            <div className="sc-host-x" style={{ display: "contents" }}>
              <a
                href="/demo"
                className="mh-btn"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "var(--font-body)", fontWeight: "var(--fw-semibold)", lineHeight: "1", border: "1px solid transparent", borderRadius: "var(--radius-md)", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)", height: "var(--control-h)", padding: "0px 22px", fontSize: "16px", background: "var(--white)", color: "var(--night-indigo)", width: "100%" }}
              >
                {"Plan een gratis demo"}
              </a>
            </div>
            <div className="sc-host-x" style={{ display: "contents" }}>
              <a
                href="/proefperiode"
                className="mh-btn"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "var(--font-body)", fontWeight: "var(--fw-semibold)", lineHeight: "1", border: "1px solid transparent", borderRadius: "var(--radius-md)", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)", height: "var(--control-h)", padding: "0px 22px", fontSize: "16px", background: "var(--color-accent)", color: "var(--white)", width: "100%" }}
              >
                <span className="sc-interp">
                  {"Start gratis"}
                </span>
              </a>
            </div>
            <a
              href="/functionaliteiten"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "7px", fontSize: "13.5px", fontWeight: "600", color: "rgb(255, 255, 255)" }}
            >
              {"Bekijk alle functionaliteiten"}
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
                className="lucide lucide-arrow-right"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
);
