
export const S06 = () => (
    <section className="mh-secpad" style={{ padding: "88px 0px", background: "var(--surface-page)" }}>
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
              {"Vragen over het partnerprogramma"}
            </h2>
            <p style={{ margin: "0px 0px 22px", fontSize: "17px", color: "var(--neutral-600)", lineHeight: "1.6" }}>
              {"Staat je vraag er niet bij? Bel 085-8000272 of app Bas op 06-44666645."}
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
                    {"Wat kost het om mee te doen?"}
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
                      {"Niets. Er zijn geen instapkosten en geen maandelijkse bijdrage. Je verdient alleen als er iemand klant wordt."}
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
                    {"Hoe worden aanmeldingen aan mij toegekend?"}
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
                      {"Via je persoonlijke aanmeldlink. Meld je iemand liever telefonisch of per mail aan, dan koppelen we hem handmatig aan jouw account, zolang je hem bij ons introduceert voordat hij zelf een demo aanvraagt."}
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
                    {"Wanneer word ik uitbetaald?"}
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
                      {"Na de eerste betaalde maand van de klant. Daarna maandelijks, op basis van een factuur die je zelf verstuurt of die wij op basis van je dashboard voor je klaarzetten."}
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
                    {"Moet ik zelf verkopen of demo\u2019s geven?"}
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
                      {"Nee. Jij zorgt voor de introductie, wij doen het gesprek, de demo en de onboarding. Wil je erbij zitten, dan ben je uiteraard welkom."}
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
                    {"Kan ik dit combineren met andere samenwerkingen?"}
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
                      {"Ja. We vragen geen exclusiviteit. Wat wij wel vragen is dat je eerlijk vertelt wat het platform doet en voor wie het geschikt is."}
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
                    {"Wat gebeurt er als een klant stopt?"}
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
                      {"Bij de doorlopende commissie stopt je vergoeding op het moment dat het abonnement stopt. Bij de eenmalige vergoeding behoud je wat je hebt verdiend."}
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
                    {"Voor wie is mijnhuis.nu geschikt om aan te bevelen?"}
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
                      {"Installatiebedrijven in zon-PV, warmtepompen, thuisbatterijen, laadinfrastructuur of isolatie, vanaf ongeveer twee man. Bedrijven met kantoorbezetting en meerdere ploegen halen er het meeste uit."}
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
                    {"Hoe weet ik of iemand daadwerkelijk klant is geworden?"}
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
                      {"Dat staat in je dashboard, met de status van elke aanmelding. Bij vragen bel je Bas en die zoekt het met je uit."}
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
