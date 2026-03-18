import React from "react";

interface EnergieadviesProps {
  pc: string;
  sc: string;
  pcTint: string;
  capaciteit: number;
  besparing: number;
  terugverdientijd: number;
  investering: number;
  formatCurrency: (n: number) => string;
  isThumbnail?: boolean;
}

function hexToTint(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

export const EnergyCards: React.FC<EnergieadviesProps> = ({ pc, sc, pcTint, capaciteit, besparing, terugverdientijd, investering, formatCurrency }) => {
  const items = [
    ...(capaciteit > 0 ? [{ label: "Aanbevolen capaciteit", value: `${capaciteit} kWh`, icon: "⚡" }] : []),
    { label: "Geschatte investering", value: formatCurrency(investering), icon: "💰" },
    { label: "Jaarlijkse besparing", value: formatCurrency(besparing), icon: "📉" },
    { label: "Terugverdientijd", value: `${terugverdientijd} jaar`, icon: "⏱" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontFamily: "'Rubik', sans-serif" }}>
      {items.map((c, i) => (
        <div key={i} style={{ backgroundColor: i === items.length - 1 ? pc : pcTint, borderRadius: 12, padding: "20px 24px", color: i === items.length - 1 ? "#fff" : sc }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>{c.icon}</div>
          <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.8, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{c.label}</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
};

export const EnergyInfographic: React.FC<EnergieadviesProps> = ({ pc, sc, pcTint, capaciteit, besparing, terugverdientijd, investering, formatCurrency }) => {
  const roiPercent = Math.min((besparing * 15 / investering) * 100, 100);
  return (
    <div style={{ fontFamily: "'Rubik', sans-serif" }}>
      <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          {capaciteit > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#888", margin: "0 0 4px", textTransform: "uppercase" }}>Capaciteit</p>
              <p style={{ fontSize: 28, fontWeight: 800, color: pc, margin: 0 }}>{capaciteit} kWh</p>
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#888", margin: "0 0 4px", textTransform: "uppercase" }}>Jaarlijkse besparing</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: sc, margin: 0 }}>{formatCurrency(besparing)}</p>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#888", margin: "0 0 4px", textTransform: "uppercase" }}>Investering</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: sc, margin: 0 }}>{formatCurrency(investering)}</p>
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#888", margin: "0 0 4px", textTransform: "uppercase" }}>Terugverdientijd</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: pc, margin: 0 }}>{terugverdientijd} jaar</p>
          </div>
        </div>
      </div>
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, color: sc, margin: "0 0 10px" }}>Verwacht rendement over 15 jaar</p>
        <div style={{ height: 24, backgroundColor: "#f0f0f0", borderRadius: 12, overflow: "hidden", position: "relative" }}>
          <div style={{ height: "100%", width: `${roiPercent}%`, background: `linear-gradient(90deg, ${pc}, ${hexToTint(pc, 0.6)})`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 10, fontSize: 10, fontWeight: 700, color: "#fff" }}>
            {Math.round(roiPercent)}%
          </div>
        </div>
      </div>
    </div>
  );
};

export const EnergyMinimal: React.FC<EnergieadviesProps> = ({ pc, sc, capaciteit, besparing, terugverdientijd, investering, formatCurrency }) => (
  <div style={{ fontFamily: "'Rubik', sans-serif" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <tbody>
        {capaciteit > 0 && (
          <tr style={{ borderBottom: "1px solid #eee" }}>
            <td style={{ padding: "10px 0", color: "#555" }}>Aanbevolen capaciteit</td>
            <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 700, color: sc }}>{capaciteit} kWh</td>
          </tr>
        )}
        <tr style={{ borderBottom: "1px solid #eee" }}>
          <td style={{ padding: "10px 0", color: "#555" }}>Investering</td>
          <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 700, color: sc }}>{formatCurrency(investering)}</td>
        </tr>
        <tr style={{ borderBottom: "1px solid #eee" }}>
          <td style={{ padding: "10px 0", color: "#555" }}>Jaarlijkse besparing</td>
          <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 700, color: pc }}>{formatCurrency(besparing)}</td>
        </tr>
        <tr>
          <td style={{ padding: "10px 0", color: "#555" }}>Terugverdientijd</td>
          <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 700, color: pc }}>{terugverdientijd} jaar</td>
        </tr>
      </tbody>
    </table>
  </div>
);

export const energieadviesTemplates: Record<string, React.FC<EnergieadviesProps>> = {
  "energy-cards": EnergyCards,
  "energy-infographic": EnergyInfographic,
  "energy-minimal": EnergyMinimal,
};
