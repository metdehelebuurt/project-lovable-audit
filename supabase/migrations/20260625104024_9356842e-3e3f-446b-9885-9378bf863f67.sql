
CREATE OR REPLACE FUNCTION public.lijst_affiliates_voor_sales_admin()
RETURNS TABLE(id uuid, voornaam text, achternaam text, email text, partner_id uuid, has_google_calendar boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
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
  WHERE u.status = 'actief'
    AND public.user_has_role(u.id, 'affiliate'::public.app_role)
    AND public.is_sales_admin(auth.uid())
  ORDER BY u.voornaam NULLS LAST, u.achternaam NULLS LAST, u.email
$$;
