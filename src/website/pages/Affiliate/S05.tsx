import { AffiliateForm } from "./AffiliateForm";
export const S05 = () => (
    <section id="aff-aanmelden" className="mh-secpad" style={{ padding: "88px 0px", background: "var(--surface-tint)" }}>
      <div className="mh-container">
        <div
          className="mh-split mh-reveal mh-hidden"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "start" }}
        >
          <div className="mh-reveal mh-hidden">
            <div
              style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--indigo-600)", marginBottom: "14px" }}
            >
              {"Aanmelden"}
            </div>
            <h2 style={{ margin: "0px 0px 12px" }}>
              {"Laat je gegevens achter, dan bellen we je binnen \u00e9\u00e9n werkdag"}
            </h2>
            <p style={{ margin: "0px 0px 26px", fontSize: "17px", color: "var(--neutral-600)", lineHeight: "1.6" }}>
              {"Geen verplichtingen. We kijken samen of het past, welke vorm bij je praktijk hoort en wat je nodig hebt om te beginnen."}
            </p>
            <div
              style={{ display: "flex", gap: "16px", alignItems: "center", padding: "22px 24px", borderRadius: "16px", background: "var(--surface-page)", border: "1px solid var(--border-subtle)" }}
            >
              <img src="/__l5e/assets-v1/97bcd2fc-a375-495f-bef1-2c0396f70ee2/img12.jpg" alt="Bas, sales manager" style={{ width: "56px", height: "56px", borderRadius: "999px", objectFit: "cover", flex: "0 0 auto" }} />
              <div>
                <div
                  style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "16px", color: "var(--text-heading)" }}
                >
                  {"Bas \u00b7 sales manager"}
                </div>
                <p style={{ margin: "4px 0px 0px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.5" }}>
                  {"Hij begeleidt het partnerprogramma. "}
                  <a href="https://wa.me/31644666645" target="_blank" rel="noopener" style={{ fontWeight: "600" }}>
                    {"App hem op 06-44666645"}
                  </a>
                  {" of bel 085-8000272."}
                </p>
              </div>
            </div>
            <div style={{ marginTop: "26px", display: "flex", flexDirection: "column", gap: "11px" }}>
              <span
                style={{ display: "flex", gap: "11px", alignItems: "flex-start", fontSize: "15.5px", color: "var(--text-heading)" }}
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
                {"Geen instapkosten of maandelijkse bijdrage"}
              </span>
              <span
                style={{ display: "flex", gap: "11px", alignItems: "flex-start", fontSize: "15.5px", color: "var(--text-heading)" }}
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
                {"Je kunt op elk moment stoppen"}
              </span>
              <span
                style={{ display: "flex", gap: "11px", alignItems: "flex-start", fontSize: "15.5px", color: "var(--text-heading)" }}
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
                {"Wij doen de demo, de onboarding en de support"}
              </span>
            </div>
          </div>
          <div
            className="mh-reveal mh-hidden"
            style={{ background: "var(--surface-page)", borderRadius: "20px", boxShadow: "var(--shadow-lg)", border: "1px solid var(--border-subtle)", padding: "32px" }}
          >
            <AffiliateForm />
          </div>
        </div>
      </div>
    </section>
);
