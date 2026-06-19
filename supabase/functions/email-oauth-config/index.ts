const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const googleClientId = Deno.env.get('GOOGLE_EMAIL_CLIENT_ID') || '';
  const googleClientSecret = Deno.env.get('GOOGLE_EMAIL_CLIENT_SECRET') || '';
  const microsoftClientId = Deno.env.get('MICROSOFT_EMAIL_CLIENT_ID') || '';
  const microsoftClientSecret = Deno.env.get('MICROSOFT_EMAIL_CLIENT_SECRET') || '';

  return new Response(JSON.stringify({
    google: {
      clientId: googleClientId,
      secretConfigured: !!googleClientSecret,
      configured: !!googleClientId && !!googleClientSecret,
    },
    microsoft: {
      clientId: microsoftClientId,
      secretConfigured: !!microsoftClientSecret,
      configured: !!microsoftClientId && !!microsoftClientSecret,
    },
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
});
