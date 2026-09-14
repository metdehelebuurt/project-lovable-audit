
export const S09 = () => (
    <section id="s-faq" className="mh-secpad" style={{ padding: "88px 0px", background: "var(--surface-tint)" }}>
      <div className="mh-container">
        <div
          className="mh-split mh-reveal"
          style={{ display: "grid", gridTemplateColumns: "1fr 1.25fr", gap: "52px", alignItems: "start" }}
        >
          <div className="mh-reveal">
            <div
              style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--indigo-600)", marginBottom: "14px" }}
            >
              {"Veelgestelde vragen"}
            </div>
            <h2 style={{ margin: "0px 0px 12px" }}>
              {"Vragen over "}
              <span className="sc-interp">
                {"Planning & werkbonnen"}
              </span>
            </h2>
            <p style={{ margin: "0px 0px 22px", fontSize: "17px", color: "var(--neutral-600)", lineHeight: "1.6" }}>
              {"Staat je vraag er niet bij? Bel 085-8000272 of app Bas op 06-44666645. Je krijgt iemand die het vak kent."}
            </p>
            <div className="sc-host-x" style={{ display: "contents" }}>
              <a
                href="/contact"
                className="mh-btn"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "var(--font-body)", fontWeight: "var(--fw-semibold)", lineHeight: "1", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border-strong)", borderImage: "initial", borderRadius: "var(--radius-md)", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)", height: "var(--control-h)", padding: "0px 22px", fontSize: "16px", background: "var(--white)", color: "var(--color-primary)" }}
              >
                {"Stel je vraag"}
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
          <div className="mh-reveal">
            <div className="sc-host-x" style={{ display: "contents" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div
                  style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", background: "var(--white)", overflow: "hidden" }}
                >
                  <button
                    type="button"
                    aria-expanded="true"
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "20px 24px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-display)", fontWeight: "var(--fw-semibold)", fontSize: "18px", color: "var(--text-heading)" }}
                  >
                    {"Kan ik plannen per ploeg of per bus?"}
                    <span
                      aria-hidden="true"
                      style={{ flex: "0 0 auto", display: "inline-flex", color: "var(--color-primary)", transition: "transform var(--dur-base) var(--ease-standard)", transform: "rotate(45deg)" }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </span>
                  </button>
                  <div
                    style={{ maxHeight: "600px", transition: "max-height var(--dur-slow) var(--ease-standard)", overflow: "hidden" }}
                  >
                    <div style={{ padding: "0px 24px 22px", fontSize: "16px", lineHeight: "1.6", color: "var(--text-body)" }}>
                      {"Ja. Je plant op monteur, ploeg of bus, in een dag- of weekoverzicht, en sleept projecten tussen die rijen."}
                    </div>
                  </div>
                </div>
                <div
                  style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", background: "var(--white)", overflow: "hidden" }}
                >
                  <button
                    type="button"
                    aria-expanded="false"
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "20px 24px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-display)", fontWeight: "var(--fw-semibold)", fontSize: "18px", color: "var(--text-heading)" }}
                  >
                    {"Houdt de planning rekening met certificaten?"}
                    <span
                      aria-hidden="true"
                      style={{ flex: "0 0 auto", display: "inline-flex", color: "var(--color-primary)", transition: "transform var(--dur-base) var(--ease-standard)", transform: "none" }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </span>
                  </button>
                  <div
                    style={{ maxHeight: "0px", transition: "max-height var(--dur-slow) var(--ease-standard)", overflow: "hidden" }}
                  >
                    <div style={{ padding: "0px 24px 22px", fontSize: "16px", lineHeight: "1.6", color: "var(--text-body)" }}>
                      {"Ja. Je legt per monteur zijn certificaten en vaardigheden vast. Plan je iemand op werk waarvoor hij niet gecertificeerd is, dan krijg je een waarschuwing."}
                    </div>
                  </div>
                </div>
                <div
                  style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", background: "var(--white)", overflow: "hidden" }}
                >
                  <button
                    type="button"
                    aria-expanded="false"
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "20px 24px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-display)", fontWeight: "var(--fw-semibold)", fontSize: "18px", color: "var(--text-heading)" }}
                  >
                    {"Krijgt de klant automatisch bericht?"}
                    <span
                      aria-hidden="true"
                      style={{ flex: "0 0 auto", display: "inline-flex", color: "var(--color-primary)", transition: "transform var(--dur-base) var(--ease-standard)", transform: "none" }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </span>
                  </button>
                  <div
                    style={{ maxHeight: "0px", transition: "max-height var(--dur-slow) var(--ease-standard)", overflow: "hidden" }}
                  >
                    <div style={{ padding: "0px 24px 22px", fontSize: "16px", lineHeight: "1.6", color: "var(--text-body)" }}>
                      {"De klant krijgt een bevestiging bij het inplannen en een herinnering vooraf. Verschuif je de afspraak, dan wordt hij daarover ge\u00efnformeerd."}
                    </div>
                  </div>
                </div>
                <div
                  style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", background: "var(--white)", overflow: "hidden" }}
                >
                  <button
                    type="button"
                    aria-expanded="false"
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "20px 24px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-display)", fontWeight: "var(--fw-semibold)", fontSize: "18px", color: "var(--text-heading)" }}
                  >
                    {"Zie ik of het materiaal er is?"}
                    <span
                      aria-hidden="true"
                      style={{ flex: "0 0 auto", display: "inline-flex", color: "var(--color-primary)", transition: "transform var(--dur-base) var(--ease-standard)", transform: "none" }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </span>
                  </button>
                  <div
                    style={{ maxHeight: "0px", transition: "max-height var(--dur-slow) var(--ease-standard)", overflow: "hidden" }}
                  >
                    <div style={{ padding: "0px 24px 22px", fontSize: "16px", lineHeight: "1.6", color: "var(--text-body)" }}>
                      {"Materiaal en werkvoorbereiding hangen aan het project. Je ziet per klus of alles klaarstaat voordat je hem definitief inplant."}
                    </div>
                  </div>
                </div>
                <div
                  style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", background: "var(--white)", overflow: "hidden" }}
                >
                  <button
                    type="button"
                    aria-expanded="false"
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "20px 24px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-display)", fontWeight: "var(--fw-semibold)", fontSize: "18px", color: "var(--text-heading)" }}
                  >
                    {"Werken uren en materiaal door naar de facturatie?"}
                    <span
                      aria-hidden="true"
                      style={{ flex: "0 0 auto", display: "inline-flex", color: "var(--color-primary)", transition: "transform var(--dur-base) var(--ease-standard)", transform: "none" }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </span>
                  </button>
                  <div
                    style={{ maxHeight: "0px", transition: "max-height var(--dur-slow) var(--ease-standard)", overflow: "hidden" }}
                  >
                    <div style={{ padding: "0px 24px 22px", fontSize: "16px", lineHeight: "1.6", color: "var(--text-body)" }}>
                      {"Ja. Wat de monteur boekt, komt op het project en gaat mee naar je facturatie en marge-rapportage."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
);
