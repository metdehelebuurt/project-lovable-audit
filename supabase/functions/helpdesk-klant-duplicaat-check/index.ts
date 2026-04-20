import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: claims } = await supa.auth.getClaims(auth.replace("Bearer ", ""));
    if (!claims?.claims) return json({ error: "Unauthorized" }, 401);

    const body = await req.json() as { email?: string; telefoon?: string; postcode?: string; huisnummer?: string };
    const email = body.email?.trim().toLowerCase() || null;
    const telefoon = body.telefoon?.replace(/\D/g, "") || null;
    const postcode = body.postcode?.replace(/\s/g, "").toUpperCase() || null;

    if (!email && !telefoon && !postcode) return json({ matches: [] });

    const userId = claims.claims.sub as string;
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: u } = await admin.from("users").select("partner_id").eq("id", userId).single();
    if (!u?.partner_id) return json({ matches: [] });

    let q = admin.from("klanten").select("id, voornaam, achternaam, email, telefoon, adres, postcode, plaats").eq("partner_id", u.partner_id).limit(5);
    const ors: string[] = [];
    if (email) ors.push(`email.ilike.%${email}%`);
    if (telefoon && telefoon.length >= 6) ors.push(`telefoon.ilike.%${telefoon.slice(-8)}%`);
    if (postcode) ors.push(`postcode.ilike.%${postcode}%`);
    if (ors.length) q = q.or(ors.join(","));

    const { data, error } = await q;
    if (error) throw error;
    return json({ matches: data ?? [] });
  } catch (e) {
    console.error("dup-check error", e);
    return json({ error: e instanceof Error ? e.message : "fout" }, 500);
  }
});

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
