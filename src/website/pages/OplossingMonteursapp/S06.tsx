
export const S06 = () => (
    <section id="s-praktijk" className="mh-secpad" style={{ padding: "96px 0px", background: "var(--surface-page)" }}>
      <div className="mh-container">
        <div className="mh-reveal" style={{ maxWidth: "680px", marginBottom: "52px" }}>
          <div
            style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--indigo-600)", marginBottom: "14px" }}
          >
            {"In de praktijk"}
          </div>
          <h2 style={{ margin: "0px 0px 12px" }}>
            {"Hoe dit er in jouw bedrijf uitziet"}
          </h2>
          <p style={{ margin: "0px", fontSize: "18px", color: "var(--neutral-600)", lineHeight: "1.6" }}>
            {"Twee momenten waarop je het verschil direct merkt, uitgelegd zoals het bij een installatiebedrijf werkt."}
          </p>
        </div>
        <div className="mh-reveal" style={{ display: "flex", flexDirection: "column", gap: "64px" }}>
          <div
            className="mh-grid2 mh-reveal"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center" }}
          >
            <div>
              <h3 style={{ fontSize: "27px", lineHeight: "1.2", margin: "0px 0px 14px", maxWidth: "24ch" }}>
                <span className="sc-interp">
                  {"Zijn hele dag op \u00e9\u00e9n scherm, ook zonder bereik"}
                </span>
              </h3>
              <p
                style={{ margin: "0px", fontSize: "17px", lineHeight: "1.7", color: "var(--text-body)", maxWidth: "52ch", textWrap: "pretty" }}
              >
                <span className="sc-interp">
                  {"De app opent op de dag van vandaag: welke adressen, welke contactpersonen en welke taken. Foto\u2019s v\u00f3\u00f3r en n\u00e1 koppelen zich aan het onderdeel waar ze bij horen, uren en materiaal boekt hij op het project en de checklist van het vakgebied laat hem niet afronden met gaten. Alles werkt zonder verbinding, wat op een dak, in een kruipruimte of in een nieuwbouwwijk het verschil maakt tussen gebruiken en teruggrijpen op papier."}
                </span>
              </p>
            </div>
            <figure style={{ margin: "0px" }}>
              <img src="/__l5e/assets-v1/eec04483-5b6a-4917-a684-0107529d092e/img19.jpg" alt="Monteur vult op het dak zijn werkbon in op zijn telefoon" loading="lazy" style={{ width: "100%", aspectRatio: "3 / 2", objectFit: "cover", borderRadius: "20px", display: "block", boxShadow: "rgba(33, 31, 84, 0.13) 0px 20px 46px" }} />
            </figure>
          </div>
          <div
            className="mh-grid2 mh-reveal"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center" }}
          >
            <div>
              <h3 style={{ fontSize: "27px", lineHeight: "1.2", margin: "0px 0px 14px", maxWidth: "24ch" }}>
                <span className="sc-interp">
                  {"Een monteur is er in een kwartier mee weg"}
                </span>
              </h3>
              <p
                style={{ margin: "0px", fontSize: "17px", lineHeight: "1.7", color: "var(--text-body)", maxWidth: "52ch", textWrap: "pretty" }}
              >
                <span className="sc-interp">
                  {"Er is geen cursus nodig. De meeste bedrijven laten hun monteurs de app in een kwartier zien en daarna gaan ze aan het werk. Loopt er iets vast of komt er meerwerk bij, dan koppelt de monteur dat direct terug naar kantoor, met foto erbij. Daarmee verdwijnt de vrijdagmiddag waarop iemand alle bonnen zit te ontcijferen, en verschijnt het overzicht dat je nodig hebt om dezelfde week nog te factureren."}
                </span>
              </p>
            </div>
            <figure style={{ margin: "0px" }}>
              <img src="/__l5e/assets-v1/f49aae4d-ff69-46fa-95f6-113a68936de4/img33.jpg" alt="Monteur legt met de app de installatie in de meterkast vast" loading="lazy" style={{ width: "100%", aspectRatio: "3 / 2", objectFit: "cover", borderRadius: "20px", display: "block", boxShadow: "rgba(33, 31, 84, 0.13) 0px 20px 46px" }} />
            </figure>
          </div>
        </div>
      </div>
    </section>
);
