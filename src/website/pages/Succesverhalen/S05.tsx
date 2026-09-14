
export const S05 = () => (
    <section
      className="mh-secpad"
      style={{ position: "relative", overflow: "hidden", padding: "104px 0px", background: "var(--night-indigo)", color: "var(--text-on-dark)" }}
    >
      <div aria-hidden="true" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "1100px", height: "1100px", pointerEvents: "none", background: "repeating-radial-gradient(circle, transparent 0px, transparent 92px, rgba(255, 255, 255, 0.07) 92px, rgba(255, 255, 255, 0.07) 93px)", maskImage: "radial-gradient(circle, rgb(0, 0, 0) 0%, transparent 62%)" }}></div>
      <div className="mh-container" style={{ position: "relative", maxWidth: "820px", textAlign: "center" }}>
        <span
          aria-hidden="true"
          className="mh-reveal mh-hidden"
          style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "88px", lineHeight: "0.6", color: "var(--indigo-400)", opacity: "0.5", marginBottom: "14px" }}
        >
          {"\u201c"}
        </span>
        <p
          className="mh-reveal mh-hidden"
          style={{ fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "32px", lineHeight: "1.4", letterSpacing: "-0.015em", color: "rgb(255, 255, 255)", margin: "0px auto 34px", maxWidth: "26ch", textWrap: "pretty" }}
        >
          {"Vroeger was ik zelf de flessenhals: elke offerte ging via mij. Nu maakt mijn hele kantoor ze, en ik zie \u2019s ochtends in \u00e9\u00e9n scherm hoeveel werk eraan komt."}
        </p>
        <div className="mh-reveal mh-hidden" style={{ width: "40px", height: "1px", background: "rgba(255, 255, 255, 0.22)", margin: "0px auto 22px" }}></div>
        <div
          className="mh-reveal mh-hidden"
          style={{ display: "flex", alignItems: "center", gap: "13px", justifyContent: "center" }}
        >
          <span
            style={{ width: "44px", height: "44px", borderRadius: "99px", background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.2)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "15px", color: "rgb(255, 255, 255)", flex: "0 0 auto" }}
          >
            {"HN"}
          </span>
          <span style={{ textAlign: "left" }}>
            <span style={{ display: "block", fontWeight: "600", fontSize: "16px", color: "rgb(255, 255, 255)" }}>
              {"Hoang Nguyen"}
            </span>
            <span style={{ display: "block", fontSize: "14px", color: "var(--text-on-dark-muted)" }}>
              {"Eigenaar, Smart Accu BV"}
            </span>
          </span>
        </div>
      </div>
    </section>
);
