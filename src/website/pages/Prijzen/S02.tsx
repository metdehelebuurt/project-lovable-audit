
export const S02 = () => (
    <section className="mh-secpad" style={{ padding: "8px 0px 72px", background: "var(--surface-page)" }}>
      <div className="mh-container">
        <div
          className="mh-grid3"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", alignItems: "start" }}
        >
          <div
            style={{ position: "relative", display: "flex", flexDirection: "column", height: "100%", borderRadius: "20px", padding: "32px", background: "var(--surface-page)", border: "1px solid var(--border-subtle)", boxShadow: "rgba(33, 31, 84, 0.06) 0px 10px 26px" }}
          >
            <div
              style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "22px", color: "var(--text-heading)", marginBottom: "6px" }}
            >
              <span className="sc-interp">
                {"Starter"}
              </span>
            </div>
            <p style={{ margin: "0px 0px 22px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.5" }}>
              <span className="sc-interp">
                {"Voor het bedrijf dat van Excel af wil en zijn eerste stappen digitaal zet."}
              </span>
            </p>
            <span
              style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "46px", lineHeight: "1", letterSpacing: "-0.02em", color: "var(--indigo-700)", marginBottom: "8px" }}
            >
              <span className="sc-interp">
                {"\u20ac 75"}
              </span>
            </span>
            <div style={{ fontSize: "14.5px", color: "var(--text-body)", marginBottom: "3px" }}>
              <span className="sc-interp">
                {"per maand, jaarlijks gefactureerd"}
              </span>
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "22px" }}>
              <span className="sc-interp">
                {"\u20ac 899 per jaar, je bespaart 21%"}
              </span>
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "11px", padding: "20px 0px", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)", marginBottom: "18px" }}
            >
              <span
                style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "15px", color: "var(--text-heading)", fontWeight: "500", lineHeight: "1.45" }}
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
                  style={{ width: "16px", height: "16px", color: "var(--green-700)", flex: "0 0 auto", marginTop: "2px" }}
                  className="lucide lucide-check"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span className="sc-interp">
                  {"Tot 3 gebruikers"}
                </span>
              </span>
              <span
                style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "15px", color: "var(--text-heading)", fontWeight: "500", lineHeight: "1.45" }}
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
                  style={{ width: "16px", height: "16px", color: "var(--green-700)", flex: "0 0 auto", marginTop: "2px" }}
                  className="lucide lucide-check"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span className="sc-interp">
                  {"50 leads per maand"}
                </span>
              </span>
              <span
                style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "15px", color: "var(--text-heading)", fontWeight: "500", lineHeight: "1.45" }}
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
                  style={{ width: "16px", height: "16px", color: "var(--green-700)", flex: "0 0 auto", marginTop: "2px" }}
                  className="lucide lucide-check"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span className="sc-interp">
                  {"25 offertes per maand"}
                </span>
              </span>
            </div>
            <div
              style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.5", marginBottom: "24px" }}
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
                style={{ width: "17px", height: "17px", color: "var(--color-primary)", flex: "0 0 auto", marginTop: "1px" }}
                className="lucide lucide-package-check"
              >
                <path d="M12 22V12" />
                <path d="m16 17 2 2 4-4" />
                <path d="M21 11.127V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.729l7 4a2 2 0 0 0 2 .001l1.32-.753" />
                <path d="M3.29 7 12 12l8.71-5" />
                <path d="m7.5 4.27 8.997 5.148" />
              </svg>
              {"Alle modules inbegrepen, ook in dit plan"}
            </div>
            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
              <a
                href="/proefperiode"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", height: "48px", borderRadius: "10px", fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "15px", textDecoration: "none", background: "var(--indigo-600)", color: "rgb(255, 255, 255)", border: "none" }}
              >
                {"Probeer 14 dagen gratis"}
              </a>
              <a href="/demo" style={{ textAlign: "center", fontSize: "14px", fontWeight: "600", color: "var(--indigo-700)" }}>
                {"Of plan eerst een demo"}
              </a>
              <span style={{ textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>
                {"Past bij "}
                <span className="sc-interp">
                  {"1 tot 3 man, \u00e9\u00e9n vakgebied"}
                </span>
              </span>
            </div>
          </div>
          <div
            style={{ position: "relative", display: "flex", flexDirection: "column", height: "100%", borderRadius: "20px", padding: "36px 32px", background: "var(--surface-page)", border: "2px solid var(--indigo-600)", boxShadow: "rgba(33, 31, 84, 0.16) 0px 28px 64px" }}
          >
            <span
              style={{ position: "absolute", top: "-13px", left: "50%", transform: "translateX(-50%)", padding: "6px 16px", borderRadius: "999px", background: "var(--indigo-600)", color: "rgb(255, 255, 255)", fontSize: "12px", fontWeight: "600", letterSpacing: "0.04em", whiteSpace: "nowrap" }}
            >
              {"Meest gekozen"}
            </span>
            <div
              style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "22px", color: "var(--text-heading)", marginBottom: "6px" }}
            >
              <span className="sc-interp">
                {"Professional"}
              </span>
            </div>
            <p style={{ margin: "0px 0px 22px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.5" }}>
              <span className="sc-interp">
                {"Voor het bedrijf met een vast kantoor en meerdere ploegen buiten."}
              </span>
            </p>
            <span
              style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "46px", lineHeight: "1", letterSpacing: "-0.02em", color: "var(--indigo-700)", marginBottom: "8px" }}
            >
              <span className="sc-interp">
                {"\u20ac 142"}
              </span>
            </span>
            <div style={{ fontSize: "14.5px", color: "var(--text-body)", marginBottom: "3px" }}>
              <span className="sc-interp">
                {"per maand, jaarlijks gefactureerd"}
              </span>
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "22px" }}>
              <span className="sc-interp">
                {"\u20ac 1.699 per jaar, je bespaart 21%"}
              </span>
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "11px", padding: "20px 0px", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)", marginBottom: "18px" }}
            >
              <span
                style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "15px", color: "var(--text-heading)", fontWeight: "500", lineHeight: "1.45" }}
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
                  style={{ width: "16px", height: "16px", color: "var(--green-700)", flex: "0 0 auto", marginTop: "2px" }}
                  className="lucide lucide-check"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span className="sc-interp">
                  {"Tot 10 gebruikers"}
                </span>
              </span>
              <span
                style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "15px", color: "var(--text-heading)", fontWeight: "500", lineHeight: "1.45" }}
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
                  style={{ width: "16px", height: "16px", color: "var(--green-700)", flex: "0 0 auto", marginTop: "2px" }}
                  className="lucide lucide-check"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span className="sc-interp">
                  {"250 leads per maand"}
                </span>
              </span>
              <span
                style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "15px", color: "var(--text-heading)", fontWeight: "500", lineHeight: "1.45" }}
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
                  style={{ width: "16px", height: "16px", color: "var(--green-700)", flex: "0 0 auto", marginTop: "2px" }}
                  className="lucide lucide-check"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span className="sc-interp">
                  {"100 offertes per maand"}
                </span>
              </span>
            </div>
            <div
              style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.5", marginBottom: "24px" }}
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
                style={{ width: "17px", height: "17px", color: "var(--color-primary)", flex: "0 0 auto", marginTop: "1px" }}
                className="lucide lucide-package-check"
              >
                <path d="M12 22V12" />
                <path d="m16 17 2 2 4-4" />
                <path d="M21 11.127V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.729l7 4a2 2 0 0 0 2 .001l1.32-.753" />
                <path d="M3.29 7 12 12l8.71-5" />
                <path d="m7.5 4.27 8.997 5.148" />
              </svg>
              {"Alle modules inbegrepen, ook in dit plan"}
            </div>
            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
              <a
                href="/proefperiode"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", height: "48px", borderRadius: "10px", fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "15px", textDecoration: "none", background: "var(--green-600)", color: "rgb(255, 255, 255)", border: "none" }}
              >
                {"Probeer 14 dagen gratis"}
              </a>
              <a href="/demo" style={{ textAlign: "center", fontSize: "14px", fontWeight: "600", color: "var(--indigo-700)" }}>
                {"Of plan eerst een demo"}
              </a>
              <span style={{ textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>
                {"Past bij "}
                <span className="sc-interp">
                  {"4 tot 10 man, meerdere vakgebieden"}
                </span>
              </span>
            </div>
          </div>
          <div
            style={{ position: "relative", display: "flex", flexDirection: "column", height: "100%", borderRadius: "20px", padding: "32px", background: "var(--surface-page)", border: "1px solid var(--border-subtle)", boxShadow: "rgba(33, 31, 84, 0.06) 0px 10px 26px" }}
          >
            <div
              style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "22px", color: "var(--text-heading)", marginBottom: "6px" }}
            >
              <span className="sc-interp">
                {"Enterprise"}
              </span>
            </div>
            <p style={{ margin: "0px 0px 22px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.5" }}>
              <span className="sc-interp">
                {"Voor bedrijven met meerdere vestigingen, een eigen merk en eigen koppelingen."}
              </span>
            </p>
            <span
              style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "46px", lineHeight: "1", letterSpacing: "-0.02em", color: "var(--indigo-700)", marginBottom: "8px" }}
            >
              <span className="sc-interp">
                {"\u20ac 200"}
              </span>
            </span>
            <div style={{ fontSize: "14.5px", color: "var(--text-body)", marginBottom: "3px" }}>
              <span className="sc-interp">
                {"per maand, jaarlijks gefactureerd"}
              </span>
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "22px" }}>
              <span className="sc-interp">
                {"\u20ac 2.399 per jaar, je bespaart 20%"}
              </span>
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "11px", padding: "20px 0px", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)", marginBottom: "18px" }}
            >
              <span
                style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "15px", color: "var(--text-heading)", fontWeight: "500", lineHeight: "1.45" }}
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
                  style={{ width: "16px", height: "16px", color: "var(--green-700)", flex: "0 0 auto", marginTop: "2px" }}
                  className="lucide lucide-check"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span className="sc-interp">
                  {"Onbeperkt gebruikers"}
                </span>
              </span>
              <span
                style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "15px", color: "var(--text-heading)", fontWeight: "500", lineHeight: "1.45" }}
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
                  style={{ width: "16px", height: "16px", color: "var(--green-700)", flex: "0 0 auto", marginTop: "2px" }}
                  className="lucide lucide-check"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span className="sc-interp">
                  {"Onbeperkt leads en offertes"}
                </span>
              </span>
              <span
                style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "15px", color: "var(--text-heading)", fontWeight: "500", lineHeight: "1.45" }}
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
                  style={{ width: "16px", height: "16px", color: "var(--green-700)", flex: "0 0 auto", marginTop: "2px" }}
                  className="lucide lucide-check"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span className="sc-interp">
                  {"White-label, eigen domein en API"}
                </span>
              </span>
            </div>
            <div
              style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.5", marginBottom: "24px" }}
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
                style={{ width: "17px", height: "17px", color: "var(--color-primary)", flex: "0 0 auto", marginTop: "1px" }}
                className="lucide lucide-package-check"
              >
                <path d="M12 22V12" />
                <path d="m16 17 2 2 4-4" />
                <path d="M21 11.127V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.729l7 4a2 2 0 0 0 2 .001l1.32-.753" />
                <path d="M3.29 7 12 12l8.71-5" />
                <path d="m7.5 4.27 8.997 5.148" />
              </svg>
              {"Alle modules inbegrepen, ook in dit plan"}
            </div>
            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
              <a
                href="/proefperiode"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", height: "48px", borderRadius: "10px", fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "15px", textDecoration: "none", background: "var(--indigo-600)", color: "rgb(255, 255, 255)", border: "none" }}
              >
                {"Probeer 14 dagen gratis"}
              </a>
              <a href="/demo" style={{ textAlign: "center", fontSize: "14px", fontWeight: "600", color: "var(--indigo-700)" }}>
                {"Of plan eerst een demo"}
              </a>
              <span style={{ textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>
                {"Past bij "}
                <span className="sc-interp">
                  {"10+ man of meerdere vestigingen"}
                </span>
              </span>
            </div>
          </div>
        </div>
        <div
          style={{ display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center", marginTop: "32px", fontSize: "14.5px", color: "var(--text-body)" }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}>
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
              style={{ width: "16px", height: "16px", color: "var(--success)" }}
              className="lucide lucide-check"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {"Geen implementatiekosten"}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}>
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
              style={{ width: "16px", height: "16px", color: "var(--success)" }}
              className="lucide lucide-check"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {"Datamigratie inbegrepen"}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}>
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
              style={{ width: "16px", height: "16px", color: "var(--success)" }}
              className="lucide lucide-check"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {"Maandelijks opzegbaar"}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}>
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
              style={{ width: "16px", height: "16px", color: "var(--success)" }}
              className="lucide lucide-check"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {"Data veilig in de EU"}
          </span>
        </div>
        <p style={{ textAlign: "center", fontSize: "13.5px", color: "var(--text-muted)", marginTop: "18px" }}>
          {"Alle bedragen zijn per bedrijf per maand, exclusief btw."}
        </p>
      </div>
    </section>
);
