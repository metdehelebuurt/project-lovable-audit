import { useState } from "react";
import { S08P1P1P2 } from "./S08P1P1P2";
import { TourRail } from "./tour/TourRail";
import { TourScherm } from "./tour/TourScherm";
import { TOUR_STAPPEN } from "./tour/tourStappen";

export const S08P1P1 = () => {
  const [actief, setActief] = useState(TOUR_STAPPEN[0].id);
  const stap = TOUR_STAPPEN.find((s) => s.id === actief) ?? TOUR_STAPPEN[0];

  return (
    <div className="mh-tourgrid mh-reveal" style={{ display: "grid", gridTemplateColumns: "296px 1fr", gap: "32px", alignItems: "start" }}>
      <TourRail actief={actief} onKies={setActief} />
      {stap.id === "leads" ? <S08P1P1P2 /> : <TourScherm stap={stap} />}
    </div>
  );
};
