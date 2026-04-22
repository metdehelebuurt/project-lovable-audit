import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { mollieFetch, corsHeaders } from "../_shared/mollie.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims } = await supabase.auth.getClaims(token);
    if (!claims?.claims) return json({ error: "Unauthorized" }, 401);

    const { abonnementId } = await req.json();
    const userId = claims.claims.sub as string;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: user } = await admin
      .from("users").select("partner_id, rol").eq("id", userId).maybeSingle();
    if (!user?.partner_id) return json({ error: "Geen partner" }, 400);

    const { data: abo } = await admin
      .from("abonnementen")
      .select("id, partner_id, mollie_subscription_id")
      .eq("id", abonnementId)
      .maybeSingle();
    if (!abo) return json({ error: "Abonnement niet gevonden" }, 404);
    if (abo.partner_id !== user.partner_id && user.rol !== "superadmin") {
      return json({ error: "Geen toegang" }, 403);
    }
    if (!abo.mollie_subscription_id) return json({ error: "Geen Mollie subscription" }, 400);

    const { data: partner } = await admin
      .from("partners").select("mollie_customer_id").eq("id", abo.partner_id).maybeSingle();
    if (!partner?.mollie_customer_id) return json({ error: "Geen Mollie customer" }, 400);

    await mollieFetch(
      `/customers/${partner.mollie_customer_id}/subscriptions/${abo.mollie_subscription_id}`,
      { method: "DELETE" },
    );

    await admin
      .from("abonnementen")
      .update({
        mollie_status: "canceled",
        status: "opgezegd",
        opzeg_datum: new Date().toISOString().slice(0, 10),
      })
      .eq("id", abo.id);

    return json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Onbekende fout";
    console.error("mollie-cancel-subscription:", msg);
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}