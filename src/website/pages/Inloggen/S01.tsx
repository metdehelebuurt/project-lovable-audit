
export const S01 = () => (
    <section
      className="mh-secpad"
      style={{ minHeight: "calc(-69px + 100vh)", display: "flex", alignItems: "center", padding: "64px 0px", background: "linear-gradient(180deg, var(--ice-lilac) 0%, var(--white) 70%)" }}
    >
      <div className="mh-container">
        <div
          className="mh-split"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "56px", alignItems: "center" }}
        >
          <div>
            <div
              style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-primary)", marginBottom: "14px" }}
            >
              {"Inloggen"}
            </div>
            <h1 style={{ fontSize: "42px", lineHeight: "1.1", margin: "0px 0px 16px" }}>
              {"Welkom terug"}
            </h1>
            <p
              style={{ fontSize: "17px", lineHeight: "1.6", color: "var(--text-body)", maxWidth: "44ch", margin: "0px 0px 28px" }}
            >
              {"Log in op je mijnhuis.nu-omgeving. Je leads, planning, offertes en opleverdossiers staan voor je klaar."}
            </p>
            <ul
              style={{ listStyle: "none", margin: "0px", padding: "0px", display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <li style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "15px", color: "var(--text-body)" }}>
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
                  style={{ width: "17px", height: "17px", color: "var(--success)" }}
                  className="lucide lucide-check"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {"E\u00e9n omgeving voor kantoor, monteur en klant"}
              </li>
              <li style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "15px", color: "var(--text-body)" }}>
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
                  style={{ width: "17px", height: "17px", color: "var(--success)" }}
                  className="lucide lucide-check"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {"Werkt op desktop, tablet en telefoon"}
              </li>
              <li style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "15px", color: "var(--text-body)" }}>
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
                  style={{ width: "17px", height: "17px", color: "var(--success)" }}
                  className="lucide lucide-check"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {"Data veilig in de EU"}
              </li>
            </ul>
          </div>
          <div
            style={{ background: "rgb(255, 255, 255)", borderRadius: "18px", boxShadow: "var(--shadow-lg)", border: "1px solid var(--border-subtle)", padding: "32px", maxWidth: "440px", width: "100%", justifySelf: "end" }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <img src="/__l5e/assets-v1/ba7e4693-1309-4590-9020-c0cfb5ed54b3/img15.png" width="30" height="30" alt="mijnhuis.nu" />
              <span
                style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "19px", color: "var(--night-indigo)" }}
              >
                {"mijnhuis"}
                <span style={{ color: "var(--color-primary)" }}>
                  {".nu"}
                </span>
              </span>
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="sc-host-x" style={{ display: "contents" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                  <label
                    htmlFor=":rk:"
                    style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: "var(--fw-medium)", color: "var(--text-heading)" }}
                  >
                    {"E-mailadres"}
                  </label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <input id=":rk:" type="email" aria-invalid="false" placeholder="jij@bedrijf.nl" style={{ width: "100%", boxSizing: "border-box", height: "var(--control-h)", padding: "0px 14px", fontFamily: "var(--font-body)", fontSize: "16px", color: "var(--text-body)", background: "var(--white)", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-md)", outline: "none", boxShadow: "none", transition: "border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)" }} />
                  </div>
                </div>
              </div>
              <div className="sc-host-x" style={{ display: "contents" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                  <label
                    htmlFor=":rl:"
                    style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: "var(--fw-medium)", color: "var(--text-heading)" }}
                  >
                    {"Wachtwoord"}
                  </label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <input id=":rl:" type="password" aria-invalid="false" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" style={{ width: "100%", boxSizing: "border-box", height: "var(--control-h)", padding: "0px 14px", fontFamily: "var(--font-body)", fontSize: "16px", color: "var(--text-body)", background: "var(--white)", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-md)", outline: "none", boxShadow: "none", transition: "border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)" }} />
                  </div>
                </div>
              </div>
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}
              >
                <div className="sc-host-x" style={{ display: "contents" }}>
                  <label
                    htmlFor=":rm:"
                    style={{ display: "inline-flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", opacity: "1" }}
                  >
                    <span style={{ position: "relative", flex: "0 0 auto", width: "20px", height: "20px", marginTop: "1px" }}>
                      <input id=":rm:" type="checkbox" style={{ position: "absolute", opacity: "0", width: "20px", height: "20px", margin: "0px", cursor: "inherit" }} />
                      <span aria-hidden="true" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "20px", height: "20px", borderRadius: "6px", background: "var(--white)", border: "1px solid var(--border-strong)", color: "var(--white)", transition: "background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)" }}></span>
                    </span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "15px", color: "var(--text-body)", lineHeight: "1.4" }}>
                      {"Onthoud mij"}
                    </span>
                  </label>
                </div>
                <a href="/contact" style={{ fontSize: "14px", fontWeight: "600" }}>
                  {"Wachtwoord vergeten?"}
                </a>
              </div>
              <div className="sc-host-x" style={{ display: "contents" }}>
                <a
                  href="/"
                  className="mh-btn"
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "var(--font-body)", fontWeight: "var(--fw-semibold)", lineHeight: "1", border: "1px solid transparent", borderRadius: "var(--radius-md)", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)", height: "var(--control-h-hero)", padding: "0px 28px", fontSize: "17px", background: "var(--color-primary)", color: "var(--white)", width: "100%" }}
                >
                  {"Inloggen"}
                </a>
              </div>
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "12px", margin: "22px 0px", color: "var(--text-muted)", fontSize: "13px" }}
            >
              <span style={{ flex: "1 1 0%", height: "1px", background: "var(--border-subtle)" }}></span>
              {"of"}
              <span style={{ flex: "1 1 0%", height: "1px", background: "var(--border-subtle)" }}></span>
            </div>
            <p style={{ margin: "0px", textAlign: "center", fontSize: "15px", color: "var(--text-body)" }}>
              {"Nog geen account? "}
              <a href="/proefperiode" style={{ fontWeight: "600" }}>
                {"Start 14 dagen gratis"}
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
);
