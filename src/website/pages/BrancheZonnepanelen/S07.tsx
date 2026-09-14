
export const S07 = () => (
    <section id="b-normen" className="mh-secpad" style={{ padding: "88px 0px", background: "var(--surface-tint)" }}>
      <div className="mh-container">
        <div className="mh-reveal mh-hidden" style={{ maxWidth: "660px", marginBottom: "36px" }}>
          <div
            style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--indigo-600)", marginBottom: "14px" }}
          >
            {"Normen en regelgeving"}
          </div>
          <h2 style={{ margin: "0px 0px 10px" }}>
            <span className="sc-interp">
              {"De normen waar je zon-PV-dossier aan moet voldoen"}
            </span>
          </h2>
          <p style={{ margin: "0px", fontSize: "17px", color: "var(--neutral-600)", lineHeight: "1.6" }}>
            {"De eisen zitten verwerkt in je schouwformulier, calculatie en opleverdocument. Wijzigt er iets, dan passen wij het aan."}
          </p>
        </div>
        <div
          className="mh-grid3 mh-reveal mh-hidden"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}
        >
          <div className="sc-host-x" style={{ display: "contents" }}>
            <div
              className="mh-card"
              style={{ boxSizing: "border-box", background: "var(--surface-card)", borderRadius: "var(--radius-lg)", padding: "24px", transition: "transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard)", border: "1px solid var(--border-subtle)", boxShadow: "none" }}
            >
              <span
                style={{ display: "inline-flex", alignItems: "center", padding: "6px 13px", borderRadius: "999px", background: "var(--indigo-50)", fontFamily: "\"IBM Plex Mono\", ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "11.5px", letterSpacing: "0.04em", color: "var(--indigo-700)", marginBottom: "14px" }}
              >
                <span className="sc-interp">
                  {"NEN 1010"}
                </span>
              </span>
              <p style={{ margin: "0px", fontSize: "15px", color: "var(--text-body)", lineHeight: "1.6" }}>
                <span className="sc-interp">
                  {"De basisnorm voor laagspanningsinstallaties: groepen, beveiliging, aarding en de aansluiting op de meterkast."}
                </span>
              </p>
            </div>
          </div>
          <div className="sc-host-x" style={{ display: "contents" }}>
            <div
              className="mh-card"
              style={{ boxSizing: "border-box", background: "var(--surface-card)", borderRadius: "var(--radius-lg)", padding: "24px", transition: "transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard)", border: "1px solid var(--border-subtle)", boxShadow: "none" }}
            >
              <span
                style={{ display: "inline-flex", alignItems: "center", padding: "6px 13px", borderRadius: "999px", background: "var(--indigo-50)", fontFamily: "\"IBM Plex Mono\", ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "11.5px", letterSpacing: "0.04em", color: "var(--indigo-700)", marginBottom: "14px" }}
              >
                <span className="sc-interp">
                  {"NEN 7250"}
                </span>
              </span>
              <p style={{ margin: "0px", fontSize: "15px", color: "var(--text-body)", lineHeight: "1.6" }}>
                <span className="sc-interp">
                  {"Gaat over de bouwkundige integratie van zonnepanelen: bevestiging, windbelasting, waterdichtheid en brandveiligheid van het dakvlak."}
                </span>
              </p>
            </div>
          </div>
          <div className="sc-host-x" style={{ display: "contents" }}>
            <div
              className="mh-card"
              style={{ boxSizing: "border-box", background: "var(--surface-card)", borderRadius: "var(--radius-lg)", padding: "24px", transition: "transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard)", border: "1px solid var(--border-subtle)", boxShadow: "none" }}
            >
              <span
                style={{ display: "inline-flex", alignItems: "center", padding: "6px 13px", borderRadius: "999px", background: "var(--indigo-50)", fontFamily: "\"IBM Plex Mono\", ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "11.5px", letterSpacing: "0.04em", color: "var(--indigo-700)", marginBottom: "14px" }}
              >
                <span className="sc-interp">
                  {"SCIOS Scope 12"}
                </span>
              </span>
              <p style={{ margin: "0px", fontSize: "15px", color: "var(--text-body)", lineHeight: "1.6" }}>
                <span className="sc-interp">
                  {"De inspectie op brandveiligheid van zonnestroominstallaties. Steeds vaker een eis van verzekeraars, en de checklist zit standaard in je opleverdocument."}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
);
