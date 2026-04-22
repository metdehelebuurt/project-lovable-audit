import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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

    const userId = claims.claims.sub as string;
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: user } = await admin
      .from("users").select("rol, partner_id").eq("id", userId).maybeSingle();
    if (!user) return json({ error: "User niet gevonden" }, 404);

    const isSuperadmin = user.rol === "superadmin";
    const { abonnementId } = await req.json().catch(() => ({}));

    let query = admin
      .from("abonnementen")
      .select("id, partner_id, mollie_subscription_id, partners!inner(mollie_customer_id)")
      .not("mollie_subscription_id", "is", null);
    if (!isSuperadmin) query = query.eq("partner_id", user.partner_id);
    if (abonnementId) query = query.eq("id", abonnementId);

    const { data: abos } = await query;
    let synced = 0;

    for (const abo of abos ?? []) {
      const customerId = (abo as { partners: { mollie_customer_id: string } }).partners.mollie_customer_id;
      if (!customerId) continue;
      try {
        const sub = await mollieFetch<{ status: string; nextPaymentDate?: string }>(
          `/customers/${customerId}/subscriptions/${abo.mollie_subscription_id}`,
        );
        await admin.from("abonnementen").update({
          mollie_status: sub.status,
          volgende_factuur_datum: sub.nextPaymentDate ?? null,
        }).eq("id", abo.id);
        synced++;
      } catch (e) {
        console.warn("sync fout abonnement", abo.id, e);
      }
    }

    return json({ synced, total: abos?.length ?? 0 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Onbekende fout";
    console.error("mollie-sync-status:", msg);
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}