import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { EmbedPartner, EmbedProduct, EmbedWidget } from "./types";

interface State {
  loading: boolean;
  error: string;
  widget: EmbedWidget | null;
  partner: EmbedPartner | null;
  producten: EmbedProduct[];
  merken: string[];
  categorieen: string[];
}

export const useCatalogusData = (widgetId: string | undefined): State => {
  const [state, setState] = useState<State>({
    loading: true,
    error: "",
    widget: null,
    partner: null,
    producten: [],
    merken: [],
    categorieen: [],
  });

  useEffect(() => {
    const load = async () => {
      if (!widgetId) {
        setState((s) => ({ ...s, loading: false, error: "Widget niet gevonden" }));
        return;
      }

      const { data: w, error: wErr } = await (supabase.from("web_widgets_public" as never) as any)
        .select("partner_id, config, actief, type")
        .eq("id", widgetId)
        .single();

      if (wErr || !w || !w.actief || w.type !== "productcatalogus") {
        setState((s) => ({ ...s, loading: false, error: "Widget niet beschikbaar" }));
        return;
      }

      const { data: p } = await (supabase
        .from("partner_branding" as never) as any)
        .select("naam, logo_url, primaire_kleur")
        .eq("id", w.partner_id)
        .single();

      const { data: prods } = await (supabase
        .from("producten_publiek" as never) as any)
        .select(
          "id, naam, merk, categorie, afbeelding_url, afbeeldingen, prijs_excl_btw, btw_percentage, website_slug, website_pitch, website_omschrijving, website_usps, website_faq, garantie_jaren, specs"
        )
        .eq("partner_id", w.partner_id)
        .eq("toon_op_website", true)
        .order("merk", { ascending: true });

      const producten = (prods ?? []) as EmbedProduct[];
      const merken = Array.from(
        new Set(producten.map((p) => p.merk).filter((m): m is string => Boolean(m)))
      );
      const categorieen = Array.from(
        new Set(producten.map((p) => p.categorie).filter((c): c is string => Boolean(c)))
      );

      setState({
        loading: false,
        error: "",
        widget: { partner_id: w.partner_id, config: (w.config || {}) as Record<string, unknown> },
        partner: p as EmbedPartner | null,
        producten,
        merken,
        categorieen,
      });
    };
    load();
  }, [widgetId]);

  return state;
};