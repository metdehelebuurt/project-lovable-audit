import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { mollieFetch, webhookUrl, corsHeaders } from "../_shared/mollie.ts";

interface MollieSubscription {
  id: string;
  status: string;
  nextPaymentDate?: string;
}

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
    if (!abonnementId) return json({ error: "abonnementId vereist" }, 400);

    const userId = claims.claims.sub as string;
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: user } = await admin
      .from("users")
      .select("partner_id, rol")
      .eq("id", userId)
      .maybeSingle();
    if (!user?.partner_id) return json({ error: "Geen partner" }, 400);

    const { data: abo } = await admin
      .from("abonnementen")
      .select("id, partner_id, plan_id, interval, maand_bedrag, mollie_subscription_id")
      .eq("id", abonnementId)
      .maybeSingle();
    if (!abo) return json({ error: "Abonnement niet gevonden" }, 404);
    if (abo.partner_id !== user.partner_id && user.rol !== "superadmin") {
      return json({ error: "Geen toegang" }, 403);
    }
    if (abo.mollie_subscription_id) {
      return json({ subscriptionId: abo.mollie_subscription_id, existed: true });
    }

    const { data: partner } = await admin
      .from("partners")
      .select("mollie_customer_id, mollie_mandate_status, naam")
      .eq("id", abo.partner_id)
      .maybeSingle();
    if (!partner?.mollie_customer_id) return json({ error: "Geen Mollie customer" }, 400);
    if (partner.mollie_mandate_status !== "valid") {
      return json({ error: "Geen geldig betaalmandaat" }, 400);
    }

    const interval = abo.interval === "jaar" ? "12 months" : "1 month";
    const amount = abo.interval === "jaar"
      ? (Number(abo.maand_bedrag) * 12).toFixed(2)
      : Number(abo.maand_bedrag).toFixed(2);

    const sub = await mollieFetch<MollieSubscription>(
      `/customers/${partner.mollie_customer_id}/subscriptions`,
      {
        method: "POST",
        body: {
          amount: { currency: "EUR", value: amount },
          interval,
          description: `Mijnhuis.nu abonnement ${partner.naam}`,
          webhookUrl: webhookUrl(),
          metadata: { abonnement_id: abo.id, partner_id: abo.partner_id },
        },
      },
    );

    await admin
      .from("abonnementen")
      .update({
        mollie_subscription_id: sub.id,
        mollie_status: sub.status,
        status: "actief",
        volgende_factuur_datum: sub.nextPaymentDate ?? null,
      })
      .eq("id", abo.id);

    return json({ subscriptionId: sub.id, status: sub.status, nextPaymentDate: sub.nextPaymentDate });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Onbekende fout";
    console.error("mollie-create-subscription:", msg);
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}