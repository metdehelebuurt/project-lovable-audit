CREATE OR REPLACE FUNCTION public.claim_affiliate_lead(_lead_id uuid)
 RETURNS affiliate_leads
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _user uuid := auth.uid();
  _rol  public.app_role;
  _row  public.affiliate_leads;
BEGIN
  IF _user IS NULL THEN
    RAISE EXCEPTION 'Niet ingelogd';
  END IF;

  SELECT rol INTO _rol FROM public.users WHERE id = _user;

  IF _rol NOT IN ('affiliate'::public.app_role, 'sales_manager'::public.app_role)
     AND NOT public.is_superadmin(_user) THEN
    RAISE EXCEPTION 'Alleen affiliates of sales managers mogen leads claimen';
  END IF;

  UPDATE public.affiliate_leads
  SET eigenaar_id = _user,
      claimed_at = now(),
      status = CASE WHEN status = 'nieuw' THEN 'nieuw' ELSE status END
  WHERE id = _lead_id AND eigenaar_id IS NULL
  RETURNING * INTO _row;

  IF _row.id IS NULL THEN
    RAISE EXCEPTION 'Lead is al geclaimd of bestaat niet';
  END IF;

  RETURN _row;
END $function$;