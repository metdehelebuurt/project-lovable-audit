
export const S03 = () => (
    <section className="mh-secpad" style={{ padding: "72px 0px", background: "var(--surface-page)" }}>
      <div className="mh-container">
        <div style={{ maxWidth: "720px", marginBottom: "28px" }}>
          <h2 style={{ margin: "0px 0px 10px" }}>
            {"Nog even dit"}
          </h2>
          <p style={{ fontSize: "17px", color: "var(--text-muted)", margin: "0px" }}>
            {"De vragen die we het vaakst krijgen over de proefperiode."}
          </p>
        </div>
        <div className="mh-reveal" style={{ maxWidth: "820px", transitionDelay: "70ms" }}>
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
                  {"Wat kost het na de proefperiode?"}
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
                    {"Niets, tenzij je zelf een pakket kiest. De proefperiode stopt automatisch, je hoeft niets op te zeggen en er is geen creditcard nodig."}
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
                  {"Kan ik met mijn echte projecten werken?"}
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
                    {"Ja, dat raden we juist aan. Je mag je eigen klanten, prijslijsten en lopende klussen invoeren; kies je daarna voor een abonnement, dan werk je gewoon door in dezelfde omgeving."}
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
                  {"Hoeveel collega's mag ik uitnodigen?"}
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
                    {"Tijdens de proefperiode nodig je onbeperkt collega's uit, kantoor \u00e9n monteurs. Zo zie je meteen hoe de flow tussen binnen en buiten loopt."}
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
                  {"Wat gebeurt er met mijn gegevens als ik stop?"}
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
                    {"Je gegevens blijven 30 dagen bewaard zodat je alsnog kunt doorgaan. Daarna verwijderen we ze, of je exporteert ze eerder zelf. Alles staat AVG-conform in de EU."}
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
                  {"Zit alles erin, of is het een uitgeklede versie?"}
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
                    {"Alles uit het Groei-pakket staat aan: sales-CRM, schouw, offertes met subsidie, planning, monteursapp, opleverdossier, klantportaal en de AI-kennisbank."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
);
