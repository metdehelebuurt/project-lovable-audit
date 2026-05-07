import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { EmbedPartner, EmbedProduct } from "@/pages/embed/EmbedCatalogus/types";

interface State {
  loading: boolean;
  error: string;
  partner: (EmbedPartner & { id: string; partner_slug: string; website?: string | null }) | null;
  producten: EmbedProduct[];
  merken: string[];
  categorieen: string[];
}

export function usePublicCatalogus(partnerSlug: string | undefined): State {
  const [state, setState] = useState<State>({
    loading: true, error: "", partner: null, producten: [], merken: [], categorieen: [],
  });

  useEffect(() => {
    const load = async () => {
      if (!partnerSlug) {
        setState((s) => ({ ...s, loading: false, error: "Catalogus niet gevonden" }));
        return;
      }

      const { data: partnerRows, error: pErr } = await (supabase.rpc as any)("get_partner_by_slug", { _slug: partnerSlug });
      const partner = Array.isArray(partnerRows) ? partnerRows[0] : partnerRows;
      if (pErr || !partner) {
        setState((s) => ({ ...s, loading: false, error: "Catalogus niet gevonden" }));
        return;
      }

      const { data: prods } = await (supabase.from("producten_publiek" as never) as any)
        .select(
          "id, naam, merk, categorie, afbeelding_url, afbeeldingen, prijs_excl_btw, btw_percentage, website_slug, website_pitch, website_omschrijving, website_usps, website_faq, garantie_jaren, specs, datasheet_url, datasheet_type, installatie_handleiding_url, installatie_handleiding_naam, gebruiker_handleiding_url, gebruiker_handleiding_naam"
        )
        .eq("partner_id", partner.id)
        .eq("toon_op_website", true)
        .order("merk", { ascending: true });

      const producten = (prods ?? []) as EmbedProduct[];
      const merken = Array.from(new Set(producten.map((p) => p.merk).filter((m): m is string => Boolean(m))));
      const categorieen = Array.from(new Set(producten.map((p) => p.categorie).filter((c): c is string => Boolean(c))));

      setState({
        loading: false,
        error: "",
        partner: {
          id: partner.id,
          partner_slug: partner.partner_slug,
          naam: partner.naam,
          logo_url: partner.logo_url ?? null,
          primaire_kleur: partner.primaire_kleur ?? null,
          website: partner.website ?? null,
        },
        producten,
        merken,
        categorieen,
      });
    };
    load();
  }, [partnerSlug]);

  return state;
}