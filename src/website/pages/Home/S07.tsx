import { useState } from "react";
import {
  ArrowRight, CalendarRange, FileSignature, Inbox, LineChart,
  Ruler, Smartphone, Sparkles, Stamp, Users,
} from "lucide-react";

type Fase = "verkopen" | "uitvoeren" | "nazorg";

interface Kaart {
  titel: string;
  tekst: string;
  href: string;
  Icoon: typeof Inbox;
}

const TABS: { id: Fase; label: string }[] = [
  { id: "verkopen", label: "Verkopen" },
  { id: "uitvoeren", label: "Uitvoeren" },
  { id: "nazorg", label: "Nazorg & inzicht" },
];

const KAARTEN: Record<Fase, Kaart[]> = {
  verkopen: [
    {
      titel: "Leadbeheer & sales-CRM",
      tekst: "Elke aanvraag van je website direct in de pijplijn, niets valt tussen wal en schip.",
      href: "/oplossingen/lead",
      Icoon: Inbox,
    },
    {
      titel: "Branchespecifieke schouw",
      tekst: "Schouwformulieren per branche met foto's, metingen en dakvlak, volgens de NEN-normen.",
      href: "/oplossingen/schouw",
      Icoon: Ruler,
    },
    {
      titel: "Offertes & subsidie in minuten",
      tekst: "Staffelprijzen, actuele subsidie en digitale ondertekening, in 5 minuten klaar.",
      href: "/oplossingen/offerte",
      Icoon: FileSignature,
    },
  ],
  uitvoeren: [
    {
      titel: "Planning & werkbon",
      tekst: "Plan ploegen en materiaal in één agenda. Een wijziging staat direct op de telefoon van de monteur.",
      href: "/oplossingen/planning",
      Icoon: CalendarRange,
    },
    {
      titel: "Monteursapp op locatie",
      tekst: "Werkbon, foto's, serienummers en uren vanaf de telefoon, ook zonder bereik.",
      href: "/oplossingen/monteursapp",
      Icoon: Smartphone,
    },
    {
      titel: "Oplevering & NEN-dossier",
      tekst: "Opleverrapport met metingen en handtekening van de klant, compleet vóór de bus wegrijdt.",
      href: "/oplossingen/oplevering",
      Icoon: Stamp,
    },
  ],
  nazorg: [
    {
      titel: "Klantportaal",
      tekst: "De klant volgt zijn project, tekent digitaal en stelt vragen in één omgeving.",
      href: "/oplossingen/klantportaal",
      Icoon: Users,
    },
    {
      titel: "Rapportage & stuurinformatie",
      tekst: "Omzet, marge, doorlooptijd en scorepercentage per branche en per adviseur.",
      href: "/oplossingen/rapportage",
      Icoon: LineChart,
    },
    {
      titel: "AI-kennisbank & service",
      tekst: "Antwoorden uit je eigen projecten en documentatie, direct bij de servicevraag.",
      href: "/kennisbank",
      Icoon: Sparkles,
    },
  ],
};

const tabStyle = (actief: boolean) => ({
  padding: "10px 20px",
  borderRadius: "999px",
  border: "none",
  cursor: "pointer",
  fontFamily: "var(--font-body)",
  fontSize: "14.5px",
  fontWeight: "600",
  whiteSpace: "nowrap" as const,
  background: actief ? "rgb(255, 255, 255)" : "transparent",
  color: actief ? "var(--indigo-700)" : "rgba(255, 255, 255, 0.88)",
  boxShadow: actief ? "rgba(33, 31, 84, 0.22) 0px 4px 12px" : "none",
  transition: "all var(--dur-fast) var(--ease-standard)",
});

const KaartLink = ({ kaart }: { kaart: Kaart }) => (
  <a
    href={kaart.href}
    className="mh-card"
    style={{ boxSizing: "border-box", background: "var(--surface-card)", borderRadius: "var(--radius-lg)", padding: "32px", transition: "transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard)", boxShadow: "var(--shadow-md)", border: "1px solid transparent", display: "block", color: "inherit", textDecoration: "none" }}
  >
    <span
      style={{ width: "58px", height: "58px", borderRadius: "15px", background: "linear-gradient(140deg, var(--indigo-500) 0%, var(--indigo-700) 100%)", boxShadow: "rgba(33, 31, 84, 0.3) 0px 8px 18px", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "rgb(255, 255, 255)", marginBottom: "18px" }}
    >
      <kaart.Icoon aria-hidden="true" style={{ width: "27px", height: "27px" }} />
    </span>
    <h3 style={{ fontSize: "18px", margin: "0px 0px 8px" }}>{kaart.titel}</h3>
    <p style={{ margin: "0px", fontSize: "14.5px", color: "var(--text-muted)", lineHeight: "1.5" }}>
      {kaart.tekst}
    </p>
  </a>
);

export const S07 = () => {
  const [fase, setFase] = useState<Fase>("verkopen");

  return (
    <section className="mh-secpad" style={{ padding: "96px 0px", background: "var(--surface-page)" }}>
      <div className="mh-container">
        <div
          className="mh-reveal"
          style={{ position: "relative", overflow: "hidden", borderRadius: "24px", background: "var(--color-primary)", boxShadow: "rgba(33, 31, 84, 0.28) 0px 30px 70px", padding: "64px 56px", color: "rgb(255, 255, 255)" }}
        >
          <div aria-hidden="true" style={{ position: "absolute", top: "-320px", right: "-260px", width: "1180px", height: "1180px", pointerEvents: "none", background: "repeating-radial-gradient(circle, transparent 0px, transparent 86px, rgba(255, 255, 255, 0.16) 86px, rgba(255, 255, 255, 0.16) 88px)", maskImage: "radial-gradient(circle, rgb(0, 0, 0) 0%, transparent 72%)" }}></div>
          <div style={{ position: "relative" }}>
            <div
              className="mh-grid2"
              style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: "32px", alignItems: "end", marginBottom: "36px" }}
            >
              <div>
                <div
                  style={{ fontFamily: "\"IBM Plex Mono\", ui-monospace, SFMono-Regular, Menlo, monospace", fontWeight: "500", fontSize: "12.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255, 255, 255, 0.72)", marginBottom: "16px" }}
                >
                  {"Het hart van het platform"}
                </div>
                <h2 style={{ margin: "0px 0px 12px", color: "rgb(255, 255, 255)", fontSize: "44px", lineHeight: "1.08" }}>
                  {"Alles wat je nodig hebt zit erin"}
                </h2>
                <p
                  style={{ fontSize: "18.5px", color: "rgba(255, 255, 255, 0.86)", margin: "0px", lineHeight: "1.55", maxWidth: "46ch" }}
                >
                  {"Van eerste lead tot service, in drie logische fases. Geen losse modules die je zelf aan elkaar knoopt: één doorlopend dossier."}
                </p>
              </div>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "flex-start" }}>
                <div
                  style={{ flex: "1 1 0%", minWidth: "132px", padding: "18px 20px", borderRadius: "14px", background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.2)" }}
                >
                  <div
                    style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "30px", lineHeight: "1", marginBottom: "6px" }}
                  >
                    {"9"}
                  </div>
                  <div style={{ fontSize: "13.5px", color: "rgba(255, 255, 255, 0.82)", lineHeight: "1.4" }}>
                    {"kernfuncties, alles inbegrepen"}
                  </div>
                </div>
                <div
                  style={{ flex: "1 1 0%", minWidth: "132px", padding: "18px 20px", borderRadius: "14px", background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.2)" }}
                >
                  <div
                    style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "30px", lineHeight: "1", marginBottom: "6px" }}
                  >
                    {"1"}
                  </div>
                  <div style={{ fontSize: "13.5px", color: "rgba(255, 255, 255, 0.82)", lineHeight: "1.4" }}>
                    {"dossier van lead tot service"}
                  </div>
                </div>
              </div>
            </div>
            <div
              role="tablist"
              aria-label="Fases van het platform"
              style={{ display: "flex", width: "fit-content", maxWidth: "100%", gap: "4px", padding: "5px", background: "rgba(255, 255, 255, 0.14)", border: "1px solid rgba(255, 255, 255, 0.22)", borderRadius: "999px", flexWrap: "wrap" }}
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={fase === tab.id}
                  className="mh-tab"
                  style={tabStyle(fase === tab.id)}
                  onClick={() => setFase(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div style={{ marginTop: "28px" }}>
              <div className="mh-grid3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
                {KAARTEN[fase].map((kaart) => (
                  <KaartLink key={kaart.titel} kaart={kaart} />
                ))}
              </div>
            </div>
            <div
              className="mh-cta"
              style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center", marginTop: "36px", paddingTop: "32px", borderTop: "1px solid rgba(255, 255, 255, 0.2)" }}
            >
              <a
                href="/functionaliteiten"
                className="mh-btn"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "var(--font-body)", fontWeight: "var(--fw-semibold)", lineHeight: "1", border: "1px solid transparent", borderRadius: "var(--radius-md)", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)", height: "var(--control-h-hero)", padding: "0px 28px", fontSize: "17px", background: "var(--white)", color: "var(--night-indigo)" }}
              >
                {"Bekijk alle functionaliteiten"}
                <ArrowRight aria-hidden="true" style={{ width: "17px", height: "17px" }} />
              </a>
              <a
                href="/proefperiode"
                className="mh-btn"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "var(--font-body)", fontWeight: "var(--fw-semibold)", lineHeight: "1", border: "1px solid transparent", borderRadius: "var(--radius-md)", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)", height: "var(--control-h-hero)", padding: "0px 28px", fontSize: "17px", background: "var(--color-accent)", color: "var(--white)" }}
              >
                {"Start gratis"}
              </a>
              <span style={{ fontSize: "14.5px", color: "rgba(255, 255, 255, 0.8)" }}>
                {"Alles zit in één platform, geen losse licenties."}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
