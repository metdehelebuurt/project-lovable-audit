import { S08P1P1P1 } from "./S08P1P1P1";
import { S08P1P1P2 } from "./S08P1P1P2";

export const S08P1P1 = () => (
    <div className="mh-tourgrid mh-reveal" style={{ display: "grid", gridTemplateColumns: "296px 1fr", gap: "32px", alignItems: "start" }}>
      <S08P1P1P1 />
      <S08P1P1P2 />
    </div>
);
