const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const googleClientId = Deno.env.get('GOOGLE_EMAIL_CLIENT_ID') || '';
  const microsoftClientId = Deno.env.get('MICROSOFT_EMAIL_CLIENT_ID') || '';

  return new Response(JSON.stringify({
    google: { clientId: googleClientId, configured: !!googleClientId },
    microsoft: { clientId: microsoftClientId, configured: !!microsoftClientId },
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
});
