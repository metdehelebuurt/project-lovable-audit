
export const S03 = () => (
    <section className="mh-secpad" style={{ padding: "0px 0px 80px", background: "var(--surface-page)" }}>
      <div className="mh-container">
        <div
          className="mh-grid2 mh-reveal mh-hidden"
          style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: "28px", alignItems: "stretch", borderRadius: "20px", border: "1px solid var(--border-subtle)", background: "var(--surface-tint)", padding: "28px", overflow: "hidden" }}
        >
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <span
              style={{ width: "46px", height: "46px", borderRadius: "12px", background: "var(--surface-page)", border: "1px solid var(--border-subtle)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)", marginBottom: "16px" }}
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
                style={{ width: "22px", height: "22px" }}
                className="lucide lucide-map-pin"
              >
                <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </span>
            <h2 style={{ margin: "0px 0px 10px", fontSize: "26px" }}>
              {"Even langskomen?"}
            </h2>
            <p style={{ margin: "0px 0px 18px", fontSize: "15.5px", color: "var(--neutral-600)", lineHeight: "1.55" }}>
              {"Je bent welkom op kantoor in Amsterdam. Laat het even weten, dan zetten we koffie en nemen we jouw werkwijze samen door."}
            </p>
            <div
              style={{ fontFamily: "\"IBM Plex Mono\", ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "11.5px", color: "var(--neutral-600)", lineHeight: "1.7" }}
            >
              {"AMSTERDAM \u00b7 OP AFSPRAAK"}
              <br />
              {"KVK 12345678 \u00b7 BTW NL0000.00.000B01"}
            </div>
          </div>
          <img src="" alt="" loading="lazy" style={{ width: "100%", height: "100%", minHeight: "240px", display: "block", objectFit: "cover", borderRadius: "14px" }} />
        </div>
      </div>
    </section>
);
