import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ProductDatasheet from "@/components/producten/ProductDatasheet";

export default function ProductDatasheetPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: p } = await supabase.from("producten").select("*").eq("id", id).single();
      if (!p) { setLoading(false); return; }
      setProduct(p);

      if (p.partner_id) {
        const { data: partner } = await supabase.from("partners").select("naam, adres, postcode, plaats, email, telefoonnummer, kvk, btw, website, logo_url, primaire_kleur, secundaire_kleur, bedrijfsslogan").eq("id", p.partner_id).single();
        if (partner) setPartner(partner);
      }
      
      if (!partner) {
        setPartner({ naam: "mijnhuis.nu", primaire_kleur: "#5B58E1", secundaire_kleur: "#1a1a2e", website: "www.mijnhuis.nu", email: "info@mijnhuis.nu" });
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div style={{ padding: 32, textAlign: "center", fontFamily: "'Rubik', sans-serif" }}>Laden...</div>;
  if (!product || !partner) return <div style={{ padding: 32, textAlign: "center", fontFamily: "'Rubik', sans-serif" }}>Product niet gevonden</div>;

  const specs = product.specs && typeof product.specs === "object" && !Array.isArray(product.specs) ? product.specs : null;

  return (
    <>
      <div className="no-print" style={{ position: "fixed", top: 16, right: 16, zIndex: 50, display: "flex", gap: 8 }}>
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
