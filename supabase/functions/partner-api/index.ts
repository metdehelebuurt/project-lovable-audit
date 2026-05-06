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

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const buildStorageUrl = (path: string | null | undefined): string | null => {
    if (!path) return null;
    if (typeof path !== "string") return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
  };
  const mapAfbeeldingen = (val: unknown): string[] => {
    if (!Array.isArray(val)) return [];
    return val
      .map((v) => {
        if (typeof v === "string") return buildStorageUrl(v);
        if (v && typeof v === "object") {
          const obj = v as Record<string, unknown>;
          const cand = obj.url ?? obj.path ?? obj.src;
          return typeof cand === "string" ? buildStorageUrl(cand) : null;
        }
        return null;
      })
      .filter((u): u is string => Boolean(u));
  };
  const slugifyFilename = (s: string): string =>
    (s || "bestand")
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 80) || "bestand";
  const buildDownloadUrl = (
    productId: string,
    kind: "datasheet" | "installatie-handleiding" | "gebruiker-handleiding",
  ): string =>
    `${SUPABASE_URL}/functions/v1/partner-api/products/${productId}/download/${kind}`;
  const mapProduct = (p: Record<string, any>) => ({
    id: p.id,
    naam: p.naam,
    merk: p.merk,
    model: p.model,
    categorie: p.categorie,
    omschrijving: p.omschrijving,
    prijs_excl_btw: p.prijs_excl_btw,
    btw_percentage: p.btw_percentage,
    eenheid: p.eenheid,
    product_code: p.product_code,
    artikelnummer: p.artikelnummer,
    ean_code: p.ean_code,
    levertijd: p.levertijd,
    garantie_jaren: p.garantie_jaren,
    certificeringen: p.certificeringen,
    installatie_instructies: p.installatie_instructies,
    onderhoud: p.onderhoud,
    specs: p.specs ?? {},
    website_slug: p.website_slug,
    website_pitch: p.website_pitch,
    website_omschrijving: p.website_omschrijving,
    website_usps: p.website_usps ?? [],
    website_faq: p.website_faq ?? [],
    afbeelding_url: buildStorageUrl(p.afbeelding_url),
    afbeeldingen: mapAfbeeldingen(p.afbeeldingen),
    datasheet: p.datasheet_url
      ? {
          url: buildStorageUrl(p.datasheet_url),
          download_url: buildDownloadUrl(p.id, "datasheet"),
          bestandsnaam: `${slugifyFilename(p.naam ?? "datasheet")}-datasheet.pdf`,
          type: p.datasheet_type ?? null,
        }
      : null,
    installatie_handleiding: p.installatie_handleiding_url
      ? {
          url: buildStorageUrl(p.installatie_handleiding_url),
          download_url: buildDownloadUrl(p.id, "installatie-handleiding"),
          bestandsnaam: p.installatie_handleiding_naam ?? null,
        }
      : null,
    gebruiker_handleiding: p.gebruiker_handleiding_url
      ? {
          url: buildStorageUrl(p.gebruiker_handleiding_url),
          download_url: buildDownloadUrl(p.id, "gebruiker-handleiding"),
          bestandsnaam: p.gebruiker_handleiding_naam ?? null,
        }
      : null,
  });

  const PRODUCT_COLUMNS =
    "id, naam, merk, model, categorie, omschrijving, prijs_excl_btw, btw_percentage, eenheid, product_code, artikelnummer, ean_code, levertijd, garantie_jaren, certificeringen, installatie_instructies, onderhoud, specs, website_slug, website_pitch, website_omschrijving, website_usps, website_faq, afbeelding_url, afbeeldingen, datasheet_url, datasheet_type, installatie_handleiding_url, installatie_handleiding_naam, gebruiker_handleiding_url, gebruiker_handleiding_naam";

  try {
    // GET /partner-api/products/:id/download/:kind  → 302 redirect met Content-Disposition hint
    const downloadMatch = subPath.match(
      /^products\/([^/]+)\/download\/(datasheet|installatie-handleiding|gebruiker-handleiding)$/,
    );
    if (req.method === "GET" && downloadMatch) {
      const [, productId, kind] = downloadMatch;
      const { data, error } = await supabase
        .from("producten_publiek")
        .select(
          "id, naam, datasheet_url, installatie_handleiding_url, installatie_handleiding_naam, gebruiker_handleiding_url, gebruiker_handleiding_naam",
        )
        .eq("partner_id", partnerId)
        .eq("toon_op_website", true)
        .eq("id", productId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return json({ error: "not_found" }, 404);
      let path: string | null = null;
      let filename = "bestand.pdf";
      const baseSlug = slugifyFilename(data.naam ?? "product");
      if (kind === "datasheet") {
        path = data.datasheet_url;
        filename = `${baseSlug}-datasheet.pdf`;
      } else if (kind === "installatie-handleiding") {
        path = data.installatie_handleiding_url;
        filename = data.installatie_handleiding_naam || `${baseSlug}-installatiehandleiding.pdf`;
      } else if (kind === "gebruiker-handleiding") {
        path = data.gebruiker_handleiding_url;
        filename = data.gebruiker_handleiding_naam || `${baseSlug}-gebruikershandleiding.pdf`;
      }
      if (!path) return json({ error: "file_not_available" }, 404);
      const target = buildStorageUrl(path);
      if (!target) return json({ error: "file_not_available" }, 404);
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: target,
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    if (req.method === "GET" && (subPath === "products" || subPath === "")) {
      const { data, error } = await supabase
        .from("producten_publiek")
        .select(PRODUCT_COLUMNS)
        .eq("partner_id", partnerId)
        .eq("toon_op_website", true);
      if (error) throw error;
      return json({ data: (data ?? []).map(mapProduct) });
    }

    // GET /partner-api/products/:id  of  /partner-api/products/slug/:slug
    if (req.method === "GET" && subPath.startsWith("products/")) {
      const rest = subPath.slice("products/".length);
      let query = supabase
        .from("producten_publiek")
        .select(PRODUCT_COLUMNS)
        .eq("partner_id", partnerId)
        .eq("toon_op_website", true);
      if (rest.startsWith("slug/")) {
        query = query.eq("website_slug", rest.slice("slug/".length));
      } else {
        query = query.eq("id", rest);
      }
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      if (!data) return json({ error: "not_found" }, 404);
      return json({ data: mapProduct(data as Record<string, any>) });
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