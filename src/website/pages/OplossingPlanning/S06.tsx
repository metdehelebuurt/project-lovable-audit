
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
                  {"Plannen met reistijd, materiaal en de juiste papieren"}
                </span>
              </h3>
              <p
                style={{ margin: "0px", fontSize: "17px", lineHeight: "1.7", color: "var(--text-body)", maxWidth: "52ch", textWrap: "pretty" }}
              >
                <span className="sc-interp">
                  {"Je sleept projecten in een week- of dagoverzicht per monteur, ploeg of bus. Het systeem houdt rekening met reistijd en beschikbaarheid, en waarschuwt als je een monteur inplant zonder het certificaat dat voor dat werk nodig is. Materiaal en werkvoorbereiding hangen aan het project, dus je ziet vooraf of de klus uitvoerbaar is in plaats van op de ochtend zelf. Projecten in dezelfde regio plaats je bij elkaar, wat direct kilometers en uren scheelt."}
                </span>
              </p>
            </div>
            <figure style={{ margin: "0px" }}>
              <img src="/__l5e/assets-v1/d5c13ea2-0a42-4f59-94fd-74fddb645fc1/img25.jpg" alt="Werkvoorbereiders overleggen over de weekplanning van de monteurs" loading="lazy" style={{ width: "100%", aspectRatio: "3 / 2", objectFit: "cover", borderRadius: "20px", display: "block", boxShadow: "rgba(33, 31, 84, 0.13) 0px 20px 46px" }} />
            </figure>
          </div>
          <div
            className="mh-grid2 mh-reveal"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center" }}
          >
            <div>
              <h3 style={{ fontSize: "27px", lineHeight: "1.2", margin: "0px 0px 14px", maxWidth: "24ch" }}>
                <span className="sc-interp">
                  {"Elke wijziging staat meteen bij de monteur"}
                </span>
              </h3>
              <p
                style={{ margin: "0px", fontSize: "17px", lineHeight: "1.7", color: "var(--text-body)", maxWidth: "52ch", textWrap: "pretty" }}
              >
                <span className="sc-interp">
                  {"De werkbon met adres, contactpersoon, taken, checklists en documenten staat op de telefoon van de monteur. Verschuif je om acht uur \u2019s ochtends nog een project, dan ziet hij dat in zijn dag zonder dat iemand hoeft te bellen. De klant krijgt automatisch een bevestiging en een herinnering, wat het aantal telefoontjes naar kantoor merkbaar terugbrengt. En omdat de monteur zijn uren en materiaal op de werkbon boekt, klopt je marge met wat er werkelijk is gebeurd."}
                </span>
              </p>
            </div>
            <figure style={{ margin: "0px" }}>
              <img src="/__l5e/assets-v1/be75da76-b2a4-4329-bc95-9a4fe491e589/img16.jpg" alt="Monteurs starten hun werkdag op locatie met de planning op hun telefoon" loading="lazy" style={{ width: "100%", aspectRatio: "3 / 2", objectFit: "cover", borderRadius: "20px", display: "block", boxShadow: "rgba(33, 31, 84, 0.13) 0px 20px 46px" }} />
            </figure>
          </div>
        </div>
      </div>
    </section>
);
