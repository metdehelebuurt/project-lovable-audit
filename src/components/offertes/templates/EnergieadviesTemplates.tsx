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
  co2Reductie?: number;
  maandBesparing?: number;
  besparingLevensduur?: number;
  zelfvoorzieningsgraad?: number;
  /** Label bij het capaciteitsveld, bijv. "Geïsoleerd oppervlak". */
  capaciteitLabel?: string;
  /** Eenheid bij het capaciteitsveld, standaard kWh. */
  capaciteitEenheid?: string;
}

function hexToTint(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

export const EnergyCards: React.FC<EnergieadviesProps> = ({ pc, sc, pcTint, capaciteit, besparing, terugverdientijd, investering, formatCurrency, co2Reductie, maandBesparing, besparingLevensduur , capaciteitLabel, capaciteitEenheid }) => {
  const items = [
    ...(capaciteit > 0 ? [{ label: capaciteitLabel ?? "Aanbevolen capaciteit", value: `${capaciteit} ${capaciteitEenheid ?? "kWh"}`, icon: "⚡" }] : []),
    { label: "Geschatte investering", value: formatCurrency(investering), icon: "💰" },
    { label: "Jaarlijkse besparing", value: formatCurrency(besparing), icon: "📉" },
    { label: "Terugverdientijd", value: `${terugverdientijd} jaar`, icon: "⏱" },
    ...(maandBesparing ? [{ label: "Maandelijkse besparing", value: formatCurrency(maandBesparing), icon: "📅" }] : []),
    ...(co2Reductie ? [{ label: "CO₂-reductie per jaar", value: `${co2Reductie} kg`, icon: "🌱" }] : []),
    ...(besparingLevensduur ? [{ label: "Besparing over 15 jaar", value: formatCurrency(besparingLevensduur), icon: "📊" }] : []),
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

export const EnergyInfographic: React.FC<EnergieadviesProps> = ({ pc, sc, pcTint, capaciteit, besparing, terugverdientijd, investering, formatCurrency, co2Reductie, besparingLevensduur , capaciteitLabel, capaciteitEenheid }) => {
  const roiPercent = Math.min((besparing * 15 / investering) * 100, 100);
  return (
    <div style={{ fontFamily: "'Rubik', sans-serif" }}>
      <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          {capaciteit > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#888", margin: "0 0 4px", textTransform: "uppercase" }}>Capaciteit</p>
              <p style={{ fontSize: 28, fontWeight: 800, color: pc, margin: 0 }}>{capaciteit} {capaciteitEenheid ?? "kWh"}</p>
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#888", margin: "0 0 4px", textTransform: "uppercase" }}>Jaarlijkse besparing</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: sc, margin: 0 }}>{formatCurrency(besparing)}</p>
          </div>
          {co2Reductie && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#888", margin: "0 0 4px", textTransform: "uppercase" }}>CO₂-reductie/jaar</p>
              <p style={{ fontSize: 28, fontWeight: 800, color: "#2E7D32", margin: 0 }}>{co2Reductie} kg</p>
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#888", margin: "0 0 4px", textTransform: "uppercase" }}>Investering</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: sc, margin: 0 }}>{formatCurrency(investering)}</p>
          </div>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#888", margin: "0 0 4px", textTransform: "uppercase" }}>Terugverdientijd</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: pc, margin: 0 }}>{terugverdientijd} jaar</p>
          </div>
          {besparingLevensduur && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#888", margin: "0 0 4px", textTransform: "uppercase" }}>Besparing 15 jaar</p>
              <p style={{ fontSize: 28, fontWeight: 800, color: "#1565C0", margin: 0 }}>{formatCurrency(besparingLevensduur)}</p>
            </div>
          )}
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

export const EnergyMinimal: React.FC<EnergieadviesProps> = ({ pc, sc, capaciteit, besparing, terugverdientijd, investering, formatCurrency, co2Reductie, maandBesparing, besparingLevensduur , capaciteitLabel, capaciteitEenheid }) => (
  <div style={{ fontFamily: "'Rubik', sans-serif" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <tbody>
        {capaciteit > 0 && (
          <tr style={{ borderBottom: "1px solid #eee" }}>
            <td style={{ padding: "10px 0", color: "#555" }}>{capaciteitLabel ?? "Aanbevolen capaciteit"}</td>
            <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 700, color: sc }}>{capaciteit} {capaciteitEenheid ?? "kWh"}</td>
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
        {maandBesparing && (
          <tr style={{ borderBottom: "1px solid #eee" }}>
            <td style={{ padding: "10px 0", color: "#555" }}>Maandelijkse besparing</td>
            <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 700, color: pc }}>{formatCurrency(maandBesparing)}</td>
          </tr>
        )}
        <tr style={{ borderBottom: "1px solid #eee" }}>
          <td style={{ padding: "10px 0", color: "#555" }}>Terugverdientijd</td>
          <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 700, color: pc }}>{terugverdientijd} jaar</td>
        </tr>
        {co2Reductie && (
          <tr style={{ borderBottom: "1px solid #eee" }}>
            <td style={{ padding: "10px 0", color: "#555" }}>CO₂-reductie per jaar</td>
            <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 700, color: "#2E7D32" }}>{co2Reductie} kg</td>
          </tr>
        )}
        {besparingLevensduur && (
          <tr>
            <td style={{ padding: "10px 0", color: "#555" }}>Besparing over 15 jaar</td>
            <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 700, color: pc }}>{formatCurrency(besparingLevensduur)}</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export const EnergyDashboard: React.FC<EnergieadviesProps> = ({ pc, sc, pcTint, capaciteit, besparing, terugverdientijd, investering, formatCurrency, co2Reductie, maandBesparing, besparingLevensduur, zelfvoorzieningsgraad , capaciteitLabel, capaciteitEenheid }) => {
  const roiPercent = Math.min((besparing * 15 / investering) * 100, 100);
  const co2Pct = co2Reductie ? Math.min((co2Reductie / 2000) * 100, 100) : 0;
  const zelfPct = zelfvoorzieningsgraad || 0;
  
  const ProgressBar = ({ value, color, label, displayValue }: { value: number; color: string; label: string; displayValue: string }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#666", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color }}>{displayValue}</span>
      </div>
      <div style={{ height: 10, backgroundColor: "#f0f0f0", borderRadius: 5, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.min(value, 100)}%`, backgroundColor: color, borderRadius: 5, transition: "width 0.3s" }} />
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Rubik', sans-serif" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Investering", value: formatCurrency(investering), sub: capaciteit > 0 ? `${capaciteit} ${capaciteitEenheid ?? "kWh"}` : undefined },
          { label: "Jaarlijks bespaard", value: formatCurrency(besparing), sub: maandBesparing ? `${formatCurrency(maandBesparing)}/mnd` : undefined },
          { label: "Terugverdientijd", value: `${terugverdientijd} jr`, sub: besparingLevensduur ? formatCurrency(besparingLevensduur) + " over 15 jr" : undefined },
        ].map((kpi, i) => (
          <div key={i} style={{ textAlign: "center", padding: "20px 12px", backgroundColor: i === 1 ? pc : pcTint, borderRadius: 12, color: i === 1 ? "#fff" : sc }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, opacity: 0.8, marginBottom: 6 }}>{kpi.label}</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{kpi.value}</div>
            {kpi.sub && <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>{kpi.sub}</div>}
          </div>
        ))}
      </div>

      <ProgressBar value={roiPercent} color={pc} label="Rendement 15 jaar" displayValue={`${Math.round(roiPercent)}%`} />
      {co2Reductie ? <ProgressBar value={co2Pct} color="#2E7D32" label="CO₂-reductie" displayValue={`${co2Reductie} kg/jaar`} /> : null}
      {zelfPct > 0 ? <ProgressBar value={zelfPct} color="#1565C0" label="Zelfvoorzieningsgraad" displayValue={`${Math.round(zelfPct)}%`} /> : null}
    </div>
  );
};

export const EnergyTimeline: React.FC<EnergieadviesProps> = ({ pc, sc, pcTint, besparing, investering, formatCurrency }) => {
  const years = Array.from({ length: 15 }, (_, i) => i + 1);
  const maxCumul = besparing * 15;
  
  return (
    <div style={{ fontFamily: "'Rubik', sans-serif" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 180, marginBottom: 16, padding: "0 4px" }}>
        {years.map(y => {
          const cumul = besparing * y;
          const height = maxCumul > 0 ? (cumul / maxCumul) * 160 : 0;
          const isPastBreakeven = cumul >= investering;
          return (
            <div key={y} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <div
                style={{
                  width: "100%",
                  height,
                  backgroundColor: isPastBreakeven ? pc : hexToTint(pc, 0.3),
                  borderRadius: "4px 4px 0 0",
                  position: "relative",
                  minHeight: 4,
                }}
              >
                {y === 1 || y === 5 || y === 10 || y === 15 ? (
                  <div style={{ position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)", fontSize: 8, fontWeight: 700, color: sc, whiteSpace: "nowrap" }}>
                    {formatCurrency(cumul)}
                  </div>
                ) : null}
              </div>
              <span style={{ fontSize: 8, color: "#999" }}>{y}</span>
            </div>
          );
        })}
      </div>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", backgroundColor: pcTint, borderRadius: 10 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>Investering</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: sc }}>{formatCurrency(investering)}</div>
        </div>
        <div style={{ width: 1, height: 32, backgroundColor: hexToTint(pc, 0.3) }} />
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>Totaal bespaard (15 jr)</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: pc }}>{formatCurrency(maxCumul)}</div>
        </div>
        <div style={{ width: 1, height: 32, backgroundColor: hexToTint(pc, 0.3) }} />
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>Netto winst</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: maxCumul - investering > 0 ? "#2E7D32" : "#c62828" }}>{formatCurrency(maxCumul - investering)}</div>
        </div>
      </div>
    </div>
  );
};

export const energieadviesTemplates: Record<string, React.FC<EnergieadviesProps>> = {
  "energy-cards": EnergyCards,
  "energy-infographic": EnergyInfographic,
  "energy-minimal": EnergyMinimal,
  "energy-dashboard": EnergyDashboard,
  "energy-timeline": EnergyTimeline,
};
