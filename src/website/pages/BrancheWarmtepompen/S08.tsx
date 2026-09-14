
export const S08 = () => (
    <section id="b-faq" className="mh-secpad" style={{ padding: "88px 0px", background: "var(--surface-page)" }}>
      <div className="mh-container">
        <div
          className="mh-split mh-reveal mh-hidden"
          style={{ display: "grid", gridTemplateColumns: "1fr 1.25fr", gap: "52px", alignItems: "start" }}
        >
          <div className="mh-reveal mh-hidden">
            <div
              style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--indigo-600)", marginBottom: "14px" }}
            >
              {"Veelgestelde vragen"}
            </div>
            <h2 style={{ margin: "0px 0px 12px" }}>
              {"Vragen over "}
              <span className="sc-interp">
                {"Warmtepompen"}
              </span>
              {" in mijnhuis.nu"}
            </h2>
            <p style={{ margin: "0px 0px 22px", fontSize: "17px", color: "var(--neutral-600)", lineHeight: "1.6" }}>
              {"Staat je vraag er niet bij? App Bas of bel 085-8000272, je krijgt gewoon iemand aan de lijn die het vak kent."}
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
          <div className="mh-reveal mh-hidden">
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
                    {"Zit de warmteverliesberekening echt in het systeem?"}
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
                      {"Ja, per vertrek. Je vult de afmetingen, isolatie en afgifte in en het systeem rekent het benodigde vermogen en de ontwerptemperatuur door naar de toestelkeuze."}
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
                    {"Is het subsidiebedrag altijd actueel?"}
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
                      {"Wij houden de bedragen en voorwaarden bij. Je offerte gebruikt het bedrag dat op dat moment geldt, met de onderbouwing als bijlage."}
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
                    {"Hoe leg ik F-gassen vast?"}
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
                      {"Het logboek hoort bij het opleverdocument van dit vakgebied. De monteur vult het in de app in en het blijft aan het adresdossier gekoppeld."}
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
                    {"Kan ik de geluidsberekening meesturen?"}
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
                      {"De geluidsbelasting wordt bij de toestelkeuze berekend en kan als bijlage mee in de offerte, wat bij vergunningvragen van de gemeente scheelt."}
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
                    {"Wordt onderhoud automatisch ingepland?"}
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
                      {"Je koppelt een onderhoudsschema aan de installatie. De tickets verschijnen vanzelf in je planning, met de historie van dat adres erbij."}
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
