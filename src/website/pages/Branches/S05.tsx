
export const S05 = () => (
    <section className="mh-secpad" style={{ padding: "88px 0px", background: "var(--surface-tint)" }}>
      <div className="mh-container">
        <div className="mh-reveal mh-hidden" style={{ maxWidth: "700px", marginBottom: "32px" }}>
          <div
            style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--indigo-600)", marginBottom: "14px" }}
          >
            {"Uit de doos"}
          </div>
          <h2 style={{ margin: "0px 0px 10px" }}>
            {"Wat er per branche klaarstaat"}
          </h2>
          <p style={{ fontSize: "17px", color: "var(--text-body)", margin: "0px", lineHeight: "1.6" }}>
            {"Geen implementatietraject van maanden: dit staat er op dag \u00e9\u00e9n, en wij houden het bij als de normen wijzigen."}
          </p>
        </div>
        <div
          className="mh-reveal mh-hidden"
          style={{ overflowX: "auto", borderRadius: "14px", border: "1px solid var(--border-subtle)", background: "rgb(255, 255, 255)" }}
        >
          <div style={{ minWidth: "1040px" }}>
            <div
              style={{ display: "grid", gridTemplateColumns: "196px repeat(5, 1fr)", borderBottom: "1px solid var(--border-subtle)", background: "var(--neutral-50)" }}
            >
              <div style={{ padding: "16px 18px" }}></div>
              <a
                href="/branches/zonnepanelen"
                style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start", borderLeft: "1px solid var(--border-subtle)", color: "var(--text-heading)" }}
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
                  style={{ width: "22px", height: "22px", color: "var(--color-primary)", strokeWidth: "1.5" }}
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
                <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "14.5px", lineHeight: "1.2" }}>
                  <span className="sc-interp">
                    {"Zonnepanelen"}
                  </span>
                </span>
              </a>
              <a
                href="/branches/warmtepompen"
                style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start", borderLeft: "1px solid var(--border-subtle)", color: "var(--text-heading)" }}
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
                  style={{ width: "22px", height: "22px", color: "var(--color-primary)", strokeWidth: "1.5" }}
                  className="lucide lucide-thermometer"
                >
                  <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
                </svg>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "14.5px", lineHeight: "1.2" }}>
                  <span className="sc-interp">
                    {"Warmtepompen"}
                  </span>
                </span>
              </a>
              <a
                href="/branches/thuisbatterijen"
                style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start", borderLeft: "1px solid var(--border-subtle)", color: "var(--text-heading)" }}
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
                  style={{ width: "22px", height: "22px", color: "var(--color-primary)", strokeWidth: "1.5" }}
                  className="lucide lucide-battery-charging"
                >
                  <path d="m11 7-3 5h4l-3 5" />
                  <path d="M14.856 6H16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.935" />
                  <path d="M22 14v-4" />
                  <path d="M5.14 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2.936" />
                </svg>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "14.5px", lineHeight: "1.2" }}>
                  <span className="sc-interp">
                    {"Thuisbatterijen"}
                  </span>
                </span>
              </a>
              <a
                href="/branches/laadpalen"
                style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start", borderLeft: "1px solid var(--border-subtle)", color: "var(--text-heading)" }}
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
                  style={{ width: "22px", height: "22px", color: "var(--color-primary)", strokeWidth: "1.5" }}
                  className="lucide lucide-plug-zap"
                >
                  <path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z" />
                  <path d="m2 22 3-3" />
                  <path d="M7.5 13.5 10 11" />
                  <path d="M10.5 16.5 13 14" />
                  <path d="m18 3-4 4h6l-4 4" />
                </svg>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "14.5px", lineHeight: "1.2" }}>
                  <span className="sc-interp">
                    {"Laadpalen"}
                  </span>
                </span>
              </a>
              <a
                href="/branches/isolatie"
                style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start", borderLeft: "1px solid var(--border-subtle)", color: "var(--text-heading)" }}
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
                  style={{ width: "22px", height: "22px", color: "var(--color-primary)", strokeWidth: "1.5" }}
                  className="lucide lucide-layers"
                >
                  <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" />
                  <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" />
                  <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" />
                </svg>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "14.5px", lineHeight: "1.2" }}>
                  <span className="sc-interp">
                    {"Isolatie"}
                  </span>
                </span>
              </a>
            </div>
            <div
              style={{ display: "grid", gridTemplateColumns: "196px repeat(5, 1fr)", borderBottom: "1px solid var(--border-subtle)" }}
            >
              <div
                style={{ padding: "16px 18px", display: "flex", gap: "9px", alignItems: "flex-start", background: "var(--neutral-50)" }}
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
                  style={{ width: "16px", height: "16px", color: "var(--color-primary)", flex: "0 0 auto", marginTop: "2px" }}
                  className="lucide lucide-ruler"
                >
                  <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" />
                  <path d="m14.5 12.5 2-2" />
                  <path d="m11.5 9.5 2-2" />
                  <path d="m8.5 6.5 2-2" />
                  <path d="m17.5 15.5 2-2" />
                </svg>
                <span
                  style={{ fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "13.5px", color: "var(--text-heading)", lineHeight: "1.3" }}
                >
                  <span className="sc-interp">
                    {"Schouw op locatie"}
                  </span>
                </span>
              </div>
              <div
                style={{ padding: "16px 14px", borderLeft: "1px solid var(--border-subtle)", fontSize: "13px", color: "var(--text-body)", lineHeight: "1.5" }}
              >
                <span className="sc-interp">
                  {"Dakvlakken, hellingshoek & schaduw"}
                </span>
              </div>
              <div
                style={{ padding: "16px 14px", borderLeft: "1px solid var(--border-subtle)", fontSize: "13px", color: "var(--text-body)", lineHeight: "1.5" }}
              >
                <span className="sc-interp">
                  {"Warmteverlies per vertrek"}
                </span>
              </div>
              <div
                style={{ padding: "16px 14px", borderLeft: "1px solid var(--border-subtle)", fontSize: "13px", color: "var(--text-body)", lineHeight: "1.5" }}
              >
                <span className="sc-interp">
                  {"Meterkast, groepen & kabelroute"}
                </span>
              </div>
              <div
                style={{ padding: "16px 14px", borderLeft: "1px solid var(--border-subtle)", fontSize: "13px", color: "var(--text-body)", lineHeight: "1.5" }}
              >
                <span className="sc-interp">
                  {"Vlakken, oppervlaktes & foto\u2019s v\u00f3\u00f3r"}
                </span>
              </div>
              <div
                style={{ padding: "16px 14px", borderLeft: "1px solid var(--border-subtle)", fontSize: "13px", color: "var(--text-body)", lineHeight: "1.5" }}
              >
                <span className="sc-interp">
                  {"Omvormer, opstelplaats & verbruik"}
                </span>
              </div>
            </div>
            <div
              style={{ display: "grid", gridTemplateColumns: "196px repeat(5, 1fr)", borderBottom: "1px solid var(--border-subtle)" }}
            >
              <div
                style={{ padding: "16px 18px", display: "flex", gap: "9px", alignItems: "flex-start", background: "var(--neutral-50)" }}
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
                  style={{ width: "16px", height: "16px", color: "var(--color-primary)", flex: "0 0 auto", marginTop: "2px" }}
                  className="lucide lucide-calculator"
                >
                  <rect width="16" height="20" x="4" y="2" rx="2" />
                  <line x1="8" x2="16" y1="6" y2="6" />
                  <line x1="16" x2="16" y1="14" y2="18" />
                  <path d="M16 10h.01" />
                  <path d="M12 10h.01" />
                  <path d="M8 10h.01" />
                  <path d="M12 14h.01" />
                  <path d="M8 14h.01" />
                  <path d="M12 18h.01" />
                  <path d="M8 18h.01" />
                </svg>
                <span
                  style={{ fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "13.5px", color: "var(--text-heading)", lineHeight: "1.3" }}
                >
                  <span className="sc-interp">
                    {"Rekenmodule"}
                  </span>
                </span>
              </div>
              <div
                style={{ padding: "16px 14px", borderLeft: "1px solid var(--border-subtle)", fontSize: "13px", color: "var(--text-body)", lineHeight: "1.5" }}
              >
                <span className="sc-interp">
                  {"PVGIS-opbrengst & terugverdientijd"}
                </span>
              </div>
              <div
                style={{ padding: "16px 14px", borderLeft: "1px solid var(--border-subtle)", fontSize: "13px", color: "var(--text-body)", lineHeight: "1.5" }}
              >
                <span className="sc-interp">
                  {"Warmteverlies, COP & geluid"}
                </span>
              </div>
              <div
                style={{ padding: "16px 14px", borderLeft: "1px solid var(--border-subtle)", fontSize: "13px", color: "var(--text-body)", lineHeight: "1.5" }}
              >
                <span className="sc-interp">
                  {"Load balancing & aansluitwaarde"}
                </span>
              </div>
              <div
                style={{ padding: "16px 14px", borderLeft: "1px solid var(--border-subtle)", fontSize: "13px", color: "var(--text-body)", lineHeight: "1.5" }}
              >
                <span className="sc-interp">
                  {"Rd-waarde per maatregel"}
                </span>
              </div>
              <div
                style={{ padding: "16px 14px", borderLeft: "1px solid var(--border-subtle)", fontSize: "13px", color: "var(--text-body)", lineHeight: "1.5" }}
              >
                <span className="sc-interp">
                  {"Terugverdienscenario op echt verbruik"}
                </span>
              </div>
            </div>
            <div
              style={{ display: "grid", gridTemplateColumns: "196px repeat(5, 1fr)", borderBottom: "1px solid var(--border-subtle)" }}
            >
              <div
                style={{ padding: "16px 18px", display: "flex", gap: "9px", alignItems: "flex-start", background: "var(--neutral-50)" }}
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
                  style={{ width: "16px", height: "16px", color: "var(--color-primary)", flex: "0 0 auto", marginTop: "2px" }}
                  className="lucide lucide-badge-euro"
                >
                  <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                  <path d="M7 12h5" />
                  <path d="M15 9.4a4 4 0 1 0 0 5.2" />
                </svg>
                <span
                  style={{ fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "13.5px", color: "var(--text-heading)", lineHeight: "1.3" }}
                >
                  <span className="sc-interp">
                    {"Subsidie"}
                  </span>
                </span>
              </div>
              <div
                style={{ padding: "16px 14px", borderLeft: "1px solid var(--border-subtle)", fontSize: "13px", color: "var(--text-body)", lineHeight: "1.5" }}
              >
                <span className="sc-interp">
                  {"Subsidie waar van toepassing"}
                </span>
              </div>
              <div
                style={{ padding: "16px 14px", borderLeft: "1px solid var(--border-subtle)", fontSize: "13px", color: "var(--text-body)", lineHeight: "1.5" }}
              >
                <span className="sc-interp">
                  {"Subsidie actueel per toestel"}
                </span>
              </div>
              <div
                style={{ padding: "16px 14px", borderLeft: "1px solid var(--border-subtle)", fontSize: "13px", color: "var(--text-body)", lineHeight: "1.5" }}
              >
                <span className="sc-interp">
                  {"Niet van toepassing"}
                </span>
              </div>
              <div
                style={{ padding: "16px 14px", borderLeft: "1px solid var(--border-subtle)", fontSize: "13px", color: "var(--text-body)", lineHeight: "1.5" }}
              >
                <span className="sc-interp">
                  {"Subsidie-onderbouwing compleet"}
                </span>
              </div>
              <div
                style={{ padding: "16px 14px", borderLeft: "1px solid var(--border-subtle)", fontSize: "13px", color: "var(--text-body)", lineHeight: "1.5" }}
              >
                <span className="sc-interp">
                  {"Niet van toepassing"}
                </span>
              </div>
            </div>
            <div
              style={{ display: "grid", gridTemplateColumns: "196px repeat(5, 1fr)", borderBottom: "1px solid var(--border-subtle)" }}
            >
              <div
                style={{ padding: "16px 18px", display: "flex", gap: "9px", alignItems: "flex-start", background: "var(--neutral-50)" }}
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
                  style={{ width: "16px", height: "16px", color: "var(--color-primary)", flex: "0 0 auto", marginTop: "2px" }}
                  className="lucide lucide-badge-check"
                >
                  <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                  <path d="m16 9-5.5 5.5L8 12" />
                </svg>
                <span
                  style={{ fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "13.5px", color: "var(--text-heading)", lineHeight: "1.3" }}
                >
                  <span className="sc-interp">
                    {"Norm & keuring"}
                  </span>
                </span>
              </div>
              <div
                style={{ padding: "16px 14px", borderLeft: "1px solid var(--border-subtle)", fontSize: "13px", color: "var(--text-body)", lineHeight: "1.5" }}
              >
                <span className="sc-interp">
                  {"SCIOS Scope 12"}
                </span>
              </div>
              <div
                style={{ padding: "16px 14px", borderLeft: "1px solid var(--border-subtle)", fontSize: "13px", color: "var(--text-body)", lineHeight: "1.5" }}
              >
                <span className="sc-interp">
                  {"F-gassen & NEN 1010"}
                </span>
              </div>
              <div
                style={{ padding: "16px 14px", borderLeft: "1px solid var(--border-subtle)", fontSize: "13px", color: "var(--text-body)", lineHeight: "1.5" }}
              >
                <span className="sc-interp">
                  {"NEN 1010-installatieverklaring"}
                </span>
              </div>
              <div
                style={{ padding: "16px 14px", borderLeft: "1px solid var(--border-subtle)", fontSize: "13px", color: "var(--text-body)", lineHeight: "1.5" }}
              >
                <span className="sc-interp">
                  {"Subsidie-eisen & Rd-bewijs"}
                </span>
              </div>
              <div
                style={{ padding: "16px 14px", borderLeft: "1px solid var(--border-subtle)", fontSize: "13px", color: "var(--text-body)", lineHeight: "1.5" }}
              >
                <span className="sc-interp">
                  {"NEN 1010 & brandveiligheid"}
                </span>
              </div>
            </div>
            <div
              style={{ display: "grid", gridTemplateColumns: "196px repeat(5, 1fr)", borderBottom: "1px solid var(--border-subtle)" }}
            >
              <div
                style={{ padding: "16px 18px", display: "flex", gap: "9px", alignItems: "flex-start", background: "var(--neutral-50)" }}
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
                  style={{ width: "16px", height: "16px", color: "var(--color-primary)", flex: "0 0 auto", marginTop: "2px" }}
                  className="lucide lucide-stamp"
                >
                  <path d="M14 13V8.5C14 7 15 7 15 5a3 3 0 0 0-6 0c0 2 1 2 1 3.5V13" />
                  <path d="M20 15.5a2.5 2.5 0 0 0-2.5-2.5h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1z" />
                  <path d="M5 22h14" />
                </svg>
                <span
                  style={{ fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "13.5px", color: "var(--text-heading)", lineHeight: "1.3" }}
                >
                  <span className="sc-interp">
                    {"Opleverdocument"}
                  </span>
                </span>
              </div>
              <div
                style={{ padding: "16px 14px", borderLeft: "1px solid var(--border-subtle)", fontSize: "13px", color: "var(--text-body)", lineHeight: "1.5" }}
              >
                <span className="sc-interp">
                  {"Stringplan & serienummers"}
                </span>
              </div>
              <div
                style={{ padding: "16px 14px", borderLeft: "1px solid var(--border-subtle)", fontSize: "13px", color: "var(--text-body)", lineHeight: "1.5" }}
              >
                <span className="sc-interp">
                  {"Inregelrapport & logboek"}
                </span>
              </div>
              <div
                style={{ padding: "16px 14px", borderLeft: "1px solid var(--border-subtle)", fontSize: "13px", color: "var(--text-body)", lineHeight: "1.5" }}
              >
                <span className="sc-interp">
                  {"Installatieverklaring & registratie"}
                </span>
              </div>
              <div
                style={{ padding: "16px 14px", borderLeft: "1px solid var(--border-subtle)", fontSize: "13px", color: "var(--text-body)", lineHeight: "1.5" }}
              >
                <span className="sc-interp">
                  {"Foto\u2019s n\u00e1 + subsidiebijlage"}
                </span>
              </div>
              <div
                style={{ padding: "16px 14px", borderLeft: "1px solid var(--border-subtle)", fontSize: "13px", color: "var(--text-body)", lineHeight: "1.5" }}
              >
                <span className="sc-interp">
                  {"Configuratie- & veiligheidsrapport"}
                </span>
              </div>
            </div>
            <div
              style={{ display: "grid", gridTemplateColumns: "196px repeat(5, 1fr)", borderBottom: "1px solid var(--border-subtle)" }}
            >
              <div
                style={{ padding: "16px 18px", display: "flex", gap: "9px", alignItems: "flex-start", background: "var(--neutral-50)" }}
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
                  style={{ width: "16px", height: "16px", color: "var(--color-primary)", flex: "0 0 auto", marginTop: "2px" }}
                  className="lucide lucide-refresh-cw"
                >
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M8 16H3v5" />
                </svg>
                <span
                  style={{ fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "13.5px", color: "var(--text-heading)", lineHeight: "1.3" }}
                >
                  <span className="sc-interp">
                    {"Service erna"}
                  </span>
                </span>
              </div>
              <div
                style={{ padding: "16px 14px", borderLeft: "1px solid var(--border-subtle)", fontSize: "13px", color: "var(--text-body)", lineHeight: "1.5" }}
              >
                <span className="sc-interp">
                  {"Opbrengst in het klantportaal"}
                </span>
              </div>
              <div
                style={{ padding: "16px 14px", borderLeft: "1px solid var(--border-subtle)", fontSize: "13px", color: "var(--text-body)", lineHeight: "1.5" }}
              >
                <span className="sc-interp">
                  {"Onderhoud automatisch gepland"}
                </span>
              </div>
              <div
                style={{ padding: "16px 14px", borderLeft: "1px solid var(--border-subtle)", fontSize: "13px", color: "var(--text-body)", lineHeight: "1.5" }}
              >
                <span className="sc-interp">
                  {"Laadpuntbeheer & garantie"}
                </span>
              </div>
              <div
                style={{ padding: "16px 14px", borderLeft: "1px solid var(--border-subtle)", fontSize: "13px", color: "var(--text-body)", lineHeight: "1.5" }}
              >
                <span className="sc-interp">
                  {"Alles per adres in \u00e9\u00e9n dossier"}
                </span>
              </div>
              <div
                style={{ padding: "16px 14px", borderLeft: "1px solid var(--border-subtle)", fontSize: "13px", color: "var(--text-body)", lineHeight: "1.5" }}
              >
                <span className="sc-interp">
                  {"Monitoring & besparing"}
                </span>
              </div>
            </div>
          </div>
        </div>
        <p
          className="mh-reveal mh-hidden"
          style={{ margin: "14px 0px 0px", fontSize: "13px", color: "var(--neutral-600)" }}
        >
          {"Scroll horizontaal om alle branches te zien."}
        </p>
      </div>
    </section>
);
