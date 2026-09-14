
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
                  {"Rekenwerk dat automatisch klopt met de werkelijkheid"}
                </span>
              </h3>
              <p
                style={{ margin: "0px", fontSize: "17px", lineHeight: "1.7", color: "var(--text-body)", maxWidth: "52ch", textWrap: "pretty" }}
              >
                <span className="sc-interp">
                  {"De offerte begint niet met een leeg document maar met de gegevens uit de schouw. Bij zon-PV rolt de verwachte jaaropbrengst en de terugverdientijd eruit, bij een warmtepomp het benodigde vermogen en de COP bij de gekozen ontwerptemperatuur, bij isolatie de Rc-verbetering per bouwdeel. Die getallen staan niet los in een bijlage, ze zijn de onderbouwing van het bedrag dat je vraagt. Werk je met pakketten en staffels, dan gebruikt elke adviseur automatisch je actuele prijslijst."}
                </span>
              </p>
            </div>
            <figure style={{ margin: "0px" }}>
              <img src="/__l5e/assets-v1/1045047b-4b5e-4ab1-a3dd-462d8e46bd4f/img38.jpg" alt="Adviseur stelt een offerte op met de schouwgegevens naast zich op de laptop" loading="lazy" style={{ width: "100%", aspectRatio: "3 / 2", objectFit: "cover", borderRadius: "20px", display: "block", boxShadow: "rgba(33, 31, 84, 0.13) 0px 20px 46px" }} />
            </figure>
          </div>
          <div
            className="mh-grid2 mh-reveal"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center" }}
          >
            <div>
              <h3 style={{ fontSize: "27px", lineHeight: "1.2", margin: "0px 0px 14px", maxWidth: "24ch" }}>
                <span className="sc-interp">
                  {"Aan de keukentafel ondertekend, project meteen gestart"}
                </span>
              </h3>
              <p
                style={{ margin: "0px", fontSize: "17px", lineHeight: "1.7", color: "var(--text-body)", maxWidth: "52ch", textWrap: "pretty" }}
              >
                <span className="sc-interp">
                  {"Het sterkste moment om te tekenen is direct na de schouw, als het enthousiasme er nog is. De klant ondertekent op de tablet of via de mail, rechtsgeldig en met tijdstempel in het dossier. Zodra hij tekent, wordt het project automatisch aangemaakt met alle schouwgegevens en materialen erbij, klaar voor de werkvoorbereiding. Verstuur je hem digitaal, dan zie je wanneer hij geopend is, zodat je nabelt op het moment dat de klant er nog mee bezig is."}
                </span>
              </p>
            </div>
            <figure style={{ margin: "0px" }}>
              <img src="/__l5e/assets-v1/645872e2-27c4-4c8f-b69e-34bbee20b589/img21.jpg" alt="Klant ondertekent de offerte digitaal terwijl de adviseur meekijkt" loading="lazy" style={{ width: "100%", aspectRatio: "3 / 2", objectFit: "cover", borderRadius: "20px", display: "block", boxShadow: "rgba(33, 31, 84, 0.13) 0px 20px 46px" }} />
            </figure>
          </div>
        </div>
      </div>
    </section>
);
