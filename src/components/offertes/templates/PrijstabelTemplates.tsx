import React, { Fragment } from "react";
import { useProductMetaMap, type ProductComponentInfo } from "@/hooks/producten/useProductMetaMap";

interface PrijstabelProps {
  pc: string;
  sc: string;
  pcTint: string;
  pcTint2: string;
  regels: Array<{
    product_id?: string;
    aantal: number;
    omschrijving: string;
    offerte_tekst?: string;
    prijs_per_stuk: number;
    btw_percentage: number;
    korting_percentage: number;
    korting_bedrag?: number;
    korting_type?: "percentage" | "bedrag";
  }>;
  subtotaal: number;
  btwBedrag: number;
  totaalBedrag: number;
  formatCurrency: (n: number) => string;
  isThumbnail?: boolean;
  offerteKortingType?: "percentage" | "bedrag" | null;
  offerteKortingWaarde?: number;
}

const regelSub = (r: PrijstabelProps["regels"][0]) => {
  const bruto = r.aantal * r.prijs_per_stuk;
  if (r.korting_type === "bedrag") return bruto - (r.korting_bedrag || 0);
  return bruto * (1 - (r.korting_percentage || 0) / 100);
};

const regelKortingLabel = (r: PrijstabelProps["regels"][0]) => {
  if (r.korting_type === "bedrag" && (r.korting_bedrag || 0) > 0) return `€${r.korting_bedrag}`;
  if ((r.korting_percentage || 0) > 0) return `${r.korting_percentage}%`;
  return null;
};

/* Berekent bruto subtotaal (voor korting op offerte-niveau) */
const brutoSubtotaal = (regels: PrijstabelProps["regels"]) =>
  regels.reduce((s, r) => s + regelSub(r), 0);

const btwLabel = (regels: PrijstabelProps["regels"]) => {
  const pcts = [...new Set(regels.map(r => r.btw_percentage))];
  if (pcts.length === 1) return `BTW (${pcts[0]}%)`;
  return `BTW (${pcts.join("% / ")}%)`;
};

function useAssemblageMap(regels: PrijstabelProps["regels"]) {
  const ids = Array.from(new Set(regels.map((r) => r.product_id).filter((id): id is string => !!id)));
  const { data } = useProductMetaMap(ids);
  return data ?? {};
}

function componentenVoor(map: Record<string, { is_assemblage: boolean; componenten: ProductComponentInfo[] }>, r: PrijstabelProps["regels"][0]): ProductComponentInfo[] {
  if (!r.product_id) return [];
  const m = map[r.product_id];
  return m?.is_assemblage ? m.componenten : [];
}

const OfferteKortingBlock: React.FC<{
  pc: string;
  brutoSub: number;
  offerteKortingType?: "percentage" | "bedrag" | null;
  offerteKortingWaarde?: number;
  subtotaal: number;
  btwBedrag: number;
  totaalBedrag: number;
  formatCurrency: (n: number) => string;
  regels: PrijstabelProps["regels"];
}> = ({ brutoSub, offerteKortingType, offerteKortingWaarde, subtotaal, btwBedrag, totaalBedrag, formatCurrency, pc, regels }) => {
  const hasOfferteKorting = offerteKortingType && (offerteKortingWaarde || 0) > 0;
  const kortingBedrag = hasOfferteKorting
    ? (offerteKortingType === "percentage" ? brutoSub * ((offerteKortingWaarde || 0) / 100) : (offerteKortingWaarde || 0))
    : 0;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 12, color: "#666" }}>
        <span>Subtotaal excl. BTW</span><span>{formatCurrency(brutoSub)}</span>
      </div>
      {hasOfferteKorting && (
        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 12, color: pc, fontWeight: 600 }}>
          <span>Korting {offerteKortingType === "percentage" ? `(${offerteKortingWaarde}%)` : "(vast bedrag)"}</span>
          <span>-{formatCurrency(kortingBedrag)}</span>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 12, color: "#666" }}>
        <span>{btwLabel(regels)}</span><span>{formatCurrency(btwBedrag)}</span>
      </div>
    </>
  );
};

export const PriceClassic: React.FC<PrijstabelProps> = ({ pc, sc, pcTint2, regels, subtotaal, btwBedrag, totaalBedrag, formatCurrency, offerteKortingType, offerteKortingWaarde }) => (
  <div style={{ fontFamily: "'Rubik', sans-serif" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
      <thead>
        <tr>
          <th style={{ backgroundColor: sc, color: "#fff", padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: 11 }}>Aantal</th>
          <th style={{ backgroundColor: sc, color: "#fff", padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: 11 }}>Omschrijving</th>
          <th style={{ backgroundColor: sc, color: "#fff", padding: "10px 12px", textAlign: "right", fontWeight: 600, fontSize: 11 }}>Prijs</th>
          <th style={{ backgroundColor: sc, color: "#fff", padding: "10px 12px", textAlign: "right", fontWeight: 600, fontSize: 11 }}>Korting</th>
          <th style={{ backgroundColor: sc, color: "#fff", padding: "10px 12px", textAlign: "right", fontWeight: 600, fontSize: 11 }}>BTW</th>
          <th style={{ backgroundColor: sc, color: "#fff", padding: "10px 12px", textAlign: "right", fontWeight: 600, fontSize: 11 }}>Subtotaal</th>
        </tr>
      </thead>
      <tbody>
        {regels.map((r, i) => {
          const sub = regelSub(r);
          const kLabel = regelKortingLabel(r);
          return (
            <tr key={i} style={{ borderBottom: `1px solid ${pcTint2}`, backgroundColor: i % 2 === 0 ? "#fff" : "rgba(0,0,0,0.02)" }}>
              <td style={{ padding: "10px 12px", fontWeight: 500 }}>{r.aantal}</td>
              <td style={{ padding: "10px 12px" }}>{r.omschrijving}{r.offerte_tekst && <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{r.offerte_tekst}</div>}</td>
              <td style={{ padding: "10px 12px", textAlign: "right" }}>{formatCurrency(r.prijs_per_stuk)}</td>
              <td style={{ padding: "10px 12px", textAlign: "right", color: kLabel ? pc : "#ccc" }}>{kLabel || "—"}</td>
              <td style={{ padding: "10px 12px", textAlign: "right" }}>{r.btw_percentage}%</td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>{formatCurrency(sub)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
      <div style={{ width: 260 }}>
        <OfferteKortingBlock pc={pc} brutoSub={brutoSubtotaal(regels)} offerteKortingType={offerteKortingType} offerteKortingWaarde={offerteKortingWaarde} subtotaal={subtotaal} btwBedrag={btwBedrag} totaalBedrag={totaalBedrag} formatCurrency={formatCurrency} regels={regels} />
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontSize: 16, fontWeight: 800, color: sc, borderTop: `3px solid ${pc}`, marginTop: 4 }}>
          <span>Totaal incl. BTW</span><span>{formatCurrency(totaalBedrag)}</span>
        </div>
      </div>
    </div>
  </div>
);

export const PriceModern: React.FC<PrijstabelProps> = ({ pc, sc, pcTint, regels, subtotaal, btwBedrag, totaalBedrag, formatCurrency, offerteKortingType, offerteKortingWaarde }) => (
  <div style={{ fontFamily: "'Rubik', sans-serif" }}>
    {regels.map((r, i) => {
      const sub = regelSub(r);
      const kLabel = regelKortingLabel(r);
      return (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", backgroundColor: i % 2 === 0 ? pcTint : "#fff", borderRadius: 8, marginBottom: 4 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: sc, margin: 0 }}>{r.omschrijving}</p>
            {r.offerte_tekst && <p style={{ fontSize: 10, color: "#777", margin: "2px 0 0" }}>{r.offerte_tekst}</p>}
            <p style={{ fontSize: 10, color: "#888", margin: "2px 0 0" }}>{r.aantal}× {formatCurrency(r.prijs_per_stuk)} {kLabel ? `(-${kLabel})` : ""} · {r.btw_percentage}% BTW</p>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: sc }}>{formatCurrency(sub)}</span>
        </div>
      );
    })}
    <div style={{ marginTop: 16, padding: "16px 20px", backgroundColor: sc, borderRadius: 12, color: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
        <span>Subtotaal</span><span>{formatCurrency(brutoSubtotaal(regels))}</span>
      </div>
      {offerteKortingType && (offerteKortingWaarde || 0) > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.85, marginBottom: 4, color: "#90EE90" }}>
          <span>Korting {offerteKortingType === "percentage" ? `(${offerteKortingWaarde}%)` : ""}</span>
          <span>-{formatCurrency(offerteKortingType === "percentage" ? brutoSubtotaal(regels) * ((offerteKortingWaarde || 0) / 100) : (offerteKortingWaarde || 0))}</span>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
        <span>{btwLabel(regels)}</span><span>{formatCurrency(btwBedrag)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 800, borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: 8 }}>
        <span>Totaal</span><span>{formatCurrency(totaalBedrag)}</span>
      </div>
    </div>
  </div>
);

export const PriceCompact: React.FC<PrijstabelProps> = ({ pc, sc, regels, subtotaal, btwBedrag, totaalBedrag, formatCurrency, offerteKortingType, offerteKortingWaarde }) => (
  <div style={{ fontFamily: "'Rubik', sans-serif" }}>
    {regels.map((r, i) => {
      const sub = regelSub(r);
      return (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eee", fontSize: 12 }}>
          <span style={{ color: "#333" }}>{r.aantal}× {r.omschrijving}{r.offerte_tekst && <span style={{ fontSize: 10, color: "#888" }}> — {r.offerte_tekst}</span>}</span>
          <span style={{ fontWeight: 600, color: sc }}>{formatCurrency(sub)} <span style={{ fontSize: 10, fontWeight: 400, color: "#999" }}>({r.btw_percentage}%)</span></span>
        </div>
      );
    })}
    {offerteKortingType && (offerteKortingWaarde || 0) > 0 && (
      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 12, color: pc, fontWeight: 600 }}>
        <span>Korting {offerteKortingType === "percentage" ? `(${offerteKortingWaarde}%)` : ""}</span>
        <span>-{formatCurrency(offerteKortingType === "percentage" ? brutoSubtotaal(regels) * ((offerteKortingWaarde || 0) / 100) : (offerteKortingWaarde || 0))}</span>
      </div>
    )}
    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", fontSize: 16, fontWeight: 800, color: sc, borderTop: `2px solid ${pc}`, marginTop: 8 }}>
      <span>Totaal incl. BTW</span><span>{formatCurrency(totaalBedrag)}</span>
    </div>
    <p style={{ fontSize: 10, color: "#999", marginTop: 4 }}>Subtotaal: {formatCurrency(subtotaal)} + {btwLabel(regels)}: {formatCurrency(btwBedrag)}</p>
  </div>
);

export const PriceDetailed: React.FC<PrijstabelProps> = ({ pc, sc, pcTint, pcTint2, regels, subtotaal, btwBedrag, totaalBedrag, formatCurrency, offerteKortingType, offerteKortingWaarde }) => (
  <div style={{ fontFamily: "'Rubik', sans-serif" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, border: `1px solid ${pcTint2}`, borderRadius: 8, overflow: "hidden" }}>
      <thead>
        <tr style={{ backgroundColor: pc, color: "#fff" }}>
          <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600 }}>#</th>
          <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600 }}>Omschrijving</th>
          <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>Aantal</th>
          <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>Eenheidsprijs</th>
          <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>Korting</th>
          <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>BTW</th>
          <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>Subtotaal</th>
        </tr>
      </thead>
      <tbody>
        {regels.map((r, i) => {
          const sub = regelSub(r);
          const kLabel = regelKortingLabel(r);
          return (
            <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#fff" : pcTint }}>
              <td style={{ padding: "8px 12px", color: "#999" }}>{i + 1}</td>
              <td style={{ padding: "8px 12px", fontWeight: 500, color: sc }}>{r.omschrijving}{r.offerte_tekst && <div style={{ fontSize: 10, color: "#888", fontWeight: 400, marginTop: 2 }}>{r.offerte_tekst}</div>}</td>
              <td style={{ padding: "8px 12px", textAlign: "right" }}>{r.aantal}</td>
              <td style={{ padding: "8px 12px", textAlign: "right" }}>{formatCurrency(r.prijs_per_stuk)}</td>
              <td style={{ padding: "8px 12px", textAlign: "right", color: kLabel ? pc : "#ccc" }}>{kLabel || "—"}</td>
              <td style={{ padding: "8px 12px", textAlign: "right" }}>{r.btw_percentage}%</td>
              <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600 }}>{formatCurrency(sub)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
      <div style={{ width: 280, backgroundColor: pcTint, borderRadius: 10, padding: "12px 16px" }}>
        <OfferteKortingBlock pc={pc} brutoSub={brutoSubtotaal(regels)} offerteKortingType={offerteKortingType} offerteKortingWaarde={offerteKortingWaarde} subtotaal={subtotaal} btwBedrag={btwBedrag} totaalBedrag={totaalBedrag} formatCurrency={formatCurrency} regels={regels} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 800, color: sc, borderTop: `3px solid ${pc}`, paddingTop: 8 }}>
          <span>Totaal</span><span>{formatCurrency(totaalBedrag)}</span>
        </div>
      </div>
    </div>
  </div>
);

export const prijstabelTemplates: Record<string, React.FC<PrijstabelProps>> = {
  "price-classic": PriceClassic,
  "price-modern": PriceModern,
  "price-compact": PriceCompact,
  "price-detailed": PriceDetailed,
};
