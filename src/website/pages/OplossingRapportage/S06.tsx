
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
                  {"Cijfers die uit het werk zelf komen"}
                </span>
              </h3>
              <p
                style={{ margin: "0px", fontSize: "17px", lineHeight: "1.7", color: "var(--text-body)", maxWidth: "52ch", textWrap: "pretty" }}
              >
                <span className="sc-interp">
                  {"De monteur boekt zijn uren en materiaal op de werkbon, meerwerk komt bij het project en de facturen volgen dezelfde lijn. Daardoor is de marge per project geen maandelijkse exercitie meer maar een getal dat live meeloopt. Je ziet welke projecttypes structureel meer uren kosten dan gecalculeerd, welke adviseur scherp calculeert en waar je inkoop knelt. Dat maakt het gesprek met je team concreet in plaats van een kwestie van gevoel."}
                </span>
              </p>
            </div>
            <figure style={{ margin: "0px" }}>
              <img src="/__l5e/assets-v1/1045047b-4b5e-4ab1-a3dd-462d8e46bd4f/img38.jpg" alt="Eigenaar bekijkt de marge per project op zijn laptop" loading="lazy" style={{ width: "100%", aspectRatio: "3 / 2", objectFit: "cover", borderRadius: "20px", display: "block", boxShadow: "rgba(33, 31, 84, 0.13) 0px 20px 46px" }} />
            </figure>
          </div>
          <div
            className="mh-grid2 mh-reveal"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center" }}
          >
            <div>
              <h3 style={{ fontSize: "27px", lineHeight: "1.2", margin: "0px 0px 14px", maxWidth: "24ch" }}>
                <span className="sc-interp">
                  {"Elke rol z\u2019n eigen dashboard"}
                </span>
              </h3>
              <p
                style={{ margin: "0px", fontSize: "17px", lineHeight: "1.7", color: "var(--text-body)", maxWidth: "52ch", textWrap: "pretty" }}
              >
                <span className="sc-interp">
                  {"Directie kijkt naar omzet, marge en prognose. Kantoor naar de pijplijn, de scoringskans en de openstaande offertes. Werkvoorbereiding naar bezetting, doorlooptijd en materiaal. Iedereen ziet dus dezelfde bron, maar in de vorm die bij zijn werk past. Voor je boekhouder exporteer je elke weergave naar Excel of pdf, en via de koppeling met Exact, Twinfield of Snelstart gaan facturen en boekingen zonder dubbel werk door."}
                </span>
              </p>
            </div>
            <figure style={{ margin: "0px" }}>
              <img src="/__l5e/assets-v1/510a0996-4fac-4ac3-a745-bdca0132446a/img13.jpg" alt="Dashboards met marge en bezetting op verschillende schermen" loading="lazy" style={{ width: "100%", aspectRatio: "3 / 2", objectFit: "cover", borderRadius: "20px", display: "block", boxShadow: "rgba(33, 31, 84, 0.13) 0px 20px 46px" }} />
            </figure>
          </div>
        </div>
      </div>
    </section>
);
