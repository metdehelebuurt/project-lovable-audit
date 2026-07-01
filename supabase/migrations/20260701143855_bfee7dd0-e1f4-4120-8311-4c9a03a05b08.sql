REVOKE ALL ON FUNCTION public.boek_voorraad_uit_ontvangst() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.boek_voorraad_uit_ontvangst() FROM anon;
REVOKE ALL ON FUNCTION public.boek_voorraad_uit_ontvangst() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.boek_voorraad_uit_ontvangst() TO service_role;