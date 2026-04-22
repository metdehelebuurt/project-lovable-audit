import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { token } = await req.json();
    if (!token) throw new Error("token verplicht");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: rapport, error } = await admin
      .from("opleverrapporten")
      .select("id, partner_id, rapportnummer, status, pdf_url, klant_token_expires_at, klant_id")
      .eq("klant_token", token)
      .maybeSingle();

    if (error || !rapport) throw new Error("Rapport niet gevonden");
    if (rapport.klant_token_expires_at && new Date(rapport.klant_token_expires_at) < new Date()) {
      throw new Error("Link is verlopen");
    }

    let signedPdf: string | null = null;
    if (rapport.pdf_url) {
      const { data: sig } = await admin.storage.from("oplever-media").createSignedUrl(rapport.pdf_url, 3600);
      signedPdf = sig?.signedUrl ?? null;
    }

    let klantNaam: string | null = null;
    if (rapport.klant_id) {
      const { data: k } = await admin.from("klanten").select("voornaam, achternaam").eq("id", rapport.klant_id).maybeSingle();
      klantNaam = k ? `${k.voornaam ?? ""} ${k.achternaam ?? ""}`.trim() : null;
    }
    const { data: partner } = await admin.from("partners").select("bedrijfsnaam").eq("id", rapport.partner_id).maybeSingle();

    return new Response(JSON.stringify({
      rapportnummer: rapport.rapportnummer,
      status: rapport.status,
      pdf_url: signedPdf,
      klant_naam: klantNaam,
      partner_naam: partner?.bedrijfsnaam ?? null,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
