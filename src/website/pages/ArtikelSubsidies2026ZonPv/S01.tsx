
export const S01 = () => (
    <section
      className="mh-secpad"
      style={{ position: "relative", overflow: "hidden", padding: "72px 0px 0px", background: "linear-gradient(168deg, #EEEBFE 0%, #F5F4FE 44%, var(--white) 100%)" }}
    >
      <div className="mh-container" style={{ position: "relative", maxWidth: "800px" }}>
        <div
          style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: "var(--neutral-600)", marginBottom: "24px", flexWrap: "wrap" }}
        >
          <a href="/" style={{ color: "var(--indigo-700)", fontWeight: "600" }}>
            {"Home"}
          </a>
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
            style={{ width: "14px", height: "14px", color: "var(--indigo-300)" }}
            className="lucide lucide-chevron-right"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          <a href="/kennisbank" style={{ color: "var(--indigo-700)", fontWeight: "600" }}>
            {"Kennisbank"}
          </a>
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
            style={{ width: "14px", height: "14px", color: "var(--indigo-300)" }}
            className="lucide lucide-chevron-right"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          <span>
            <span className="sc-interp">
              {"Subsidies"}
            </span>
          </span>
        </div>
        <span
          style={{ display: "inline-flex", alignItems: "center", padding: "7px 14px", borderRadius: "999px", background: "var(--indigo-600)", color: "rgb(255, 255, 255)", fontSize: "12px", fontWeight: "600", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "20px" }}
        >
          <span className="sc-interp">
            {"Subsidies"}
          </span>
        </span>
        <h1 style={{ fontSize: "46px", lineHeight: "1.1", margin: "0px 0px 18px" }}>
          <span className="sc-interp">
            {"Subsidies 2026: wat verandert er voor zon-PV?"}
          </span>
        </h1>
        <p style={{ fontSize: "19px", lineHeight: "1.65", color: "var(--text-body)", margin: "0px 0px 26px" }}>
          <span className="sc-interp">
            {"De subsidievoorwaarden voor zonnestroom schuiven elk jaar op. Wie met verouderde bedragen rekent, verliest marge of moet achteraf uitleggen waarom de klant minder terugkrijgt. Dit is wat er dit jaar verandert en hoe je het in je offerte verwerkt."}
          </span>
        </p>
        <div
          style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap", paddingBottom: "32px", fontSize: "14px", color: "var(--neutral-600)" }}
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
              style={{ width: "16px", height: "16px", color: "var(--color-primary)" }}
              className="lucide lucide-user-round"
            >
              <circle cx="12" cy="8" r="5" />
              <path d="M20 21a8 8 0 0 0-16 0" />
            </svg>
            <span className="sc-interp">
              {"Charlotte"}
            </span>
          </span>
          <span aria-hidden="true">
            {"\u00b7"}
          </span>
          <span>
            <span className="sc-interp">
              {"4 augustus 2026"}
            </span>
          </span>
          <span aria-hidden="true">
            {"\u00b7"}
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
              style={{ width: "16px", height: "16px", color: "var(--color-primary)" }}
              className="lucide lucide-clock"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span className="sc-interp">
              {"5 min"}
            </span>
            {" lezen"}
          </span>
        </div>
      </div>
    </section>
);
