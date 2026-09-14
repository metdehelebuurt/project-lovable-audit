
export const S06 = () => (
    <section id="b-uitleg" className="mh-secpad" style={{ padding: "96px 0px", background: "var(--surface-page)" }}>
      <div className="mh-container">
        <div
          className="mh-split mh-reveal"
          style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "56px", alignItems: "start" }}
        >
          <div className="mh-reveal">
            <div
              style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-primary)", marginBottom: "14px" }}
            >
              {"Achtergrond"}
            </div>
            <h2 style={{ margin: "0px 0px 22px", maxWidth: "24ch" }}>
              <span className="sc-interp">
                {"Wat komt er kijken bij een isolatieproject?"}
              </span>
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "68ch" }}>
              <p
                style={{ margin: "0px", fontSize: "17px", lineHeight: "1.75", color: "var(--text-body)", textWrap: "pretty" }}
              >
                <span className="sc-interp">
                  {"Isolatie verkoopt zich op onderbouwing. De klant wil weten welke Rc-waarde hij krijgt, wat dat scheelt op zijn energierekening en of hij recht heeft op subsidie. Dat betekent dat je de bestaande constructie, de huidige waarde en de te isoleren oppervlakken nauwkeurig moet vastleggen, inclusief vocht, ventilatie en aansluitdetails."}
                </span>
              </p>
              <p
                style={{ margin: "0px", fontSize: "17px", lineHeight: "1.75", color: "var(--text-body)", textWrap: "pretty" }}
              >
                <span className="sc-interp">
                  {"In mijnhuis.nu meet je de oppervlakken in op de tablet en rekent het systeem de Rc-verbetering per maatregel door. Het actuele subsidiebedrag en de bijbehorende eisen staan in de offerte, met de onderbouwing als bijlage. Zo weet de klant vooraf wat hij netto betaalt en loop je geen aanvraag mis door een ontbrekend document."}
                </span>
              </p>
              <p
                style={{ margin: "0px", fontSize: "17px", lineHeight: "1.75", color: "var(--text-body)", textWrap: "pretty" }}
              >
                <span className="sc-interp">
                  {"Bij oplevering horen foto\u2019s v\u00f3\u00f3r en n\u00e1, de verwerkingsdetails en de Rc-onderbouwing in het dossier. Dat is precies wat een subsidieverstrekker of een toekomstige koper wil zien. De klant tekent op locatie en heeft het document meteen in zijn portaal staan."}
                </span>
              </p>
            </div>
            <div
              style={{ marginTop: "32px", padding: "22px 26px", borderRadius: "16px", background: "var(--surface-tint)", border: "1px solid var(--indigo-200)", display: "flex", gap: "16px", alignItems: "flex-start" }}
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
                style={{ width: "22px", height: "22px", color: "var(--color-primary)", flex: "0 0 auto", marginTop: "2px" }}
                className="lucide lucide-lightbulb"
              >
                <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                <path d="M9 18h6" />
                <path d="M10 22h4" />
              </svg>
              <p style={{ margin: "0px", fontSize: "15.5px", lineHeight: "1.6", color: "var(--text-body)" }}>
                {"Wil je zien hoe dit er in jouw situatie uitziet? In een "}
                <a href="/demo" style={{ fontWeight: "600" }}>
                  {"gratis demo"}
                </a>
                {" lopen we een "}
                <span className="sc-interp">
                  {"Isolatie"}
                </span>
                {"-project van begin tot eind door, of je probeert het zelf "}
                <a href="/proefperiode" style={{ fontWeight: "600" }}>
                  {"14 dagen gratis"}
                </a>
                {"."}
              </p>
            </div>
          </div>
          <aside
            className="mh-reveal"
            style={{ position: "sticky", top: "96px", borderRadius: "18px", border: "1px solid var(--border-subtle)", background: "var(--surface-page)", boxShadow: "var(--shadow-md)", padding: "24px 26px" }}
          >
            <div
              style={{ fontFamily: "\"IBM Plex Mono\", ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "11px", letterSpacing: "0.08em", color: "var(--indigo-600)", marginBottom: "14px" }}
            >
              {"OP DEZE PAGINA"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
              <button
                className="scp5"
                style={{ textAlign: "left", background: "none", border: "none", padding: "0px", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "14.5px", fontWeight: "500", color: "var(--text-body)" }}
              >
                <span className="sc-interp">
                  {"Wat komt er kijken?"}
                </span>
              </button>
              <button
                className="scp5"
                style={{ textAlign: "left", background: "none", border: "none", padding: "0px", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "14.5px", fontWeight: "500", color: "var(--text-body)" }}
              >
                <span className="sc-interp">
                  {"Normen en regelgeving"}
                </span>
              </button>
              <button
                className="scp5"
                style={{ textAlign: "left", background: "none", border: "none", padding: "0px", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "14.5px", fontWeight: "500", color: "var(--text-body)" }}
              >
                <span className="sc-interp">
                  {"Veelgestelde vragen"}
                </span>
              </button>
              <button
                className="scp5"
                style={{ textAlign: "left", background: "none", border: "none", padding: "0px", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "14.5px", fontWeight: "500", color: "var(--text-body)" }}
              >
                <span className="sc-interp">
                  {"Oplossingen die je gebruikt"}
                </span>
              </button>
            </div>
            <div
              style={{ borderTop: "1px solid var(--border-subtle)", marginTop: "18px", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "11px" }}
            >
              <div
                style={{ fontFamily: "\"IBM Plex Mono\", ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "11px", letterSpacing: "0.08em", color: "var(--indigo-600)", marginBottom: "2px" }}
              >
                {"VERDER LEZEN"}
              </div>
              <a
                href="/prijzen"
                style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "14.5px", fontWeight: "600", color: "var(--indigo-700)" }}
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
                  style={{ width: "15px", height: "15px" }}
                  className="lucide lucide-tag"
                >
                  <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
                  <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
                </svg>
                {"Wat kost het?"}
              </a>
              <a
                href="/succesverhalen"
                style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "14.5px", fontWeight: "600", color: "var(--indigo-700)" }}
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
                  style={{ width: "15px", height: "15px" }}
                  className="lucide lucide-quote"
                >
                  <path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z" />
                  <path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z" />
                </svg>
                {"Succesverhaal van een klant"}
              </a>
              <a
                href="/kennisbank"
                style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "14.5px", fontWeight: "600", color: "var(--indigo-700)" }}
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
                  style={{ width: "15px", height: "15px" }}
                  className="lucide lucide-book-open"
                >
                  <path d="M12 5v16" />
                  <path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z" />
                </svg>
                {"Kennisbank en normen"}
              </a>
              <a
                href="/functionaliteiten"
                style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "14.5px", fontWeight: "600", color: "var(--indigo-700)" }}
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
                  style={{ width: "15px", height: "15px" }}
                  className="lucide lucide-layout-grid"
                >
                  <rect width="7" height="7" x="3" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="14" rx="1" />
                  <rect width="7" height="7" x="3" y="14" rx="1" />
                </svg>
                {"Alle functionaliteiten"}
              </a>
            </div>
          </aside>
        </div>
      </div>
    </section>
);
