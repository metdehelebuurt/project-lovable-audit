UPDATE public.email_accounts
SET needs_reauth = true,
    last_sync_error = 'OAuth-client gewijzigd: refresh-token van vorige Google Cloud project is ongeldig. Koppel opnieuw via Instellingen → E-mail.',
    last_sync_error_at = now()
WHERE provider = 'google' AND actief = true;