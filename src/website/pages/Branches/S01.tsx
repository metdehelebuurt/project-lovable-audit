
export const S01 = () => (
    <section
      className="mh-secpad"
      style={{ position: "relative", overflow: "hidden", padding: "72px 0px 44px", background: "radial-gradient(90% 80% at 88% -14%, var(--indigo-200) 0%, rgba(238,240,253,0) 58%), linear-gradient(162deg, #EEEBFE 0%, #F4F3FE 38%, var(--white) 82%)" }}
    >
      <div aria-hidden="true" style={{ position: "absolute", inset: "0px", backgroundImage: "radial-gradient(var(--indigo-300) 1.2px, transparent 1.2px)", backgroundSize: "26px 26px", opacity: "0.26", maskImage: "radial-gradient(110% 80% at 84% -5%, rgb(0, 0, 0) 0%, transparent 60%)" }}></div>
      <div className="mh-container" style={{ position: "relative", maxWidth: "800px" }}>
        <div
          style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: "var(--neutral-600)", marginBottom: "24px" }}
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
          <span>
            {"Branches"}
          </span>
        </div>
        <div
          style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-primary)", marginBottom: "14px" }}
        >
          {"Branches"}
        </div>
        <h1 style={{ fontSize: "50px", lineHeight: "1.08", margin: "0px 0px 16px" }}>
          {"Software voor de verduurzamingsbranche, per vakgebied ingericht"}
        </h1>
        <p
          style={{ fontSize: "18.5px", lineHeight: "1.6", color: "var(--text-body)", margin: "0px 0px 26px", maxWidth: "62ch" }}
        >
          {"Zon-PV, warmtepompen, thuisbatterijen, laadinfrastructuur en isolatie. Elk vakgebied heeft z\u2019n eigen schouw, rekenwerk en normen, en die staan bij ons standaard klaar. Kies je vakgebied en zie precies wat er voor jou in het platform zit."}
        </p>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "14.5px", color: "var(--text-body)" }}
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
              style={{ width: "16px", height: "16px", color: "var(--success)" }}
              className="lucide lucide-check"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {"Schouw, offerte en oplevering per vakgebied"}
          </span>
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "14.5px", color: "var(--text-body)" }}
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
              style={{ width: "16px", height: "16px", color: "var(--success)" }}
              className="lucide lucide-check"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {"Wij houden de normen bij"}
          </span>
        </div>
      </div>
    </section>
);
