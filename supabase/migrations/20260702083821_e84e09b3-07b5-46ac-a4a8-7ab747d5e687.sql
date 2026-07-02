CREATE OR REPLACE FUNCTION public.admin_doorzetten_naar_affiliate_v2(_lead_id uuid, _affiliate_id uuid, _notitie text DEFAULT NULL::text, _temperatuur lead_temperatuur DEFAULT NULL::lead_temperatuur, _volgende_actie_op timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS affiliate_leads
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.affiliate_leads;
BEGIN
  IF NOT public.is_sales_admin(v_uid) THEN
    RAISE EXCEPTION 'alleen platformbeheerder of sales manager mag leads doorzetten';
  END IF;

  UPDATE public.affiliate_leads
     SET eigenaar_id = _affiliate_id,
         claimed_at = CASE WHEN _affiliate_id IS NOT NULL THEN now() ELSE NULL END,
         sales_fase = 'doorgezet',
         fase_slug = COALESCE(fase_slug, 'benaderd'),
         temperatuur = COALESCE(_temperatuur, temperatuur),
         volgende_actie_op = COALESCE(_volgende_actie_op, volgende_actie_op),
         doorgezet_op = now(),
         toegewezen_door_admin_id = v_uid,
         status = COALESCE(status, 'nieuw'::affiliate_lead_status),
         updated_at = now()
   WHERE id = _lead_id
   RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN RAISE EXCEPTION 'lead niet gevonden'; END IF;

  IF _notitie IS NOT NULL AND length(trim(_notitie)) > 0 THEN
    INSERT INTO public.affiliate_lead_contactmomenten (lead_id, affiliate_id, type, notitie)
    VALUES (_lead_id, COALESCE(_affiliate_id, v_uid), 'notitie', _notitie);
  END IF;

  RETURN v_row;
END;
$function$;