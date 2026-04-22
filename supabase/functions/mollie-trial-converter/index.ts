import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { mollieFetch, webhookUrl, corsHeaders } from "../_shared/mollie.ts";

// Scheduled (dagelijks). Converteert trials naar actieve abonnementen wanneer:
// - trial bijna afloopt (<= 1 dag)
// - partner heeft geldig mandaat
// Anders → status verloopt + e-mail (via bestaande subscription-notifications)

interface MollieSubscription { id: string; status: string; nextPaymentDate?: string; }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10);

    const { data: trials } = await admin
      .from("abonnementen")
      .select("id, partner_id, plan_id, interval, maand_bedrag, verloop_datum, partners!inner(naam, mollie_customer_id, mollie_mandate_status)")
      .eq("status", "trial")
      .lte("verloop_datum", tomorrow)
      .is("mollie_subscription_id", null);

    let converted = 0;
    let expired = 0;

    for (const abo of trials ?? []) {
      const partner = (abo as { partners: { naam: string; mollie_customer_id?: string; mollie_mandate_status?: string } }).partners;

      if (partner.mollie_mandate_status !== "valid" || !partner.mollie_customer_id) {
        await admin.from("abonnementen").update({ status: "verlopen" }).eq("id", abo.id);
        expired++;
        continue;
      }

      const interval = abo.interval === "jaar" ? "12 months" : "1 month";
      const amount = abo.interval === "jaar"
        ? (Number(abo.maand_bedrag) * 12).toFixed(2)
        : Number(abo.maand_bedrag).toFixed(2);

      try {
        const sub = await mollieFetch<MollieSubscription>(
          `/customers/${partner.mollie_customer_id}/subscriptions`,
          {
            method: "POST",
            body: {
              amount: { currency: "EUR", value: amount },
              interval,
              description: `Mijnhuis.nu abonnement ${partner.naam}`,
              webhookUrl: webhookUrl(),
              metadata: { abonnement_id: abo.id, partner_id: abo.partner_id, kind: "trial_conversion" },
            },
          },
        );
        await admin.from("abonnementen").update({
          mollie_subscription_id: sub.id,
          mollie_status: sub.status,
          status: "actief",
          volgende_factuur_datum: sub.nextPaymentDate ?? null,
        }).eq("id", abo.id);
        converted++;
      } catch (e) {
        console.error("trial conversion fout", abo.id, e);
      }
    }

    return new Response(JSON.stringify({ converted, expired, checked: trials?.length ?? 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Onbekende fout";
    console.error("mollie-trial-converter:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});