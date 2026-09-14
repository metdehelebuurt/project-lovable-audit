
export const S01 = () => (
    <section
      className="mh-secpad"
      style={{ position: "relative", overflow: "hidden", padding: "88px 0px 56px", background: "linear-gradient(180deg, var(--ice-lilac) 0%, var(--white) 78%)" }}
    >
      <div aria-hidden="true" style={{ position: "absolute", inset: "0px", backgroundImage: "radial-gradient(var(--indigo-200) 1.3px, transparent 1.3px)", backgroundSize: "24px 24px", opacity: "0.4", maskImage: "radial-gradient(115% 80% at 82% -5%, rgb(0, 0, 0) 0%, transparent 62%)" }}></div>
      <div className="mh-container" style={{ position: "relative" }}>
        <div style={{ maxWidth: "760px" }}>
          <div
            style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-primary)", marginBottom: "14px" }}
          >
            {"Over ons"}
          </div>
          <h1 style={{ fontSize: "50px", lineHeight: "1.08", margin: "0px 0px 16px" }}>
            {"Wij bouwen het platform dat we "}
            <span style={{ color: "var(--color-primary)" }}>
              {"zelf wilden hebben"}
            </span>
          </h1>
          <p style={{ fontSize: "18px", lineHeight: "1.6", color: "var(--text-body)", maxWidth: "60ch", margin: "0px" }}>
            {"mijnhuis.nu is een Nederlandse scale-up voor de verduurzamingsbranche. We kennen de meterkast \u00e9n de kantoortuin, en bouwen software die op de werkvloer klopt, nuchter, concreet en samen met de eerste installatiebedrijven."}
          </p>
        </div>
      </div>
    </section>
);
