import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, ...payload } = await req.json();

    // Setup superadmin doesn't require auth (bootstrap)
    if (action === "setup_superadmin") {
      return await handleSetupSuperadmin(supabaseAdmin, corsHeaders);
    }

    // Admin password reset (bootstrap utility)
    if (action === "reset_admin_password") {
      const { new_password, new_email } = payload;
      const { data: admins } = await supabaseAdmin
        .from("users")
        .select("id, email")
        .eq("rol", "superadmin")
        .limit(1);
      
      if (!admins || admins.length === 0) {
        return new Response(JSON.stringify({ error: "Geen superadmin gevonden" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const updateData: any = {};
      if (new_password) updateData.password = new_password;
      if (new_email) {
        updateData.email = new_email;
        updateData.email_confirm = true;
      }

      const { error } = await supabaseAdmin.auth.admin.updateUserById(admins[0].id, updateData);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Also update email in users table if changed
      if (new_email) {
        await supabaseAdmin.from("users").update({ email: new_email }).eq("id", admins[0].id);
      }

      return new Response(JSON.stringify({ success: true, message: "Admin account bijgewerkt", old_email: admins[0].email }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // All other actions require authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Niet geautoriseerd" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: caller } } = await supabaseClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Niet geautoriseerd" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get caller's role
    const { data: callerProfile } = await supabaseAdmin
      .from("users")
      .select("rol, partner_id")
      .eq("id", caller.id)
      .single();

    if (!callerProfile) {
      return new Response(JSON.stringify({ error: "Gebruikersprofiel niet gevonden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    switch (action) {
      case "create_user": {
        const { email, password, voornaam, achternaam, rol, partner_id, telefoon } = payload;

        // Authorization check
        if (callerProfile.rol !== "superadmin" && callerProfile.rol !== "partner_admin") {
          return new Response(JSON.stringify({ error: "Geen rechten om gebruikers aan te maken" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Partner admin can only create users within their own partner
        if (callerProfile.rol === "partner_admin" && partner_id !== callerProfile.partner_id) {
          return new Response(JSON.stringify({ error: "Kan alleen gebruikers binnen eigen organisatie aanmaken" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Create auth user
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: password || generatePassword(),
          email_confirm: true,
        });

        if (authError) {
          return new Response(JSON.stringify({ error: authError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Create profile
        const { error: profileError } = await supabaseAdmin.from("users").insert({
          id: authUser.user.id,
          email,
          voornaam,
          achternaam,
          rol,
          partner_id: rol === "superadmin" ? null : partner_id,
          telefoon,
          status: "actief",
        });

        if (profileError) {
          // Rollback: delete auth user
          await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
          return new Response(JSON.stringify({ error: profileError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ user: { id: authUser.user.id, email } }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete_user": {
        const { user_id } = payload;

        if (callerProfile.rol !== "superadmin" && callerProfile.rol !== "partner_admin") {
          return new Response(JSON.stringify({ error: "Geen rechten" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Partner admin scope check
        if (callerProfile.rol === "partner_admin") {
          const { data: targetUser } = await supabaseAdmin
            .from("users")
            .select("partner_id")
            .eq("id", user_id)
            .single();
          if (!targetUser || targetUser.partner_id !== callerProfile.partner_id) {
            return new Response(JSON.stringify({ error: "Geen rechten" }), {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }

        // Delete from users table first (cascade), then auth
        await supabaseAdmin.from("users").delete().eq("id", user_id);
        const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id);

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "reset_password": {
        const { user_id, new_password } = payload;

        if (callerProfile.rol !== "superadmin" && callerProfile.rol !== "partner_admin") {
          return new Response(JSON.stringify({ error: "Geen rechten" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
          password: new_password || generatePassword(),
        });

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }


      default:
        return new Response(JSON.stringify({ error: "Onbekende actie" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleSetupSuperadmin(supabaseAdmin: any, corsHeaders: Record<string, string>) {
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("rol", "superadmin")
    .limit(1);

  if (existing && existing.length > 0) {
    return new Response(JSON.stringify({ error: "Superadmin bestaat al" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const email = "info@cenora.nl";
  const password = "AdminCenora2024!";

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return new Response(JSON.stringify({ error: authError.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { error: profileError } = await supabaseAdmin.from("users").insert({
    id: authUser.user.id,
    email,
    voornaam: "Admin",
    achternaam: "Cenora",
    rol: "superadmin",
    partner_id: null,
    status: "actief",
  });

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    return new Response(JSON.stringify({ error: profileError.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ success: true, email, message: "Superadmin aangemaakt" }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

function generatePassword(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
