import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function emailValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  // Path na /partner-api
  const fullPath = url.pathname.replace(/^\/+/, "");
  const subPath = fullPath.replace(/^partner-api\/?/, "");

  // Token uit Authorization: Bearer of x-api-key
  const authHeader = req.headers.get("authorization") ?? "";
  const xApiKey = req.headers.get("x-api-key") ?? "";
  const rawToken = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : xApiKey.trim();

  if (!rawToken) return json({ error: "missing_token" }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const tokenHash = await sha256Hex(rawToken);
  const { data: validation, error: vErr } = await supabase.rpc("validate_partner_api_token", {
    _token_hash: tokenHash,
  });
  if (vErr) {
    console.error("validate error", vErr);
    return json({ error: "validation_failed" }, 500);
  }
  const row = Array.isArray(validation) ? validation[0] : validation;
  if (!row?.allowed) {
    if (row?.reden === "rate_limited") return json({ error: "rate_limited" }, 429);
    return json({ error: "invalid_token" }, 401);
  }
  const partnerId: string = row.partner_id;

  try {
    if (req.method === "GET" && (subPath === "products" || subPath === "")) {
      const { data, error } = await supabase
        .from("producten_publiek")
        .select(
          "id, naam, merk, categorie, afbeelding_url, prijs_excl_btw, btw_percentage, website_slug, website_pitch, website_omschrijving, website_usps, website_faq, garantie_jaren"
        )
        .eq("partner_id", partnerId)
        .eq("toon_op_website", true);
      if (error) throw error;
      return json({ data });
    }

    if (req.method === "GET" && subPath === "brands") {
      const { data, error } = await supabase
        .from("partner_merken")
        .select("id, merk, slug, logo_url, intro_html, volgorde")
        .eq("partner_id", partnerId)
        .eq("toon_op_website", true)
        .order("volgorde");
      if (error) throw error;
      return json({ data });
    }

    if (req.method === "GET" && subPath === "categories") {
      const { data, error } = await supabase
        .from("producten_publiek")
        .select("categorie")
        .eq("partner_id", partnerId)
        .eq("toon_op_website", true)
        .not("categorie", "is", null);
      if (error) throw error;
      const unique = Array.from(new Set((data ?? []).map((r: { categorie: string }) => r.categorie)));
      return json({ data: unique });
    }

    if (req.method === "POST" && subPath === "leads") {
      const body = await req.json().catch(() => ({}));
      const voornaam = String(body.voornaam ?? "").trim().slice(0, 100);
      const achternaam = String(body.achternaam ?? "").trim().slice(0, 100);
      const email = String(body.email ?? "").trim().toLowerCase().slice(0, 255);
      const telefoon = body.telefoon ? String(body.telefoon).trim().slice(0, 20) : null;
      const bericht = body.bericht ? String(body.bericht).trim().slice(0, 2000) : null;
      const productId = body.product_id ? String(body.product_id) : null;

      if (!voornaam || !achternaam || !email) return json({ error: "missing_fields" }, 400);
      if (!emailValid(email)) return json({ error: "invalid_email" }, 400);

      const { data: admin } = await supabase
        .from("users")
        .select("id")
        .eq("partner_id", partnerId)
        .eq("rol", "partner_admin")
        .eq("status", "actief")
        .limit(1)
        .maybeSingle();

      if (!admin) return json({ error: "no_partner_admin" }, 500);

      const { data: lead, error: leadErr } = await supabase
        .from("leads")
        .insert({
          partner_id: partnerId,
          owner_user_id: admin.id,
          voornaam,
          achternaam,
          email,
          telefoon,
          bron: "api",
          notities: bericht,
          lead_status: "nieuw",
        })
        .select("id")
        .single();

      if (leadErr) {
        console.error("lead insert", leadErr);
        return json({ error: "lead_create_failed" }, 500);
      }

      if (productId) {
        await supabase.from("webshop_lead_bron").insert({
          lead_id: lead.id,
          partner_id: partnerId,
          product_id: productId,
          bron: "api",
        });
      }

      return json({ success: true, lead_id: lead.id });
    }

    return json({ error: "not_found" }, 404);
  } catch (err) {
    console.error("partner-api error", err);
    return json({ error: "internal_error" }, 500);
  }
});