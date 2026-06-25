import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";
import { sendUserEmail, UserMailboxError } from "../_shared/user-email-send.ts";
import { wrapInMijnhuisTemplate } from "../_shared/mijnhuis-template.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  template_key: z.string().min(1).max(100),
  onderwerp: z.string().min(1).max(300),
  body_html: z.string().min(1).max(50000),
  recipient_email: z.string().email().max(320).optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Niet ingelogd" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    if (!user) return json({ error: "Niet ingelogd" }, 401);

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: profile } = await adminClient
      .from("users")
      .select("partner_id, email, voornaam, achternaam")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.email) return json({ error: "Geen e-mailadres bekend op profiel" }, 400);

    const naam = [profile.voornaam, profile.achternaam].filter(Boolean).join(" ").trim() || null;
    const html = wrapInMijnhuisTemplate(parsed.data.body_html, naam);

    const to = parsed.data.recipient_email?.trim() || profile.email;

    await sendUserEmail({
      adminClient,
      userId: user.id,
      partnerId: profile.partner_id ?? "",
      to,
      subject: `[TEST] ${parsed.data.onderwerp}`,
      html,
      type: "affiliate-template-test",
    });

    return json({ ok: true });
  } catch (err) {
    const status = err instanceof UserMailboxError ? err.status : 500;
    const msg = err instanceof Error ? err.message : "Onbekende fout";
    return json({ error: msg }, status);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
