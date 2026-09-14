
export const S01 = () => (
    <section
      className="mh-secpad"
      style={{ padding: "80px 0px 88px", background: "radial-gradient(120% 90% at 15% -10%, var(--ice-lilac) 0%, var(--white) 55%)" }}
    >
      <div className="mh-container">
        <div
          className="mh-split"
          style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: "48px", alignItems: "start" }}
        >
          <div>
            <div
              style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-primary)", marginBottom: "14px" }}
            >
              {"Plan een afspraak"}
            </div>
            <h1 style={{ fontSize: "46px", lineHeight: "1.08", margin: "0px 0px 16px" }}>
              {"Zie mijnhuis.nu live: "}
              <span style={{ color: "var(--color-primary)" }}>
                {"in 30 minuten"}
              </span>
            </h1>
            <p
              style={{ fontSize: "18px", lineHeight: "1.6", color: "var(--text-body)", maxWidth: "48ch", margin: "0px 0px 28px" }}
            >
              {"We laten zien hoe de hele keten werkt voor jouw bedrijf, met jouw soort projecten. Geen verplichtingen, geen gladde verkooppraat."}
            </p>
            <ul
              style={{ listStyle: "none", margin: "0px 0px 28px", padding: "0px", display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <li
                style={{ display: "flex", gap: "12px", alignItems: "flex-start", fontSize: "16px", color: "var(--text-body)" }}
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
                  style={{ width: "20px", height: "20px", color: "var(--color-primary)", flex: "0 0 auto", marginTop: "2px" }}
                  className="lucide lucide-clock"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                {"30 minuten, online of bij jou op de zaak"}
              </li>
              <li
                style={{ display: "flex", gap: "12px", alignItems: "flex-start", fontSize: "16px", color: "var(--text-body)" }}
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
                  style={{ width: "20px", height: "20px", color: "var(--color-primary)", flex: "0 0 auto", marginTop: "2px" }}
                  className="lucide lucide-layers"
                >
                  <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" />
                  <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" />
                  <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" />
                </svg>
                {"Afgestemd op jouw branche"}
              </li>
              <li
                style={{ display: "flex", gap: "12px", alignItems: "flex-start", fontSize: "16px", color: "var(--text-body)" }}
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
                  style={{ width: "20px", height: "20px", color: "var(--color-primary)", flex: "0 0 auto", marginTop: "2px" }}
                  className="lucide lucide-messages-square"
                >
                  <path d="M16 10a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 14.286V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  <path d="M20 9a2 2 0 0 1 2 2v10.286a.71.71 0 0 1-1.212.502l-2.202-2.202A2 2 0 0 0 17.172 19H10a2 2 0 0 1-2-2v-1" />
                </svg>
                {"Al je vragen beantwoord door iemand die het vak kent"}
              </li>
              <li
                style={{ display: "flex", gap: "12px", alignItems: "flex-start", fontSize: "16px", color: "var(--text-body)" }}
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
                  style={{ width: "20px", height: "20px", color: "var(--color-primary)", flex: "0 0 auto", marginTop: "2px" }}
                  className="lucide lucide-shield-check"
                >
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                {"Geheel vrijblijvend"}
              </li>
            </ul>
            <div
              style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "22px", display: "flex", flexWrap: "wrap", gap: "22px", alignItems: "center" }}
            >
              <div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "2px" }}>
                  {"Liever bellen?"}
                </div>
                <a
                  href="/demo"
                  style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "18px", color: "var(--text-heading)" }}
                >
                  {"085-8000272"}
                </a>
              </div>
              <div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "2px" }}>
                  {"Of mail"}
                </div>
                <a
                  href="/demo"
                  style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "18px", color: "var(--text-heading)" }}
                >
                  {"info@mijnhuis.nu"}
                </a>
              </div>
              <div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "2px" }}>
                  {"Liever appen?"}
                </div>
                <a
                  href="https://wa.me/31644666645"
                  target="_blank"
                  rel="noopener"
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "18px", color: "var(--green-700)" }}
                >
                  <span style={{ color: "var(--green-600)", display: "inline-flex" }}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.85 1.21 3.05c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01a9.4 9.4 0 0 1-4.79-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.36 9.36 0 0 1-1.44-5A9.45 9.45 0 0 1 12.05 2.6a9.4 9.4 0 0 1 6.68 2.77 9.36 9.36 0 0 1 2.77 6.66 9.45 9.45 0 0 1-9.46 9.47zM20.06 3.98A11.36 11.36 0 0 0 12.04.66C5.77.66.66 5.76.66 12.03c0 2 .53 3.96 1.53 5.69L.57 23.34l5.76-1.51a11.36 11.36 0 0 0 5.71 1.46h.01c6.27 0 11.38-5.1 11.38-11.37 0-3.04-1.19-5.9-3.34-8.05z" />
                    </svg>
                  </span>
                  {"WhatsApp Bas"}
                </a>
              </div>
            </div>
          </div>
          <DemoForm />
        </div>
      </div>
    </section>
);
