import React from "react";

interface ProductProps {
  pc: string;
  sc: string;
  pcTint: string;
  producten: Array<{
    naam: string;
    merk: string | null;
    model: string | null;
    omschrijving: string | null;
    afbeelding_url: string | null;
    garantie_jaren: number | null;
    certificeringen: string | null;
    specs: Record<string, any> | null;
    onderhoud: string | null;
  }>;
  isThumbnail?: boolean;
  index?: number;
}

function resolveImgUrl(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${url}`;
}

export const ProductList: React.FC<ProductProps> = ({ pc, sc, pcTint, producten }) => (
  <div style={{ fontFamily: "'Rubik', sans-serif" }}>
    {producten.map((prod, i) => (
      <div key={i} style={{ display: "flex", gap: 16, padding: "16px 0", borderBottom: i < producten.length - 1 ? `1px solid ${pcTint}` : "none" }}>
        {resolveImgUrl(prod.afbeelding_url) && (
          <img src={resolveImgUrl(prod.afbeelding_url)!} alt={prod.naam} style={{ width: 80, height: 80, objectFit: "contain", borderRadius: 8, backgroundColor: "#f8f8fa" }} />
        )}
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: sc, margin: 0 }}>{prod.naam}</h4>
          {prod.merk && <p style={{ fontSize: 11, color: pc, fontWeight: 600, margin: "2px 0" }}>{prod.merk}{prod.model ? ` — ${prod.model}` : ""}</p>}
          {prod.omschrijving && <p style={{ fontSize: 11, color: "#555", margin: "4px 0 0", lineHeight: 1.5 }}>{prod.omschrijving}</p>}
        </div>
      </div>
    ))}
  </div>
);

export const ProductCards: React.FC<ProductProps> = ({ pc, sc, pcTint, producten }) => (
  <div style={{ fontFamily: "'Rubik', sans-serif" }}>
    {producten.map((prod, i) => (
      <div key={i} style={{ border: `1px solid ${pcTint}`, borderRadius: 12, padding: 20, marginBottom: 16, display: "flex", gap: 20 }}>
        {resolveImgUrl(prod.afbeelding_url) && (
          <div style={{ width: 140, height: 140, borderRadius: 10, overflow: "hidden", backgroundColor: "#f8f8fa", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src={resolveImgUrl(prod.afbeelding_url)!} alt={prod.naam} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: 16, fontWeight: 700, color: sc, margin: "0 0 4px" }}>{prod.naam}</h4>
          {prod.merk && <p style={{ fontSize: 11, color: pc, fontWeight: 600, margin: "0 0 8px" }}>{prod.merk}{prod.model ? ` — ${prod.model}` : ""}</p>}
          {prod.omschrijving && <p style={{ fontSize: 11, color: "#555", lineHeight: 1.6, margin: 0 }}>{prod.omschrijving}</p>}
          <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
            {prod.garantie_jaren && (
              <span style={{ backgroundColor: pcTint, borderRadius: 6, padding: "4px 10px", fontSize: 10, color: pc, fontWeight: 600 }}>
                {prod.garantie_jaren} jaar garantie
              </span>
            )}
            {prod.certificeringen && (
              <span style={{ backgroundColor: pcTint, borderRadius: 6, padding: "4px 10px", fontSize: 10, color: sc, fontWeight: 500 }}>
                {prod.certificeringen}
              </span>
            )}
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const ProductGrid: React.FC<ProductProps> = ({ pc, sc, pcTint, producten }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontFamily: "'Rubik', sans-serif" }}>
    {producten.map((prod, i) => (
      <div key={i} style={{ backgroundColor: pcTint, borderRadius: 12, padding: 16, textAlign: "center" }}>
        {resolveImgUrl(prod.afbeelding_url) && (
          <img src={resolveImgUrl(prod.afbeelding_url)!} alt={prod.naam} style={{ width: 100, height: 100, objectFit: "contain", margin: "0 auto 12px" }} />
        )}
        <h4 style={{ fontSize: 14, fontWeight: 700, color: sc, margin: "0 0 4px" }}>{prod.naam}</h4>
        {prod.merk && <p style={{ fontSize: 10, color: pc, fontWeight: 600, margin: 0 }}>{prod.merk}{prod.model ? ` ${prod.model}` : ""}</p>}
      </div>
    ))}
  </div>
);

export const ProductSpotlight: React.FC<ProductProps> = ({ pc, sc, pcTint, producten }) => (
  <div style={{ fontFamily: "'Rubik', sans-serif" }}>
    {producten.map((prod, i) => {
      const specs = prod.specs && typeof prod.specs === "object" ? prod.specs : null;
      return (
        <div key={i} style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", gap: 24, marginBottom: 12 }}>
            {resolveImgUrl(prod.afbeelding_url) && (
              <div style={{ width: 160, height: 160, borderRadius: 12, overflow: "hidden", backgroundColor: "#f8f8fa", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src={resolveImgUrl(prod.afbeelding_url)!} alt={prod.naam} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: sc, margin: "0 0 4px" }}>{prod.naam}</h3>
              {prod.merk && <p style={{ fontSize: 12, color: pc, fontWeight: 600, margin: "0 0 8px" }}>{prod.merk}{prod.model ? ` — ${prod.model}` : ""}</p>}
              {prod.omschrijving && <p style={{ fontSize: 12, color: "#555", lineHeight: 1.6, margin: 0 }}>{prod.omschrijving}</p>}
            </div>
          </div>
          {specs && Object.keys(specs).length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <tbody>
                {Object.entries(specs).map(([key, val], si) => (
                  <tr key={key} style={{ backgroundColor: si % 2 === 0 ? "#fff" : pcTint }}>
                    <td style={{ padding: "6px 10px", fontWeight: 500, color: "#555", width: "40%", borderBottom: "1px solid #f0f0f0" }}>{key.replace(/_/g, " ")}</td>
                    <td style={{ padding: "6px 10px", color: sc, fontWeight: 600, borderBottom: "1px solid #f0f0f0" }}>{String(val)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      );
    })}
  </div>
);

export const ProductShowcase: React.FC<ProductProps & { index?: number }> = ({ pc, sc, pcTint, producten, index = 0 }) => {
  const prod = producten[index];
  if (!prod) return null;
  const specs = prod.specs && typeof prod.specs === "object" ? Object.entries(prod.specs).slice(0, 6) : [];
  const usps: { icon: string; label: string }[] = [];
  if (prod.garantie_jaren) usps.push({ icon: "🛡️", label: `${prod.garantie_jaren} jaar garantie` });
  if (prod.certificeringen) usps.push({ icon: "✓", label: prod.certificeringen });
  if (prod.onderhoud) usps.push({ icon: "🔧", label: prod.onderhoud });

  return (
    <div style={{ fontFamily: "'Rubik', sans-serif" }}>
      {prod.merk && (
        <p style={{ fontSize: 11, fontWeight: 600, color: pc, textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 4px" }}>
          {prod.merk}{prod.model ? ` — ${prod.model}` : ""}
        </p>
      )}

      {resolveImgUrl(prod.afbeelding_url) && (
        <div style={{ width: "100%", height: 280, borderRadius: 16, overflow: "hidden", backgroundColor: "#f8f8fa", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <img src={resolveImgUrl(prod.afbeelding_url)!} alt={prod.naam} style={{ maxWidth: "85%", maxHeight: "85%", objectFit: "contain" }} />
        </div>
      )}

      <h3 style={{ fontSize: 22, fontWeight: 800, color: sc, margin: "0 0 8px", textAlign: "center" }}>{prod.naam}</h3>

      {prod.omschrijving && (
        <p style={{ fontSize: 12, color: "#555", lineHeight: 1.7, margin: "12px 0 20px", textAlign: "center", maxWidth: "85%", marginLeft: "auto", marginRight: "auto" }}>{prod.omschrijving}</p>
      )}

      {usps.length > 0 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
          {usps.map((usp, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: pcTint, borderRadius: 20, padding: "8px 16px" }}>
              <span style={{ fontSize: 14 }}>{usp.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: sc }}>{usp.label}</span>
            </div>
          ))}
        </div>
      )}

      {specs.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, borderRadius: 10, overflow: "hidden" }}>
          <tbody>
            {specs.map(([key, val], si) => (
              <tr key={key} style={{ backgroundColor: si % 2 === 0 ? "#fff" : pcTint }}>
                <td style={{ padding: "8px 14px", fontWeight: 500, color: "#555", width: "45%", borderBottom: "1px solid #f0f0f0" }}>{key.replace(/_/g, " ")}</td>
                <td style={{ padding: "8px 14px", color: sc, fontWeight: 600, borderBottom: "1px solid #f0f0f0" }}>{String(val)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export const productTemplates: Record<string, React.FC<ProductProps>> = {
  "product-list": ProductList,
  "product-cards": ProductCards,
  "product-grid": ProductGrid,
  "product-spotlight": ProductSpotlight,
  "product-showcase": ProductShowcase,
};
