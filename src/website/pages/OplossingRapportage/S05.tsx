
export const S05 = () => (
    <section id="s-stappen" className="mh-secpad" style={{ padding: "88px 0px", background: "var(--surface-tint)" }}>
      <div className="mh-container">
        <div className="mh-reveal" style={{ maxWidth: "660px", marginBottom: "20px" }}>
          <div
            style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-primary)", marginBottom: "14px" }}
          >
            {"Zo werkt het"}
          </div>
          <h2 style={{ margin: "0px 0px 10px" }}>
            <span className="sc-interp">
              {"Rapportages & marge"}
            </span>
            {" in vier stappen"}
          </h2>
          <p style={{ fontSize: "17px", color: "var(--text-body)", margin: "0px", lineHeight: "1.6" }}>
            {"Onderdeel van dezelfde doorlopende lijn: wat hier vastligt, gebruikt de volgende stap opnieuw."}
          </p>
        </div>
        <div className="mh-reveal" style={{ margin: "26px 0px -2px" }}>
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
                <circle cx="333.3333333333333" cy="40" r="11" fill="var(--white)" stroke="var(--indigo-500)" strokeWidth="2" />
                <text
                  x="333.3333333333333"
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
                <circle cx="666.6666666666666" cy="40" r="11" fill="var(--white)" stroke="var(--indigo-500)" strokeWidth="2" />
                <text
                  x="666.6666666666666"
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
                <circle cx="1000" cy="40" r="11" fill="var(--green-500)" stroke="var(--green-500)" strokeWidth="2" />
                <path d="M996 40 l3 3 l6 -6" fill="none" stroke="var(--white)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </svg>
          </div>
        </div>
        <div
          className="mh-grid4 mh-reveal"
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}
        >
          <div className="mh-step">
            <div
              style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "15px", color: "var(--color-primary)", marginBottom: "8px" }}
            >
              <span className="sc-interp">
                {"Stap 1"}
              </span>
            </div>
            <h3 style={{ fontSize: "19px", margin: "0px 0px 8px", lineHeight: "1.25" }}>
              <span className="sc-interp">
                {"Werk boekt zichzelf"}
              </span>
            </h3>
            <p style={{ margin: "0px", fontSize: "15px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
              <span className="sc-interp">
                {"Uren, materiaal en meerwerk worden geboekt in de app, op het project."}
              </span>
            </p>
          </div>
          <div className="mh-step">
            <div
              style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "15px", color: "var(--color-primary)", marginBottom: "8px" }}
            >
              <span className="sc-interp">
                {"Stap 2"}
              </span>
            </div>
            <h3 style={{ fontSize: "19px", margin: "0px 0px 8px", lineHeight: "1.25" }}>
              <span className="sc-interp">
                {"Marge loopt mee"}
              </span>
            </h3>
            <p style={{ margin: "0px", fontSize: "15px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
              <span className="sc-interp">
                {"Je ziet per project het verschil tussen calculatie en werkelijkheid."}
              </span>
            </p>
          </div>
          <div className="mh-step">
            <div
              style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "15px", color: "var(--color-primary)", marginBottom: "8px" }}
            >
              <span className="sc-interp">
                {"Stap 3"}
              </span>
            </div>
            <h3 style={{ fontSize: "19px", margin: "0px 0px 8px", lineHeight: "1.25" }}>
              <span className="sc-interp">
                {"Dashboards per rol"}
              </span>
            </h3>
            <p style={{ margin: "0px", fontSize: "15px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
              <span className="sc-interp">
                {"Directie, kantoor en werkvoorbereiding kijken elk naar hun eigen cijfers."}
              </span>
            </p>
          </div>
          <div className="mh-step">
            <div
              style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "15px", color: "var(--color-primary)", marginBottom: "8px" }}
            >
              <span className="sc-interp">
                {"Stap 4"}
              </span>
            </div>
            <h3 style={{ fontSize: "19px", margin: "0px 0px 8px", lineHeight: "1.25" }}>
              <span className="sc-interp">
                {"Door naar de boekhouding"}
              </span>
            </h3>
            <p style={{ margin: "0px", fontSize: "15px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
              <span className="sc-interp">
                {"Facturen en boekingen gaan via de koppeling naar je boekhoudpakket."}
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
);
