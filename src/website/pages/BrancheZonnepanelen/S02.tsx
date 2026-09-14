
export const S02 = () => (
    <section className="mh-secpad" style={{ padding: "88px 0px 80px", background: "var(--surface-tint)" }}>
      <div className="mh-container">
        <div style={{ maxWidth: "640px", marginBottom: "36px" }}>
          <div
            style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--indigo-600)", marginBottom: "14px" }}
          >
            {"Herkenbaar?"}
          </div>
          <h2 style={{ margin: "0px 0px 10px" }}>
            <span className="sc-interp">
              {"Herken je dit bij zon-PV?"}
            </span>
          </h2>
          <p style={{ fontSize: "18px", color: "var(--neutral-600)", margin: "0px", lineHeight: "1.6" }}>
            {"De meeste bedrijven in deze branche lopen tegen dezelfde drie dingen aan."}
          </p>
        </div>
        <div className="mh-grid3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
          <div className="sc-host-x" style={{ display: "contents" }}>
            <div
              className="mh-card"
              style={{ boxSizing: "border-box", background: "var(--surface-card)", borderRadius: "var(--radius-lg)", padding: "24px", transition: "transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard)", border: "1px solid var(--border-subtle)", boxShadow: "none" }}
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
                style={{ width: "32px", height: "32px", color: "var(--color-primary)", strokeWidth: "1.5", flex: "0 0 auto", display: "block", marginBottom: "16px" }}
                className="lucide lucide-clock"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <div
                style={{ fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "17px", lineHeight: "1.3", color: "var(--text-heading)", marginBottom: "9px" }}
              >
                <span className="sc-interp">
                  {"Het dak is opgemeten, de offerte volgt dagen later"}
                </span>
              </div>
              <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                <span className="sc-interp">
                  {"Ondertussen ligt er al een offerte van de buurman op de mat, en koelt je lead af."}
                </span>
              </p>
            </div>
          </div>
          <div className="sc-host-x" style={{ display: "contents" }}>
            <div
              className="mh-card"
              style={{ boxSizing: "border-box", background: "var(--surface-card)", borderRadius: "var(--radius-lg)", padding: "24px", transition: "transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard)", border: "1px solid var(--border-subtle)", boxShadow: "none" }}
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
                style={{ width: "32px", height: "32px", color: "var(--color-primary)", strokeWidth: "1.5", flex: "0 0 auto", display: "block", marginBottom: "16px" }}
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
              <div
                style={{ fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "17px", lineHeight: "1.3", color: "var(--text-heading)", marginBottom: "9px" }}
              >
                <span className="sc-interp">
                  {"Opbrengst in de ene tool, prijzen in de andere"}
                </span>
              </div>
              <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                <span className="sc-interp">
                  {"PVGIS, een rekenblad en een Word-sjabloon. Drie keer overtypen, drie kansen op een fout."}
                </span>
              </p>
            </div>
          </div>
          <div className="sc-host-x" style={{ display: "contents" }}>
            <div
              className="mh-card"
              style={{ boxSizing: "border-box", background: "var(--surface-card)", borderRadius: "var(--radius-lg)", padding: "24px", transition: "transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard)", border: "1px solid var(--border-subtle)", boxShadow: "none" }}
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
                style={{ width: "32px", height: "32px", color: "var(--color-primary)", strokeWidth: "1.5", flex: "0 0 auto", display: "block", marginBottom: "16px" }}
                className="lucide lucide-file-warning"
              >
                <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
              <div
                style={{ fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "17px", lineHeight: "1.3", color: "var(--text-heading)", marginBottom: "9px" }}
              >
                <span className="sc-interp">
                  {"Scope 12-papierwerk komt weken achteraan"}
                </span>
              </div>
              <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                <span className="sc-interp">
                  {"Stringplan en serienummers zitten in een appje van de monteur, niet in een dossier."}
                </span>
              </p>
            </div>
          </div>
        </div>
        <div
          style={{ marginTop: "28px", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", padding: "20px 24px", borderRadius: "14px", background: "rgb(255, 255, 255)", border: "1px solid var(--indigo-200)", boxShadow: "0 0 0 3px var(--indigo-50)" }}
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
            style={{ width: "22px", height: "22px", color: "var(--color-primary)", flex: "0 0 auto" }}
            className="lucide lucide-arrow-down"
          >
            <path d="M12 5v14" />
            <path d="m19 12-7 7-7-7" />
          </svg>
          <span
            style={{ fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "17px", color: "var(--text-heading)", flex: "1 1 0%", minWidth: "260px" }}
          >
            {"In mijnhuis.nu staat dit alles in \u00e9\u00e9n dossier, van eerste aanvraag tot ondertekende oplevering."}
          </span>
          <div className="sc-host-x" style={{ display: "contents" }}>
            <a
              href="/demo"
              className="mh-btn"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "var(--font-body)", fontWeight: "var(--fw-semibold)", lineHeight: "1", border: "1px solid transparent", borderRadius: "var(--radius-md)", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)", height: "var(--control-h)", padding: "0px 22px", fontSize: "16px", background: "var(--color-primary)", color: "var(--white)" }}
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
                className="lucide lucide-calendar-check"
              >
                <path d="M8 2v3" />
                <path d="M16 2v3" />
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="m9 15 2 2 4-4" />
              </svg>
              {"Laat het me zien"}
            </a>
          </div>
        </div>
      </div>
    </section>
);
