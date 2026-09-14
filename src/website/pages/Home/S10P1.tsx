import { S10P1P1 } from "./S10P1P1";

export const S10P1 = () => (
    <div className="mh-container">
      <div className="mh-reveal" style={{ maxWidth: "700px", marginBottom: "52px" }}>
        <div
          style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-primary)", marginBottom: "14px" }}
        >
          {"Voor jouw vakgebied"}
        </div>
        <h2 style={{ margin: "0px 0px 12px" }}>
          {"Elk vakgebied heeft z\u2019n eigen schouw, rekenwerk en norm"}
        </h2>
        <p style={{ margin: "0px", fontSize: "18px", color: "var(--neutral-600)", lineHeight: "1.6" }}>
          {"Daarom is mijnhuis.nu geen algemeen pakket waar je zelf sjablonen in bouwt. Kies je vakgebied en zie precies wat er voor jou klaarstaat."}
        </p>
      </div>
      <S10P1P1 />
      <div
        className="mh-reveal"
        style={{ marginTop: "40px", display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between", padding: "26px 30px", borderRadius: "18px", background: "var(--surface-tint)", border: "1px solid var(--indigo-200)" }}
      >
        <p
          style={{ margin: "0px", fontSize: "16.5px", color: "var(--text-body)", lineHeight: "1.55", maxWidth: "62ch" }}
        >
          {"Werk je in meerdere vakgebieden? Dan draaien ze naast elkaar in hetzelfde platform, elk met hun eigen schouw, calculatie en opleverdocument."}
        </p>
        <span className="mh-cta" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <div className="sc-host-x" style={{ display: "contents" }}>
            <a
              href="/branches"
              className="mh-btn"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "var(--font-body)", fontWeight: "var(--fw-semibold)", lineHeight: "1", border: "1px solid transparent", borderRadius: "var(--radius-md)", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)", height: "var(--control-h)", padding: "0px 22px", fontSize: "16px", background: "var(--color-primary)", color: "var(--white)" }}
            >
              {"Vergelijk alle vakgebieden"}
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
                style={{ width: "16px", height: "16px" }}
                className="lucide lucide-arrow-right"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </a>
          </div>
        </span>
      </div>
    </div>
);
