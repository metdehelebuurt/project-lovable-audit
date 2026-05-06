import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { action, share_token, afzender_naam, bericht } = body;

    if (!share_token || typeof share_token !== "string") {
      return new Response(JSON.stringify({ error: "share_token is vereist" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate share_token -> get offerte
    const { data: offerte, error: oErr } = await supabase
      .from("offertes")
      .select("id, offertenummer, partner_id, adviseur_id, klant_naam, share_token, share_expires_at")
      .eq("share_token", share_token)
      .single();

    if (oErr || !offerte) {
      return new Response(JSON.stringify({ error: "Offerte niet gevonden" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (offerte.share_expires_at && new Date(offerte.share_expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Link verlopen" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET messages
    if (action === "get") {
      const { data: messages } = await supabase
        .from("offerte_berichten")
        .select("*")
        .eq("offerte_id", offerte.id)
        .order("created_at", { ascending: true });

      return new Response(JSON.stringify({ messages: messages || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST message
    if (action === "post") {
      if (!bericht?.trim() || !afzender_naam?.trim()) {
        return new Response(JSON.stringify({ error: "Naam en bericht zijn verplicht" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: insertErr } = await supabase
        .from("offerte_berichten")
        .insert({
          offerte_id: offerte.id,
          share_token,
          afzender_type: "klant",
          afzender_naam: afzender_naam.trim(),
          bericht: bericht.trim(),
        });

      if (insertErr) {
        return new Response(JSON.stringify({ error: insertErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Notificeer backoffice: adviseur (eigenaar) + alle partner_admins van deze partner.
      try {
        const ontvangerIds = new Set<string>();
        if (offerte.adviseur_id) ontvangerIds.add(offerte.adviseur_id);
        if (offerte.partner_id) {
          const { data: admins } = await supabase
            .from("users")
            .select("id")
            .eq("partner_id", offerte.partner_id)
            .eq("rol", "partner_admin");
          for (const a of admins || []) ontvangerIds.add(a.id);
        }
        if (ontvangerIds.size > 0) {
          const snippet = bericht.trim().slice(0, 140);
          const rows = Array.from(ontvangerIds).map((uid) => ({
            user_id: uid,
            type: "offerte_bericht",
            titel: `Nieuw bericht van ${afzender_naam.trim()}`,
            bericht: `Offerte ${offerte.offertenummer || ""}: ${snippet}`,
            entity_type: "offerte",
            entity_id: offerte.id,
          }));
          await supabase.from("notificaties").insert(rows);
        }
      } catch (notifErr) {
        // Notificaties zijn best-effort — niet blokkerend voor verzending.
        console.warn("Notificatie aanmaken mislukt:", notifErr);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ongeldige actie" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("offerte-portal-messages error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Onbekende fout" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
