import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendTransactional } from "../_shared/partner-notify-recipients.ts";

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

    // All actions require authentication
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
      case "setup_superadmin": {
        // Only existing superadmins can bootstrap another superadmin
        if (callerProfile.rol !== "superadmin") {
          return new Response(JSON.stringify({ error: "Alleen superadmins kunnen dit uitvoeren" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return await handleSetupSuperadmin(supabaseAdmin, corsHeaders);
      }

      case "create_user": {
        const { email, password, voornaam, achternaam, rol, partner_id, telefoon } = payload;

        // Authorization check
        if (callerProfile.rol !== "superadmin" && callerProfile.rol !== "partner_admin") {
          return new Response(JSON.stringify({ error: "Geen rechten om gebruikers aan te maken" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Role cap: partner_admin can only assign rollen binnen de eigen organisatie.
        const allowedRolesForPartnerAdmin = ["backoffice", "partner_staff", "adviseur", "installateur", "consument", "affiliate"];
        const allowedRolesForSuperadmin = ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur", "affiliate", "consument"];

        if (callerProfile.rol === "partner_admin" && !allowedRolesForPartnerAdmin.includes(rol)) {
          return new Response(JSON.stringify({ error: "Rol niet toegestaan" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (callerProfile.rol === "superadmin" && !allowedRolesForSuperadmin.includes(rol)) {
          return new Response(JSON.stringify({ error: "Ongeldige rol" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Bepaal effectieve partner-context.
        // - superadmin blijft platformbreed
        // - affiliate mag door superadmin platformbreed worden aangemaakt
        // - affiliate door partner_admin wordt aan de eigen organisatie gekoppeld
        const isPlatformAffiliate = rol === "affiliate" && callerProfile.rol === "superadmin" && !partner_id;
        const resolvedPartnerId = rol === "superadmin"
          ? null
          : isPlatformAffiliate
            ? null
            : (partner_id ?? callerProfile.partner_id ?? null);

        if (rol !== "superadmin" && !isPlatformAffiliate && !resolvedPartnerId) {
          return new Response(
            JSON.stringify({ error: "partner_id is verplicht voor deze rol" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Partner admin can only create users within their own partner
        if (callerProfile.rol === "partner_admin" && resolvedPartnerId !== callerProfile.partner_id) {
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
          partner_id: resolvedPartnerId,
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

        // Welkomstmail met password-reset link
        try {
          const siteUrl = req.headers.get("origin") ?? "https://mijnhuis.nu";
          const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
            type: "recovery",
            email,
            options: { redirectTo: `${siteUrl}/reset-password` },
          });
          const setupUrl = linkData?.properties?.action_link ?? `${siteUrl}/login`;
          let partnerNaam: string | undefined;
          if (resolvedPartnerId) {
            const { data: p } = await supabaseAdmin
              .from("partners").select("naam").eq("id", resolvedPartnerId).maybeSingle();
            partnerNaam = p?.naam ?? undefined;
          }
          const { data: inviter } = await supabaseAdmin
            .from("users").select("voornaam, achternaam")
            .eq("id", caller.id).maybeSingle();
          const uitgenodigdDoor = [inviter?.voornaam, inviter?.achternaam].filter(Boolean).join(" ") || undefined;
          await sendTransactional("gebruiker-welkom", email, `gebruiker-welkom-${authUser.user.id}`, {
            voornaam, email, rol, partnerNaam, uitgenodigdDoor, setupUrl,
          });
        } catch (e) {
          console.warn("gebruiker-welkom mail kon niet worden verzonden:", e);
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

        // Verwijder direct via auth.admin.deleteUser.
        // public.users.id heeft ON DELETE CASCADE naar auth.users(id),
        // dus de profielrij + alle CASCADE-tabellen worden automatisch opgeruimd.
        // SET NULL-tabellen behouden hun historie.
        const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id);

        if (error) {
          const msg = error.message || "";

          // Idempotent: user bestond al niet meer → succes
          if (msg.toLowerCase().includes("user not found") || msg.toLowerCase().includes("not_found")) {
            return new Response(JSON.stringify({ success: true, already_deleted: true }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // FK violation → vriendelijke melding
          if (msg.includes("foreign key") || msg.includes("23503")) {
            return new Response(
              JSON.stringify({
                error:
                  "Deze gebruiker is nog gekoppeld aan andere records. Wijs deze records eerst over aan een andere gebruiker of archiveer ze, en probeer het opnieuw.",
              }),
              {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              },
            );
          }

          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
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

        // Partner admin scope check - can only reset passwords within own partner
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

  // Use environment variables for initial admin credentials
  const email = Deno.env.get("INITIAL_ADMIN_EMAIL");
  const password = Deno.env.get("INITIAL_ADMIN_PASSWORD") || generatePassword();

  if (!email) {
    return new Response(JSON.stringify({ error: "INITIAL_ADMIN_EMAIL niet geconfigureerd" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

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
    achternaam: "Platform",
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
    JSON.stringify({ success: true, message: "Superadmin aangemaakt" }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

function generatePassword(): string {
  // Cryptografisch veilig wachtwoord (geen Math.random)
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
  const len = 20;
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  let password = "";
  for (let i = 0; i < len; i++) {
    password += chars.charAt(arr[i] % chars.length);
  }
  // Garandeer minimaal 1 hoofdletter, 1 cijfer en 1 symbool
  if (!/[A-Z]/.test(password)) password = "A" + password.slice(1);
  if (!/[0-9]/.test(password)) password = password.slice(0, -1) + "7";
  if (!/[!@#$%&*]/.test(password)) password = password.slice(0, -2) + "!" + password.slice(-1);
  return password;
}
