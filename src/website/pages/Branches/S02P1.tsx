import { S02P1P1 } from "./S02P1P1";
import { S02P1P2 } from "./S02P1P2";
import { S02P1P3 } from "./S02P1P3";
import { S02P1P4 } from "./S02P1P4";
import { S02P1P5 } from "./S02P1P5";

export const S02P1 = () => (
    <div className="mh-bgrid mh-bhero" style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "0px" }}>
      <S02P1P1 />
      <S02P1P2 />
      <S02P1P3 />
      <S02P1P4 />
      <S02P1P5 />
      <div
        style={{ gridColumn: "span 12", background: "var(--night-indigo)", color: "rgb(255, 255, 255)", padding: "44px 6vw", display: "flex", gap: "28px", alignItems: "center", flexWrap: "wrap" }}
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
          style={{ width: "32px", height: "32px", color: "var(--indigo-400)", strokeWidth: "1.5", flex: "0 0 auto" }}
          className="lucide lucide-message-circle-question"
        >
          <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
        <div style={{ flex: "1 1 0%", minWidth: "280px" }}>
          <h2 style={{ fontSize: "21px", margin: "0px 0px 6px", color: "rgb(255, 255, 255)" }}>
            {"Werk je in een andere verduurzamingsniche?"}
          </h2>
          <p
            style={{ margin: "0px", fontSize: "15.5px", color: "var(--text-on-dark-muted)", lineHeight: "1.55", maxWidth: "62ch" }}
          >
            {"Denk aan ventilatie, warmtenetten of een combinatie van maatregelen. We kijken samen met je naar de schouw, de calculatie en het opleverdocument dat jouw werk nodig heeft."}
          </p>
        </div>
        <div className="sc-host-x" style={{ display: "contents" }}>
          <a
            href="/contact"
            className="mh-btn"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "var(--font-body)", fontWeight: "var(--fw-semibold)", lineHeight: "1", border: "1px solid transparent", borderRadius: "var(--radius-md)", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)", height: "var(--control-h)", padding: "0px 22px", fontSize: "16px", background: "var(--white)", color: "var(--night-indigo)" }}
          >
            {"Overleg met ons"}
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
      </div>
    </div>
);
