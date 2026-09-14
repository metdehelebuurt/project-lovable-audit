
export const S09 = () => (
    <section id="b-tools" className="mh-secpad" style={{ padding: "88px 0px", background: "var(--surface-tint)" }}>
      <div className="mh-container">
        <div className="mh-reveal mh-hidden" style={{ maxWidth: "660px", marginBottom: "32px" }}>
          <div
            style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--indigo-600)", marginBottom: "14px" }}
          >
            {"Oplossingen"}
          </div>
          <h2 style={{ margin: "0px 0px 10px" }}>
            {"Wat je bij een "}
            <span className="sc-interp">
              {"Warmtepompen"}
            </span>
            {"-project gebruikt"}
          </h2>
          <p style={{ margin: "0px", fontSize: "17px", color: "var(--neutral-600)", lineHeight: "1.6" }}>
            {"Elk onderdeel heeft z\u2019n eigen pagina met uitleg, stappen en voorbeelden."}
          </p>
        </div>
        <div
          className="mh-grid4 mh-reveal mh-hidden"
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}
        >
          <a
            href="/oplossingen/lead"
            className="scp3"
            style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "22px", borderRadius: "16px", background: "var(--surface-page)", border: "1px solid var(--border-subtle)", color: "var(--text-heading)" }}
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
              style={{ width: "32px", height: "32px", color: "var(--color-primary)", strokeWidth: "1.5", flex: "0 0 auto", display: "block" }}
              className="lucide lucide-inbox"
            >
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
              <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </svg>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "16.5px", lineHeight: "1.25" }}>
              <span className="sc-interp">
                {"Leadbeheer & sales-CRM"}
              </span>
            </span>
            <span style={{ fontSize: "13.5px", color: "var(--neutral-600)", lineHeight: "1.5", flex: "1 1 0%" }}>
              <span className="sc-interp">
                {"Aanvragen voor warmtepompen direct in je pijplijn, toegewezen en opgevolgd."}
              </span>
            </span>
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13.5px", fontWeight: "600", color: "var(--indigo-700)" }}
            >
              {"Lees verder"}
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
                style={{ width: "14px", height: "14px" }}
                className="lucide lucide-arrow-right"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </span>
          </a>
          <a
            href="/oplossingen/schouw"
            className="scp3"
            style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "22px", borderRadius: "16px", background: "var(--surface-page)", border: "1px solid var(--border-subtle)", color: "var(--text-heading)" }}
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
              style={{ width: "32px", height: "32px", color: "var(--color-primary)", strokeWidth: "1.5", flex: "0 0 auto", display: "block" }}
              className="lucide lucide-ruler"
            >
              <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" />
              <path d="m14.5 12.5 2-2" />
              <path d="m11.5 9.5 2-2" />
              <path d="m8.5 6.5 2-2" />
              <path d="m17.5 15.5 2-2" />
            </svg>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "16.5px", lineHeight: "1.25" }}>
              <span className="sc-interp">
                {"Branchespecifieke schouw"}
              </span>
            </span>
            <span style={{ fontSize: "13.5px", color: "var(--neutral-600)", lineHeight: "1.5", flex: "1 1 0%" }}>
              <span className="sc-interp">
                {"Het schouwformulier van dit vakgebied, met de juiste velden en metingen."}
              </span>
            </span>
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13.5px", fontWeight: "600", color: "var(--indigo-700)" }}
            >
              {"Lees verder"}
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
                style={{ width: "14px", height: "14px" }}
                className="lucide lucide-arrow-right"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </span>
          </a>
          <a
            href="/oplossingen/offerte"
            className="scp3"
            style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "22px", borderRadius: "16px", background: "var(--surface-page)", border: "1px solid var(--border-subtle)", color: "var(--text-heading)" }}
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
              style={{ width: "32px", height: "32px", color: "var(--color-primary)", strokeWidth: "1.5", flex: "0 0 auto", display: "block" }}
              className="lucide lucide-file-signature"
            >
              <path d="M14.364 13.634a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506l4.013-4.009a1 1 0 0 0-3.004-3.004z" />
              <path d="M14.487 7.858A1 1 0 0 1 14 7V2" />
              <path d="M20 19.645V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l2.516 2.516" />
              <path d="M8 18h1" />
            </svg>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "16.5px", lineHeight: "1.25" }}>
              <span className="sc-interp">
                {"Offertes & subsidie"}
              </span>
            </span>
            <span style={{ fontSize: "13.5px", color: "var(--neutral-600)", lineHeight: "1.5", flex: "1 1 0%" }}>
              <span className="sc-interp">
                {"Vakberekening en actueel subsidiebedrag automatisch in je offerte."}
              </span>
            </span>
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13.5px", fontWeight: "600", color: "var(--indigo-700)" }}
            >
              {"Lees verder"}
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
                style={{ width: "14px", height: "14px" }}
                className="lucide lucide-arrow-right"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </span>
          </a>
          <a
            href="/oplossingen/oplevering"
            className="scp3"
            style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "22px", borderRadius: "16px", background: "var(--surface-page)", border: "1px solid var(--border-subtle)", color: "var(--text-heading)" }}
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
              style={{ width: "32px", height: "32px", color: "var(--color-primary)", strokeWidth: "1.5", flex: "0 0 auto", display: "block" }}
              className="lucide lucide-stamp"
            >
              <path d="M14 13V8.5C14 7 15 7 15 5a3 3 0 0 0-6 0c0 2 1 2 1 3.5V13" />
              <path d="M20 15.5a2.5 2.5 0 0 0-2.5-2.5h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1z" />
              <path d="M5 22h14" />
            </svg>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "16.5px", lineHeight: "1.25" }}>
              <span className="sc-interp">
                {"Oplevering & handtekening"}
              </span>
            </span>
            <span style={{ fontSize: "13.5px", color: "var(--neutral-600)", lineHeight: "1.5", flex: "1 1 0%" }}>
              <span className="sc-interp">
                {"Het opleverdocument volgens de normen van dit vakgebied, op locatie getekend."}
              </span>
            </span>
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13.5px", fontWeight: "600", color: "var(--indigo-700)" }}
            >
              {"Lees verder"}
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
                style={{ width: "14px", height: "14px" }}
                className="lucide lucide-arrow-right"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </span>
          </a>
        </div>
      </div>
    </section>
);
