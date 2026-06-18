import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

const BUCKET = 'schouw-media'
const SITE_URL = 'https://app.mijnhuis.nu'

interface SchouwFoto { url: string; label: string; uploaded_at: string; path?: string }

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

function getServiceClient() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
}

async function loadSchouwByToken(supabase: ReturnType<typeof getServiceClient>, token: string) {
  const { data, error } = await supabase
    .from('schouwen')
    .select('id, schouw_nummer, consument_naam, klant_email, fotos, status, partner_id, adviseur_id, lead_id, is_self_service, self_service_completed_at')
    .eq('self_service_token', token)
    .maybeSingle()
  if (error) throw error
  return data
}

async function loadPartnerBranding(supabase: ReturnType<typeof getServiceClient>, partnerId: string) {
  const { data } = await supabase
    .from('partners')
    .select('naam, logo_url, logo_url_donker, primaire_kleur, website')
    .eq('id', partnerId)
    .maybeSingle()
  return data
}

async function handleGet(token: string) {
  const supabase = getServiceClient()
  const schouw = await loadSchouwByToken(supabase, token)
  if (!schouw) return json({ error: 'Niet gevonden' }, 404)
  if (!schouw.is_self_service) return json({ error: 'Self-service uitgeschakeld' }, 403)
  const partner = await loadPartnerBranding(supabase, schouw.partner_id)
  const fotos = Array.isArray(schouw.fotos) ? (schouw.fotos as SchouwFoto[]).filter((f) => f?.label?.startsWith('self:')) : []
  return json({
    schouwId: schouw.id,
    schouwNummer: schouw.schouw_nummer,
    consumentNaam: schouw.consument_naam,
    voltooidOp: schouw.self_service_completed_at,
    partner,
    fotos,
  })
}

async function handleUpload(token: string, req: Request) {
  const supabase = getServiceClient()
  const schouw = await loadSchouwByToken(supabase, token)
  if (!schouw) return json({ error: 'Niet gevonden' }, 404)
  if (!schouw.is_self_service) return json({ error: 'Self-service uitgeschakeld' }, 403)
  if (schouw.self_service_completed_at) return json({ error: 'Reeds afgerond' }, 409)

  const form = await req.formData()
  const file = form.get('file')
  const categorie = String(form.get('categorie') ?? 'overig').slice(0, 40)
  if (!(file instanceof File)) return json({ error: 'Geen bestand' }, 400)
  if (!file.type.startsWith('image/')) return json({ error: 'Alleen afbeeldingen' }, 400)
  if (file.size > 15 * 1024 * 1024) return json({ error: 'Maximaal 15MB' }, 400)

  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const safeCat = categorie.replace(/[^a-z0-9_-]/gi, '-')
  const path = `${schouw.id}/self-service/${safeCat}-${Date.now()}-${crypto.randomUUID().slice(0, 6)}.${ext}`

  const bytes = new Uint8Array(await file.arrayBuffer())
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type, upsert: false,
  })
  if (upErr) return json({ error: `Upload mislukt: ${upErr.message}` }, 500)

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
  const nieuweFoto: SchouwFoto = {
    url: pub.publicUrl,
    label: `self:${safeCat}`,
    uploaded_at: new Date().toISOString(),
    path,
  }
  const huidige = Array.isArray(schouw.fotos) ? (schouw.fotos as SchouwFoto[]) : []
  const next = [...huidige, nieuweFoto]
  const { error: updErr } = await supabase.from('schouwen').update({ fotos: next as any }).eq('id', schouw.id)
  if (updErr) return json({ error: `Opslaan mislukt: ${updErr.message}` }, 500)

  return json({ foto: nieuweFoto })
}

async function handleDelete(token: string, req: Request) {
  const supabase = getServiceClient()
  const schouw = await loadSchouwByToken(supabase, token)
  if (!schouw) return json({ error: 'Niet gevonden' }, 404)
  if (schouw.self_service_completed_at) return json({ error: 'Reeds afgerond' }, 409)

  const body = await req.json().catch(() => ({})) as { path?: string }
  if (!body.path) return json({ error: 'path vereist' }, 400)
  const huidige = Array.isArray(schouw.fotos) ? (schouw.fotos as SchouwFoto[]) : []
  const target = huidige.find((f) => f.path === body.path && f.label?.startsWith('self:'))
  if (!target) return json({ error: 'Foto niet gevonden' }, 404)

  await supabase.storage.from(BUCKET).remove([body.path])
  const next = huidige.filter((f) => f.path !== body.path)
  await supabase.from('schouwen').update({ fotos: next as any }).eq('id', schouw.id)
  return json({ ok: true })
}

async function notifyAdviseur(supabase: ReturnType<typeof getServiceClient>, schouw: any) {
  if (!schouw.adviseur_id) return
  const { data: adv } = await supabase
    .from('users')
    .select('email, voornaam, achternaam')
    .eq('id', schouw.adviseur_id)
    .maybeSingle()
  if (!adv?.email) return
  try {
    await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'consument-schouw-voltooid',
        recipientEmail: adv.email,
        idempotencyKey: `consumer-schouw-${schouw.id}`,
        templateData: {
          ontvangerNaam: adv.voornaam ?? '',
          schouwNummer: schouw.schouw_nummer,
          consumentNaam: schouw.consument_naam ?? '',
          url: `${SITE_URL}/schouwen/${schouw.id}`,
        },
      },
    })
  } catch (e) {
    console.error('email failed', e)
  }
  await supabase.from('notificaties').insert({
    user_id: schouw.adviseur_id,
    type: 'consumer_schouw',
    titel: 'Consument heeft foto\'s aangeleverd',
    bericht: `Schouw ${schouw.schouw_nummer}${schouw.consument_naam ? ' — ' + schouw.consument_naam : ''}`,
    entity_type: 'schouwen',
    entity_id: schouw.id,
  })
}

async function handleComplete(token: string) {
  const supabase = getServiceClient()
  const schouw = await loadSchouwByToken(supabase, token)
  if (!schouw) return json({ error: 'Niet gevonden' }, 404)
  if (schouw.self_service_completed_at) return json({ ok: true, alreadyCompleted: true })

  const fotos = Array.isArray(schouw.fotos) ? (schouw.fotos as SchouwFoto[]).filter((f) => f.label?.startsWith('self:')) : []
  if (fotos.length === 0) return json({ error: 'Upload eerst minimaal één foto' }, 400)

  const now = new Date().toISOString()
  const { error } = await supabase.from('schouwen').update({ self_service_completed_at: now }).eq('id', schouw.id)
  if (error) return json({ error: error.message }, 500)
  await notifyAdviseur(supabase, schouw)
  return json({ ok: true, voltooidOp: now })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    const action = url.searchParams.get('action') ?? (req.method === 'GET' ? 'get' : 'upload')
    if (!token || !/^[0-9a-f-]{36}$/i.test(token)) return json({ error: 'Ongeldig token' }, 400)

    if (req.method === 'GET') return await handleGet(token)
    if (req.method === 'POST' && action === 'upload') return await handleUpload(token, req)
    if (req.method === 'POST' && action === 'delete') return await handleDelete(token, req)
    if (req.method === 'POST' && action === 'complete') return await handleComplete(token)
    return json({ error: 'Onbekende actie' }, 405)
  } catch (e) {
    console.error('consumer-schouw error', e)
    return json({ error: (e as Error).message }, 500)
  }
})