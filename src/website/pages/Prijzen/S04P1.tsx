import { S04P1P1 } from "./S04P1P1";

export const S04P1 = () => (
    <div className="mh-container">
      <div className="mh-reveal mh-hidden" style={{ maxWidth: "660px", marginBottom: "34px" }}>
        <div
          style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--indigo-600)", marginBottom: "14px" }}
        >
          {"Vergelijken"}
        </div>
        <h2 style={{ margin: "0px 0px 10px" }}>
          {"Alles op een rij"}
        </h2>
        <p style={{ margin: "0px", fontSize: "17px", color: "var(--neutral-600)", lineHeight: "1.6" }}>
          {"De volledige vergelijking, zonder sterretjes en zonder voetnoten die je later tegenkomen."}
        </p>
      </div>
      <S04P1P1 />
      <p
        className="mh-reveal mh-hidden"
        style={{ margin: "16px 0px 0px", fontSize: "13.5px", color: "var(--text-muted)" }}
      >
        {"Scroll horizontaal om alle plannen te zien. Bedragen zijn per bedrijf per maand, exclusief btw."}
      </p>
    </div>
);
