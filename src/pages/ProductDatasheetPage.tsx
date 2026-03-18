import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ProductDatasheet from "@/components/producten/ProductDatasheet";
import ProductDatasheetSection from "@/components/producten/ProductDatasheetSection";

export default function ProductDatasheetPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"preview" | "edit">("preview");

  const loadProduct = async () => {
    if (!id) return;
    const { data: p } = await supabase.from("producten").select("*").eq("id", id).single();
    if (!p) { setLoading(false); return; }
    setProduct(p);

    let partnerData = null;
    if (p.partner_id) {
      const { data: pt } = await supabase.from("partners").select("naam, adres, postcode, plaats, email, telefoonnummer, kvk, btw, website, logo_url, primaire_kleur, secundaire_kleur, bedrijfsslogan").eq("id", p.partner_id).single();
      if (pt) partnerData = pt;
    }
    if (!partnerData) {
      partnerData = { naam: "mijnhuis.nu", primaire_kleur: "#5B58E1", secundaire_kleur: "#1a1a2e", website: "www.mijnhuis.nu", email: "info@mijnhuis.nu" };
    }
    setPartner(partnerData);

    // Auto-show edit mode if no datasheet exists yet
    if (!p.datasheet_type) {
      setMode("edit");
    }
    setLoading(false);
  };

  useEffect(() => { loadProduct(); }, [id]);

  if (loading) return <div style={{ padding: 32, textAlign: "center", fontFamily: "'Rubik', sans-serif" }}>Laden...</div>;
  if (!product || !partner) return <div style={{ padding: 32, textAlign: "center", fontFamily: "'Rubik', sans-serif" }}>Product niet gevonden</div>;

  const specs = product.specs && typeof product.specs === "object" && !Array.isArray(product.specs) ? product.specs : null;

  if (mode === "edit") {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: 32, fontFamily: "'Rubik', sans-serif" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Datasheet beheren: {product.naam}</h1>
        <p style={{ color: "#666", marginBottom: 24 }}>Upload een fabrikant-PDF of genereer een branded datasheet met AI.</p>
        <ProductDatasheetSection
          productId={product.id}
          productData={{
            naam: product.naam,
            merk: product.merk || "",
            model: product.model || "",
            categorie: product.categorie,
            omschrijving: product.omschrijving || "",
            specs: specs || {},
            certificeringen: product.certificeringen || "",
            garantie_jaren: product.garantie_jaren,
            prijs_excl_btw: product.prijs_excl_btw,
            afbeelding_url: product.afbeelding_url,
          }}
          datasheetUrl={product.datasheet_url}
          datasheetType={product.datasheet_type}
          onDatasheetChange={async (url, type) => {
            await supabase.from("producten").update({ datasheet_url: url, datasheet_type: type }).eq("id", product.id);
            await loadProduct();
          }}
          onSpecsUpdate={async (newSpecs) => {
            await supabase.from("producten").update({ specs: newSpecs as any }).eq("id", product.id);
            await loadProduct();
          }}
          onOmschrijvingUpdate={async (omschrijving) => {
            await supabase.from("producten").update({ omschrijving }).eq("id", product.id);
            await loadProduct();
          }}
          partnerId={product.partner_id}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
          {product.datasheet_type && (
            <button onClick={() => setMode("preview")} style={{ padding: "10px 24px", borderRadius: 40, color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", backgroundColor: partner.primaire_kleur || "#5B58E1" }}>
              Preview bekijken
            </button>
          )}
          <button onClick={() => window.close()} style={{ padding: "10px 24px", borderRadius: 40, backgroundColor: "#f0f0f0", color: "#555", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
            Sluiten
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="no-print" style={{ position: "fixed", top: 16, right: 16, zIndex: 50, display: "flex", gap: 8 }}>
        <button onClick={() => setMode("edit")} style={{ padding: "10px 24px", borderRadius: 40, color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", backgroundColor: "#333" }}>
          Bewerken
        </button>
        <button onClick={() => window.print()} style={{ padding: "10px 24px", borderRadius: 40, color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", backgroundColor: partner.primaire_kleur || "#5B58E1", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
          PDF downloaden
        </button>
        <button onClick={() => window.history.back()} style={{ padding: "10px 24px", borderRadius: 40, backgroundColor: "#f0f0f0", color: "#555", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
          Terug
        </button>
      </div>
      <ProductDatasheet product={{ ...product, specs }} partner={partner} />
    </>
  );
}
