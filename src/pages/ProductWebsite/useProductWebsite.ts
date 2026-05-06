import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { uniekeSlug } from "@/lib/website/slug";
import type { FaqItem } from "@/components/producten/website/FaqEditor";

export interface ProductWebsiteData {
  toon_op_website: boolean;
  website_slug: string;
  website_pitch: string;
  website_omschrijving: string;
  website_usps: string[];
  website_faq: FaqItem[];
  website_ai_gegenereerd: boolean;
}

const LEEG: ProductWebsiteData = {
  toon_op_website: false,
  website_slug: "",
  website_pitch: "",
  website_omschrijving: "",
  website_usps: [],
  website_faq: [],
  website_ai_gegenereerd: false,
};

export function useProductWebsite(productId: string | undefined) {
  const [product, setProduct] = useState<any | null>(null);
  const [data, setData] = useState<ProductWebsiteData>(LEEG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!productId) return;
    let active = true;
    (async () => {
      const { data: p, error } = await supabase
        .from("producten")
        .select("*")
        .eq("id", productId)
        .single();
      if (!active) return;
      if (error || !p) {
        toast.error("Product niet gevonden");
        setLoading(false);
        return;
      }
      setProduct(p);
      setData({
        toon_op_website: (p as any).toon_op_website ?? false,
        website_slug: (p as any).website_slug ?? "",
        website_pitch: (p as any).website_pitch ?? "",
        website_omschrijving: (p as any).website_omschrijving ?? "",
        website_usps: Array.isArray((p as any).website_usps) ? (p as any).website_usps : [],
        website_faq: Array.isArray((p as any).website_faq) ? (p as any).website_faq : [],
        website_ai_gegenereerd: (p as any).website_ai_gegenereerd ?? false,
      });
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [productId]);

  const update = <K extends keyof ProductWebsiteData>(key: K, value: ProductWebsiteData[K]) => {
    setData((d) => ({ ...d, [key]: value }));
    setDirty(true);
  };

  const ensureSlug = async (): Promise<string> => {
    if (data.website_slug) return data.website_slug;
    if (!product) return "";
    const { data: bestaande } = await supabase
      .from("producten")
      .select("website_slug")
      .eq("partner_id", product.partner_id)
      .neq("id", product.id);
    const set = new Set<string>(
      ((bestaande as any[]) ?? [])
        .map((r) => r.website_slug)
        .filter(Boolean) as string[]
    );
    return uniekeSlug(product.naam || "product", set);
  };

  const save = async (): Promise<boolean> => {
    if (!product) return false;
    setSaving(true);
    try {
      const slug = await ensureSlug();
      const { error } = await supabase
        .from("producten")
        .update({
          toon_op_website: data.toon_op_website,
          website_slug: slug,
          website_pitch: data.website_pitch || null,
          website_omschrijving: data.website_omschrijving || null,
          website_usps: data.website_usps.filter((u) => u.trim()),
          website_faq: data.website_faq.filter((f) => f.vraag.trim() && f.antwoord.trim()),
          website_ai_gegenereerd: data.website_ai_gegenereerd,
        } as any)
        .eq("id", product.id);
      if (error) {
        toast.error("Opslaan mislukt", { description: error.message });
        return false;
      }
      setData((d) => ({ ...d, website_slug: slug }));
      setDirty(false);
      toast.success("Website-instellingen opgeslagen");
      return true;
    } finally {
      setSaving(false);
    }
  };

  return { product, data, update, save, loading, saving, dirty };
}