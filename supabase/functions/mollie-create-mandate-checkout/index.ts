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

    const { redirectUrl } = await req.json().catch(() => ({ redirectUrl: null }));

    const userId = claims.claims.sub as string;
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: user } = await admin
      .from("users")
      .select("partner_id")
      .eq("id", userId)
      .maybeSingle();
    if (!user?.partner_id) return json({ error: "Geen partner" }, 400);

    const { data: partner } = await admin
      .from("partners")
      .select("id, mollie_customer_id, naam")
      .eq("id", user.partner_id)
      .maybeSingle();
    if (!partner?.mollie_customer_id) {
      return json({ error: "Partner heeft geen Mollie customer (eerst create-customer aanroepen)" }, 400);
    }

    const origin = req.headers.get("origin") ?? "https://mijnhuis.nu";
    const payment = await mollieFetch<MolliePayment>("/payments", {
      method: "POST",
      body: {
        amount: { currency: "EUR", value: "1.00" },
        description: `Verificatie betaalmethode ${partner.naam}`,
        sequenceType: "first",
        customerId: partner.mollie_customer_id,
        redirectUrl: redirectUrl ?? `${origin}/onboarding/betaalmethode-klaar`,
        webhookUrl: webhookUrl(),
        metadata: { partner_id: partner.id, kind: "mandate_setup" },
      },
    });

    return json({
      paymentId: payment.id,
      checkoutUrl: payment._links.checkout?.href,
      status: payment.status,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Onbekende fout";
    console.error("mollie-create-mandate-checkout:", msg);
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}