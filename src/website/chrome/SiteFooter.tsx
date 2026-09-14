
export const SiteFooter = () => (
    <footer style={{ background: "var(--night-indigo)", color: "var(--text-on-dark)" }}>
      <div className="mh-container" style={{ padding: "64px 24px 32px" }}>
        <div
          className="mh-footgrid"
          style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr", gap: "32px" }}
        >
          <div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
              <img src="/__l5e/assets-v1/9f627532-46a9-45fe-bad0-6013be889abf/img00.png" width="30" height="30" alt="mijnhuis.nu" />
              <span
                style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "19px", color: "rgb(255, 255, 255)" }}
              >
                {"mijnhuis"}
                <span style={{ color: "var(--indigo-400)" }}>
                  {".nu"}
                </span>
              </span>
            </span>
            <p
              style={{ marginTop: "14px", fontSize: "14px", color: "var(--text-on-dark-muted)", maxWidth: "260px", lineHeight: "1.6" }}
            >
              {"E\u00e9n Nederlands platform voor de hele klantreis, gebouwd voor de verduurzamingsbranche."}
            </p>
            <a
              href="https://wa.me/31644666645"
              target="_blank"
              rel="noopener"
              className="scpf"
              style={{ marginTop: "18px", display: "inline-flex", alignItems: "center", gap: "10px", padding: "10px 16px", borderRadius: "10px", background: "rgba(31, 169, 124, 0.16)", border: "1px solid rgba(31, 169, 124, 0.4)", color: "rgb(255, 255, 255)", fontSize: "14px", fontWeight: "600" }}
            >
              <span style={{ color: "var(--green-500)", display: "inline-flex" }}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.85 1.21 3.05c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01a9.4 9.4 0 0 1-4.79-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.36 9.36 0 0 1-1.44-5A9.45 9.45 0 0 1 12.05 2.6a9.4 9.4 0 0 1 6.68 2.77 9.36 9.36 0 0 1 2.77 6.66 9.45 9.45 0 0 1-9.46 9.47zM20.06 3.98A11.36 11.36 0 0 0 12.04.66C5.77.66.66 5.76.66 12.03c0 2 .53 3.96 1.53 5.69L.57 23.34l5.76-1.51a11.36 11.36 0 0 0 5.71 1.46h.01c6.27 0 11.38-5.1 11.38-11.37 0-3.04-1.19-5.9-3.34-8.05z" />
                </svg>
              </span>
              {"WhatsApp 06-44666645"}
            </a>
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <a
                href="/contact"
                aria-label="LinkedIn"
                className="scpg"
                style={{ width: "40px", height: "40px", borderRadius: "11px", border: "1px solid rgba(255, 255, 255, 0.18)", background: "rgba(255, 255, 255, 0.06)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "rgb(255, 255, 255)" }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.76-1.95 4.02 0 4.76 2.5 4.76 5.76V21h-4v-5.6c0-1.34-.03-3.06-1.9-3.06-1.9 0-2.19 1.45-2.19 2.96V21H9z" />
                </svg>
              </a>
              <a
                href="/contact"
                aria-label="Instagram"
                className="scpg"
                style={{ width: "40px", height: "40px", borderRadius: "11px", border: "1px solid rgba(255, 255, 255, 0.18)", background: "rgba(255, 255, 255, 0.06)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "rgb(255, 255, 255)" }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.8 3.8 0 0 1-1.38-.9 3.8 3.8 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 1.8c-3.15 0-3.5.01-4.74.07-1.14.05-1.76.24-2.17.4-.55.21-.94.47-1.35.88-.41.41-.67.8-.88 1.35-.16.41-.35 1.03-.4 2.17-.06 1.24-.07 1.59-.07 4.74s.01 3.5.07 4.74c.05 1.14.24 1.76.4 2.17.21.55.47.94.88 1.35.41.41.8.67 1.35.88.41.16 1.03.35 2.17.4 1.24.06 1.59.07 4.74.07s3.5-.01 4.74-.07c1.14-.05 1.76-.24 2.17-.4.55-.21.94-.47 1.35-.88.41-.41.67-.8.88-1.35.16-.41.35-1.03.4-2.17.06-1.24.07-1.59.07-4.74s-.01-3.5-.07-4.74c-.05-1.14-.24-1.76-.4-2.17a3.6 3.6 0 0 0-.88-1.35 3.6 3.6 0 0 0-1.35-.88c-.41-.16-1.03-.35-2.17-.4-1.24-.06-1.59-.07-4.74-.07zM12 6.86a5.14 5.14 0 1 1 0 10.28 5.14 5.14 0 0 1 0-10.28zm0 1.8a3.34 3.34 0 1 0 0 6.68 3.34 3.34 0 0 0 0-6.68zm5.34-3.2a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z" />
                </svg>
              </a>
              <a
                href="/contact"
                aria-label="YouTube"
                className="scpg"
                style={{ width: "40px", height: "40px", borderRadius: "11px", border: "1px solid rgba(255, 255, 255, 0.18)", background: "rgba(255, 255, 255, 0.06)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "rgb(255, 255, 255)" }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.45a2.78 2.78 0 0 0-1.95 1.97A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.97C5.12 20 12 20 12 20s6.88 0 8.59-.45a2.78 2.78 0 0 0 1.95-1.97A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12z" />
                </svg>
              </a>
              <a
                href="/contact"
                aria-label="Facebook"
                className="scpg"
                style={{ width: "40px", height: "40px", borderRadius: "11px", border: "1px solid rgba(255, 255, 255, 0.18)", background: "rgba(255, 255, 255, 0.06)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "rgb(255, 255, 255)" }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12z" />
                </svg>
              </a>
            </div>
          </div>
          <div>
            <div
              style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "0.04em", textTransform: "uppercase", color: "rgb(255, 255, 255)", marginBottom: "14px" }}
            >
              {"Product"}
            </div>
            <ul
              style={{ listStyle: "none", margin: "0px", padding: "0px", display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <li>
                <a href="/functionaliteiten" style={{ fontSize: "14px", color: "rgb(255, 255, 255)", fontWeight: "600" }}>
                  {"Alle functionaliteiten"}
                </a>
              </li>
              <li>
                <a href="/oplossingen/lead" style={{ fontSize: "14px", color: "var(--text-on-dark-muted)" }}>
                  {"Leadbeheer & CRM"}
                </a>
              </li>
              <li>
                <a href="/oplossingen/schouw" style={{ fontSize: "14px", color: "var(--text-on-dark-muted)" }}>
                  {"Digitale schouw"}
                </a>
              </li>
              <li>
                <a href="/oplossingen/offerte" style={{ fontSize: "14px", color: "var(--text-on-dark-muted)" }}>
                  {"Offertes & subsidie"}
                </a>
              </li>
              <li>
                <a href="/oplossingen/planning" style={{ fontSize: "14px", color: "var(--text-on-dark-muted)" }}>
                  {"Planning & werkbonnen"}
                </a>
              </li>
              <li>
                <a href="/oplossingen/monteursapp" style={{ fontSize: "14px", color: "var(--text-on-dark-muted)" }}>
                  {"Monteursapp"}
                </a>
              </li>
              <li>
                <a href="/oplossingen/oplevering" style={{ fontSize: "14px", color: "var(--text-on-dark-muted)" }}>
                  {"Opleverdossier"}
                </a>
              </li>
              <li>
                <a href="/oplossingen/klantportaal" style={{ fontSize: "14px", color: "var(--text-on-dark-muted)" }}>
                  {"Klantportaal"}
                </a>
              </li>
              <li>
                <a href="/oplossingen/rapportage" style={{ fontSize: "14px", color: "var(--text-on-dark-muted)" }}>
                  {"Rapportages & marge"}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <div
              style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "0.04em", textTransform: "uppercase", color: "rgb(255, 255, 255)", marginBottom: "14px" }}
            >
              {"Branches"}
            </div>
            <ul
              style={{ listStyle: "none", margin: "0px", padding: "0px", display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <li>
                <a href="/branches" style={{ fontSize: "14px", color: "rgb(255, 255, 255)", fontWeight: "600" }}>
                  {"Alle branches vergelijken"}
                </a>
              </li>
              <li>
                <a href="/branches/zonnepanelen" style={{ fontSize: "14px", color: "var(--text-on-dark-muted)" }}>
                  {"Zonnepanelen"}
                </a>
              </li>
              <li>
                <a href="/branches/warmtepompen" style={{ fontSize: "14px", color: "var(--text-on-dark-muted)" }}>
                  {"Warmtepompen"}
                </a>
              </li>
              <li>
                <a href="/branches/thuisbatterijen" style={{ fontSize: "14px", color: "var(--text-on-dark-muted)" }}>
                  {"Thuisbatterijen"}
                </a>
              </li>
              <li>
                <a href="/branches/laadpalen" style={{ fontSize: "14px", color: "var(--text-on-dark-muted)" }}>
                  {"Laadpalen"}
                </a>
              </li>
              <li>
                <a href="/branches/isolatie" style={{ fontSize: "14px", color: "var(--text-on-dark-muted)" }}>
                  {"Isolatie"}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <div
              style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "0.04em", textTransform: "uppercase", color: "rgb(255, 255, 255)", marginBottom: "14px" }}
            >
              {"Bedrijf"}
            </div>
            <ul
              style={{ listStyle: "none", margin: "0px", padding: "0px", display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <li>
                <a href="/over" style={{ fontSize: "14px", color: "var(--text-on-dark-muted)" }}>
                  {"Over ons"}
                </a>
              </li>
              <li>
                <a href="/succesverhalen" style={{ fontSize: "14px", color: "var(--text-on-dark-muted)" }}>
                  {"Succesverhalen"}
                </a>
              </li>
              <li>
                <a href="/kennismaking" style={{ fontSize: "14px", color: "var(--text-on-dark-muted)" }}>
                  {"Kennismaking"}
                </a>
              </li>
              <li>
                <a href="/prijzen" style={{ fontSize: "14px", color: "var(--text-on-dark-muted)" }}>
                  {"Prijzen"}
                </a>
              </li>
              <li>
                <a href="/kennisbank" style={{ fontSize: "14px", color: "var(--text-on-dark-muted)" }}>
                  {"Kennisbank"}
                </a>
              </li>
              <li>
                <a href="/affiliate" style={{ fontSize: "14px", color: "var(--text-on-dark-muted)" }}>
                  {"Affiliate worden"}
                </a>
              </li>
              <li>
                <a href="/contact" style={{ fontSize: "14px", color: "var(--text-on-dark-muted)" }}>
                  {"Contact"}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <div
              style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "0.04em", textTransform: "uppercase", color: "rgb(255, 255, 255)", marginBottom: "14px" }}
            >
              {"Aan de slag"}
            </div>
            <ul
              style={{ listStyle: "none", margin: "0px", padding: "0px", display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <li>
                <a href="/demo" style={{ fontSize: "14px", color: "var(--text-on-dark-muted)" }}>
                  {"Plan een demo"}
                </a>
              </li>
              <li>
                <a href="/proefperiode" style={{ fontSize: "14px", color: "var(--text-on-dark-muted)" }}>
                  {"14 dagen gratis"}
                </a>
              </li>
              <li>
                <a href="/login" style={{ fontSize: "14px", color: "var(--text-on-dark-muted)" }}>
                  {"Inloggen"}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div
          style={{ marginTop: "40px", paddingTop: "22px", borderTop: "1px solid var(--border-on-dark)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", fontSize: "13px", color: "var(--text-on-dark-muted)" }}
        >
          <span>
            {"\u00a9 mijnhuis.nu \u00b7 KvK 12345678"}
          </span>
          <span style={{ display: "flex", gap: "18px" }}>
            <a href="/juridisch" style={{ color: "var(--text-on-dark-muted)" }}>
              {"Voorwaarden"}
            </a>
            <a href="/juridisch" style={{ color: "var(--text-on-dark-muted)" }}>
              {"Privacy"}
            </a>
            <a href="/juridisch" style={{ color: "var(--text-on-dark-muted)" }}>
              {"Cookies"}
            </a>
          </span>
        </div>
      </div>
    </footer>
);
