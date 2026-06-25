CREATE OR REPLACE FUNCTION public.claim_affiliate_lead(_lead_id uuid)
 RETURNS affiliate_leads
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _user uuid := auth.uid();
  _row public.affiliate_leads;
BEGIN
  IF _user IS NULL THEN
    RAISE EXCEPTION 'Niet ingelogd';
  END IF;
  IF NOT public.is_affiliate(_user)
     AND NOT public.has_role(_user, 'sales_manager'::app_role)
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