
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
                  {"De norm zit in het formulier, niet in iemands hoofd"}
                </span>
              </h3>
              <p
                style={{ margin: "0px", fontSize: "17px", lineHeight: "1.7", color: "var(--text-body)", maxWidth: "52ch", textWrap: "pretty" }}
              >
                <span className="sc-interp">
                  {"Per vakgebied is het opleverdocument opgebouwd volgens de geldende normen: stringplan en serienummers bij zon-PV, inregelrapport en F-gassenlogboek bij een warmtepomp, de installatieverklaring bij laadinfrastructuur, foto\u2019s v\u00f3\u00f3r en n\u00e1 met Rc-onderbouwing bij isolatie. Wordt een eis niet ingevuld, dan kan de monteur niet afronden. Dat voelt in het begin streng en scheelt daarna eindeloos veel discussie, ook intern."}
                </span>
              </p>
            </div>
            <figure style={{ margin: "0px" }}>
              <img src="/__l5e/assets-v1/be75da76-b2a4-4329-bc95-9a4fe491e589/img16.jpg" alt="Monteurs ronden op locatie het opleverdossier af volgens de checklist" loading="lazy" style={{ width: "100%", aspectRatio: "3 / 2", objectFit: "cover", borderRadius: "20px", display: "block", boxShadow: "rgba(33, 31, 84, 0.13) 0px 20px 46px" }} />
            </figure>
          </div>
          <div
            className="mh-grid2 mh-reveal"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center" }}
          >
            <div>
              <h3 style={{ fontSize: "27px", lineHeight: "1.2", margin: "0px 0px 14px", maxWidth: "24ch" }}>
                <span className="sc-interp">
                  {"Tweezijdig ondertekend, gehasht en altijd terug te vinden"}
                </span>
              </h3>
              <p
                style={{ margin: "0px", fontSize: "17px", lineHeight: "1.7", color: "var(--text-body)", maxWidth: "52ch", textWrap: "pretty" }}
              >
                <span className="sc-interp">
                  {"Monteur en klant tekenen samen op de tablet, met naam, datum en tijdstip. Het document krijgt een hash, waardoor achteraf aanpassen niet mogelijk is; precies dat maakt het bewijskracht waard. De klant ontvangt het direct per mail en in zijn portaal, en jij vindt alles wat je ooit op dat adres deed terug in \u00e9\u00e9n dossier. Bij een vraag over garantie of een controle heb je het binnen een minuut op je scherm."}
                </span>
              </p>
            </div>
            <figure style={{ margin: "0px" }}>
              <img src="/__l5e/assets-v1/dd1d32c3-1005-4407-a662-172121c967cd/img20.jpg" alt="Oplevering van een woning met het ondertekende dossier compleet" loading="lazy" style={{ width: "100%", aspectRatio: "3 / 2", objectFit: "cover", borderRadius: "20px", display: "block", boxShadow: "rgba(33, 31, 84, 0.13) 0px 20px 46px" }} />
            </figure>
          </div>
        </div>
      </div>
    </section>
);
