
export const S02 = () => (
    <section className="mh-secpad" style={{ padding: "56px 0px 80px", background: "var(--surface-page)" }}>
      <div className="mh-container" style={{ maxWidth: "820px", display: "flex", flexDirection: "column", gap: "32px" }}>
        <div>
          <h2 style={{ fontSize: "24px", margin: "0px 0px 10px" }}>
            {"Algemene voorwaarden"}
          </h2>
          <p style={{ margin: "0px", fontSize: "16px", lineHeight: "1.65", color: "var(--text-body)" }}>
            {"mijnhuis.nu levert een SaaS-platform voor installatiebedrijven. Abonnementen zijn per gebruiker per maand, maandelijks opzegbaar, zonder setupkosten. Je behoudt te allen tijde eigendom van je eigen data en kunt deze bij vertrek exporteren."}
          </p>
        </div>
        <div>
          <h2 style={{ fontSize: "24px", margin: "0px 0px 10px" }}>
            {"Privacybeleid"}
          </h2>
          <p style={{ margin: "0px", fontSize: "16px", lineHeight: "1.65", color: "var(--text-body)" }}>
            {"We verwerken persoonsgegevens AVG-conform en hosten alle data binnen de Europese Unie. Je bepaalt per rol wie welke gegevens ziet. We verkopen nooit gegevens aan derden en delen alleen wat nodig is voor de dienst (zoals betalingen via Mollie)."}
          </p>
        </div>
        <div>
          <h2 style={{ fontSize: "24px", margin: "0px 0px 10px" }}>
            {"Cookies"}
          </h2>
          <p style={{ margin: "0px", fontSize: "16px", lineHeight: "1.65", color: "var(--text-body)" }}>
            {"We gebruiken functionele cookies om het platform te laten werken en beperkte, geanonimiseerde analytische cookies om de dienst te verbeteren. Je kunt je voorkeuren op elk moment aanpassen."}
          </p>
        </div>
        <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "24px" }}>
          <p style={{ margin: "0px", fontSize: "15px", color: "var(--text-muted)" }}>
            {"Vragen over onze voorwaarden of gegevensverwerking? "}
            <a href="/contact" style={{ fontWeight: "600" }}>
              {"Neem contact met ons op"}
            </a>
            {"."}
          </p>
        </div>
      </div>
    </section>
);
