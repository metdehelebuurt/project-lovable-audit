
export const S01 = () => (
    <section
      id="f-top"
      className="mh-secpad"
      style={{ position: "relative", overflow: "hidden", padding: "88px 0px 64px", background: "radial-gradient(90% 75% at 85% -10%, var(--indigo-200) 0%, rgba(238,240,253,0) 58%), linear-gradient(162deg, #EEEBFE 0%, #F4F3FE 34%, var(--white) 74%)" }}
    >
      <div aria-hidden="true" style={{ position: "absolute", inset: "0px", backgroundImage: "radial-gradient(var(--indigo-300) 1.2px, transparent 1.2px)", backgroundSize: "26px 26px", opacity: "0.28", maskImage: "radial-gradient(110% 80% at 80% -5%, rgb(0, 0, 0) 0%, transparent 60%)" }}></div>
      <div className="mh-container" style={{ position: "relative" }}>
        <div style={{ maxWidth: "780px" }}>
          <div
            style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-primary)", marginBottom: "12px" }}
          >
            {"Functionaliteiten"}
          </div>
          <h1 style={{ fontSize: "52px", lineHeight: "1.08", margin: "0px 0px 18px" }}>
            {"Elke functie voor je hele klantreis: "}
            <span style={{ color: "var(--color-primary)" }}>
              {"in \u00e9\u00e9n platform"}
            </span>
          </h1>
          <p
            style={{ fontSize: "19px", lineHeight: "1.6", color: "var(--text-body)", maxWidth: "62ch", margin: "0px 0px 28px" }}
          >
            {"Van lead en schouw tot offerte, planning, oplevering, service en inzicht. Hieronder vind je elke functie met uitleg, gegroepeerd in de drie fases van je klantreis. E\u00e9n flow, \u00e9\u00e9n dossier, geen dubbele invoer."}
          </p>
          <div className="mh-cta" style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
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
          <div
            style={{ display: "flex", gap: "18px", flexWrap: "wrap", marginTop: "16px", fontSize: "14px", color: "var(--text-muted)" }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
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
                style={{ width: "15px", height: "15px", color: "var(--success)" }}
                className="lucide lucide-check"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {"14 dagen gratis"}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
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
                style={{ width: "15px", height: "15px", color: "var(--success)" }}
                className="lucide lucide-check"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {"Geen creditcard nodig"}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
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
                style={{ width: "15px", height: "15px", color: "var(--success)" }}
                className="lucide lucide-check"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {"Data veilig in de EU"}
            </span>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "28px" }}>
            <button
              style={{ padding: "10px 18px", borderRadius: "99px", border: "1px solid var(--border-subtle)", background: "rgb(255, 255, 255)", color: "var(--text-body)", fontWeight: "600", fontSize: "14px", cursor: "pointer", fontFamily: "var(--font-body)", display: "inline-flex", alignItems: "center", gap: "8px" }}
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
                style={{ width: "16px", height: "16px", color: "var(--color-primary)" }}
                className="lucide lucide-briefcase"
              >
                <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                <rect width="20" height="14" x="2" y="6" rx="2" />
              </svg>
              {"Verkopen"}
            </button>
            <button
              style={{ padding: "10px 18px", borderRadius: "99px", border: "1px solid var(--border-subtle)", background: "rgb(255, 255, 255)", color: "var(--text-body)", fontWeight: "600", fontSize: "14px", cursor: "pointer", fontFamily: "var(--font-body)", display: "inline-flex", alignItems: "center", gap: "8px" }}
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
                style={{ width: "16px", height: "16px", color: "var(--color-primary)" }}
                className="lucide lucide-wrench"
              >
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z" />
              </svg>
              {"Uitvoeren"}
            </button>
            <button
              style={{ padding: "10px 18px", borderRadius: "99px", border: "1px solid var(--border-subtle)", background: "rgb(255, 255, 255)", color: "var(--text-body)", fontWeight: "600", fontSize: "14px", cursor: "pointer", fontFamily: "var(--font-body)", display: "inline-flex", alignItems: "center", gap: "8px" }}
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
                style={{ width: "16px", height: "16px", color: "var(--color-primary)" }}
                className="lucide lucide-line-chart"
              >
                <path d="M3 3v16a2 2 0 0 0 2 2h16" />
                <path d="m19 9-5 5-4-4-3 3" />
              </svg>
              {"Nazorg & inzicht"}
            </button>
            <button
              style={{ padding: "10px 18px", borderRadius: "99px", border: "1px solid var(--border-subtle)", background: "rgb(255, 255, 255)", color: "var(--text-body)", fontWeight: "600", fontSize: "14px", cursor: "pointer", fontFamily: "var(--font-body)", display: "inline-flex", alignItems: "center", gap: "8px" }}
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
                style={{ width: "16px", height: "16px", color: "var(--color-primary)" }}
                className="lucide lucide-plug"
              >
                <path d="M12 22v-5" />
                <path d="M15 8V2" />
                <path d="M17 8a1 1 0 0 1 1 1v4a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1z" />
                <path d="M9 8V2" />
              </svg>
              {"Koppelingen"}
            </button>
          </div>
        </div>
      </div>
    </section>
);
