import { S04P1P1 } from "./S04P1P1";

export const S04P1 = () => (
    <div className="mh-container">
      <div
        className="mh-reveal"
        style={{ maxWidth: "680px", margin: "0px auto 48px", textAlign: "center", transitionDelay: "0ms" }}
      >
        <div
          style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-primary)", marginBottom: "14px" }}
        >
          {"De oplossing"}
        </div>
        <h2 style={{ margin: "0px 0px 14px" }}>
          {"E\u00e9n platform. E\u00e9n flow. Van lead tot service."}
        </h2>
        <p style={{ fontSize: "17.5px", color: "var(--text-body)", lineHeight: "1.6", margin: "0px" }}>
          {"Een lead komt binnen en staat direct in je sales-CRM. De schouw gaat op tablet, de offerte met subsidie rolt eruit, de klant tekent digitaal en de monteur krijgt de werkbon op zijn telefoon. Zonder \u00e9\u00e9n keer overtypen."}
        </p>
      </div>
      <S04P1P1 />
      <div
        className="mh-reveal"
        style={{ display: "flex", justifyContent: "center", gap: "16px", alignItems: "center", marginTop: "44px", flexWrap: "wrap" }}
      >
        <div className="sc-host-x" style={{ display: "contents" }}>
          <a
            href="/functionaliteiten"
            className="mh-btn"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "var(--font-body)", fontWeight: "var(--fw-semibold)", lineHeight: "1", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border-strong)", borderImage: "initial", borderRadius: "var(--radius-md)", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)", height: "var(--control-h-hero)", padding: "0px 28px", fontSize: "17px", background: "var(--white)", color: "var(--color-primary)" }}
          >
            {"Bekijk hoe het werkt"}
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
              style={{ width: "17px", height: "17px" }}
              className="lucide lucide-arrow-right"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </a>
        </div>
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
            {"Plan een gratis demo"}
          </a>
        </div>
      </div>
    </div>
);
