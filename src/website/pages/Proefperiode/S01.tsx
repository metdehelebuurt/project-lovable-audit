
export const S01 = () => (
    <section
      className="mh-secpad"
      style={{ position: "relative", overflow: "hidden", padding: "76px 0px 84px", background: "radial-gradient(120% 90% at 12% -10%, var(--ice-lilac) 0%, var(--white) 58%)" }}
    >
      <div aria-hidden="true" style={{ position: "absolute", inset: "0px", backgroundImage: "radial-gradient(var(--indigo-200) 1.3px, transparent 1.3px)", backgroundSize: "24px 24px", opacity: "0.35", maskImage: "radial-gradient(110% 75% at 85% -5%, rgb(0, 0, 0) 0%, transparent 60%)" }}></div>
      <div className="mh-container" style={{ position: "relative" }}>
        <div
          className="mh-split"
          style={{ display: "grid", gridTemplateColumns: "0.95fr 1.05fr", gap: "48px", alignItems: "start" }}
        >
          <div>
            <div
              style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-primary)", marginBottom: "14px" }}
            >
              {"Gratis proberen"}
            </div>
            <h1 style={{ fontSize: "46px", lineHeight: "1.08", margin: "0px 0px 16px" }}>
              {"Start vandaag: "}
              <span style={{ color: "var(--color-primary)" }}>
                {"14 dagen gratis"}
              </span>
            </h1>
            <p
              style={{ fontSize: "18px", lineHeight: "1.6", color: "var(--text-body)", maxWidth: "50ch", margin: "0px 0px 26px" }}
            >
              {"Je account staat binnen twee minuten klaar, ingericht voor jouw branche. Draai een echt project van lead tot opleverdossier en beslis daarna pas."}
            </p>
            <ul
              style={{ listStyle: "none", margin: "0px 0px 26px", padding: "0px", display: "flex", flexDirection: "column", gap: "13px" }}
            >
              <li
                style={{ display: "flex", gap: "12px", alignItems: "flex-start", fontSize: "16px", color: "var(--text-body)" }}
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
                  style={{ width: "19px", height: "19px", color: "var(--success)", flex: "0 0 auto", marginTop: "3px" }}
                  className="lucide lucide-check"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {"Alle functies uit Groei, niets uitgeschakeld"}
              </li>
              <li
                style={{ display: "flex", gap: "12px", alignItems: "flex-start", fontSize: "16px", color: "var(--text-body)" }}
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
                  style={{ width: "19px", height: "19px", color: "var(--success)", flex: "0 0 auto", marginTop: "3px" }}
                  className="lucide lucide-check"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {"Geen creditcard, stopt vanzelf, geen opzegdrempel"}
              </li>
              <li
                style={{ display: "flex", gap: "12px", alignItems: "flex-start", fontSize: "16px", color: "var(--text-body)" }}
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
                  style={{ width: "19px", height: "19px", color: "var(--success)", flex: "0 0 auto", marginTop: "3px" }}
                  className="lucide lucide-check"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {"Schouw, offerte en opleverdocument van jouw branche staan klaar"}
              </li>
              <li
                style={{ display: "flex", gap: "12px", alignItems: "flex-start", fontSize: "16px", color: "var(--text-body)" }}
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
                  style={{ width: "19px", height: "19px", color: "var(--success)", flex: "0 0 auto", marginTop: "3px" }}
                  className="lucide lucide-check"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {"Een vaste accountmanager helpt je op weg"}
              </li>
            </ul>
            <div
              style={{ background: "rgb(255, 255, 255)", border: "1px solid var(--border-subtle)", borderRadius: "14px", padding: "20px 22px" }}
            >
              <div
                style={{ fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "15.5px", color: "var(--text-heading)", marginBottom: "10px" }}
              >
                {"Wat gebeurt er na 14 dagen?"}
              </div>
              <p style={{ margin: "0px 0px 12px", fontSize: "14.5px", color: "var(--text-muted)", lineHeight: "1.55" }}>
                {"Niets automatisch. Je proefperiode stopt gewoon; wil je door, dan kies je zelf een pakket. Je projecten en dossiers blijven bewaard."}
              </p>
              <a href="/prijzen" style={{ fontSize: "14.5px", fontWeight: "600" }}>
                {"Bekijk de prijzen"}
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
                  style={{ width: "14px", height: "14px", verticalAlign: "-2px", marginLeft: "5px" }}
                  className="lucide lucide-arrow-right"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </a>
            </div>
            <div
              style={{ borderTop: "1px solid var(--border-subtle)", marginTop: "24px", paddingTop: "20px", display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "center", fontSize: "14px", color: "var(--text-muted)" }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}>
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
                  className="lucide lucide-shield-check"
                >
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                {"AVG-conform, data in de EU"}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}>
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
                  className="lucide lucide-phone"
                >
                  <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />
                </svg>
                {"Liever eerst zien? "}
                <a href="/demo" style={{ fontWeight: "600" }}>
                  {"Plan een demo"}
                </a>
              </span>
            </div>
          </div>
          <TrialForm />
        </div>
      </div>
    </section>
);
