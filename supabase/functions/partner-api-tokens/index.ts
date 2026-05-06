import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return "pat_" + Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = req.headers.get("authorization") ?? "";
  if (!auth.toLowerCase().startsWith("bearer ")) return json({ error: "unauthorized" }, 401);
  const jwt = auth.slice(7).trim();

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: userRes } = await userClient.auth.getUser();
  const user = userRes?.user;
  if (!user) return json({ error: "unauthorized" }, 401);

  const admin = createClient(url, service);

  const { data: profile } = await admin
    .from("users")
    .select("partner_id, rol")
    .eq("id", user.id)
    .single();

  if (!profile) return json({ error: "no_profile" }, 403);
  if (!["superadmin", "partner_admin"].includes(profile.rol)) {
    return json({ error: "forbidden" }, 403);
  }
  const partnerId = profile.partner_id;

  try {
    if (req.method === "GET") {
      const { data, error } = await admin
        .from("partner_api_tokens")
        .select("id, label, token_prefix, last_used_at, created_at, revoked_at")
        .eq("partner_id", partnerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json({ data });
    }

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const label = String(body.label ?? "API token").slice(0, 80);
      const token = generateToken();
      const hash = await sha256Hex(token);
      const prefix = token.slice(0, 12);

      const { data, error } = await admin
        .from("partner_api_tokens")
        .insert({
          partner_id: partnerId,
          token_hash: hash,
          token_prefix: prefix,
          label,
          created_by: user.id,
        })
        .select("id, label, token_prefix, created_at")
        .single();
      if (error) throw error;

      // Token wordt ALLEEN bij creatie geretourneerd
      return json({ token, ...data });
    }

    if (req.method === "DELETE") {
      const body = await req.json().catch(() => ({}));
      const id = String(body.id ?? "");
      if (!id) return json({ error: "missing_id" }, 400);

      const { error } = await admin
        .from("partner_api_tokens")
        .update({ revoked_at: new Date().toISOString(), revoked_by: user.id })
        .eq("id", id)
        .eq("partner_id", partnerId);
      if (error) throw error;
      return json({ success: true });
    }

    return json({ error: "method_not_allowed" }, 405);
  } catch (err) {
    console.error("partner-api-tokens error", err);
    return json({ error: "internal_error" }, 500);
  }
});