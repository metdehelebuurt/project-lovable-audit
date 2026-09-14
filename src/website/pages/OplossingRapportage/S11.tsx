
export const S11 = () => (
    <section className="mh-secpad" style={{ padding: "80px 0px", background: "var(--surface-tint)" }}>
      <div className="mh-container">
        <div className="mh-reveal" style={{ maxWidth: "640px", marginBottom: "32px" }}>
          <div
            style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--indigo-600)", marginBottom: "14px" }}
          >
            {"De keten"}
          </div>
          <h2 style={{ margin: "0px 0px 10px" }}>
            {"Dit staat niet op zichzelf"}
          </h2>
          <p style={{ fontSize: "17px", color: "var(--neutral-600)", margin: "0px", lineHeight: "1.6" }}>
            {"Elke stap geeft zijn gegevens door aan de volgende. Daarom hoef je nooit iets over te typen."}
          </p>
        </div>
        <div className="mh-grid2 mh-reveal" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <a
            href="/oplossingen/klantportaal"
            className="scp4"
            style={{ display: "flex", gap: "16px", alignItems: "center", padding: "24px 26px", borderRadius: "16px", background: "var(--surface-page)", border: "1px solid var(--border-subtle)", color: "var(--text-heading)" }}
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
              style={{ width: "18px", height: "18px", color: "var(--indigo-300)", flex: "0 0 auto" }}
              className="lucide lucide-arrow-left"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            <span style={{ flex: "1 1 0%" }}>
              <span
                style={{ display: "block", fontSize: "12.5px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--neutral-600)", marginBottom: "4px" }}
              >
                {"Ervoor"}
              </span>
              <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "18px" }}>
                <span className="sc-interp">
                  {"Klantportaal"}
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
              style={{ width: "32px", height: "32px", color: "var(--color-primary)", strokeWidth: "1.5", flex: "0 0 auto", display: "block" }}
              className="lucide lucide-bar-chart-3"
            >
              <path d="M3 3v16a2 2 0 0 0 2 2h16" />
              <path d="M18 17V9" />
              <path d="M13 17V5" />
              <path d="M8 17v-3" />
            </svg>
          </a>
          <a
            href="/oplossingen/lead"
            className="scp4"
            style={{ display: "flex", gap: "16px", alignItems: "center", padding: "24px 26px", borderRadius: "16px", background: "var(--surface-page)", border: "1px solid var(--border-subtle)", color: "var(--text-heading)" }}
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
              style={{ width: "32px", height: "32px", color: "var(--color-primary)", strokeWidth: "1.5", flex: "0 0 auto", display: "block" }}
              className="lucide lucide-ruler"
            >
              <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" />
              <path d="m14.5 12.5 2-2" />
              <path d="m11.5 9.5 2-2" />
              <path d="m8.5 6.5 2-2" />
              <path d="m17.5 15.5 2-2" />
            </svg>
            <span style={{ flex: "1 1 0%" }}>
              <span
                style={{ display: "block", fontSize: "12.5px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--neutral-600)", marginBottom: "4px" }}
              >
                {"Daarna"}
              </span>
              <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "18px" }}>
                <span className="sc-interp">
                  {"Leadbeheer & sales-CRM"}
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
              style={{ width: "18px", height: "18px", color: "var(--indigo-300)", flex: "0 0 auto" }}
              className="lucide lucide-arrow-right"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </a>
        </div>
        <div className="mh-reveal" style={{ display: "flex", justifyContent: "center", marginTop: "28px" }}>
          <div className="sc-host-x" style={{ display: "contents" }}>
            <a
              href="/functionaliteiten"
              className="mh-btn"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "var(--font-body)", fontWeight: "var(--fw-semibold)", lineHeight: "1", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border-strong)", borderImage: "initial", borderRadius: "var(--radius-md)", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)", height: "var(--control-h)", padding: "0px 22px", fontSize: "16px", background: "var(--white)", color: "var(--color-primary)" }}
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
          className="mh-reveal"
          style={{ marginTop: "44px", paddingTop: "32px", borderTop: "1px solid var(--border-subtle)" }}
        >
          <div
            style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "17px", color: "var(--text-heading)", marginBottom: "6px" }}
          >
            {"Zo werkt "}
            <span className="sc-interp">
              {"Rapportages & marge"}
            </span>
            {" in jouw vakgebied"}
          </div>
          <p style={{ margin: "0px 0px 18px", fontSize: "15.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
            {"De formulieren, berekeningen en documenten verschillen per vakgebied. Kies het jouwe voor de details."}
          </p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <a
              href="/branches/zonnepanelen"
              className="scp6"
              style={{ display: "inline-flex", alignItems: "center", gap: "9px", padding: "11px 18px", borderRadius: "999px", background: "var(--surface-page)", border: "1px solid var(--border-subtle)", color: "var(--text-heading)", fontSize: "14.5px", fontWeight: "600" }}
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
                style={{ width: "16px", height: "16px", color: "var(--color-primary)" }}
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
                {"Zonnepanelen"}
              </span>
            </a>
            <a
              href="/branches/warmtepompen"
              className="scp6"
              style={{ display: "inline-flex", alignItems: "center", gap: "9px", padding: "11px 18px", borderRadius: "999px", background: "var(--surface-page)", border: "1px solid var(--border-subtle)", color: "var(--text-heading)", fontSize: "14.5px", fontWeight: "600" }}
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
                style={{ width: "16px", height: "16px", color: "var(--color-primary)" }}
                className="lucide lucide-thermometer"
              >
                <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
              </svg>
              <span className="sc-interp">
                {"Warmtepompen"}
              </span>
            </a>
            <a
              href="/branches/thuisbatterijen"
              className="scp6"
              style={{ display: "inline-flex", alignItems: "center", gap: "9px", padding: "11px 18px", borderRadius: "999px", background: "var(--surface-page)", border: "1px solid var(--border-subtle)", color: "var(--text-heading)", fontSize: "14.5px", fontWeight: "600" }}
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
                style={{ width: "16px", height: "16px", color: "var(--color-primary)" }}
                className="lucide lucide-battery-charging"
              >
                <path d="m11 7-3 5h4l-3 5" />
                <path d="M14.856 6H16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.935" />
                <path d="M22 14v-4" />
                <path d="M5.14 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2.936" />
              </svg>
              <span className="sc-interp">
                {"Thuisbatterijen"}
              </span>
            </a>
            <a
              href="/branches/laadpalen"
              className="scp6"
              style={{ display: "inline-flex", alignItems: "center", gap: "9px", padding: "11px 18px", borderRadius: "999px", background: "var(--surface-page)", border: "1px solid var(--border-subtle)", color: "var(--text-heading)", fontSize: "14.5px", fontWeight: "600" }}
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
                style={{ width: "16px", height: "16px", color: "var(--color-primary)" }}
                className="lucide lucide-plug-zap"
              >
                <path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z" />
                <path d="m2 22 3-3" />
                <path d="M7.5 13.5 10 11" />
                <path d="M10.5 16.5 13 14" />
                <path d="m18 3-4 4h6l-4 4" />
              </svg>
              <span className="sc-interp">
                {"Laadpalen"}
              </span>
            </a>
            <a
              href="/branches/isolatie"
              className="scp6"
              style={{ display: "inline-flex", alignItems: "center", gap: "9px", padding: "11px 18px", borderRadius: "999px", background: "var(--surface-page)", border: "1px solid var(--border-subtle)", color: "var(--text-heading)", fontSize: "14.5px", fontWeight: "600" }}
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
                style={{ width: "16px", height: "16px", color: "var(--color-primary)" }}
                className="lucide lucide-layers"
              >
                <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" />
                <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" />
                <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" />
              </svg>
              <span className="sc-interp">
                {"Isolatie"}
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
);
