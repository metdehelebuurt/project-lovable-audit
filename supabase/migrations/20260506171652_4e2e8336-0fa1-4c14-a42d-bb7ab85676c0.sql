REVOKE EXECUTE ON FUNCTION public.validate_partner_api_token(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_partner_api_token(text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.cleanup_partner_api_rate_log() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_partner_api_rate_log() TO service_role;