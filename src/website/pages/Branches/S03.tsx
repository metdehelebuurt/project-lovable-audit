
export const S03 = () => (
    <section className="mh-secpad" style={{ padding: "88px 0px", background: "var(--surface-tint)" }}>
      <div className="mh-container">
        <div className="mh-reveal mh-hidden" style={{ maxWidth: "640px", marginBottom: "36px" }}>
          <div
            style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--indigo-600)", marginBottom: "14px" }}
          >
            {"Herkenbaar?"}
          </div>
          <h2 style={{ margin: "0px 0px 10px" }}>
            {"Waarom generieke software vastloopt in de verduurzaming"}
          </h2>
          <p style={{ fontSize: "18px", color: "var(--neutral-600)", margin: "0px", lineHeight: "1.6" }}>
            {"Een algemeen pakket kent je vak niet. Dus bouw je het er zelf bij, en blijft het half af."}
          </p>
        </div>
        <div
          className="mh-grid3 mh-reveal mh-hidden"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}
        >
          <div className="sc-host-x" style={{ display: "contents" }}>
            <div
              className="mh-card"
              style={{ boxSizing: "border-box", background: "var(--surface-card)", borderRadius: "var(--radius-lg)", padding: "24px", transition: "transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard)", border: "1px solid var(--border-subtle)", boxShadow: "none" }}
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
                style={{ width: "32px", height: "32px", color: "var(--color-primary)", strokeWidth: "1.5", flex: "0 0 auto", display: "block", marginBottom: "16px" }}
                className="lucide lucide-puzzle"
              >
                <path d="M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z" />
              </svg>
              <div
                style={{ fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "17px", lineHeight: "1.3", color: "var(--text-heading)", marginBottom: "9px" }}
              >
                {"Je vak past niet in een standaardpakket"}
              </div>
              <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                {"Geen dakvlak, geen warmteverlies, geen Rd-waarde. Dus knutsel je zelf sjablonen, en onderhoudt niemand ze."}
              </p>
            </div>
          </div>
          <div className="sc-host-x" style={{ display: "contents" }}>
            <div
              className="mh-card"
              style={{ boxSizing: "border-box", background: "var(--surface-card)", borderRadius: "var(--radius-lg)", padding: "24px", transition: "transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard)", border: "1px solid var(--border-subtle)", boxShadow: "none" }}
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
                style={{ width: "32px", height: "32px", color: "var(--color-primary)", strokeWidth: "1.5", flex: "0 0 auto", display: "block", marginBottom: "16px" }}
                className="lucide lucide-unplug"
              >
                <path d="m19 5 3-3" />
                <path d="m2 22 3-3" />
                <path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z" />
                <path d="M7.5 13.5 10 11" />
                <path d="M10.5 16.5 13 14" />
                <path d="m12 6 6 6 2.3-2.3a2.4 2.4 0 0 0 0-3.4l-2.6-2.6a2.4 2.4 0 0 0-3.4 0Z" />
              </svg>
              <div
                style={{ fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "17px", lineHeight: "1.3", color: "var(--text-heading)", marginBottom: "9px" }}
              >
                {"Elke branche z\u2019n eigen losse tool"}
              </div>
              <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                {"Rekentool hier, prijslijst daar, opleverrapport in Word. Vijf systemen die niets van elkaar weten."}
              </p>
            </div>
          </div>
          <div className="sc-host-x" style={{ display: "contents" }}>
            <div
              className="mh-card"
              style={{ boxSizing: "border-box", background: "var(--surface-card)", borderRadius: "var(--radius-lg)", padding: "24px", transition: "transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard)", border: "1px solid var(--border-subtle)", boxShadow: "none" }}
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
                style={{ width: "32px", height: "32px", color: "var(--color-primary)", strokeWidth: "1.5", flex: "0 0 auto", display: "block", marginBottom: "16px" }}
                className="lucide lucide-user-round-x"
              >
                <path d="m16.5 16.5 5 5" />
                <path d="M2 21a8 8 0 0 1 11.531-7.18" />
                <path d="m21.5 16.5-5 5" />
                <circle cx="10" cy="8" r="5" />
              </svg>
              <div
                style={{ fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "17px", lineHeight: "1.3", color: "var(--text-heading)", marginBottom: "9px" }}
              >
                {"De norm zit in hoofden, niet in het systeem"}
              </div>
              <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                {"Scope 12, F-gassen, NEN 1010, wordt het niet afgedwongen, dan ontbreekt er altijd iets in het dossier."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
);
