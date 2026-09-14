
export const S06 = () => (
    <section className="mh-secpad" style={{ padding: "88px 0px", background: "var(--surface-page)" }}>
      <div className="mh-container">
        <div className="mh-reveal mh-hidden" style={{ maxWidth: "660px", marginBottom: "16px" }}>
          <div
            style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-primary)", marginBottom: "14px" }}
          >
            {"Hoe het werkt"}
          </div>
          <h2 style={{ margin: "0px 0px 10px" }}>
            {"Dezelfde flow, in jouw vaktaal"}
          </h2>
          <p style={{ fontSize: "17px", color: "var(--text-body)", margin: "0px", lineHeight: "1.6" }}>
            {"Welke branche je ook doet, het project loopt via \u00e9\u00e9n doorlopende lijn, met de formulieren van jouw vak."}
          </p>
        </div>
        <div className="mh-reveal mh-hidden" style={{ margin: "26px 0px -2px" }}>
          <div className="sc-host-x" style={{ display: "contents" }}>
            <svg
              viewBox="0 0 1000 80"
              width="100%"
              height="80"
              preserveAspectRatio="none"
              aria-hidden="true"
              style={{ overflow: "visible" }}
            >
              <path d="M0 40 L1000 40" fill="none" stroke="var(--dossier-line)" strokeWidth="var(--dossier-line-width)" strokeLinecap="round" strokeDasharray="6 8" style={{ strokeDasharray: "1000", strokeDashoffset: "1000" }} />
              <g>
                <circle cx="0" cy="40" r="11" fill="var(--white)" stroke="var(--indigo-500)" strokeWidth="2" />
                <text
                  x="0"
                  y="44"
                  textAnchor="middle"
                  fontFamily="var(--font-display)"
                  fontSize="11"
                  fontWeight="700"
                  fill="var(--indigo-500)"
                >
                  {"1"}
                </text>
              </g>
              <g>
                <circle cx="250" cy="40" r="11" fill="var(--white)" stroke="var(--indigo-500)" strokeWidth="2" />
                <text
                  x="250"
                  y="44"
                  textAnchor="middle"
                  fontFamily="var(--font-display)"
                  fontSize="11"
                  fontWeight="700"
                  fill="var(--indigo-500)"
                >
                  {"2"}
                </text>
              </g>
              <g>
                <circle cx="500" cy="40" r="11" fill="var(--white)" stroke="var(--indigo-500)" strokeWidth="2" />
                <text
                  x="500"
                  y="44"
                  textAnchor="middle"
                  fontFamily="var(--font-display)"
                  fontSize="11"
                  fontWeight="700"
                  fill="var(--indigo-500)"
                >
                  {"3"}
                </text>
              </g>
              <g>
                <circle cx="750" cy="40" r="11" fill="var(--white)" stroke="var(--indigo-500)" strokeWidth="2" />
                <text
                  x="750"
                  y="44"
                  textAnchor="middle"
                  fontFamily="var(--font-display)"
                  fontSize="11"
                  fontWeight="700"
                  fill="var(--indigo-500)"
                >
                  {"4"}
                </text>
              </g>
              <g>
                <circle cx="1000" cy="40" r="11" fill="var(--green-500)" stroke="var(--green-500)" strokeWidth="2" />
                <path d="M996 40 l3 3 l6 -6" fill="none" stroke="var(--white)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </svg>
          </div>
        </div>
        <div
          className="mh-grid5 mh-reveal mh-hidden"
          style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "22px" }}
        >
          <div className="mh-step">
            <div
              style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "14px", color: "var(--color-primary)", marginBottom: "8px" }}
            >
              {"Stap 1"}
            </div>
            <h3 style={{ fontSize: "17.5px", margin: "0px 0px 8px", lineHeight: "1.25" }}>
              {"Lead komt binnen"}
            </h3>
            <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--text-muted)", lineHeight: "1.55" }}>
              {"Van website of campagne, direct in je sales-CRM en toegewezen aan de juiste adviseur."}
            </p>
          </div>
          <div className="mh-step">
            <div
              style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "14px", color: "var(--color-primary)", marginBottom: "8px" }}
            >
              {"Stap 2"}
            </div>
            <h3 style={{ fontSize: "17.5px", margin: "0px 0px 8px", lineHeight: "1.25" }}>
              {"Schouw van jouw branche"}
            </h3>
            <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--text-muted)", lineHeight: "1.55" }}>
              {"Het juiste formulier met de juiste velden, metingen en foto\u2019s, niets vergeten op locatie."}
            </p>
          </div>
          <div className="mh-step">
            <div
              style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "14px", color: "var(--color-primary)", marginBottom: "8px" }}
            >
              {"Stap 3"}
            </div>
            <h3 style={{ fontSize: "17.5px", margin: "0px 0px 8px", lineHeight: "1.25" }}>
              {"Offerte die rekent"}
            </h3>
            <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--text-muted)", lineHeight: "1.55" }}>
              {"Vakberekening en actuele subsidie erin verwerkt; de klant tekent digitaal."}
            </p>
          </div>
          <div className="mh-step">
            <div
              style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "14px", color: "var(--color-primary)", marginBottom: "8px" }}
            >
              {"Stap 4"}
            </div>
            <h3 style={{ fontSize: "17.5px", margin: "0px 0px 8px", lineHeight: "1.25" }}>
              {"Planning & uitvoering"}
            </h3>
            <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--text-muted)", lineHeight: "1.55" }}>
              {"Materiaal en werkvoorbereiding gaan mee; de monteur werkt op zijn telefoon, ook offline."}
            </p>
          </div>
          <div className="mh-step">
            <div
              style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "14px", color: "var(--color-primary)", marginBottom: "8px" }}
            >
              {"Stap 5"}
            </div>
            <h3 style={{ fontSize: "17.5px", margin: "0px 0px 8px", lineHeight: "1.25" }}>
              {"Oplevering volgens norm"}
            </h3>
            <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--text-muted)", lineHeight: "1.55" }}>
              {"Het opleverdocument van jouw branche, tweezijdig ondertekend, en service loopt door."}
            </p>
          </div>
        </div>
      </div>
    </section>
);
