import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { mollieFetch, corsHeaders } from "../_shared/mollie.ts";

interface MollieCustomer {
  id: string;
  email: string;
  name: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) return json({ error: "Unauthorized" }, 401);

    const userId = claims.claims.sub as string;
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: user } = await admin
      .from("users")
      .select("partner_id, email")
      .eq("id", userId)
      .maybeSingle();
    if (!user?.partner_id) return json({ error: "Geen partner gevonden" }, 400);

    const { data: partner } = await admin
      .from("partners")
      .select("id, naam, email, mollie_customer_id")
      .eq("id", user.partner_id)
      .maybeSingle();
    if (!partner) return json({ error: "Partner niet gevonden" }, 404);

    if (partner.mollie_customer_id) {
      return json({ customerId: partner.mollie_customer_id, existed: true });
    }

    const customer = await mollieFetch<MollieCustomer>("/customers", {
      method: "POST",
      body: {
        name: partner.naam,
        email: partner.email ?? user.email,
        metadata: { partner_id: partner.id },
      },
    });

    await admin
      .from("partners")
      .update({ mollie_customer_id: customer.id })
      .eq("id", partner.id);

    return json({ customerId: customer.id, existed: false });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Onbekende fout";
    console.error("mollie-create-customer:", msg);
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}