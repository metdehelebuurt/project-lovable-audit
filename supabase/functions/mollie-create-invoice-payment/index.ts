import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { mollieFetch, webhookUrl, corsHeaders } from "../_shared/mollie.ts";

interface MolliePayment {
  id: string;
  status: string;
  _links: { checkout?: { href: string } };
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

    const { factuurId, redirectUrl } = await req.json();
    if (!factuurId) return json({ error: "factuurId vereist" }, 400);

    const userId = claims.claims.sub as string;
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: user } = await admin
      .from("users").select("rol").eq("id", userId).maybeSingle();
    if (user?.rol !== "superadmin") return json({ error: "Alleen superadmin" }, 403);

    const { data: factuur } = await admin
      .from("facturen")
      .select("id, factuurnummer, totaal_bedrag, partner_id, status, partners(naam, email)")
      .eq("id", factuurId)
      .maybeSingle();
    if (!factuur) return json({ error: "Factuur niet gevonden" }, 404);
    if (factuur.status === "betaald") return json({ error: "Al betaald" }, 400);

    const partner = (factuur as { partners: { naam: string; email: string | null } }).partners;
    const origin = req.headers.get("origin") ?? "https://mijnhuis.nu";

    const payment = await mollieFetch<MolliePayment>("/payments", {
      method: "POST",
      body: {
        amount: { currency: "EUR", value: Number(factuur.totaal_bedrag).toFixed(2) },
        description: `Factuur ${factuur.factuurnummer} — ${partner.naam}`,
        redirectUrl: redirectUrl ?? `${origin}/abonnement?factuur=${factuur.id}`,
        webhookUrl: webhookUrl(),
        metadata: {
          factuur_id: factuur.id,
          partner_id: factuur.partner_id,
          kind: "abonnement_factuur",
        },
      },
    });

    await admin.from("facturen").update({
      mollie_payment_id: payment.id,
      mollie_payment_status: payment.status,
      mollie_checkout_url: payment._links.checkout?.href ?? null,
      status: "verstuurd",
    }).eq("id", factuur.id);

    return json({
      paymentId: payment.id,
      checkoutUrl: payment._links.checkout?.href,
      status: payment.status,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Onbekende fout";
    console.error("mollie-create-invoice-payment:", msg);
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}