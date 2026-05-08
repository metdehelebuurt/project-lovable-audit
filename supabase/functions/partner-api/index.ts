import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-api-version, accept-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Expose-Headers":
    "x-api-version, x-api-default-version, x-api-supported-versions, x-api-latest-version, sunset, deprecation",
};

/* ─── API versioning ───────────────────────────────────────────────────────
 * Versies worden bepaald in deze volgorde:
 *   1. URL-prefix:   /partner-api/v2/products
 *   2. Header:       X-Api-Version: 2  of  Accept-Version: v2
 *   3. Default:      DEFAULT_VERSION (laatste stabiele major)
 *
 * Binnen één major versie zijn ALLEEN additieve wijzigingen toegestaan
 * (nieuwe velden, nieuwe endpoints). Verwijderen/hernoemen vereist een
 * nieuwe major. Zo komen nieuwe product-media velden zonder breaking
 * changes beschikbaar.
 * ─────────────────────────────────────────────────────────────────────── */
const SUPPORTED_VERSIONS = ["v1"] as const;
type ApiVersion = typeof SUPPORTED_VERSIONS[number];
const DEFAULT_VERSION: ApiVersion = "v1";
const LATEST_VERSION: ApiVersion = "v1";

function parseVersion(raw: string | null | undefined): ApiVersion | null {
  if (!raw) return null;
  const norm = raw.trim().toLowerCase().replace(/^v?/, "v").split(/[.,;\s]/)[0];
  return (SUPPORTED_VERSIONS as readonly string[]).includes(norm) ? (norm as ApiVersion) : null;
}

function versionHeaders(version: ApiVersion, source: "url" | "header" | "default") {
  const h: Record<string, string> = {
    "X-Api-Version": version,
    "X-Api-Default-Version": DEFAULT_VERSION,
    "X-Api-Latest-Version": LATEST_VERSION,
    "X-Api-Supported-Versions": SUPPORTED_VERSIONS.join(","),
  };
  if (source === "default") {
    h["Warning"] =
      '299 - "Geen API versie opgegeven. Zet X-Api-Version header of gebruik /v1/ prefix om te pinnen."';
  }
  return h;
}

const json = (body: unknown, status = 200, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extraHeaders },
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
  // Path na /partner-api[/vN]
  const fullPath = url.pathname.replace(/^\/+/, "");
  let subPath = fullPath.replace(/^partner-api\/?/, "");

  // 1) versie uit URL-prefix
  let version: ApiVersion | null = null;
  let versionSource: "url" | "header" | "default" = "default";
  const urlPrefix = subPath.match(/^(v\d+)(?:\/(.*))?$/);
  if (urlPrefix) {
    const candidate = parseVersion(urlPrefix[1]);
    if (!candidate) {
      return json(
        { error: "unsupported_version", supported: SUPPORTED_VERSIONS, latest: LATEST_VERSION },
        400,
      );
    }
    version = candidate;
    versionSource = "url";
    subPath = urlPrefix[2] ?? "";
  }

  // 2) versie uit header
  if (!version) {
    const headerVersion =
      parseVersion(req.headers.get("x-api-version")) ??
      parseVersion(req.headers.get("accept-version"));
    if (req.headers.get("x-api-version") || req.headers.get("accept-version")) {
      if (!headerVersion) {
        return json(
          { error: "unsupported_version", supported: SUPPORTED_VERSIONS, latest: LATEST_VERSION },
          400,
        );
      }
      version = headerVersion;
      versionSource = "header";
    }
  }

  // 3) default
  if (!version) version = DEFAULT_VERSION;
  const vHeaders = versionHeaders(version, versionSource);

  // Preflight gebruikt nu ook expose-headers; korte handler hier ipv vroeg
  // (maar de eerste OPTIONS check werd al voor de versie-parsing gedaan).

  // Token uit Authorization: Bearer of x-api-key
  const authHeader = req.headers.get("authorization") ?? "";
  const xApiKey = req.headers.get("x-api-key") ?? "";
  const rawToken = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : xApiKey.trim();

  if (!rawToken) return json({ error: "missing_token" }, 401, vHeaders);

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
    return json({ error: "validation_failed" }, 500, vHeaders);
  }
  const row = Array.isArray(validation) ? validation[0] : validation;
  if (!row?.allowed) {
    if (row?.reden === "rate_limited") return json({ error: "rate_limited" }, 429, vHeaders);
    return json({ error: "invalid_token" }, 401, vHeaders);
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
  // Zorgt dat tekstvelden als geldige HTML worden teruggegeven, zodat
  // afnemers de opmaak (alinea's, regelafbrekingen, opsommingen) direct
  // kunnen renderen. Velden die al HTML-tags bevatten worden ongewijzigd
  // doorgegeven; platte tekst krijgt <p>/<br> opmaak en wordt geëscaped.
  const escapeHtml = (s: string): string =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  const looksLikeHtml = (s: string): boolean => /<\/?[a-z][\s\S]*>/i.test(s);
  const toHtml = (val: unknown): string | null => {
    if (val == null) return null;
    const raw = String(val).trim();
    if (!raw) return null;
    if (looksLikeHtml(raw)) return raw;
    const paragraphs = raw
      .split(/\n{2,}/)
      .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
      .join("");
    return paragraphs;
  };
  const buildDownloadUrl = (
    productId: string,
    kind: "datasheet" | "installatie-handleiding" | "gebruiker-handleiding",
  ): string =>
    `${SUPABASE_URL}/functions/v1/partner-api/${version}/products/${productId}/download/${kind}`;
  const mapProduct = (p: Record<string, any>) => {
    const base: Record<string, unknown> = {
    id: p.id,
    naam: p.naam,
    merk: p.merk,
    model: p.model,
    categorie: p.categorie,
    omschrijving: toHtml(p.omschrijving),
    prijs_excl_btw: p.prijs_excl_btw,
    btw_percentage: p.btw_percentage,
    eenheid: p.eenheid,
    product_code: p.product_code,
    artikelnummer: p.artikelnummer,
    ean_code: p.ean_code,
    levertijd: p.levertijd,
    garantie_jaren: p.garantie_jaren,
    certificeringen: p.certificeringen,
    installatie_instructies: toHtml(p.installatie_instructies),
    onderhoud: toHtml(p.onderhoud),
    specs: p.specs ?? {},
    website_slug: p.website_slug,
    website_pitch: toHtml(p.website_pitch),
    website_omschrijving: toHtml(p.website_omschrijving),
    website_usps: Array.isArray(p.website_usps)
      ? (p.website_usps as unknown[])
          .map((u) => toHtml(u))
          .filter((u): u is string => Boolean(u))
      : [],
    website_faq: Array.isArray(p.website_faq)
      ? (p.website_faq as Array<Record<string, unknown>>).map((f) => ({
          vraag: toHtml(f?.vraag),
          antwoord: toHtml(f?.antwoord),
        }))
      : [],
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
    };
    // Toekomstige major-versies (v2+) kunnen velden hernoemen of weglaten.
    // Vandaag is v1 het volledige actuele schema en zijn additieve velden welkom.
    return base;
  };

  const PRODUCT_COLUMNS =
    "id, naam, merk, model, categorie, omschrijving, prijs_excl_btw, btw_percentage, eenheid, product_code, artikelnummer, ean_code, levertijd, garantie_jaren, certificeringen, installatie_instructies, onderhoud, specs, website_slug, website_pitch, website_omschrijving, website_usps, website_faq, afbeelding_url, afbeeldingen, datasheet_url, datasheet_type, installatie_handleiding_url, installatie_handleiding_naam, gebruiker_handleiding_url, gebruiker_handleiding_naam";

  // Haal merken op die de partner zichtbaar heeft gezet. Producten van een
  // verborgen merk worden uit de API gefilterd, ook al staat het product zelf
  // op toon_op_website=true.
  async function getVisibleMerken(): Promise<string[] | null> {
    const { data, error } = await supabase
      .from("partner_merken")
      .select("merk")
      .eq("partner_id", partnerId)
      .eq("toon_op_website", true);
    if (error) {
      console.error("partner_merken lookup", error);
      return null;
    }
    return (data ?? []).map((r: { merk: string }) => r.merk).filter(Boolean);
  }

  function applyVisibilityFilters<T>(q: T): T {
    // status='actief' + toon_op_website=true (merk-filter wordt los toegevoegd)
    return (q as any).eq("status", "actief").eq("toon_op_website", true);
  }

  try {
    // GET /partner-api/products/:id/download/:kind  → 302 redirect met Content-Disposition hint
    const downloadMatch = subPath.match(
      /^products\/([^/]+)\/download\/(datasheet|installatie-handleiding|gebruiker-handleiding)$/,
    );
    if (req.method === "GET" && downloadMatch) {
      const [, productId, kind] = downloadMatch;
      const visibleMerken = await getVisibleMerken();
      let q = supabase
        .from("producten_publiek")
        .select(
          "id, naam, merk, status, datasheet_url, installatie_handleiding_url, installatie_handleiding_naam, gebruiker_handleiding_url, gebruiker_handleiding_naam",
        )
        .eq("partner_id", partnerId)
        .eq("status", "actief")
        .eq("toon_op_website", true)
        .eq("id", productId);
      if (visibleMerken && visibleMerken.length > 0) {
        q = q.in("merk", visibleMerken);
      } else if (visibleMerken) {
        return json({ error: "not_found" }, 404, vHeaders);
      }
      const { data, error } = await q.maybeSingle();
      if (error) throw error;
      if (!data) return json({ error: "not_found" }, 404, vHeaders);
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
      if (!path) return json({ error: "file_not_available" }, 404, vHeaders);
      const target = buildStorageUrl(path);
      if (!target) return json({ error: "file_not_available" }, 404, vHeaders);
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          ...vHeaders,
          Location: target,
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    if (req.method === "GET" && (subPath === "products" || subPath === "")) {
      const visibleMerken = await getVisibleMerken();
      if (visibleMerken && visibleMerken.length === 0) {
        return json({ api_version: version, data: [] }, 200, vHeaders);
      }
      let q = supabase
        .from("producten_publiek")
        .select(PRODUCT_COLUMNS)
        .eq("partner_id", partnerId)
        .eq("status", "actief")
        .eq("toon_op_website", true);
      if (visibleMerken) q = q.in("merk", visibleMerken);
      const { data, error } = await q;
      if (error) throw error;
      return json({ api_version: version, data: (data ?? []).map(mapProduct) }, 200, vHeaders);
    }

    // GET /partner-api/products/:id  of  /partner-api/products/slug/:slug
    if (req.method === "GET" && subPath.startsWith("products/")) {
      const rest = subPath.slice("products/".length);
      const visibleMerken = await getVisibleMerken();
      if (visibleMerken && visibleMerken.length === 0) {
        return json({ error: "not_found" }, 404, vHeaders);
      }
      let query = supabase
        .from("producten_publiek")
        .select(PRODUCT_COLUMNS)
        .eq("partner_id", partnerId)
        .eq("status", "actief")
        .eq("toon_op_website", true);
      if (visibleMerken) query = query.in("merk", visibleMerken);
      if (rest.startsWith("slug/")) {
        query = query.eq("website_slug", rest.slice("slug/".length));
      } else {
        query = query.eq("id", rest);
      }
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      if (!data) return json({ error: "not_found" }, 404, vHeaders);
      return json({ api_version: version, data: mapProduct(data as Record<string, any>) }, 200, vHeaders);
    }

    if (req.method === "GET" && subPath === "brands") {
      const { data, error } = await supabase
        .from("partner_merken")
        .select("id, merk, slug, logo_url, intro_html, volgorde")
        .eq("partner_id", partnerId)
        .eq("toon_op_website", true)
        .order("volgorde");
      if (error) throw error;
      const mapped = (data ?? []).map((b: Record<string, any>) => ({
        ...b,
        intro_html: toHtml(b.intro_html),
      }));
      return json({ api_version: version, data: mapped }, 200, vHeaders);
    }

    if (req.method === "GET" && subPath === "categories") {
      const visibleMerken = await getVisibleMerken();
      if (visibleMerken && visibleMerken.length === 0) {
        return json({ api_version: version, data: [] }, 200, vHeaders);
      }
      let q = supabase
        .from("producten_publiek")
        .select("categorie")
        .eq("partner_id", partnerId)
        .eq("status", "actief")
        .eq("toon_op_website", true)
        .not("categorie", "is", null);
      if (visibleMerken) q = q.in("merk", visibleMerken);
      const { data, error } = await q;
      if (error) throw error;
      const unique = Array.from(new Set((data ?? []).map((r: { categorie: string }) => r.categorie)));
      return json({ api_version: version, data: unique }, 200, vHeaders);
    }

    if (req.method === "POST" && subPath === "leads") {
      const body = await req.json().catch(() => ({}));
      const voornaam = String(body.voornaam ?? "").trim().slice(0, 100);
      const achternaam = String(body.achternaam ?? "").trim().slice(0, 100);
      const email = String(body.email ?? "").trim().toLowerCase().slice(0, 255);
      const telefoon = body.telefoon ? String(body.telefoon).trim().slice(0, 20) : null;
      const bericht = body.bericht ? String(body.bericht).trim().slice(0, 2000) : null;
      const productId = body.product_id ? String(body.product_id) : null;

      if (!voornaam || !achternaam || !email) return json({ error: "missing_fields" }, 400, vHeaders);
      if (!emailValid(email)) return json({ error: "invalid_email" }, 400, vHeaders);

      const { data: admin } = await supabase
        .from("users")
        .select("id")
        .eq("partner_id", partnerId)
        .eq("rol", "partner_admin")
        .eq("status", "actief")
        .limit(1)
        .maybeSingle();

      if (!admin) return json({ error: "no_partner_admin" }, 500, vHeaders);

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
        return json({ error: "lead_create_failed" }, 500, vHeaders);
      }

      if (productId) {
        await supabase.from("webshop_lead_bron").insert({
          lead_id: lead.id,
          partner_id: partnerId,
          product_id: productId,
          bron: "api",
        });
      }

      return json({ api_version: version, success: true, lead_id: lead.id }, 200, vHeaders);
    }

    if (req.method === "GET" && (subPath === "" || subPath === "version")) {
      return json(
        {
          api_version: version,
          default_version: DEFAULT_VERSION,
          latest_version: LATEST_VERSION,
          supported_versions: SUPPORTED_VERSIONS,
        },
        200,
        vHeaders,
      );
    }

    return json({ error: "not_found" }, 404, vHeaders);
  } catch (err) {
    console.error("partner-api error", err);
    return json({ error: "internal_error" }, 500, vHeaders);
  }
});