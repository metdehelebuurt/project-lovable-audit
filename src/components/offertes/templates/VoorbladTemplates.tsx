import React from "react";

interface VoorbladProps {
  pc: string;
  sc: string;
  pcTint: string;
  logoUrl: string | null;
  logoUrlDark: string | null;
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
  heroImageUrl?: string | null;
  heroTitle?: string;
}

function hexToTint(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

const A4_HEIGHT = 1123;

const rootStyle: React.CSSProperties = {
  width: "100%",
  height: A4_HEIGHT,
  minHeight: A4_HEIGHT,
  fontFamily: "'Rubik', sans-serif",
  position: "relative",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

const HeroImageBg: React.FC<{ url: string; overlay: string }> = ({ url, overlay }) => (
  <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
    <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    <div style={{ position: "absolute", inset: 0, background: overlay }} />
  </div>
);

/* ════════════════════════════════════════════════════════════
   1 — HERO DARK
   ════════════════════════════════════════════════════════════ */
export const HeroDark: React.FC<VoorbladProps> = (props) => {
  const { pc, sc, logoUrl, logoUrlDark, partnerNaam, klantNaam, offertenummer, adviseurNaam, datum, categoryLabel, productNaam, slogan, introTekst, badges, telefoon, klantAdres, klantPostcode, klantPlaats, pcTint, heroImageUrl, heroTitle = "Offerte" } = props;
  const darkLogo = logoUrlDark || logoUrl;
  const hasImage = !!heroImageUrl;

  return (
    <div style={{ ...rootStyle }}>
      {hasImage && <HeroImageBg url={heroImageUrl!} overlay={`${sc}dd`} />}

      {/* Top hero section — 50% of page */}
      <div style={{ backgroundColor: hasImage ? "transparent" : sc, color: "#fff", padding: "70px 56px 48px", position: "relative", flex: "0 0 50%", zIndex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: 240, height: "100%", background: `linear-gradient(135deg, ${pc}, ${hexToTint(pc, 0.6)})`, clipPath: "polygon(30% 0, 100% 0, 100% 100%, 0% 100%)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          {logoUrl && <img src={logoUrl} alt={partnerNaam} style={{ height: 52, marginBottom: 32, objectFit: "contain" }} />}
          <p style={{ fontSize: 14, fontWeight: 600, textTransform: "uppercase", letterSpacing: 3, color: pc, marginBottom: 10 }}>{heroTitle}</p>
          <h1 style={{ fontSize: 42, fontWeight: 800, margin: 0, lineHeight: 1.15 }}>Verduurzaam je huis</h1>
          <h1 style={{ fontSize: 42, fontWeight: 800, margin: "6px 0 0", lineHeight: 1.15, color: pc }}>
            {categoryLabel ? `met onze ${categoryLabel}` : "met onze oplossing"}
          </h1>
          {productNaam && <p style={{ fontSize: 20, fontWeight: 500, marginTop: 16, opacity: 0.9 }}>{productNaam}</p>}
        </div>
      </div>

      {/* Bottom content section — remaining 50% */}
      <div style={{ padding: "48px 56px", flex: 1, display: "flex", flexDirection: "column", zIndex: 1, backgroundColor: hasImage ? "rgba(255,255,255,0.96)" : "transparent" }}>
        <div style={{ display: "flex", gap: 48, marginBottom: 40 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: pc, marginBottom: 10 }}>Opgesteld voor</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: sc, margin: 0 }}>{klantNaam}</p>
            {klantAdres && <p style={{ margin: "6px 0 0", color: "#555", fontSize: 14 }}>{klantAdres}</p>}
            {(klantPostcode || klantPlaats) && <p style={{ margin: "3px 0 0", color: "#555", fontSize: 14 }}>{klantPostcode} {klantPlaats}</p>}
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: pc, marginBottom: 10 }}>Uw adviseur</p>
            <p style={{ fontSize: 17, fontWeight: 600, color: sc, margin: 0 }}>{adviseurNaam}</p>
            <p style={{ margin: "6px 0 0", color: "#555", fontSize: 13 }}>Offertenr: {offertenummer}</p>
            <p style={{ margin: "3px 0 0", color: "#555", fontSize: 13 }}>{datum}</p>
          </div>
        </div>
        {introTekst && (
          <div style={{ backgroundColor: pcTint, borderLeft: `4px solid ${pc}`, padding: "18px 24px", borderRadius: 10, marginBottom: 28 }}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: "#333" }}>{introTekst}</p>
          </div>
        )}
        <div style={{ flex: 1 }} />
        {slogan && <p style={{ fontSize: 16, fontStyle: "italic", color: pc, marginBottom: 20 }}>"{slogan}"</p>}
        <div style={{ backgroundColor: pcTint, padding: "18px 0", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${hexToTint(pc, 0.15)}`, paddingLeft: 0, paddingRight: 0 }}>
          <div style={{ display: "flex", gap: 24, fontSize: 12, color: "#666" }}>
            {badges.map((b, i) => <span key={i}>✓ {b}</span>)}
          </div>
          {telefoon && <span style={{ fontSize: 13, fontWeight: 600, color: sc }}>{telefoon}</span>}
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   2 — HERO SPLIT
   ════════════════════════════════════════════════════════════ */
export const HeroSplit: React.FC<VoorbladProps> = (props) => {
  const { pc, sc, logoUrl, partnerNaam, klantNaam, offertenummer, adviseurNaam, datum, categoryLabel, introTekst, pcTint, slogan, klantAdres, klantPostcode, klantPlaats, heroImageUrl, heroTitle = "Offerte" } = props;

  return (
    <div style={{ ...rootStyle, flexDirection: "row" }}>
      {/* Left panel — 42% */}
      <div style={{ width: "42%", backgroundColor: sc, color: "#fff", padding: "64px 40px", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
        {heroImageUrl && <HeroImageBg url={heroImageUrl} overlay={`${sc}cc`} />}
        <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
          {logoUrl && <img src={logoUrl} alt={partnerNaam} style={{ height: 44, marginBottom: 48, objectFit: "contain", alignSelf: "flex-start" }} />}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <p style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 3, color: pc, marginBottom: 10 }}>{heroTitle}</p>
            <h1 style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.2, margin: 0 }}>Uw persoonlijke offerte</h1>
            <div style={{ width: 48, height: 3, backgroundColor: pc, borderRadius: 2, marginTop: 20, marginBottom: 28 }} />
            <p style={{ fontSize: 15, opacity: 0.8, lineHeight: 1.7 }}>{categoryLabel ? `Voor uw ${categoryLabel.toLowerCase()} project` : "Voor uw verduurzamingsproject"}</p>
          </div>
          {slogan && <p style={{ fontSize: 14, fontStyle: "italic", color: pc, marginTop: "auto", paddingTop: 24 }}>"{slogan}"</p>}
        </div>
      </div>

      {/* Right panel — 58% */}
      <div style={{ width: "58%", padding: "64px 44px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: pc, marginBottom: 10 }}>Opgesteld voor</p>
          <p style={{ fontSize: 26, fontWeight: 700, color: sc, margin: 0 }}>{klantNaam}</p>
          {klantAdres && <p style={{ margin: "6px 0 0", color: "#555", fontSize: 14 }}>{klantAdres}</p>}
          {(klantPostcode || klantPlaats) && <p style={{ margin: "3px 0 0", color: "#555", fontSize: 14 }}>{klantPostcode} {klantPlaats}</p>}
        </div>
        <div style={{ marginBottom: 40, padding: "20px 24px", backgroundColor: pcTint, borderRadius: 14 }}>
          <p style={{ fontSize: 13, color: "#555", margin: "4px 0" }}>Adviseur: <strong>{adviseurNaam}</strong></p>
          <p style={{ fontSize: 13, color: "#555", margin: "4px 0" }}>Offertenr: <strong>{offertenummer}</strong></p>
          <p style={{ fontSize: 13, color: "#555", margin: "4px 0" }}>Datum: <strong>{datum}</strong></p>
        </div>
        {introTekst && <p style={{ fontSize: 14, lineHeight: 1.8, color: "#333" }}>{introTekst}</p>}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   3 — HERO MINIMAL
   ════════════════════════════════════════════════════════════ */
export const HeroMinimal: React.FC<VoorbladProps> = (props) => {
  const { pc, sc, logoUrl, partnerNaam, klantNaam, offertenummer, adviseurNaam, datum, introTekst, klantAdres, klantPostcode, klantPlaats, heroImageUrl, heroTitle = "Offerte" } = props;

  return (
    <div style={{ ...rootStyle, padding: "80px 64px" }}>
      {heroImageUrl && (
        <div style={{ position: "absolute", top: 0, right: 0, width: "45%", height: "55%", overflow: "hidden", borderBottomLeftRadius: 48, opacity: 0.12 }}>
          <img src={heroImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}

      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 72, position: "relative", zIndex: 1 }}>
        {logoUrl && <img src={logoUrl} alt={partnerNaam} style={{ height: 44, objectFit: "contain" }} />}
        <div style={{ textAlign: "right", fontSize: 12, color: "#999" }}>
          <p style={{ margin: "3px 0" }}>{offertenummer}</p>
          <p style={{ margin: "3px 0" }}>{datum}</p>
        </div>
      </div>

      {/* Center content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", zIndex: 1 }}>
        <p style={{ fontSize: 15, fontWeight: 700, textTransform: "uppercase", letterSpacing: 5, color: pc, marginBottom: 20 }}>{heroTitle}</p>
        <h1 style={{ fontSize: 56, fontWeight: 800, color: sc, margin: 0, lineHeight: 1.05 }}>Uw persoonlijke<br />voorstel</h1>
        <div style={{ width: 72, height: 4, backgroundColor: pc, borderRadius: 2, margin: "32px 0" }} />
        <p style={{ fontSize: 18, color: "#555", margin: 0 }}>Opgesteld voor <strong style={{ color: sc }}>{klantNaam}</strong></p>
        {klantAdres && <p style={{ fontSize: 15, color: "#888", margin: "6px 0 0" }}>{klantAdres}, {klantPostcode} {klantPlaats}</p>}
        {introTekst && <p style={{ fontSize: 14, lineHeight: 1.8, color: "#555", marginTop: 32, maxWidth: 520 }}>{introTekst}</p>}
      </div>

      {/* Footer */}
      <div style={{ borderTop: `2px solid ${pc}`, paddingTop: 20, fontSize: 12, color: "#999", position: "relative", zIndex: 1 }}>
        <p style={{ margin: 0 }}>Door: {adviseurNaam} • {partnerNaam}</p>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   4 — HERO GRADIENT
   ════════════════════════════════════════════════════════════ */
export const HeroGradient: React.FC<VoorbladProps> = (props) => {
  const { pc, sc, logoUrl, partnerNaam, klantNaam, offertenummer, adviseurNaam, datum, categoryLabel, introTekst, badges, klantAdres, klantPostcode, klantPlaats, heroImageUrl, heroTitle = "Offerte" } = props;

  return (
    <div style={{ ...rootStyle, background: heroImageUrl ? "none" : `linear-gradient(160deg, ${sc} 0%, ${hexToTint(pc, 0.9)} 100%)`, color: "#fff", padding: "64px 56px" }}>
      {heroImageUrl && <HeroImageBg url={heroImageUrl} overlay={`linear-gradient(160deg, ${sc}ee 0%, ${hexToTint(pc, 0.85)} 100%)`} />}

      <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
        {logoUrl && <img src={logoUrl} alt={partnerNaam} style={{ height: 48, marginBottom: 56, objectFit: "contain", alignSelf: "flex-start" }} />}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p style={{ fontSize: 16, fontWeight: 600, textTransform: "uppercase", letterSpacing: 5, marginBottom: 16, opacity: 0.7 }}>{heroTitle}</p>
          <h1 style={{ fontSize: 52, fontWeight: 800, margin: 0, lineHeight: 1.1 }}>{categoryLabel ? `${categoryLabel} offerte` : "Uw offerte"}</h1>
          <h2 style={{ fontSize: 28, fontWeight: 400, margin: "12px 0 0", opacity: 0.9 }}>voor {klantNaam}</h2>
          {klantAdres && <p style={{ fontSize: 15, opacity: 0.7, margin: "10px 0 0" }}>{klantAdres}, {klantPostcode} {klantPlaats}</p>}
          {introTekst && (
            <p style={{ fontSize: 15, lineHeight: 1.8, marginTop: 40, maxWidth: 520, opacity: 0.9 }}>{introTekst}</p>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: 24 }}>
          <div style={{ fontSize: 13, opacity: 0.7 }}>
            <p style={{ margin: "3px 0" }}>{adviseurNaam}</p>
            <p style={{ margin: "3px 0" }}>{offertenummer} • {datum}</p>
          </div>
          <div style={{ display: "flex", gap: 20, fontSize: 12, opacity: 0.6 }}>
            {badges.map((b, i) => <span key={i}>✓ {b}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   5 — HERO PHOTO
   ════════════════════════════════════════════════════════════ */
export const HeroPhoto: React.FC<VoorbladProps> = (props) => {
  const { pc, sc, logoUrl, partnerNaam, klantNaam, offertenummer, adviseurNaam, datum, categoryLabel, introTekst, pcTint, klantAdres, klantPostcode, klantPlaats, heroImageUrl, heroTitle = "Offerte" } = props;

  return (
    <div style={{ ...rootStyle }}>
      {/* Top image area — 45% */}
      <div style={{ height: "45%", flexShrink: 0, background: heroImageUrl ? "none" : `linear-gradient(135deg, ${sc}, ${pc})`, display: "flex", alignItems: "flex-end", padding: "0 56px 36px", position: "relative", overflow: "hidden" }}>
        {heroImageUrl && <HeroImageBg url={heroImageUrl} overlay={`${sc}bb`} />}
        {logoUrl && <img src={logoUrl} alt={partnerNaam} style={{ position: "absolute", top: 36, left: 56, height: 40, objectFit: "contain", zIndex: 2 }} />}
        <div style={{ position: "relative", zIndex: 2 }}>
          <p style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 3, color: pc, marginBottom: 6, opacity: 0.9 }}>{heroTitle}</p>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: "#fff", margin: 0 }}>
            {categoryLabel || "Offerte"}
          </h1>
        </div>
      </div>

      {/* Bottom content — 55% */}
      <div style={{ flex: 1, padding: "44px 56px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, marginBottom: 36 }}>
          <div style={{ backgroundColor: pcTint, borderRadius: 14, padding: "22px 26px" }}>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: pc, marginBottom: 10 }}>Voor</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: sc, margin: 0 }}>{klantNaam}</p>
            {klantAdres && <p style={{ fontSize: 13, color: "#555", margin: "6px 0 0" }}>{klantAdres}</p>}
            {(klantPostcode || klantPlaats) && <p style={{ fontSize: 13, color: "#555", margin: "3px 0 0" }}>{klantPostcode} {klantPlaats}</p>}
          </div>
          <div style={{ backgroundColor: pcTint, borderRadius: 14, padding: "22px 26px" }}>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: pc, marginBottom: 10 }}>Door</p>
            <p style={{ fontSize: 17, fontWeight: 600, color: sc, margin: 0 }}>{adviseurNaam}</p>
            <p style={{ fontSize: 13, color: "#555", margin: "6px 0 0" }}>{offertenummer}</p>
            <p style={{ fontSize: 13, color: "#555", margin: "3px 0 0" }}>{datum}</p>
          </div>
        </div>
        {introTekst && <p style={{ fontSize: 14, lineHeight: 1.8, color: "#333" }}>{introTekst}</p>}
        <div style={{ flex: 1 }} />
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
