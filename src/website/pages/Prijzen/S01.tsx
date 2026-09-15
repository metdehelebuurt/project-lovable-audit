import { PrijsToggle } from "@/website/components/prijzen/PrijsToggle";

export const S01 = () => (
  <section
    className="mh-secpad"
    style={{ padding: "88px 0px 56px", background: "radial-gradient(120% 90% at 50% -20%, var(--ice-lilac) 0%, var(--white) 60%)" }}
  >
    <div className="mh-container">
      <div style={{ textAlign: "center", maxWidth: "660px", margin: "0px auto" }}>
        <div
          style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-primary)", marginBottom: "14px" }}
        >
          {"Prijzen"}
        </div>
        <h1 style={{ fontSize: "50px", lineHeight: "1.08", margin: "0px 0px 16px" }}>
          {"Heldere prijzen, geen verrassingen"}
        </h1>
        <p style={{ fontSize: "18px", lineHeight: "1.6", color: "var(--text-body)", margin: "0px 0px 26px" }}>
          {"E\u00e9n vast bedrag per maand voor je hele bedrijf, niet per gebruiker. Alle modules zitten in elk plan: het verschil zit in de omvang van je team en hoever je het platform onder je eigen merk zet."}
        </p>
        <PrijsToggle />
      </div>
    </div>
  </section>
);
