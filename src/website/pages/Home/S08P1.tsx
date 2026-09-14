import { S08P1P1 } from "./S08P1P1";
import { S08P1P2 } from "./S08P1P2";

export const S08P1 = () => (
    <div className="mh-container">
      <div className="mh-reveal" style={{ maxWidth: "660px", marginBottom: "40px" }}>
        <div
          style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-primary)", marginBottom: "14px" }}
        >
          {"In de app"}
        </div>
        <h2 style={{ margin: "0px 0px 10px" }}>
          {"Zo ziet het eruit"}
        </h2>
        <p style={{ fontSize: "17px", color: "var(--text-muted)", margin: "0px", lineHeight: "1.6" }}>
          {"Geen abstracte beloftes. Dit zijn de schermen waar je team elke dag in werkt. Klik door de vijf stappen van de keten."}
        </p>
      </div>
      <S08P1P1 />
      <S08P1P2 />
    </div>
);
