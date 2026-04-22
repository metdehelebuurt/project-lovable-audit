import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { mollieFetch, corsHeaders } from "../_shared/mollie.ts";

interface MolliePayment {
  id: string;
  status: string;
  amount: { value: string; currency: string };
  customerId?: string;
  subscriptionId?: string;
  mandateId?: string;
  metadata?: Record<string, unknown>;
  paidAt?: string;
  method?: string;
}

interface MollieMandate {
  id: string;
  status: string;
  customerId: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const form = await req.formData();
    const id = form.get("id")?.toString();
    if (!id) return new Response("missing id", { status: 400 });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (id.startsWith("tr_")) {
      await processPayment(id, admin);
    } else if (id.startsWith("sub_")) {
      await processSubscription(id, admin);
    } else if (id.startsWith("mdt_")) {
      await processMandate(id, admin);
    } else {
      console.warn("Onbekend Mollie ID type:", id);
    }

    return new Response("ok", { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Onbekende fout";
    console.error("mollie-webhook fout:", msg);
    // Mollie retried bij non-2xx; we loggen maar geven 200 om infinite retries te voorkomen
    return new Response("ok", { status: 200 });
  }
});

async function processPayment(id: string, admin: ReturnType<typeof createClient>) {
  const payment = await mollieFetch<MolliePayment>(`/payments/${id}`);

  // Idempotency: bestaat dit event al?
  const { data: existing } = await admin
    .from("mollie_webhook_events")
    .select("id, processed")
    .eq("mollie_payment_id", id)
    .eq("event_type", `payment.${payment.status}`)
    .maybeSingle();
  if (existing?.processed) return;

  const eventId = existing?.id ?? (await admin
    .from("mollie_webhook_events")
    .insert({
      event_type: `payment.${payment.status}`,
      mollie_payment_id: id,
      mollie_customer_id: payment.customerId,
      mollie_subscription_id: payment.subscriptionId,
      payload: payment as unknown as Record<string, unknown>,
    })
    .select("id")
    .single()).data?.id;

  const meta = payment.metadata ?? {};
  const kind = meta.kind as string | undefined;

  // Mandaat-setup payment → bevestig mandaat op partner
  if (kind === "mandate_setup" && payment.status === "paid" && payment.customerId) {
    const mandates = await mollieFetch<{ _embedded?: { mandates?: MollieMandate[] } }>(
      `/customers/${payment.customerId}/mandates`,
    );
    const valid = mandates._embedded?.mandates?.find((m) => m.status === "valid");
    if (valid) {
      await admin
        .from("partners")
        .update({ mollie_mandate_id: valid.id, mollie_mandate_status: "valid" })
        .eq("mollie_customer_id", payment.customerId);
    }
  }

  // Add-on eenmalig
  if (kind === "addon_oneoff") {
    await admin
      .from("abonnement_addon_aankopen")
      .update({ status: payment.status === "paid" ? "actief" : "geannuleerd" })
      .eq("mollie_payment_id", id);
  }

  // Recurring payment van subscription → factuur in 'facturen'
  if (payment.subscriptionId && payment.status === "paid") {
    const { data: abo } = await admin
      .from("abonnementen")
      .select("id, partner_id")
      .eq("mollie_subscription_id", payment.subscriptionId)
      .maybeSingle();
    if (abo) {
      const totaal = Number(payment.amount.value);
      const btw = +(totaal - totaal / 1.21).toFixed(2);
      const excl = +(totaal - btw).toFixed(2);
      const { data: nrData } = await admin.rpc("generate_abonnement_factuurnummer");
      await admin.from("facturen").insert({
        partner_id: abo.partner_id,
        abonnement_id: abo.id,
        factuurnummer: nrData ?? `AB-${Date.now()}`,
        bedrag_excl_btw: excl,
        btw_bedrag: btw,
        totaal_bedrag: totaal,
        periode_start: new Date().toISOString().slice(0, 10),
        periode_eind: new Date().toISOString().slice(0, 10),
        status: "betaald",
        betaald_op: payment.paidAt ?? new Date().toISOString(),
        betaald_via: payment.method ?? "mollie",
        mollie_payment_id: id,
        mollie_payment_status: payment.status,
      });
    }
  }

  await admin
    .from("mollie_webhook_events")
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq("id", eventId);
}

async function processSubscription(id: string, admin: ReturnType<typeof createClient>) {
  await admin.from("mollie_webhook_events").insert({
    event_type: "subscription.update",
    mollie_subscription_id: id,
    payload: { id },
    processed: true,
    processed_at: new Date().toISOString(),
  });

  const { data: abo } = await admin
    .from("abonnementen")
    .select("id, partner_id")
    .eq("mollie_subscription_id", id)
    .maybeSingle();
  if (!abo) return;

  const { data: partner } = await admin
    .from("partners").select("mollie_customer_id").eq("id", abo.partner_id).maybeSingle();
  if (!partner?.mollie_customer_id) return;

  const sub = await mollieFetch<{ status: string; nextPaymentDate?: string }>(
    `/customers/${partner.mollie_customer_id}/subscriptions/${id}`,
  );

  await admin
    .from("abonnementen")
    .update({
      mollie_status: sub.status,
      status: sub.status === "active" ? "actief"
        : sub.status === "canceled" ? "opgezegd"
        : sub.status === "suspended" ? "gepauzeerd"
        : "actief",
      volgende_factuur_datum: sub.nextPaymentDate ?? null,
    })
    .eq("id", abo.id);
}

async function processMandate(id: string, admin: ReturnType<typeof createClient>) {
  await admin.from("mollie_webhook_events").insert({
    event_type: "mandate.update",
    mollie_mandate_id: id,
    payload: { id },
    processed: true,
    processed_at: new Date().toISOString(),
  });
}