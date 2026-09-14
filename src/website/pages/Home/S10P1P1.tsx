import { S10P1P1P1 } from "./S10P1P1P1";
import { S10P1P1P2 } from "./S10P1P1P2";
import { S10P1P1P3 } from "./S10P1P1P3";
import { S10P1P1P4 } from "./S10P1P1P4";
import { S10P1P1P5 } from "./S10P1P1P5";

export const S10P1P1 = () => (
    <div className="mh-bgrid mh-reveal" style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "0px", borderRadius: "22px", overflow: "hidden", boxShadow: "rgba(33, 31, 84, 0.14) 0px 24px 60px" }}>
      <S10P1P1P1 />
      <S10P1P1P2 />
      <S10P1P1P3 />
      <S10P1P1P4 />
      <S10P1P1P5 />
    </div>
);
