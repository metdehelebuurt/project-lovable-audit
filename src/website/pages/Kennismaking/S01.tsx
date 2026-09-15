
export const S01 = () => (
    <section
      className="mh-secpad"
      style={{ position: "relative", overflow: "hidden", padding: "80px 0px 72px", background: "radial-gradient(120% 90% at 12% -10%, var(--ice-lilac) 0%, var(--white) 58%)" }}
    >
      <div aria-hidden="true" style={{ position: "absolute", top: "-400px", right: "-300px", width: "1050px", height: "1050px", pointerEvents: "none", background: "repeating-radial-gradient(circle, transparent 0px, transparent 96px, rgba(91, 92, 232, 0.13) 96px, rgba(91, 92, 232, 0.13) 97px)", maskImage: "radial-gradient(circle, rgb(0, 0, 0) 0%, transparent 68%)" }}></div>
      <div className="mh-container" style={{ position: "relative" }}>
        <div
          className="mh-split"
          style={{ display: "grid", gridTemplateColumns: "0.95fr 1.05fr", gap: "48px", alignItems: "start" }}
        >
          <div>
            <div
              style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--indigo-600)", marginBottom: "14px" }}
            >
              {"Kennismaking"}
            </div>
            <h1 style={{ fontSize: "46px", lineHeight: "1.08", margin: "0px 0px 16px" }}>
              {"Even kennismaken, "}
              <span style={{ color: "var(--color-primary)" }}>
                {"zonder verkooppraat"}
              </span>
            </h1>
            <p
              style={{ fontSize: "18px", lineHeight: "1.6", color: "var(--text-body)", maxWidth: "50ch", margin: "0px 0px 26px" }}
            >
              {"Twintig minuten bellen of videobellen over jouw bedrijf: hoe je nu werkt, waar het schuurt en of wij daar iets aan kunnen doen. Geen schermdelen, geen presentatie."}
            </p>
            <ul
              style={{ listStyle: "none", margin: "0px 0px 28px", padding: "0px", display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <li
                style={{ display: "flex", gap: "12px", alignItems: "flex-start", fontSize: "16px", color: "var(--text-body)", lineHeight: "1.55" }}
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
                {"20 minuten, op een moment dat jou uitkomt"}
              </li>
              <li
                style={{ display: "flex", gap: "12px", alignItems: "flex-start", fontSize: "16px", color: "var(--text-body)", lineHeight: "1.55" }}
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
                  className="lucide lucide-phone"
                >
                  <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />
                </svg>
                {"Telefonisch of videobellen, wat jij prettig vindt"}
              </li>
              <li
                style={{ display: "flex", gap: "12px", alignItems: "flex-start", fontSize: "16px", color: "var(--text-body)", lineHeight: "1.55" }}
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
                {"Jij praat, wij luisteren: eerst je situatie, dan pas oplossingen"}
              </li>
              <li
                style={{ display: "flex", gap: "12px", alignItems: "flex-start", fontSize: "16px", color: "var(--text-body)", lineHeight: "1.55" }}
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
                {"Eerlijk advies, ook als we niet bij je passen"}
              </li>
            </ul>
            <div
              style={{ borderRadius: "16px", border: "1px solid var(--border-subtle)", background: "var(--surface-page)", boxShadow: "var(--shadow-sm)", padding: "20px 22px", display: "flex", gap: "16px", alignItems: "center" }}
            >
              <img src="/__l5e/assets-v1/97bcd2fc-a375-495f-bef1-2c0396f70ee2/img12.jpg" alt="Bas, salesmanager bij mijnhuis.nu" style={{ width: "58px", height: "58px", borderRadius: "99px", objectFit: "cover", display: "block", flex: "0 0 auto" }} />
              <div style={{ minWidth: "0px" }}>
                <div
                  style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "16px", color: "var(--text-heading)", lineHeight: "1.25", marginBottom: "3px" }}
                >
                  {"Je spreekt Bas"}
                </div>
                <p style={{ margin: "0px 0px 8px", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.5" }}>
                  {"Salesmanager. Hij kent de branche en zegt gewoon wat wel en niet kan."}
                </p>
                <a
                  href="https://wa.me/31644666645"
                  target="_blank"
                  rel="noopener"
                  style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "13.5px", fontWeight: "600", color: "var(--green-700)" }}
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
                    className="lucide lucide-message-circle"
                  >
                    <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
                  </svg>
                  {"Of app hem direct op 06-44666645"}
                </a>
              </div>
            </div>
          </div>
          <div
            style={{ background: "var(--surface-page)", borderRadius: "18px", boxShadow: "var(--shadow-lg)", border: "1px solid var(--border-subtle)", padding: "28px" }}
          >
            <h2 style={{ margin: "0px 0px 8px", fontSize: "26px" }}>
              {"Plan je kennismaking"}
            </h2>
            <p style={{ margin: "0px 0px 22px", fontSize: "15px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
              {"Vul kort in wie je bent. We bellen binnen \u00e9\u00e9n werkdag om een moment af te spreken."}
            </p>
            <KennismakingForm />
          </div>
        </div>
      </div>
    </section>
);
