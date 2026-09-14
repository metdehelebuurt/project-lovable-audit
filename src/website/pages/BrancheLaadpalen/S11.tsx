
export const S11 = () => (
    <section
      className="mh-secpad"
      style={{ padding: "72px 0px 88px", background: "var(--surface-page)", borderTop: "1px solid var(--border-subtle)" }}
    >
      <div className="mh-container">
        <div className="mh-grid2 mh-reveal" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px" }}>
          <div>
            <h3 style={{ fontSize: "19px", margin: "0px 0px 16px" }}>
              {"Andere vakgebieden"}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <a
                href="/branches/zonnepanelen"
                className="scp5"
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 4px", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-heading)" }}
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
                  style={{ width: "18px", height: "18px", color: "var(--color-primary)", flex: "0 0 auto" }}
                  className="lucide lucide-thermometer"
                >
                  <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
                </svg>
                <span style={{ flex: "1 1 0%" }}>
                  <span style={{ display: "block", fontWeight: "600", fontSize: "15.5px" }}>
                    <span className="sc-interp">
                      {"Zonnepanelen"}
                    </span>
                  </span>
                  <span style={{ display: "block", fontSize: "13.5px", color: "var(--neutral-600)", lineHeight: "1.45" }}>
                    <span className="sc-interp">
                      {"Van dakvlak-schouw en opbrengstberekening tot oplevering met SCIOS-bewijs."}
                    </span>
                  </span>
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
                  style={{ width: "15px", height: "15px", color: "var(--indigo-300)", flex: "0 0 auto" }}
                  className="lucide lucide-arrow-right"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </a>
              <a
                href="/branches/warmtepompen"
                className="scp5"
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 4px", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-heading)" }}
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
                  style={{ width: "18px", height: "18px", color: "var(--color-primary)", flex: "0 0 auto" }}
                  className="lucide lucide-battery-charging"
                >
                  <path d="m11 7-3 5h4l-3 5" />
                  <path d="M14.856 6H16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.935" />
                  <path d="M22 14v-4" />
                  <path d="M5.14 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2.936" />
                </svg>
                <span style={{ flex: "1 1 0%" }}>
                  <span style={{ display: "block", fontWeight: "600", fontSize: "15.5px" }}>
                    <span className="sc-interp">
                      {"Warmtepompen"}
                    </span>
                  </span>
                  <span style={{ display: "block", fontSize: "13.5px", color: "var(--neutral-600)", lineHeight: "1.45" }}>
                    <span className="sc-interp">
                      {"Warmteverlies rekenen, subsidie aanvragen en F-gassen netjes gelogd."}
                    </span>
                  </span>
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
                  style={{ width: "15px", height: "15px", color: "var(--indigo-300)", flex: "0 0 auto" }}
                  className="lucide lucide-arrow-right"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </a>
              <a
                href="/branches/thuisbatterijen"
                className="scp5"
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 4px", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-heading)" }}
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
                  style={{ width: "18px", height: "18px", color: "var(--color-primary)", flex: "0 0 auto" }}
                  className="lucide lucide-plug-zap"
                >
                  <path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z" />
                  <path d="m2 22 3-3" />
                  <path d="M7.5 13.5 10 11" />
                  <path d="M10.5 16.5 13 14" />
                  <path d="m18 3-4 4h6l-4 4" />
                </svg>
                <span style={{ flex: "1 1 0%" }}>
                  <span style={{ display: "block", fontWeight: "600", fontSize: "15.5px" }}>
                    <span className="sc-interp">
                      {"Thuisbatterijen"}
                    </span>
                  </span>
                  <span style={{ display: "block", fontSize: "13.5px", color: "var(--neutral-600)", lineHeight: "1.45" }}>
                    <span className="sc-interp">
                      {"Zelfconsumptie doorrekenen en veilig opleveren volgens de norm."}
                    </span>
                  </span>
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
                  style={{ width: "15px", height: "15px", color: "var(--indigo-300)", flex: "0 0 auto" }}
                  className="lucide lucide-arrow-right"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </a>
              <a
                href="/branches/isolatie"
                className="scp5"
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 4px", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-heading)" }}
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
                  style={{ width: "18px", height: "18px", color: "var(--color-primary)", flex: "0 0 auto" }}
                  className="lucide lucide-layers"
                >
                  <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" />
                  <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" />
                  <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" />
                </svg>
                <span style={{ flex: "1 1 0%" }}>
                  <span style={{ display: "block", fontWeight: "600", fontSize: "15.5px" }}>
                    <span className="sc-interp">
                      {"Isolatie"}
                    </span>
                  </span>
                  <span style={{ display: "block", fontSize: "13.5px", color: "var(--neutral-600)", lineHeight: "1.45" }}>
                    <span className="sc-interp">
                      {"Rc-waarden, subsidie en oplevering, netjes onderbouwd."}
                    </span>
                  </span>
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
                  style={{ width: "15px", height: "15px", color: "var(--indigo-300)", flex: "0 0 auto" }}
                  className="lucide lucide-arrow-right"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: "19px", margin: "0px 0px 16px" }}>
              {"Verder lezen"}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <a
                href="/functionaliteiten"
                className="scp5"
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 4px", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-heading)" }}
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
                  style={{ width: "18px", height: "18px", color: "var(--color-primary)" }}
                  className="lucide lucide-layout-grid"
                >
                  <rect width="7" height="7" x="3" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="14" rx="1" />
                  <rect width="7" height="7" x="3" y="14" rx="1" />
                </svg>
                <span style={{ flex: "1 1 0%" }}>
                  <span style={{ display: "block", fontWeight: "600", fontSize: "15.5px" }}>
                    {"Alle functionaliteiten"}
                  </span>
                  <span style={{ display: "block", fontSize: "13.5px", color: "var(--neutral-600)" }}>
                    {"Elke functie met uitleg, in drie fases"}
                  </span>
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
                  style={{ width: "15px", height: "15px", color: "var(--indigo-300)" }}
                  className="lucide lucide-arrow-right"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </a>
              <a
                href="/prijzen"
                className="scp5"
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 4px", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-heading)" }}
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
                  style={{ width: "18px", height: "18px", color: "var(--color-primary)" }}
                  className="lucide lucide-tag"
                >
                  <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
                  <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
                </svg>
                <span style={{ flex: "1 1 0%" }}>
                  <span style={{ display: "block", fontWeight: "600", fontSize: "15.5px" }}>
                    {"Prijzen en pakketten"}
                  </span>
                  <span style={{ display: "block", fontSize: "13.5px", color: "var(--neutral-600)" }}>
                    {"Per gebruiker per maand, zonder verrassingen"}
                  </span>
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
                  style={{ width: "15px", height: "15px", color: "var(--indigo-300)" }}
                  className="lucide lucide-arrow-right"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </a>
              <a
                href="/succesverhalen"
                className="scp5"
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 4px", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-heading)" }}
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
                  style={{ width: "18px", height: "18px", color: "var(--color-primary)" }}
                  className="lucide lucide-quote"
                >
                  <path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z" />
                  <path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z" />
                </svg>
                <span style={{ flex: "1 1 0%" }}>
                  <span style={{ display: "block", fontWeight: "600", fontSize: "15.5px" }}>
                    {"Succesverhalen"}
                  </span>
                  <span style={{ display: "block", fontSize: "13.5px", color: "var(--neutral-600)" }}>
                    {"Hoe Smart Accu van 4 naar 14 man groeide"}
                  </span>
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
                  style={{ width: "15px", height: "15px", color: "var(--indigo-300)" }}
                  className="lucide lucide-arrow-right"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </a>
              <a
                href="/kennisbank"
                className="scp5"
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 4px", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-heading)" }}
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
                  style={{ width: "18px", height: "18px", color: "var(--color-primary)" }}
                  className="lucide lucide-book-open"
                >
                  <path d="M12 5v16" />
                  <path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z" />
                </svg>
                <span style={{ flex: "1 1 0%" }}>
                  <span style={{ display: "block", fontWeight: "600", fontSize: "15.5px" }}>
                    {"Kennisbank"}
                  </span>
                  <span style={{ display: "block", fontSize: "13.5px", color: "var(--neutral-600)" }}>
                    {"Gidsen over subsidies, normen en werkwijze"}
                  </span>
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
                  style={{ width: "15px", height: "15px", color: "var(--indigo-300)" }}
                  className="lucide lucide-arrow-right"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </a>
              <a
                href="/kennismaking"
                className="scp5"
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 4px", color: "var(--text-heading)" }}
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
                  style={{ width: "18px", height: "18px", color: "var(--color-primary)" }}
                  className="lucide lucide-coffee"
                >
                  <path d="M10 2v2" />
                  <path d="M14 2v2" />
                  <path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1" />
                  <path d="M6 2v2" />
                </svg>
                <span style={{ flex: "1 1 0%" }}>
                  <span style={{ display: "block", fontWeight: "600", fontSize: "15.5px" }}>
                    {"Vrijblijvende kennismaking"}
                  </span>
                  <span style={{ display: "block", fontSize: "13.5px", color: "var(--neutral-600)" }}>
                    {"Twintig minuten met Bas, zonder verkooppraat"}
                  </span>
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
                  style={{ width: "15px", height: "15px", color: "var(--indigo-300)" }}
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
    </section>
);
