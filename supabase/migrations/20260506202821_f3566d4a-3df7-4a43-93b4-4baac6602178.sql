CREATE OR REPLACE FUNCTION public.validate_partner_api_token(_token_hash text)
RETURNS TABLE(partner_id uuid, allowed boolean, reden text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_partner uuid;
  v_token_id uuid;
  v_bucket timestamptz := date_trunc('minute', now());
  v_count int;
  v_limit int := 60;
BEGIN
  SELECT t.id, t.partner_id
    INTO v_token_id, v_partner
  FROM public.partner_api_tokens t
  WHERE t.token_hash = _token_hash
    AND t.revoked_at IS NULL
  LIMIT 1;

  IF v_partner IS NULL THEN
    RETURN QUERY SELECT NULL::uuid AS partner_id, false AS allowed, 'invalid_token'::text AS reden;
    RETURN;
  END IF;

  -- Atomic upsert + increment voor rate limit (kolommen expliciet kwalificeren)
  INSERT INTO public.partner_api_rate_log AS r (partner_id, minute_bucket, count)
  VALUES (v_partner, v_bucket, 1)
  ON CONFLICT (partner_id, minute_bucket)
  DO UPDATE SET count = r.count + 1
  RETURNING r.count INTO v_count;

  -- Update last_used (best effort)
  UPDATE public.partner_api_tokens
     SET last_used_at = now()
   WHERE id = v_token_id;

  IF v_count > v_limit THEN
    RETURN QUERY SELECT v_partner AS partner_id, false AS allowed, 'rate_limited'::text AS reden;
    RETURN;
  END IF;

  RETURN QUERY SELECT v_partner AS partner_id, true AS allowed, NULL::text AS reden;
END;
$function$;