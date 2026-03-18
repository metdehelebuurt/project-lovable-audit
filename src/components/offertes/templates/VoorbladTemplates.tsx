import React from "react";

interface VoorbladProps {
  pc: string; // primaire kleur
  sc: string; // secundaire kleur
  pcTint: string;
  logoUrl: string | null;
  partnerNaam: string;
  klantNaam: string;
  offertenummer: string;
  adviseurNaam: string;
  datum: string;
  categoryLabel: string | null;
  productNaam: string | null;
  slogan: string | null;
  introTekst: string | null;
  badges: string[];
  telefoon: string | null;
  klantAdres: string | null;
  klantPostcode: string | null;
  klantPlaats: string | null;
  isThumbnail?: boolean;
}

function hexToTint(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

export const HeroDark: React.FC<VoorbladProps> = (props) => {
  const { pc, sc, logoUrl, partnerNaam, klantNaam, offertenummer, adviseurNaam, datum, categoryLabel, productNaam, slogan, introTekst, badges, telefoon, klantAdres, klantPostcode, klantPlaats, pcTint } = props;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", fontFamily: "'Rubik', sans-serif" }}>
      <div style={{ backgroundColor: sc, color: "#fff", padding: "60px 50px 40px", position: "relative", flex: "0 0 auto" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: 220, height: "100%", background: `linear-gradient(135deg, ${pc}, ${hexToTint(pc, 0.6)})`, clipPath: "polygon(30% 0, 100% 0, 100% 100%, 0% 100%)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          {logoUrl && <img src={logoUrl} alt={partnerNaam} style={{ height: 48, marginBottom: 24, objectFit: "contain" }} />}
          <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0, lineHeight: 1.15 }}>Verduurzaam je huis</h1>
          <h1 style={{ fontSize: 36, fontWeight: 800, margin: "4px 0 0", lineHeight: 1.15, color: pc }}>
            {categoryLabel ? `met onze ${categoryLabel}` : "met onze oplossing"}
          </h1>
          {productNaam && <p style={{ fontSize: 18, fontWeight: 500, marginTop: 12, opacity: 0.9 }}>{productNaam}</p>}
        </div>
      </div>
      <div style={{ padding: "40px 50px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", gap: 40, marginBottom: 32 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: pc, marginBottom: 8 }}>Opgesteld voor</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: sc, margin: 0 }}>{klantNaam}</p>
            {klantAdres && <p style={{ margin: "4px 0 0", color: "#555" }}>{klantAdres}</p>}
            {(klantPostcode || klantPlaats) && <p style={{ margin: "2px 0 0", color: "#555" }}>{klantPostcode} {klantPlaats}</p>}
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: pc, marginBottom: 8 }}>Uw adviseur</p>
            <p style={{ fontSize: 16, fontWeight: 600, color: sc, margin: 0 }}>{adviseurNaam}</p>
            <p style={{ margin: "4px 0 0", color: "#555", fontSize: 13 }}>Offertenr: {offertenummer}</p>
            <p style={{ margin: "2px 0 0", color: "#555", fontSize: 13 }}>{datum}</p>
          </div>
        </div>
        {introTekst && (
          <div style={{ backgroundColor: pcTint, borderLeft: `4px solid ${pc}`, padding: "16px 20px", borderRadius: 8, marginBottom: 24 }}>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: "#333" }}>{introTekst}</p>
          </div>
        )}
        {slogan && <p style={{ fontSize: 15, fontStyle: "italic", color: pc, marginTop: "auto", marginBottom: 0 }}>"{slogan}"</p>}
      </div>
      <div style={{ backgroundColor: pcTint, padding: "16px 50px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 20, fontSize: 11, color: "#666" }}>
          {badges.map((b, i) => <span key={i}>✓ {b}</span>)}
        </div>
        {telefoon && <span style={{ fontSize: 12, fontWeight: 600, color: sc }}>Neem contact op: {telefoon}</span>}
      </div>
    </div>
  );
};

export const HeroSplit: React.FC<VoorbladProps> = (props) => {
  const { pc, sc, logoUrl, partnerNaam, klantNaam, offertenummer, adviseurNaam, datum, categoryLabel, introTekst, pcTint, slogan, klantAdres, klantPostcode, klantPlaats } = props;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", fontFamily: "'Rubik', sans-serif" }}>
      <div style={{ width: "45%", backgroundColor: sc, color: "#fff", padding: "60px 40px", display: "flex", flexDirection: "column" }}>
        {logoUrl && <img src={logoUrl} alt={partnerNaam} style={{ height: 40, marginBottom: 40, objectFit: "contain", alignSelf: "flex-start" }} />}
        <h1 style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.2, margin: 0 }}>Uw persoonlijke offerte</h1>
        <div style={{ width: 48, height: 3, backgroundColor: pc, borderRadius: 2, marginTop: 16, marginBottom: 24 }} />
        <p style={{ fontSize: 14, opacity: 0.8, lineHeight: 1.6 }}>{categoryLabel ? `Voor uw ${categoryLabel.toLowerCase()} project` : "Voor uw verduurzamingsproject"}</p>
        {slogan && <p style={{ fontSize: 13, fontStyle: "italic", color: pc, marginTop: "auto" }}>"{slogan}"</p>}
      </div>
      <div style={{ width: "55%", padding: "60px 40px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: pc, marginBottom: 8 }}>Opgesteld voor</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: sc, margin: 0 }}>{klantNaam}</p>
          {klantAdres && <p style={{ margin: "4px 0 0", color: "#555" }}>{klantAdres}</p>}
          {(klantPostcode || klantPlaats) && <p style={{ margin: "2px 0 0", color: "#555" }}>{klantPostcode} {klantPlaats}</p>}
        </div>
        <div style={{ marginBottom: 32, padding: "16px 20px", backgroundColor: pcTint, borderRadius: 12 }}>
          <p style={{ fontSize: 12, color: "#555", margin: "2px 0" }}>Adviseur: <strong>{adviseurNaam}</strong></p>
          <p style={{ fontSize: 12, color: "#555", margin: "2px 0" }}>Offertenr: <strong>{offertenummer}</strong></p>
          <p style={{ fontSize: 12, color: "#555", margin: "2px 0" }}>Datum: <strong>{datum}</strong></p>
        </div>
        {introTekst && <p style={{ fontSize: 13, lineHeight: 1.7, color: "#333" }}>{introTekst}</p>}
      </div>
    </div>
  );
};

export const HeroMinimal: React.FC<VoorbladProps> = (props) => {
  const { pc, sc, logoUrl, partnerNaam, klantNaam, offertenummer, adviseurNaam, datum, introTekst, pcTint, klantAdres, klantPostcode, klantPlaats } = props;
  return (
    <div style={{ width: "100%", height: "100%", padding: "80px 60px", display: "flex", flexDirection: "column", fontFamily: "'Rubik', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 60 }}>
        {logoUrl && <img src={logoUrl} alt={partnerNaam} style={{ height: 40, objectFit: "contain" }} />}
        <div style={{ textAlign: "right", fontSize: 11, color: "#999" }}>
          <p style={{ margin: "2px 0" }}>{offertenummer}</p>
          <p style={{ margin: "2px 0" }}>{datum}</p>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <p style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: pc, marginBottom: 16 }}>Offerte</p>
        <h1 style={{ fontSize: 42, fontWeight: 800, color: sc, margin: 0, lineHeight: 1.1 }}>Uw persoonlijke<br />voorstel</h1>
        <div style={{ width: 64, height: 4, backgroundColor: pc, borderRadius: 2, margin: "24px 0" }} />
        <p style={{ fontSize: 16, color: "#555", margin: 0 }}>Opgesteld voor <strong style={{ color: sc }}>{klantNaam}</strong></p>
        {klantAdres && <p style={{ fontSize: 14, color: "#888", margin: "4px 0 0" }}>{klantAdres}, {klantPostcode} {klantPlaats}</p>}
        {introTekst && <p style={{ fontSize: 13, lineHeight: 1.7, color: "#555", marginTop: 24, maxWidth: 500 }}>{introTekst}</p>}
      </div>
      <div style={{ borderTop: `2px solid ${pc}`, paddingTop: 16, fontSize: 11, color: "#999" }}>
        <p style={{ margin: 0 }}>Door: {adviseurNaam} • {partnerNaam}</p>
      </div>
    </div>
  );
};

export const HeroGradient: React.FC<VoorbladProps> = (props) => {
  const { pc, sc, logoUrl, partnerNaam, klantNaam, offertenummer, adviseurNaam, datum, categoryLabel, introTekst, badges, klantAdres, klantPostcode, klantPlaats } = props;
  return (
    <div style={{ width: "100%", height: "100%", background: `linear-gradient(160deg, ${sc} 0%, ${hexToTint(pc, 0.9)} 100%)`, color: "#fff", padding: "60px 50px", display: "flex", flexDirection: "column", fontFamily: "'Rubik', sans-serif" }}>
      {logoUrl && <img src={logoUrl} alt={partnerNaam} style={{ height: 44, marginBottom: 40, objectFit: "contain", alignSelf: "flex-start" }} />}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <p style={{ fontSize: 14, fontWeight: 500, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12, opacity: 0.7 }}>Offerte</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, margin: 0, lineHeight: 1.15 }}>{categoryLabel ? `${categoryLabel} offerte` : "Uw offerte"}</h1>
        <h2 style={{ fontSize: 24, fontWeight: 400, margin: "8px 0 0", opacity: 0.9 }}>voor {klantNaam}</h2>
        {klantAdres && <p style={{ fontSize: 14, opacity: 0.7, margin: "8px 0 0" }}>{klantAdres}, {klantPostcode} {klantPlaats}</p>}
        {introTekst && (
          <p style={{ fontSize: 14, lineHeight: 1.7, marginTop: 32, maxWidth: 500, opacity: 0.9 }}>{introTekst}</p>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: 20 }}>
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          <p style={{ margin: "2px 0" }}>{adviseurNaam}</p>
          <p style={{ margin: "2px 0" }}>{offertenummer} • {datum}</p>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 11, opacity: 0.6 }}>
          {badges.map((b, i) => <span key={i}>✓ {b}</span>)}
        </div>
      </div>
    </div>
  );
};

export const HeroPhoto: React.FC<VoorbladProps> = (props) => {
  const { pc, sc, logoUrl, partnerNaam, klantNaam, offertenummer, adviseurNaam, datum, categoryLabel, introTekst, pcTint, klantAdres, klantPostcode, klantPlaats } = props;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", fontFamily: "'Rubik', sans-serif" }}>
      <div style={{ height: "40%", background: `linear-gradient(135deg, ${sc}, ${pc})`, display: "flex", alignItems: "flex-end", padding: "0 50px 30px", position: "relative" }}>
        {logoUrl && <img src={logoUrl} alt={partnerNaam} style={{ position: "absolute", top: 30, left: 50, height: 36, objectFit: "contain" }} />}
        <h1 style={{ fontSize: 36, fontWeight: 800, color: "#fff", margin: 0 }}>
          {categoryLabel || "Offerte"}
        </h1>
      </div>
      <div style={{ flex: 1, padding: "40px 50px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
          <div style={{ backgroundColor: pcTint, borderRadius: 12, padding: "20px 24px" }}>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: pc, marginBottom: 8 }}>Voor</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: sc, margin: 0 }}>{klantNaam}</p>
            {klantAdres && <p style={{ fontSize: 12, color: "#555", margin: "4px 0 0" }}>{klantAdres}</p>}
            {(klantPostcode || klantPlaats) && <p style={{ fontSize: 12, color: "#555", margin: "2px 0 0" }}>{klantPostcode} {klantPlaats}</p>}
          </div>
          <div style={{ backgroundColor: pcTint, borderRadius: 12, padding: "20px 24px" }}>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: pc, marginBottom: 8 }}>Door</p>
            <p style={{ fontSize: 16, fontWeight: 600, color: sc, margin: 0 }}>{adviseurNaam}</p>
            <p style={{ fontSize: 12, color: "#555", margin: "4px 0 0" }}>{offertenummer}</p>
            <p style={{ fontSize: 12, color: "#555", margin: "2px 0 0" }}>{datum}</p>
          </div>
        </div>
        {introTekst && <p style={{ fontSize: 13, lineHeight: 1.7, color: "#333" }}>{introTekst}</p>}
      </div>
    </div>
  );
};

export const voorbladTemplates: Record<string, React.FC<VoorbladProps>> = {
  "hero-dark": HeroDark,
  "hero-split": HeroSplit,
  "hero-minimal": HeroMinimal,
  "hero-gradient": HeroGradient,
  "hero-photo": HeroPhoto,
};
