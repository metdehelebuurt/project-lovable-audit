
-- Helperfunctie: lijst van alle actieve affiliates die een sales_admin (superadmin of sales_manager) mag zien.
CREATE OR REPLACE FUNCTION public.lijst_affiliates_voor_sales_admin()
RETURNS TABLE (
  id uuid,
  voornaam text,
  achternaam text,
  email text,
  partner_id uuid,
  has_google_calendar boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    u.id,
    u.voornaam,
    u.achternaam,
    u.email,
    u.partner_id,
    EXISTS (
      SELECT 1 FROM public.google_calendar_accounts g
      WHERE g.user_id = u.id AND g.actief = true
    ) AS has_google_calendar
  FROM public.users u
  WHERE u.rol = 'affiliate'::public.app_role
    AND u.status = 'actief'
    AND public.is_sales_admin(auth.uid())
  ORDER BY u.voornaam NULLS LAST, u.achternaam NULLS LAST, u.email
$$;

-- Helperfunctie: één google_calendar_accounts-rij voor service-role gebruik vanuit edge functions
-- (edge functions gebruiken service-role-key direct, dus dit is alleen voor zichtbaarheid in client-RLS-respecterende queries)
GRANT EXECUTE ON FUNCTION public.lijst_affiliates_voor_sales_admin() TO authenticated;
