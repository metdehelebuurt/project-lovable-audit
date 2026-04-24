import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from 'jsr:@supabase/supabase-js@2/cors'
import { z } from 'npm:zod@3.23.8'

const BodySchema = z.object({
  partner_id: z.string().uuid(),
  reden: z.string().trim().min(10, 'Reden moet minimaal 10 tekens bevatten').max(500),
  duur_uren: z.number().int().min(1).max(24),
  notify_partner: z.boolean().default(true),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Niet ingelogd' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData.user) {
      return json({ error: 'Ongeldige sessie' }, 401)
    }
    const userId = userData.user.id

    const admin = createClient(supabaseUrl, serviceKey)

    const { data: profile, error: profileErr } = await admin
      .from('users')
      .select('id, rol, voornaam, achternaam, email')
      .eq('id', userId)
      .single()
    if (profileErr || !profile || profile.rol !== 'superadmin') {
      return json({ error: 'Alleen platformbeheerders mogen tijdelijke toegang aanvragen' }, 403)
    }

    const body = await req.json().catch(() => null)
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) {
      return json({ error: 'Ongeldige invoer', details: parsed.error.flatten().fieldErrors }, 400)
    }
    const { partner_id, reden, duur_uren, notify_partner } = parsed.data

    const { data: partner, error: partnerErr } = await admin
      .from('partners')
      .select('id, bedrijfsnaam')
      .eq('id', partner_id)
      .single()
    if (partnerErr || !partner) {
      return json({ error: 'Partner niet gevonden' }, 404)
    }

    const verleend = new Date()
    const vervalt = new Date(verleend.getTime() + duur_uren * 60 * 60 * 1000)

    const { data: grant, error: insertErr } = await admin
      .from('superadmin_access_grants')
      .insert({
        superadmin_user_id: userId,
        partner_id,
        reden: reden.trim(),
        verleend_op: verleend.toISOString(),
        vervalt_op: vervalt.toISOString(),
        notify_partner,
      })
      .select('*')
      .single()
    if (insertErr) {
      return json({ error: insertErr.message }, 400)
    }

    if (notify_partner) {
      const { data: partnerAdmins } = await admin
        .from('users')
        .select('email, voornaam')
        .eq('partner_id', partner_id)
        .eq('rol', 'partner_admin')
        .eq('status', 'actief')

      const sendgridKey = Deno.env.get('SENDGRID_API_KEY')
      const fromEmail = Deno.env.get('SENDGRID_FROM_EMAIL') ?? 'noreply@mijnhuis.nu'
      if (sendgridKey && partnerAdmins && partnerAdmins.length > 0) {
        const adminNaam = `${profile.voornaam ?? ''} ${profile.achternaam ?? ''}`.trim() || profile.email
        const subject = `Tijdelijke platformtoegang geactiveerd voor ${partner.bedrijfsnaam}`
        const html = `
          <p>Beste ${partnerAdmins[0].voornaam ?? ''},</p>
          <p>Een platformbeheerder heeft tijdelijke toegang tot uw partneromgeving geactiveerd.</p>
          <ul>
            <li><strong>Beheerder:</strong> ${escapeHtml(adminNaam)}</li>
            <li><strong>Reden:</strong> ${escapeHtml(reden)}</li>
            <li><strong>Vervalt op:</strong> ${vervalt.toLocaleString('nl-NL')}</li>
          </ul>
          <p>U kunt deze toegang inzien via Instellingen → Platformtoegang historie.</p>
        `
        await sendSendgrid(sendgridKey, fromEmail, partnerAdmins.map(a => a.email), subject, html)
      }
    }

    return json({ grant }, 200)
  } catch (e) {
    console.error('grant-access error', e)
    return json({ error: e instanceof Error ? e.message : 'Onbekende fout' }, 500)
  }
})

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

async function sendSendgrid(apiKey: string, from: string, to: string[], subject: string, html: string) {
  try {
    await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: to.map(email => ({ email })) }],
        from: { email: from, name: 'Mijnhuis.nu' },
        subject,
        content: [{ type: 'text/html', value: html }],
      }),
    })
  } catch (e) {
    console.error('sendgrid send failed', e)
  }
}