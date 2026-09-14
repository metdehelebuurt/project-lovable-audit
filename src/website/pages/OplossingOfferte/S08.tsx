
export const S08 = () => (
    <section className="mh-secpad" style={{ padding: "88px 0px", background: "var(--surface-page)" }}>
      <div className="mh-container">
        <div
          className="mh-split mh-reveal"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "52px", alignItems: "center" }}
        >
          <div>
            <div
              style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--indigo-600)", marginBottom: "14px" }}
            >
              {"Uit de praktijk"}
            </div>
            <h2 style={{ margin: "0px 0px 18px" }}>
              {"Wat dit oplevert"}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div
                style={{ display: "flex", gap: "18px", alignItems: "baseline", paddingBottom: "18px", borderBottom: "1px solid var(--border-subtle)" }}
              >
                <span
                  style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "30px", lineHeight: "1.1", color: "var(--color-primary)", flex: "0 0 auto", minWidth: "130px" }}
                >
                  <span className="sc-interp">
                    {"5 min"}
                  </span>
                </span>
                <span style={{ fontSize: "15.5px", color: "var(--neutral-600)", lineHeight: "1.5" }}>
                  <span className="sc-interp">
                    {"van schouw naar verstuurde offerte"}
                  </span>
                </span>
              </div>
              <div
                style={{ display: "flex", gap: "18px", alignItems: "baseline", paddingBottom: "18px", borderBottom: "1px solid var(--border-subtle)" }}
              >
                <span
                  style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "30px", lineHeight: "1.1", color: "var(--color-primary)", flex: "0 0 auto", minWidth: "130px" }}
                >
                  <span className="sc-interp">
                    {"Iedereen"}
                  </span>
                </span>
                <span style={{ fontSize: "15.5px", color: "var(--neutral-600)", lineHeight: "1.5" }}>
                  <span className="sc-interp">
                    {"op kantoor kan er een maken"}
                  </span>
                </span>
              </div>
              <div
                style={{ display: "flex", gap: "18px", alignItems: "baseline", paddingBottom: "18px", borderBottom: "1px solid var(--border-subtle)" }}
              >
                <span
                  style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "30px", lineHeight: "1.1", color: "var(--color-primary)", flex: "0 0 auto", minWidth: "130px" }}
                >
                  <span className="sc-interp">
                    {"1 bron"}
                  </span>
                </span>
                <span style={{ fontSize: "15.5px", color: "var(--neutral-600)", lineHeight: "1.5" }}>
                  <span className="sc-interp">
                    {"voor prijzen, marges en subsidie"}
                  </span>
                </span>
              </div>
            </div>
            <p style={{ margin: "18px 0px 0px", fontSize: "13px", color: "var(--text-muted)" }}>
              {"Illustratief, gebaseerd op ervaringen van eerste gebruikers. Jouw resultaat hangt af van je huidige werkwijze."}
            </p>
          </div>
          <div
            style={{ borderRadius: "20px", background: "var(--night-indigo)", color: "rgb(255, 255, 255)", padding: "38px 36px" }}
          >
            <span
              aria-hidden="true"
              style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "64px", lineHeight: "0.6", color: "var(--indigo-400)", opacity: "0.5", marginBottom: "16px" }}
            >
              {"\u201c"}
            </span>
            <p
              style={{ fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "21px", lineHeight: "1.45", color: "rgb(255, 255, 255)", margin: "0px 0px 26px", textWrap: "pretty" }}
            >
              <span className="sc-interp">
                {"Vroeger was ik zelf de flessenhals: elke offerte ging via mij. Nu maakt mijn hele kantoor ze."}
              </span>
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "13px" }}>
              <span
                style={{ width: "42px", height: "42px", borderRadius: "99px", background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.2)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "14px", color: "rgb(255, 255, 255)", flex: "0 0 auto" }}
              >
                {"HN"}
              </span>
              <span>
                <span style={{ display: "block", fontWeight: "600", fontSize: "15px", color: "rgb(255, 255, 255)" }}>
                  <span className="sc-interp">
                    {"Hoang Nguyen"}
                  </span>
                </span>
                <span style={{ display: "block", fontSize: "13.5px", color: "var(--text-on-dark-muted)" }}>
                  <span className="sc-interp">
                    {"Eigenaar, Smart Accu BV"}
                  </span>
                </span>
              </span>
            </div>
            <a
              href="/succesverhalen"
              style={{ display: "inline-flex", alignItems: "center", gap: "7px", marginTop: "24px", fontSize: "14.5px", fontWeight: "600", color: "rgb(255, 255, 255)" }}
            >
              {"Lees het hele verhaal"}
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
                className="lucide lucide-arrow-right"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
);
