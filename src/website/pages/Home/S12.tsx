
export const S12 = () => (
    <section className="mh-secpad" style={{ padding: "96px 0px", background: "var(--surface-tint)" }}>
      <div className="mh-container">
        <div className="mh-reveal" style={{ maxWidth: "660px", marginBottom: "36px" }}>
          <div
            id="mh-start"
            style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--indigo-600)", marginBottom: "14px" }}
          >
            {"Aan de slag"}
          </div>
          <h2 style={{ margin: "0px 0px 12px" }}>
            {"Zelf inrichten en meteen werken, of samen overstappen"}
          </h2>
          <p style={{ fontSize: "18px", color: "var(--neutral-600)", margin: "0px", lineHeight: "1.6" }}>
            {"Het platform is zo gebouwd dat je je eigen omgeving in een middag inricht en direct kunt beginnen. Wil je liever begeleiding bij migratie en training? Dan doen we het samen."}
          </p>
        </div>
        <div className="mh-reveal" style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "28px" }}>
          <button
            style={{ flex: "1 1 260px", display: "flex", gap: "18px", alignItems: "center", textAlign: "left", cursor: "pointer", padding: "22px 26px", borderRadius: "16px", fontFamily: "var(--font-body)", position: "relative", overflow: "hidden", border: "1px solid var(--indigo-600)", background: "var(--indigo-600)", boxShadow: "rgba(33, 31, 84, 0.18) 0px 14px 30px" }}
          >
            <span
              style={{ flex: "0 0 auto", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "rgb(255, 255, 255)" }}
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
                style={{ width: "30px", height: "30px", strokeWidth: "1.5" }}
                className="lucide lucide-rocket"
              >
                <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09" />
                <path d="M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z" />
                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05" />
              </svg>
            </span>
            <span style={{ flex: "1 1 0%" }}>
              <span
                style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "19px", lineHeight: "1.25", marginBottom: "6px", color: "rgb(255, 255, 255)" }}
              >
                <span className="sc-interp">
                  {"Zelf inrichten"}
                </span>
              </span>
              <span style={{ display: "block", fontSize: "14.5px", lineHeight: "1.5", color: "rgba(255, 255, 255, 0.82)" }}>
                <span className="sc-interp">
                  {"Vandaag een account, morgen je eerste offerte. Alles staat al klaar."}
                </span>
              </span>
            </span>
          </button>
          <button
            style={{ flex: "1 1 260px", display: "flex", gap: "18px", alignItems: "center", textAlign: "left", cursor: "pointer", padding: "22px 26px", borderRadius: "16px", fontFamily: "var(--font-body)", position: "relative", overflow: "hidden", border: "1px solid var(--border-subtle)", background: "var(--surface-page)", boxShadow: "none" }}
          >
            <span
              style={{ flex: "0 0 auto", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)" }}
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
                style={{ width: "30px", height: "30px", strokeWidth: "1.5" }}
                className="lucide lucide-handshake"
              >
                <path d="m11 17 2 2a1 1 0 1 0 3-3" />
                <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
                <path d="m21 3 1 11h-2" />
                <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
                <path d="M3 4h8" />
              </svg>
            </span>
            <span style={{ flex: "1 1 0%" }}>
              <span
                style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "19px", lineHeight: "1.25", marginBottom: "6px", color: "var(--text-heading)" }}
              >
                <span className="sc-interp">
                  {"Samen met ons"}
                </span>
              </span>
              <span style={{ display: "block", fontSize: "14.5px", lineHeight: "1.5", color: "var(--neutral-600)" }}>
                <span className="sc-interp">
                  {"Wij migreren je data, richten je sjablonen in en trainen je team."}
                </span>
              </span>
            </span>
          </button>
        </div>
        <div
          className="mh-reveal"
          style={{ borderRadius: "20px", border: "1px solid var(--border-subtle)", background: "var(--surface-page)", overflow: "hidden" }}
        >
          <div className="mh-split" style={{ display: "grid", gridTemplateColumns: "1.25fr 0.75fr" }}>
            <div style={{ padding: "40px 42px" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", gap: "20px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "0 0 auto" }}>
                    <span
                      style={{ width: "34px", height: "34px", borderRadius: "99px", background: "var(--color-primary)", color: "rgb(255, 255, 255)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "14px" }}
                    >
                      <span className="sc-interp">
                        {"1"}
                      </span>
                    </span>
                    <span style={{ flex: "1 1 0%", width: "2px", background: "repeating-linear-gradient(to bottom, var(--indigo-300) 0 6px, transparent 6px 11px)", margin: "8px 0px 2px" }}></span>
                  </div>
                  <div style={{ paddingBottom: "30px" }}>
                    <h3 style={{ fontSize: "20px", margin: "0px 0px 8px", lineHeight: "1.25" }}>
                      <span className="sc-interp">
                        {"Account in twee minuten"}
                      </span>
                    </h3>
                    <p
                      style={{ margin: "0px", fontSize: "15.5px", color: "var(--neutral-600)", lineHeight: "1.6", maxWidth: "52ch" }}
                    >
                      <span className="sc-interp">
                        {"Je kiest de vakgebieden waarin je werkt en vult je bedrijfsgegevens in. Geen installatie, geen consultant, geen creditcard."}
                      </span>
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "20px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "0 0 auto" }}>
                    <span
                      style={{ width: "34px", height: "34px", borderRadius: "99px", background: "var(--color-primary)", color: "rgb(255, 255, 255)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "14px" }}
                    >
                      <span className="sc-interp">
                        {"2"}
                      </span>
                    </span>
                    <span style={{ flex: "1 1 0%", width: "2px", background: "repeating-linear-gradient(to bottom, var(--indigo-300) 0 6px, transparent 6px 11px)", margin: "8px 0px 2px" }}></span>
                  </div>
                  <div style={{ paddingBottom: "30px" }}>
                    <h3 style={{ fontSize: "20px", margin: "0px 0px 8px", lineHeight: "1.25" }}>
                      <span className="sc-interp">
                        {"Je omgeving inrichten"}
                      </span>
                    </h3>
                    <p
                      style={{ margin: "0px", fontSize: "15.5px", color: "var(--neutral-600)", lineHeight: "1.6", maxWidth: "52ch" }}
                    >
                      <span className="sc-interp">
                        {"Prijzen, pakketten en je logo erin. Schouwformulieren, offertesjablonen en opleverdocumenten staan er al, per branche."}
                      </span>
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "20px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "0 0 auto" }}>
                    <span
                      style={{ width: "34px", height: "34px", borderRadius: "99px", background: "var(--color-primary)", color: "rgb(255, 255, 255)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "14px" }}
                    >
                      <span className="sc-interp">
                        {"3"}
                      </span>
                    </span>
                    <span style={{ flex: "1 1 0%", width: "2px", background: "repeating-linear-gradient(to bottom, var(--indigo-300) 0 6px, transparent 6px 11px)", margin: "8px 0px 2px" }}></span>
                  </div>
                  <div style={{ paddingBottom: "30px" }}>
                    <h3 style={{ fontSize: "20px", margin: "0px 0px 8px", lineHeight: "1.25" }}>
                      <span className="sc-interp">
                        {"Team uitnodigen en werken"}
                      </span>
                    </h3>
                    <p
                      style={{ margin: "0px", fontSize: "15.5px", color: "var(--neutral-600)", lineHeight: "1.6", maxWidth: "52ch" }}
                    >
                      <span className="sc-interp">
                        {"Collega\u2019s toevoegen met een paar klikken. Je monteur werkt binnen een kwartier met de app."}
                      </span>
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "20px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "0 0 auto" }}>
                    <span
                      style={{ width: "34px", height: "34px", borderRadius: "99px", background: "var(--green-500)", color: "rgb(255, 255, 255)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
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
                        style={{ width: "17px", height: "17px" }}
                        className="lucide lucide-check"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: "20px", margin: "0px 0px 8px", lineHeight: "1.25" }}>
                      {"Dezelfde dag je eerste offerte"}
                    </h3>
                    <p
                      style={{ margin: "0px", fontSize: "15.5px", color: "var(--neutral-600)", lineHeight: "1.6", maxWidth: "52ch" }}
                    >
                      {"Geen wachttijd, geen implementatiekosten. Bevalt het niet, dan stop je gewoon."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div
              style={{ padding: "40px 38px", background: "var(--surface-tint)", borderLeft: "1px solid var(--border-subtle)" }}
            >
              <div>
                <div
                  style={{ fontFamily: "\"IBM Plex Mono\", ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "11px", letterSpacing: "0.08em", color: "var(--indigo-600)", marginBottom: "16px" }}
                >
                  {"STAAT AL VOOR JE KLAAR"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "28px" }}>
                  <span
                    style={{ display: "flex", gap: "11px", alignItems: "flex-start", fontSize: "15.5px", color: "var(--text-heading)", lineHeight: "1.5" }}
                  >
                    <span
                      style={{ flex: "0 0 auto", width: "22px", height: "22px", borderRadius: "999px", background: "rgba(31, 169, 124, 0.14)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: "1px" }}
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
                        style={{ width: "13px", height: "13px", color: "var(--green-700)" }}
                        className="lucide lucide-check"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    <span className="sc-interp">
                      {"Ingericht voor de verduurzamingsbranche: zon-PV, warmtepompen, thuisbatterijen, laadinfrastructuur en isolatie"}
                    </span>
                  </span>
                  <span
                    style={{ display: "flex", gap: "11px", alignItems: "flex-start", fontSize: "15.5px", color: "var(--text-heading)", lineHeight: "1.5" }}
                  >
                    <span
                      style={{ flex: "0 0 auto", width: "22px", height: "22px", borderRadius: "999px", background: "rgba(31, 169, 124, 0.14)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: "1px" }}
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
                        style={{ width: "13px", height: "13px", color: "var(--green-700)" }}
                        className="lucide lucide-check"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    <span className="sc-interp">
                      {"Subsidiebedragen automatisch actueel"}
                    </span>
                  </span>
                  <span
                    style={{ display: "flex", gap: "11px", alignItems: "flex-start", fontSize: "15.5px", color: "var(--text-heading)", lineHeight: "1.5" }}
                  >
                    <span
                      style={{ flex: "0 0 auto", width: "22px", height: "22px", borderRadius: "999px", background: "rgba(31, 169, 124, 0.14)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: "1px" }}
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
                        style={{ width: "13px", height: "13px", color: "var(--green-700)" }}
                        className="lucide lucide-check"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    <span className="sc-interp">
                      {"Offertes en documenten in je eigen huisstijl"}
                    </span>
                  </span>
                  <span
                    style={{ display: "flex", gap: "11px", alignItems: "flex-start", fontSize: "15.5px", color: "var(--text-heading)", lineHeight: "1.5" }}
                  >
                    <span
                      style={{ flex: "0 0 auto", width: "22px", height: "22px", borderRadius: "999px", background: "rgba(31, 169, 124, 0.14)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: "1px" }}
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
                        style={{ width: "13px", height: "13px", color: "var(--green-700)" }}
                        className="lucide lucide-check"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    <span className="sc-interp">
                      {"Monteursapp meteen bruikbaar"}
                    </span>
                  </span>
                </div>
                <div className="sc-host-x" style={{ display: "contents" }}>
                  <a
                    href="/proefperiode"
                    className="mh-btn"
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "var(--font-body)", fontWeight: "var(--fw-semibold)", lineHeight: "1", border: "1px solid transparent", borderRadius: "var(--radius-md)", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)", height: "var(--control-h-hero)", padding: "0px 28px", fontSize: "17px", background: "var(--color-accent)", color: "var(--white)", width: "100%" }}
                  >
                    <span className="sc-interp">
                      {"Start gratis"}
                    </span>
                  </a>
                </div>
                <p style={{ margin: "12px 0px 0px", fontSize: "13.5px", color: "var(--neutral-600)", textAlign: "center" }}>
                  {"Geen creditcard nodig"}
                </p>
              </div>
            </div>
          </div>
          <div
            style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "22px 42px", borderTop: "1px solid var(--border-subtle)", background: "var(--surface-page)" }}
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
              style={{ width: "22px", height: "22px", color: "var(--color-primary)", flex: "0 0 auto", marginTop: "2px" }}
              className="lucide lucide-user-round-check"
            >
              <path d="M2 21a8 8 0 0 1 13.292-6" />
              <circle cx="10" cy="8" r="5" />
              <path d="m16 19 2 2 4-4" />
            </svg>
            <p style={{ margin: "0px", fontSize: "15.5px", lineHeight: "1.6", color: "var(--text-body)" }}>
              {"Hoe je ook start: je krijgt een vaste, persoonlijke accountmanager en Nederlandse support die je monteurs ook 's ochtends vroeg gewoon te woord staat."}
            </p>
          </div>
        </div>
        <div className="mh-reveal" style={{ marginTop: "28px" }}>
          <div
            style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center", fontSize: "15.5px", color: "var(--neutral-600)" }}
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
              className="lucide lucide-phone"
            >
              <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />
            </svg>
            <span>
              {"Twijfel je welke route bij je past? Bel 085-8000272 of app Bas op 06-44666645."}
            </span>
          </div>
        </div>
      </div>
    </section>
);
