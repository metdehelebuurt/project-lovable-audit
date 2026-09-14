
export const S08 = () => (
    <section className="mh-secpad" style={{ padding: "72px 0px", background: "var(--surface-tint)" }}>
      <div className="mh-container">
        <div className="mh-reveal mh-hidden" style={{ maxWidth: "620px", marginBottom: "32px" }}>
          <div
            style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--indigo-600)", marginBottom: "12px" }}
          >
            {"Waarom een klasse hoger"}
          </div>
          <h2 style={{ margin: "0px" }}>
            {"Twee dingen die de groten je niet geven"}
          </h2>
        </div>
        <div
          className="mh-grid2 mh-reveal mh-hidden"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}
        >
          <div className="sc-host-x" style={{ display: "contents" }}>
            <div
              className="mh-card"
              style={{ boxSizing: "border-box", background: "var(--surface-card)", borderRadius: "var(--radius-lg)", padding: "32px", transition: "transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard)", border: "1px solid var(--color-primary)", boxShadow: "0 0 0 3px var(--indigo-50)" }}
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
                style={{ width: "32px", height: "32px", color: "var(--color-primary)", strokeWidth: "1.5", flex: "0 0 auto", display: "block", marginBottom: "14px" }}
                className="lucide lucide-sparkles"
              >
                <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
                <path d="M20 2v4" />
                <path d="M22 4h-4" />
                <circle cx="4" cy="20" r="2" />
              </svg>
              <h3 style={{ fontSize: "21px", margin: "0px 0px 8px" }}>
                {"AI-kennisbank die met je meegroeit"}
              </h3>
              <p style={{ margin: "0px", fontSize: "15.5px", color: "var(--neutral-600)", lineHeight: "1.6" }}>
                {"Geen statisch handboek, maar een assistent die leert van jouw projecten, normen en handleidingen, en je team en monteurs direct het juiste antwoord geeft, met bronvermelding."}
              </p>
            </div>
          </div>
          <div className="sc-host-x" style={{ display: "contents" }}>
            <div
              className="mh-card"
              style={{ boxSizing: "border-box", background: "var(--surface-card)", borderRadius: "var(--radius-lg)", padding: "32px", transition: "transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard)", border: "1px solid var(--color-primary)", boxShadow: "0 0 0 3px var(--indigo-50)" }}
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
                style={{ width: "32px", height: "32px", color: "var(--color-primary)", strokeWidth: "1.5", flex: "0 0 auto", display: "block", marginBottom: "14px" }}
                className="lucide lucide-user-round-check"
              >
                <path d="M2 21a8 8 0 0 1 13.292-6" />
                <circle cx="10" cy="8" r="5" />
                <path d="m16 19 2 2 4-4" />
              </svg>
              <h3 style={{ fontSize: "21px", margin: "0px 0px 8px" }}>
                {"Een persoonlijke accountmanager"}
              </h3>
              <p style={{ margin: "0px", fontSize: "15.5px", color: "var(--neutral-600)", lineHeight: "1.6" }}>
                {"Een vast aanspreekpunt dat je bedrijf kent, naar je behoeften luistert en samen met jou nieuwe functies uitwerkt. Jij praat mee over de roadmap."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
);
