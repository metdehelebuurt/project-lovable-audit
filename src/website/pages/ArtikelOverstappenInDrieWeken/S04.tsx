
export const S04 = () => (
    <section className="mh-secpad" style={{ padding: "72px 0px 88px", background: "var(--surface-tint)" }}>
      <div className="mh-container">
        <div
          className="mh-reveal"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px", flexWrap: "wrap", marginBottom: "26px" }}
        >
          <h2 style={{ margin: "0px", fontSize: "28px" }}>
            {"Verder lezen"}
          </h2>
          <a
            href="/kennisbank"
            style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "15px", fontWeight: "600", color: "var(--indigo-700)" }}
          >
            {"Alle artikelen"}
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
        <div className="mh-grid2 mh-reveal" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <a
            href="/kennisbank/offerte-in-vijf-minuten"
            className="scp4"
            style={{ display: "flex", gap: "0px", alignItems: "stretch", borderRadius: "16px", overflow: "hidden", background: "var(--surface-page)", border: "1px solid var(--border-subtle)", color: "var(--text-heading)" }}
          >
            <span style={{ flex: "0 0 132px", backgroundSize: "cover", backgroundPosition: "center center", backgroundImage: "url(\"/__l5e/assets-v1/ce7d2dbc-5b5a-4bf8-b24d-774048ad16a9/img17.jpg")" }}></span>
            <span style={{ flex: "1 1 0%", padding: "22px 24px", display: "flex", flexDirection: "column", gap: "9px" }}>
              <span
                style={{ fontFamily: "\"IBM Plex Mono\", ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--indigo-600)" }}
              >
                <span className="sc-interp">
                  {"Schouw & verkoop"}
                </span>
              </span>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "18px", lineHeight: "1.3" }}>
                <span className="sc-interp">
                  {"In vijf minuten een offerte die de klant meteen tekent"}
                </span>
              </span>
              <span
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13.5px", color: "var(--neutral-600)", marginTop: "auto" }}
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
                  style={{ width: "14px", height: "14px" }}
                  className="lucide lucide-clock"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <span className="sc-interp">
                  {"5 min"}
                </span>
                {" lezen"}
              </span>
            </span>
          </a>
          <a
            href="/kennisbank/subsidies-2026-zon-pv"
            className="scp4"
            style={{ display: "flex", gap: "0px", alignItems: "stretch", borderRadius: "16px", overflow: "hidden", background: "var(--surface-page)", border: "1px solid var(--border-subtle)", color: "var(--text-heading)" }}
          >
            <span style={{ flex: "0 0 132px", backgroundSize: "cover", backgroundPosition: "center center", backgroundImage: "url(\"/__l5e/assets-v1/ce7d2dbc-5b5a-4bf8-b24d-774048ad16a9/img17.jpg")" }}></span>
            <span style={{ flex: "1 1 0%", padding: "22px 24px", display: "flex", flexDirection: "column", gap: "9px" }}>
              <span
                style={{ fontFamily: "\"IBM Plex Mono\", ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--indigo-600)" }}
              >
                <span className="sc-interp">
                  {"Subsidies"}
                </span>
              </span>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "18px", lineHeight: "1.3" }}>
                <span className="sc-interp">
                  {"Subsidies 2026: wat verandert er voor zon-PV?"}
                </span>
              </span>
              <span
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13.5px", color: "var(--neutral-600)", marginTop: "auto" }}
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
                  style={{ width: "14px", height: "14px" }}
                  className="lucide lucide-clock"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <span className="sc-interp">
                  {"5 min"}
                </span>
                {" lezen"}
              </span>
            </span>
          </a>
        </div>
      </div>
    </section>
);
