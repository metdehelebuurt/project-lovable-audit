
export const S04 = () => (
    <section id="f-uitvoeren" className="mh-secpad" style={{ padding: "72px 0px", background: "var(--surface-tint)" }}>
      <div className="mh-container">
        <div
          className="mh-grid2 mh-reveal mh-hidden"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center", marginBottom: "40px" }}
        >
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div
              style={{ width: "230px", borderRadius: "30px", background: "var(--night-indigo)", padding: "9px", boxShadow: "var(--shadow-lg)" }}
            >
              <div style={{ borderRadius: "23px", overflow: "hidden", background: "rgb(255, 255, 255)" }}>
                <div style={{ background: "var(--color-primary)", color: "rgb(255, 255, 255)", padding: "16px 16px 18px" }}>
                  <div style={{ fontSize: "11px", opacity: "0.85" }}>
                    {"Werkbon \u00b7 vandaag"}
                  </div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "16px", marginTop: "2px" }}>
                    {"Warmtepomp \u00b7 Jansen BV"}
                  </div>
                </div>
                <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "11px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "9px", fontSize: "13px", color: "var(--neutral-600)" }}>
                    <span
                      style={{ width: "18px", height: "18px", borderRadius: "6px", background: "var(--green-500)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
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
                        style={{ width: "12px", height: "12px", color: "rgb(255, 255, 255)" }}
                        className="lucide lucide-check"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    <span style={{ textDecoration: "line-through" }}>
                      {"Warmteverlies gerekend"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "9px", fontSize: "13px", color: "var(--neutral-600)" }}>
                    <span
                      style={{ width: "18px", height: "18px", borderRadius: "6px", background: "var(--green-500)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
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
                        style={{ width: "12px", height: "12px", color: "rgb(255, 255, 255)" }}
                        className="lucide lucide-check"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    <span style={{ textDecoration: "line-through" }}>
                      {"Foto's binnenunit"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "9px", fontSize: "13px", color: "var(--text-body)" }}>
                    <span style={{ width: "18px", height: "18px", borderRadius: "6px", border: "1px solid var(--border-strong)" }}></span>
                    {"F-gassen gelogd"}
                  </div>
                  <div
                    style={{ marginTop: "4px", height: "40px", borderRadius: "10px", background: "var(--indigo-50)", color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", fontSize: "13px", fontWeight: "600" }}
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
                      className="lucide lucide-camera"
                    >
                      <path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z" />
                      <circle cx="12" cy="13" r="3" />
                    </svg>
                    {"Foto toevoegen"}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--neutral-600)", display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "99px", background: "var(--green-500)" }}></span>
                    {"Werkt offline \u00b7 sync automatisch"}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div
              style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--indigo-600)", marginBottom: "12px" }}
            >
              {"Fase 2 \u00b7 Uitvoeren"}
            </div>
            <h2 style={{ margin: "0px 0px 14px" }}>
              {"Plannen, uitvoeren en opleveren: op locatie"}
            </h2>
            <p style={{ fontSize: "17px", color: "var(--text-body)", lineHeight: "1.6", margin: "0px" }}>
              {"De planning vult zich, de monteur werkt de werkbon af op zijn telefoon (ook offline) en het opleverdocument maak je gewoon af op de klus, zoals het hoort."}
            </p>
          </div>
        </div>
        <div
          className="mh-grid3 mh-reveal mh-hidden"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}
        >
          <div className="sc-host-x" style={{ display: "contents" }}>
            <div
              className="mh-card"
              style={{ boxSizing: "border-box", background: "var(--surface-card)", borderRadius: "var(--radius-lg)", padding: "32px", transition: "transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard)", border: "1px solid var(--border-subtle)", boxShadow: "none" }}
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
                style={{ width: "32px", height: "32px", color: "var(--color-primary)", strokeWidth: "1.5", flex: "0 0 auto", display: "block", marginBottom: "14px" }}
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
              <h3 style={{ fontSize: "18px", margin: "0px 0px 8px" }}>
                {"Weekplanning"}
              </h3>
              <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                {"Sleep-en-neerzet planning voor je hele team. Elke wijziging staat direct op de telefoon van je monteur."}
              </p>
            </div>
          </div>
          <div className="sc-host-x" style={{ display: "contents" }}>
            <div
              className="mh-card"
              style={{ boxSizing: "border-box", background: "var(--surface-card)", borderRadius: "var(--radius-lg)", padding: "32px", transition: "transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard)", border: "1px solid var(--border-subtle)", boxShadow: "none" }}
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
                style={{ width: "32px", height: "32px", color: "var(--color-primary)", strokeWidth: "1.5", flex: "0 0 auto", display: "block", marginBottom: "14px" }}
                className="lucide lucide-clipboard-list"
              >
                <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <path d="M12 11h4" />
                <path d="M12 16h4" />
                <path d="M8 11h.01" />
                <path d="M8 16h.01" />
              </svg>
              <h3 style={{ fontSize: "18px", margin: "0px 0px 8px" }}>
                {"Werkbonnen"}
              </h3>
              <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                {"Digitale werkbonnen met alle projectinfo, taken en checklists. Ingevuld op locatie, meteen terug op kantoor."}
              </p>
            </div>
          </div>
          <div className="sc-host-x" style={{ display: "contents" }}>
            <div
              className="mh-card"
              style={{ boxSizing: "border-box", background: "var(--surface-card)", borderRadius: "var(--radius-lg)", padding: "32px", transition: "transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard)", border: "1px solid var(--border-subtle)", boxShadow: "none" }}
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
                style={{ width: "32px", height: "32px", color: "var(--color-primary)", strokeWidth: "1.5", flex: "0 0 auto", display: "block", marginBottom: "14px" }}
                className="lucide lucide-smartphone"
              >
                <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
                <path d="M12 18h.01" />
              </svg>
              <h3 style={{ fontSize: "18px", margin: "0px 0px 8px" }}>
                {"Monteursapp (offline)"}
              </h3>
              <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                {"Werkt zonder bereik: foto\u2019s, checklists en handtekeningen synchroniseren automatisch zodra er verbinding is."}
              </p>
            </div>
          </div>
          <div className="sc-host-x" style={{ display: "contents" }}>
            <div
              className="mh-card"
              style={{ boxSizing: "border-box", background: "var(--surface-card)", borderRadius: "var(--radius-lg)", padding: "32px", transition: "transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard)", border: "1px solid var(--border-subtle)", boxShadow: "none" }}
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
                style={{ width: "32px", height: "32px", color: "var(--color-primary)", strokeWidth: "1.5", flex: "0 0 auto", display: "block", marginBottom: "14px" }}
                className="lucide lucide-package"
              >
                <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
                <path d="M12 22V12" />
                <polyline points="3.29 7 12 12 20.71 7" />
                <path d="m7.5 4.27 9 5.15" />
              </svg>
              <h3 style={{ fontSize: "18px", margin: "0px 0px 8px" }}>
                {"Materiaal & voorraad"}
              </h3>
              <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                {"Materiaallijsten per project en zicht op wat mee moet de bus in. Minder misgrijpen op locatie."}
              </p>
            </div>
          </div>
          <div className="sc-host-x" style={{ display: "contents" }}>
            <div
              className="mh-card"
              style={{ boxSizing: "border-box", background: "var(--surface-card)", borderRadius: "var(--radius-lg)", padding: "32px", transition: "transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard)", border: "1px solid var(--border-subtle)", boxShadow: "none" }}
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
                style={{ width: "32px", height: "32px", color: "var(--color-primary)", strokeWidth: "1.5", flex: "0 0 auto", display: "block", marginBottom: "14px" }}
                className="lucide lucide-clock"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <h3 style={{ fontSize: "18px", margin: "0px 0px 8px" }}>
                {"Urenregistratie"}
              </h3>
              <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                {"Uren en reistijd registreren vanuit de app, direct gekoppeld aan het project en de facturatie."}
              </p>
            </div>
          </div>
          <div className="sc-host-x" style={{ display: "contents" }}>
            <div
              className="mh-card"
              style={{ boxSizing: "border-box", background: "var(--surface-card)", borderRadius: "var(--radius-lg)", padding: "32px", transition: "transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard)", border: "1px solid var(--border-subtle)", boxShadow: "none" }}
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
                style={{ width: "32px", height: "32px", color: "var(--color-primary)", strokeWidth: "1.5", flex: "0 0 auto", display: "block", marginBottom: "14px" }}
                className="lucide lucide-stamp"
              >
                <path d="M14 13V8.5C14 7 15 7 15 5a3 3 0 0 0-6 0c0 2 1 2 1 3.5V13" />
                <path d="M20 15.5a2.5 2.5 0 0 0-2.5-2.5h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1z" />
                <path d="M5 22h14" />
              </svg>
              <h3 style={{ fontSize: "18px", margin: "0px 0px 8px" }}>
                {"Oplevering & opleverdossier"}
              </h3>
              <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                {"Maak het opleverdocument op locatie af, per branche volgens NEN, met tijdstempel, hash en tweezijdige ondertekening."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
);
