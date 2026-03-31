import React from "react";

interface VoorwaardenProps {
  pc: string;
  sc: string;
  pcTint: string;
  pcTint2: string;
  partnerNaam: string;
  adviseurNaam: string;
  klantNaam: string;
  datum: string;
  garantieVw: string | null;
  installTermijn: string | null;
  betalingsvoorwaarden: string | null;
  notities: string | null;
  akkoordTekst: string;
  isThumbnail?: boolean;
  partnerHandtekening?: string | null;
  partnerHandtekeningDatum?: string | null;
}

export const TermsSimple: React.FC<VoorwaardenProps> = ({ pc, sc, pcTint, partnerNaam, adviseurNaam, klantNaam, datum, garantieVw, installTermijn, betalingsvoorwaarden, notities, akkoordTekst, partnerHandtekening, partnerHandtekeningDatum }) => (
  <div style={{ fontFamily: "'Rubik', sans-serif" }}>
    {garantieVw && (
      <div style={{ backgroundColor: pcTint, borderRadius: 10, padding: "14px 18px", marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: sc, margin: "0 0 6px" }}>Garantievoorwaarden</p>
        <p style={{ fontSize: 11, color: "#555", margin: 0, lineHeight: 1.6 }}>{garantieVw}</p>
      </div>
    )}
    {installTermijn && (
      <p style={{ fontSize: 12, color: "#555", marginBottom: 12 }}>
        <strong style={{ color: sc }}>Installatietermijn:</strong> {installTermijn}
      </p>
    )}
    {betalingsvoorwaarden && (
      <p style={{ fontSize: 11, color: "#666", marginBottom: 12 }}>
        <strong>Betalingsvoorwaarden:</strong> {betalingsvoorwaarden}
      </p>
    )}
    {notities && (
      <div style={{ marginBottom: 16, fontSize: 11, color: "#666" }}>
        <strong>Opmerkingen:</strong>
        <p style={{ margin: "4px 0 0", whiteSpace: "pre-wrap" }}>{notities}</p>
      </div>
    )}
    {akkoordTekst && (
      <div style={{ backgroundColor: pcTint, borderRadius: 10, padding: "14px 18px", marginBottom: 16 }}>
        <p style={{ fontSize: 11, color: "#555", margin: 0, lineHeight: 1.6 }}>{akkoordTekst}</p>
      </div>
    )}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 20, borderTop: `1px solid ${pcTint}`, paddingTop: 20 }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: sc, margin: "0 0 8px" }}>Voor akkoord — {partnerNaam}</p>
        <p style={{ fontSize: 12, color: "#555", margin: "4px 0" }}>{adviseurNaam}</p>
        <p style={{ fontSize: 12, color: "#888", margin: "4px 0" }}>Datum: {partnerHandtekeningDatum || datum}</p>
        {partnerHandtekening ? (
          <img src={partnerHandtekening} alt="Handtekening" style={{ height: 40, marginTop: 8, objectFit: "contain" }} />
        ) : (
          <div style={{ borderBottom: "1px solid #ccc", height: 40, marginTop: 16 }} />
        )}
      </div>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: sc, margin: "0 0 8px" }}>Voor akkoord — Klant</p>
        <p style={{ fontSize: 12, color: "#555", margin: "4px 0" }}>{klantNaam}</p>
        <p style={{ fontSize: 12, color: "#888", margin: "4px 0" }}>Datum: ____________________</p>
        <div style={{ borderBottom: "1px solid #ccc", height: 40, marginTop: 16 }} />
      </div>
    </div>
  </div>
);

export const TermsBoxed: React.FC<VoorwaardenProps> = ({ pc, sc, pcTint, pcTint2, partnerNaam, adviseurNaam, klantNaam, datum, garantieVw, installTermijn, betalingsvoorwaarden, notities, akkoordTekst, partnerHandtekening, partnerHandtekeningDatum }) => (
  <div style={{ fontFamily: "'Rubik', sans-serif" }}>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
      {garantieVw && (
        <div style={{ border: `1px solid ${pcTint2}`, borderRadius: 10, padding: "14px 16px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: pc, margin: "0 0 6px" }}>Garantie</p>
          <p style={{ fontSize: 11, color: "#555", margin: 0, lineHeight: 1.6 }}>{garantieVw}</p>
        </div>
      )}
      {installTermijn && (
        <div style={{ border: `1px solid ${pcTint2}`, borderRadius: 10, padding: "14px 16px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: pc, margin: "0 0 6px" }}>Installatie</p>
          <p style={{ fontSize: 11, color: "#555", margin: 0 }}>{installTermijn}</p>
        </div>
      )}
      {betalingsvoorwaarden && (
        <div style={{ border: `1px solid ${pcTint2}`, borderRadius: 10, padding: "14px 16px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: pc, margin: "0 0 6px" }}>Betaling</p>
          <p style={{ fontSize: 11, color: "#555", margin: 0 }}>{betalingsvoorwaarden}</p>
        </div>
      )}
      {notities && (
        <div style={{ border: `1px solid ${pcTint2}`, borderRadius: 10, padding: "14px 16px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: pc, margin: "0 0 6px" }}>Opmerkingen</p>
          <p style={{ fontSize: 11, color: "#555", margin: 0, whiteSpace: "pre-wrap" }}>{notities}</p>
        </div>
      )}
    </div>
    {akkoordTekst && (
      <div style={{ backgroundColor: pcTint, borderRadius: 10, padding: "14px 18px", marginBottom: 16 }}>
        <p style={{ fontSize: 11, color: "#555", margin: 0, lineHeight: 1.6 }}>{akkoordTekst}</p>
      </div>
    )}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 20, borderTop: `2px solid ${pc}`, paddingTop: 20 }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: sc, margin: "0 0 8px" }}>Handtekening {partnerNaam}</p>
        <p style={{ fontSize: 11, color: "#888", margin: "4px 0" }}>{adviseurNaam} — {partnerHandtekeningDatum || datum}</p>
        {partnerHandtekening ? (
          <img src={partnerHandtekening} alt="Handtekening" style={{ height: 40, marginTop: 8, objectFit: "contain" }} />
        ) : (
          <div style={{ borderBottom: "1px solid #ccc", height: 40, marginTop: 12 }} />
        )}
      </div>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: sc, margin: "0 0 8px" }}>Handtekening klant</p>
        <p style={{ fontSize: 11, color: "#888", margin: "4px 0" }}>{klantNaam}</p>
        <div style={{ borderBottom: "1px solid #ccc", height: 40, marginTop: 12 }} />
      </div>
    </div>
  </div>
);

export const TermsSidebar: React.FC<VoorwaardenProps> = ({ pc, sc, pcTint, partnerNaam, adviseurNaam, klantNaam, datum, garantieVw, installTermijn, betalingsvoorwaarden, notities, akkoordTekst, partnerHandtekening, partnerHandtekeningDatum }) => (
  <div style={{ display: "flex", gap: 24, fontFamily: "'Rubik', sans-serif" }}>
    <div style={{ flex: "0 0 45%", backgroundColor: pcTint, borderRadius: 12, padding: "20px 24px" }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: sc, margin: "0 0 12px" }}>Voorwaarden</p>
      {garantieVw && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: pc, margin: "0 0 4px" }}>Garantie</p>
          <p style={{ fontSize: 11, color: "#555", margin: 0, lineHeight: 1.5 }}>{garantieVw}</p>
        </div>
      )}
      {installTermijn && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: pc, margin: "0 0 4px" }}>Installatie</p>
          <p style={{ fontSize: 11, color: "#555", margin: 0 }}>{installTermijn}</p>
        </div>
      )}
      {betalingsvoorwaarden && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: pc, margin: "0 0 4px" }}>Betaling</p>
          <p style={{ fontSize: 11, color: "#555", margin: 0 }}>{betalingsvoorwaarden}</p>
        </div>
      )}
      {notities && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, color: pc, margin: "0 0 4px" }}>Opmerkingen</p>
          <p style={{ fontSize: 11, color: "#555", margin: 0, whiteSpace: "pre-wrap" }}>{notities}</p>
        </div>
      )}
    </div>
    <div style={{ flex: 1 }}>
      {akkoordTekst && <p style={{ fontSize: 11, color: "#555", lineHeight: 1.6, marginBottom: 20 }}>{akkoordTekst}</p>}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: sc, margin: "0 0 8px" }}>Voor akkoord — {partnerNaam}</p>
        <p style={{ fontSize: 11, color: "#888", margin: "2px 0" }}>{adviseurNaam}</p>
        <p style={{ fontSize: 11, color: "#888", margin: "2px 0" }}>Datum: {partnerHandtekeningDatum || datum}</p>
        {partnerHandtekening ? (
          <img src={partnerHandtekening} alt="Handtekening" style={{ height: 36, marginTop: 8, objectFit: "contain" }} />
        ) : (
          <div style={{ borderBottom: "1px solid #ccc", height: 36, marginTop: 12 }} />
        )}
      </div>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: sc, margin: "0 0 8px" }}>Voor akkoord — Klant</p>
        <p style={{ fontSize: 11, color: "#888", margin: "2px 0" }}>{klantNaam}</p>
        <p style={{ fontSize: 11, color: "#888", margin: "2px 0" }}>Datum: ____________________</p>
        <div style={{ borderBottom: "1px solid #ccc", height: 36, marginTop: 12 }} />
      </div>
    </div>
  </div>
);

export const voorwaardenTemplates: Record<string, React.FC<VoorwaardenProps>> = {
  "terms-simple": TermsSimple,
  "terms-boxed": TermsBoxed,
  "terms-sidebar": TermsSidebar,
};
