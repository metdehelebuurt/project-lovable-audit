
export const S04 = () => (
    <section id="s-uitleg" className="mh-secpad" style={{ padding: "96px 0px", background: "var(--surface-page)" }}>
      <div className="mh-container">
        <div
          className="mh-split mh-reveal"
          style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "56px", alignItems: "start", transitionDelay: "0ms" }}
        >
          <div className="mh-reveal" style={{ transitionDelay: "0ms" }}>
            <div
              style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-primary)", marginBottom: "14px" }}
            >
              {"Achtergrond"}
            </div>
            <h2 style={{ margin: "0px 0px 22px", maxWidth: "26ch" }}>
              <span className="sc-interp">
                {"Wat statustelefoontjes je per week kosten"}
              </span>
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "68ch" }}>
              <p
                style={{ margin: "0px", fontSize: "17.5px", lineHeight: "1.75", color: "var(--text-body)", textWrap: "pretty" }}
              >
                <span className="sc-interp">
                  {"\u201cHoe staat het ervoor?\u201d is de meest gestelde vraag aan een installatiebedrijf, en de minst waardevolle om te beantwoorden. Bij twintig lopende projecten kost dat je kantoor makkelijk een paar uur per week, terwijl het antwoord in het systeem al bekend is. De klant belt niet omdat hij ongeduldig is, maar omdat hij nergens kan kijken."}
                </span>
              </p>
              <p
                style={{ margin: "0px", fontSize: "17.5px", lineHeight: "1.75", color: "var(--text-body)", textWrap: "pretty" }}
              >
                <span className="sc-interp">
                  {"Hetzelfde geldt voor documenten. De offerte zit in een mail van zes weken oud, de factuur in een andere en het garantiebewijs is nooit apart verstuurd. Zodra de klant er iets van nodig heeft, belt hij jou. Dat is geen slechte klant, dat is een ontbrekende plek."}
                </span>
              </p>
              <p
                style={{ margin: "0px", fontSize: "17.5px", lineHeight: "1.75", color: "var(--text-body)", textWrap: "pretty" }}
              >
                <span className="sc-interp">
                  {"Een klantportaal in jouw huisstijl vult die plek. De klant volgt zijn planning, ziet wie er komt, vindt zijn documenten en facturen terug en bekijkt na oplevering de opbrengst van zijn installatie. Jij houdt je telefoon vrij en blijft tegelijk zichtbaar: het portaal draagt jouw logo, jouw kleuren en jouw domein."}
                </span>
              </p>
            </div>
            <div
              className="mh-grid2"
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", marginTop: "34px" }}
            >
              <figure style={{ margin: "0px" }}>
                <img src="/__l5e/assets-v1/dd1d32c3-1005-4407-a662-172121c967cd/img20.jpg" alt="Woningeigenaar met de sleutel van zijn verduurzaamde woning" loading="lazy" style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: "16px", display: "block" }} />
                <figcaption style={{ marginTop: "9px", fontSize: "13px", color: "var(--text-muted)", lineHeight: "1.45" }}>
                  <span className="sc-interp">
                    {"Woningeigenaar met de sleutel van zijn verduurzaamde woning"}
                  </span>
                </figcaption>
              </figure>
              <figure style={{ margin: "0px" }}>
                <img src="/__l5e/assets-v1/510a0996-4fac-4ac3-a745-bdca0132446a/img13.jpg" alt="Klant opent het portaal op laptop en telefoon" loading="lazy" style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: "16px", display: "block" }} />
                <figcaption style={{ marginTop: "9px", fontSize: "13px", color: "var(--text-muted)", lineHeight: "1.45" }}>
                  <span className="sc-interp">
                    {"Klant opent het portaal op laptop en telefoon"}
                  </span>
                </figcaption>
              </figure>
            </div>
          </div>
          <aside
            className="mh-reveal"
            style={{ position: "sticky", top: "96px", display: "flex", flexDirection: "column", gap: "18px", transitionDelay: "0ms" }}
          >
            <div
              style={{ borderRadius: "18px", border: "1px solid var(--border-subtle)", background: "var(--surface-page)", boxShadow: "var(--shadow-md)", padding: "24px 26px" }}
            >
              <div
                style={{ fontFamily: "\"IBM Plex Mono\", ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "11px", letterSpacing: "0.08em", color: "var(--indigo-600)", marginBottom: "14px" }}
              >
                {"OP DEZE PAGINA"}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
                <a
                  href="#s-uitleg"
                  style={{ fontSize: "14.5px", fontWeight: "500", color: "var(--text-body)", lineHeight: "1.4" }}
                >
                  {"Achtergrond en context"}
                </a>
                <a
                  href="#s-stappen"
                  style={{ fontSize: "14.5px", fontWeight: "500", color: "var(--text-body)", lineHeight: "1.4" }}
                >
                  {"Zo werkt het in vier stappen"}
                </a>
                <a
                  href="#s-praktijk"
                  style={{ fontSize: "14.5px", fontWeight: "500", color: "var(--text-body)", lineHeight: "1.4" }}
                >
                  {"In de praktijk"}
                </a>
                <a
                  href="#s-functies"
                  style={{ fontSize: "14.5px", fontWeight: "500", color: "var(--text-body)", lineHeight: "1.4" }}
                >
                  {"Alles wat erin zit"}
                </a>
                <a href="#s-faq" style={{ fontSize: "14.5px", fontWeight: "500", color: "var(--text-body)", lineHeight: "1.4" }}>
                  {"Veelgestelde vragen"}
                </a>
              </div>
            </div>
            <div
              style={{ borderRadius: "18px", border: "1px solid var(--indigo-200)", background: "var(--surface-tint)", padding: "24px 26px" }}
            >
              <div
                style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "16.5px", color: "var(--text-heading)", marginBottom: "8px" }}
              >
                {"Zelf zien met je eigen projecten"}
              </div>
              <p style={{ margin: "0px 0px 16px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                {"In een demo van 30 minuten lopen we "}
                <span className="sc-interp">
                  {"Klantportaal"}
                </span>
                {" door met jouw soort werk."}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <a
                  href="/demo"
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
                    className="lucide lucide-calendar-check"
                  >
                    <path d="M8 2v3" />
                    <path d="M16 2v3" />
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18" />
                    <path d="m9 15 2 2 4-4" />
                  </svg>
                  {"Plan een gratis demo"}
                </a>
                <a
                  href="/proefperiode"
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
                    className="lucide lucide-rocket"
                  >
                    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09" />
                    <path d="M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z" />
                    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05" />
                  </svg>
                  {"Start 14 dagen gratis"}
                </a>
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
                  {"Bekijk wat het kost"}
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
);
