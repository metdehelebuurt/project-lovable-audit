// Public edge function: geeft configurator-metadata van een samengesteld product
// terug (template-attributen, slots, matchende producten, prijsberekening).
//
// Publiek leesbaar zodat de klantwebsite (server-to-server of via CORS) hier
// direct tegenaan kan bouwen. Alleen assemblages met toon_op_website=true en
// status=actief worden vrijgegeven.
//
// GET  ?assemblage_id=<uuid>            → template + slots + opties
// POST { assemblage_id, keuzes, attrs } → valideert & retourneert prijs-samenvatting

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import {
  berekenPrijs,
  resolveSpecFilter,
  specsMatch,
  type AssemblageDef,
  type Keuzes,
  type OptieDef,
  type SlotDef,
} from "./logic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface Assemblage {
  id: string;
  naam: string;
  merk: string | null;
  categorie: string;
  partner_id: string;
  afbeelding_url: string | null;
  configureerbaar_type: string | null;
  template_attributen: Record<string, unknown> | null;
  prijs_strategie: "vast" | "som_componenten";
  prijs_excl_btw: number | string;
  btw_percentage: number | null;
  marge_opslag_percentage: number | string;
  toon_op_website: boolean;
  status: string;
  website_pitch: string | null;
  website_omschrijving: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const assemblageId = req.method === "GET"
    ? url.searchParams.get("assemblage_id")
    : null;

  // Service-role client omdat we bewust cross-partner data readonly serveren
  // (alleen wanneer toon_op_website=true) via één publieke endpoint.
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "server_misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    let body: { assemblage_id?: string; keuzes?: Record<string, Array<{ product_id: string; aantal: number }>>; template_attributen?: Record<string, unknown> } | null = null;
    if (req.method === "POST") {
      body = await req.json().catch(() => null);
    }
    const id = assemblageId ?? body?.assemblage_id;
    if (!id) {
      return new Response(JSON.stringify({ error: "assemblage_id_required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Assemblage ophalen — alleen publiek zichtbaar
    const { data: rawAssemblage, error: aErr } = await supabase
      .from("producten")
      .select("id,naam,merk,categorie,partner_id,afbeelding_url,configureerbaar_type,template_attributen,prijs_strategie,prijs_excl_btw,btw_percentage,marge_opslag_percentage,toon_op_website,status,website_pitch,website_omschrijving,is_assemblage")
      .eq("id", id)
      .eq("is_assemblage", true)
      .maybeSingle();
    if (aErr) throw aErr;
    if (!rawAssemblage || !rawAssemblage.toon_op_website || rawAssemblage.status !== "actief") {
      return new Response(JSON.stringify({ error: "not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const assemblage = rawAssemblage as unknown as Assemblage;

    // 2. Slots ophalen
    const { data: slotsRaw, error: sErr } = await supabase
      .from("product_assemblage_slots")
      .select("*")
      .eq("assemblage_id", id)
      .order("volgorde");
    if (sErr) throw sErr;
    const slots = (slotsRaw ?? []) as unknown as SlotDef[];

    // 3. Templateattributen mergen (URL/body overrides > opgeslagen defaults)
    const templateAttrs: Record<string, unknown> = {
      ...(assemblage.template_attributen ?? {}),
      ...(body?.template_attributen ?? {}),
    };

    // 4. Voor elke slot: matchende producten van dezelfde partner
    const optiesPerSlot: Record<string, OptieDef[]> = {};
    for (const slot of slots) {
      let query = supabase
        .from("producten")
        .select("id,naam,merk,categorie,prijs_excl_btw,btw_percentage,afbeelding_url,specs,product_rol,is_installatiedienst")
        .eq("partner_id", assemblage.partner_id)
        .eq("status", "actief")
        .eq("is_assemblage", false);
      if (slot.product_rol_filter) query = query.eq("product_rol", slot.product_rol_filter);
      if (slot.categorie_filter) query = query.eq("categorie", slot.categorie_filter);
      const { data: prodRaw } = await query.order("naam");
      const resolvedFilter = resolveSpecFilter(slot.spec_filter, templateAttrs);
      const opties = ((prodRaw ?? []) as OptieDef[]).filter((p) =>
        specsMatch((p as { specs: Record<string, unknown> | null }).specs, resolvedFilter),
      );
      optiesPerSlot[slot.sleutel] = opties;
    }

    // 5. Bij POST: valideer keuzes en bereken prijs
    const prijs = req.method === "POST"
      ? berekenPrijs(
          {
            prijs_strategie: assemblage.prijs_strategie,
            prijs_excl_btw: assemblage.prijs_excl_btw,
            btw_percentage: assemblage.btw_percentage,
            marge_opslag_percentage: assemblage.marge_opslag_percentage,
          } as AssemblageDef,
          slots,
          optiesPerSlot,
          (body?.keuzes ?? {}) as Keuzes,
        )
      : null;

    return new Response(
      JSON.stringify({
        assemblage: {
          id: assemblage.id,
          naam: assemblage.naam,
          merk: assemblage.merk,
          categorie: assemblage.categorie,
          afbeelding_url: assemblage.afbeelding_url,
          configureerbaar_type: assemblage.configureerbaar_type,
          website_pitch: assemblage.website_pitch,
          website_omschrijving: assemblage.website_omschrijving,
          btw_percentage: Number(assemblage.btw_percentage ?? 21),
          prijs_strategie: assemblage.prijs_strategie,
        },
        template_attributen: templateAttrs,
        slots,
        opties: optiesPerSlot,
        prijs,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown_error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});