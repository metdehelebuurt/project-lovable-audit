CREATE OR REPLACE FUNCTION public.admin_overdracht_affiliate_lead(_lead_id uuid, _nieuwe_eigenaar_id uuid, _notitie text DEFAULT NULL::text)
 RETURNS affiliate_leads
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.affiliate_leads;
BEGIN
  IF NOT (public.is_sales_admin(v_uid) OR public.is_superadmin(v_uid)) THEN
    RAISE EXCEPTION 'Alleen platformbeheerder of sales-manager mag leads overdragen';
  END IF;

  UPDATE public.affiliate_leads
     SET eigenaar_id = _nieuwe_eigenaar_id,
         claimed_at = CASE WHEN _nieuwe_eigenaar_id IS NOT NULL THEN now() ELSE NULL END,
         toegewezen_door_admin_id = v_uid,
         doorgezet_op = now(),
         updated_at = now()
   WHERE id = _lead_id
   RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Lead niet gevonden';
  END IF;

  IF _notitie IS NOT NULL AND length(btrim(_notitie)) > 0 THEN
    INSERT INTO public.affiliate_lead_contactmomenten (lead_id, affiliate_id, type, notitie)
    VALUES (_lead_id, COALESCE(_nieuwe_eigenaar_id, v_uid), 'notitie', _notitie);
  END IF;

  RETURN v_row;
END $function$;