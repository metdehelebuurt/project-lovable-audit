
export const S04 = () => (
    <section className="mh-secpad" style={{ padding: "80px 0px", background: "var(--surface-tint)" }}>
      <div className="mh-container">
        <div
          className="mh-reveal mh-hidden"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "24px", flexWrap: "wrap", marginBottom: "34px" }}
        >
          <div style={{ maxWidth: "640px" }}>
            <div
              style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--indigo-600)", marginBottom: "14px" }}
            >
              {"Volg ons"}
            </div>
            <h2 style={{ margin: "0px 0px 10px" }}>
              {"Kijk mee over onze schouder"}
            </h2>
            <p style={{ fontSize: "17px", color: "var(--neutral-600)", margin: "0px", lineHeight: "1.6" }}>
              {"Werk van klanten, productupdates en uitleg over normen en subsidies. Geen reclame, wel het vak."}
            </p>
          </div>
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 16px", borderRadius: "999px", background: "var(--surface-page)", border: "1px solid var(--border-subtle)", fontSize: "14px", color: "var(--neutral-600)", whiteSpace: "nowrap" }}
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
              style={{ width: "15px", height: "15px", color: "var(--color-primary)" }}
              className="lucide lucide-rss"
            >
              <path d="M4 11a9 9 0 0 1 9 9" />
              <path d="M4 4a16 16 0 0 1 16 16" />
              <circle cx="5" cy="19" r="1" />
            </svg>
            {"Wekelijks iets nieuws"}
          </span>
        </div>
        <div
          className="mh-grid4 mh-reveal mh-hidden"
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}
        >
          <a
            href="/contact"
            className="scp8"
            style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "26px", borderRadius: "16px", background: "var(--surface-page)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-sm)", color: "var(--text-heading)" }}
          >
            <span
              style={{ width: "52px", height: "52px", borderRadius: "14px", background: "rgba(10, 102, 194, 0.1)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "rgb(10, 102, 194)" }}
            >
              <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
                <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.76-1.95 4.02 0 4.76 2.5 4.76 5.76V21h-4v-5.6c0-1.34-.03-3.06-1.9-3.06-1.9 0-2.19 1.45-2.19 2.96V21H9z" />
              </svg>
            </span>
            <span>
              <span
                style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "18px", lineHeight: "1.2", marginBottom: "4px" }}
              >
                {"LinkedIn"}
              </span>
              <span
                style={{ display: "block", fontFamily: "\"IBM Plex Mono\", ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "12.5px", color: "var(--neutral-600)", marginBottom: "8px" }}
              >
                {"@mijnhuisnu"}
              </span>
              <span style={{ display: "block", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                {"Productupdates, vacatures en wat we leren van installatiebedrijven."}
              </span>
            </span>
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "13.5px", fontWeight: "600", color: "rgb(10, 102, 194)", marginTop: "auto" }}
            >
              {"Volgen"}
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
                className="lucide lucide-arrow-up-right"
              >
                <path d="M7 7h10v10" />
                <path d="M7 17 17 7" />
              </svg>
            </span>
          </a>
          <a
            href="/contact"
            className="scp9"
            style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "26px", borderRadius: "16px", background: "var(--surface-page)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-sm)", color: "var(--text-heading)" }}
          >
            <span
              style={{ width: "52px", height: "52px", borderRadius: "14px", background: "rgba(193, 53, 132, 0.1)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "rgb(193, 53, 132)" }}
            >
              <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
                <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.8 3.8 0 0 1-1.38-.9 3.8 3.8 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 1.8c-3.15 0-3.5.01-4.74.07-1.14.05-1.76.24-2.17.4-.55.21-.94.47-1.35.88-.41.41-.67.8-.88 1.35-.16.41-.35 1.03-.4 2.17-.06 1.24-.07 1.59-.07 4.74s.01 3.5.07 4.74c.05 1.14.24 1.76.4 2.17.21.55.47.94.88 1.35.41.41.8.67 1.35.88.41.16 1.03.35 2.17.4 1.24.06 1.59.07 4.74.07s3.5-.01 4.74-.07c1.14-.05 1.76-.24 2.17-.4.55-.21.94-.47 1.35-.88.41-.41.67-.8.88-1.35.16-.41.35-1.03.4-2.17.06-1.24.07-1.59.07-4.74s-.01-3.5-.07-4.74c-.05-1.14-.24-1.76-.4-2.17a3.6 3.6 0 0 0-.88-1.35 3.6 3.6 0 0 0-1.35-.88c-.41-.16-1.03-.35-2.17-.4-1.24-.06-1.59-.07-4.74-.07zM12 6.86a5.14 5.14 0 1 1 0 10.28 5.14 5.14 0 0 1 0-10.28zm0 1.8a3.34 3.34 0 1 0 0 6.68 3.34 3.34 0 0 0 0-6.68zm5.34-3.2a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z" />
              </svg>
            </span>
            <span>
              <span
                style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "18px", lineHeight: "1.2", marginBottom: "4px" }}
              >
                {"Instagram"}
              </span>
              <span
                style={{ display: "block", fontFamily: "\"IBM Plex Mono\", ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "12.5px", color: "var(--neutral-600)", marginBottom: "8px" }}
              >
                {"@mijnhuis.nu"}
              </span>
              <span style={{ display: "block", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                {"Beeld van de werkvloer: schouwen, installaties en opleveringen."}
              </span>
            </span>
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "13.5px", fontWeight: "600", color: "rgb(193, 53, 132)", marginTop: "auto" }}
            >
              {"Volgen"}
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
                className="lucide lucide-arrow-up-right"
              >
                <path d="M7 7h10v10" />
                <path d="M7 17 17 7" />
              </svg>
            </span>
          </a>
          <a
            href="/contact"
            className="scpa"
            style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "26px", borderRadius: "16px", background: "var(--surface-page)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-sm)", color: "var(--text-heading)" }}
          >
            <span
              style={{ width: "52px", height: "52px", borderRadius: "14px", background: "rgba(214, 43, 33, 0.1)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "rgb(214, 43, 33)" }}
            >
              <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.45a2.78 2.78 0 0 0-1.95 1.97A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.97C5.12 20 12 20 12 20s6.88 0 8.59-.45a2.78 2.78 0 0 0 1.95-1.97A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12z" />
              </svg>
            </span>
            <span>
              <span
                style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "18px", lineHeight: "1.2", marginBottom: "4px" }}
              >
                {"YouTube"}
              </span>
              <span
                style={{ display: "block", fontFamily: "\"IBM Plex Mono\", ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "12.5px", color: "var(--neutral-600)", marginBottom: "8px" }}
              >
                {"mijnhuis.nu"}
              </span>
              <span style={{ display: "block", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                {"Korte uitlegvideo\u2019s: van schouw tot ondertekend opleverdossier."}
              </span>
            </span>
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "13.5px", fontWeight: "600", color: "rgb(214, 43, 33)", marginTop: "auto" }}
            >
              {"Volgen"}
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
                className="lucide lucide-arrow-up-right"
              >
                <path d="M7 7h10v10" />
                <path d="M7 17 17 7" />
              </svg>
            </span>
          </a>
          <a
            href="/contact"
            className="scpb"
            style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "26px", borderRadius: "16px", background: "var(--surface-page)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-sm)", color: "var(--text-heading)" }}
          >
            <span
              style={{ width: "52px", height: "52px", borderRadius: "14px", background: "rgba(24, 119, 242, 0.1)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "rgb(24, 119, 242)" }}
            >
              <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
                <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12z" />
              </svg>
            </span>
            <span>
              <span
                style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "18px", lineHeight: "1.2", marginBottom: "4px" }}
              >
                {"Facebook"}
              </span>
              <span
                style={{ display: "block", fontFamily: "\"IBM Plex Mono\", ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "12.5px", color: "var(--neutral-600)", marginBottom: "8px" }}
              >
                {"mijnhuis.nu"}
              </span>
              <span style={{ display: "block", fontSize: "14.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
                {"Nieuws en aankondigingen voor de branche."}
              </span>
            </span>
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "13.5px", fontWeight: "600", color: "rgb(24, 119, 242)", marginTop: "auto" }}
            >
              {"Volgen"}
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
                className="lucide lucide-arrow-up-right"
              >
                <path d="M7 7h10v10" />
                <path d="M7 17 17 7" />
              </svg>
            </span>
          </a>
        </div>
      </div>
    </section>
);
