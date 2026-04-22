import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { mollieFetch, webhookUrl, corsHeaders } from "../_shared/mollie.ts";

interface MollieSubscription { id: string; status: string; nextPaymentDate?: string; }
interface MolliePayment { id: string; status: string; _links: { checkout?: { href: string } }; }

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

    const { addonId, aantal = 1, interval = "maand" } = await req.json();
    if (!addonId) return json({ error: "addonId vereist" }, 400);

    const userId = claims.claims.sub as string;
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: user } = await admin
      .from("users").select("partner_id").eq("id", userId).maybeSingle();
    if (!user?.partner_id) return json({ error: "Geen partner" }, 400);

    const { data: partner } = await admin
      .from("partners")
      .select("mollie_customer_id, mollie_mandate_status, naam")
      .eq("id", user.partner_id)
      .maybeSingle();
    if (!partner?.mollie_customer_id) return json({ error: "Geen Mollie customer" }, 400);

    const { data: addon } = await admin
      .from("abonnement_addons")
      .select("id, naam, type, maand_prijs, jaar_prijs")
      .eq("id", addonId)
      .maybeSingle();
    if (!addon) return json({ error: "Add-on niet gevonden" }, 404);

    const isRecurring = addon.type === "abonnement";
    const prijs = interval === "jaar" ? Number(addon.jaar_prijs) : Number(addon.maand_prijs);
    const totaal = (prijs * aantal).toFixed(2);

    if (isRecurring) {
      if (partner.mollie_mandate_status !== "valid") {
        return json({ error: "Geldig betaalmandaat vereist voor recurring add-on" }, 400);
      }
      const sub = await mollieFetch<MollieSubscription>(
        `/customers/${partner.mollie_customer_id}/subscriptions`,
        {
          method: "POST",
          body: {
            amount: { currency: "EUR", value: totaal },
            interval: interval === "jaar" ? "12 months" : "1 month",
            description: `Add-on ${addon.naam} × ${aantal}`,
            webhookUrl: webhookUrl(),
            metadata: { partner_id: user.partner_id, addon_id: addon.id, kind: "addon" },
          },
        },
      );

      await admin.from("abonnement_addon_aankopen").insert({
        partner_id: user.partner_id,
        addon_id: addon.id,
        aantal,
        interval,
        maand_bedrag: prijs,
        status: "actief",
        mollie_subscription_id: sub.id,
      });

      return json({ kind: "subscription", subscriptionId: sub.id });
    }

    const origin = req.headers.get("origin") ?? "https://mijnhuis.nu";
    const payment = await mollieFetch<MolliePayment>("/payments", {
      method: "POST",
      body: {
        amount: { currency: "EUR", value: totaal },
        description: `Eenmalige add-on ${addon.naam} × ${aantal}`,
        customerId: partner.mollie_customer_id,
        sequenceType: partner.mollie_mandate_status === "valid" ? "recurring" : "oneoff",
        redirectUrl: `${origin}/abonnementen?addon=success`,
        webhookUrl: webhookUrl(),
        metadata: { partner_id: user.partner_id, addon_id: addon.id, kind: "addon_oneoff" },
      },
    });

    await admin.from("abonnement_addon_aankopen").insert({
      partner_id: user.partner_id,
      addon_id: addon.id,
      aantal,
      interval: "eenmalig",
      maand_bedrag: prijs,
      status: "in_afwachting",
      mollie_payment_id: payment.id,
    });

    return json({
      kind: "payment",
      paymentId: payment.id,
      checkoutUrl: payment._links.checkout?.href,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Onbekende fout";
    console.error("mollie-purchase-addon:", msg);
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}