import { S04P1P1 } from "./S04P1P1";

export const S04P1 = () => (
    <div className="mh-container">
      <div className="mh-reveal mh-hidden" style={{ maxWidth: "700px", marginBottom: "36px" }}>
        <div
          style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-primary)", marginBottom: "14px" }}
        >
          {"Het verschil"}
        </div>
        <h2 style={{ margin: "0px 0px 12px" }}>
          {"Algemeen pakket versus mijnhuis.nu"}
        </h2>
        <p style={{ fontSize: "17px", color: "var(--text-body)", margin: "0px", lineHeight: "1.6" }}>
          {"Wij bouwen alleen voor de verduurzaming. Daarom zit het vak er al in, en houden wij de normen bij, niet jij."}
        </p>
      </div>
      <S04P1P1 />
      <div
        className="mh-cta mh-reveal mh-hidden"
        style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginTop: "36px" }}
      >
        <div className="sc-host-x" style={{ display: "contents" }}>
          <a
            href="/demo"
            className="mh-btn"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "var(--font-body)", fontWeight: "var(--fw-semibold)", lineHeight: "1", border: "1px solid transparent", borderRadius: "var(--radius-md)", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)", height: "var(--control-h-hero)", padding: "0px 28px", fontSize: "17px", background: "var(--color-primary)", color: "var(--white)" }}
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
              style={{ width: "18px", height: "18px" }}
              className="lucide lucide-calendar-check"
            >
              <path d="M8 2v3" />
              <path d="M16 2v3" />
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
              <path d="m9 15 2 2 4-4" />
            </svg>
            {"Laat het zien voor mijn branche"}
          </a>
        </div>
        <div className="sc-host-x" style={{ display: "contents" }}>
          <a
            href="/proefperiode"
            className="mh-btn"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "var(--font-body)", fontWeight: "var(--fw-semibold)", lineHeight: "1", border: "1px solid transparent", borderRadius: "var(--radius-md)", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)", height: "var(--control-h-hero)", padding: "0px 28px", fontSize: "17px", background: "var(--color-accent)", color: "var(--white)" }}
          >
            <span className="sc-interp">
              {"Start gratis"}
            </span>
          </a>
        </div>
      </div>
    </div>
);
