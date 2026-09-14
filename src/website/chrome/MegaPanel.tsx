import { MegaPanelP1 } from "./MegaPanelP1";

export const MegaPanel = () => (
    <div className="mh-mega" style={{ position: "absolute", left: "0px", right: "0px", top: "100%", background: "var(--surface-page)", borderTop: "1px solid var(--border-subtle)", boxShadow: "rgba(33, 31, 84, 0.16) 0px 24px 48px" }}>
      <MegaPanelP1 />
    </div>
);
