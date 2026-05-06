-- Herbouw producten_publiek view zodat ook de nieuwe website_* velden meegaan
DO $$
DECLARE
  col_list text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ')
    INTO col_list
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'producten'
    AND column_name <> 'inkoopprijs';

  IF col_list IS NOT NULL THEN
    EXECUTE format('CREATE OR REPLACE VIEW public.producten_publiek AS SELECT %s FROM public.producten', col_list);
    EXECUTE 'ALTER VIEW public.producten_publiek SET (security_invoker = true)';
    EXECUTE 'GRANT SELECT ON public.producten_publiek TO authenticated, anon';
  END IF;
END $$;

-- Anonieme SELECT-policy op producten: alleen rijen met toon_op_website = true
DROP POLICY IF EXISTS "Public kan website-zichtbare producten zien" ON public.producten;
CREATE POLICY "Public kan website-zichtbare producten zien"
  ON public.producten
  FOR SELECT
  TO anon
  USING (toon_op_website = true);

-- Anonieme SELECT op partner_merken: alleen merken die zichtbaar zijn
DROP POLICY IF EXISTS "Public kan zichtbare merken zien" ON public.partner_merken;
CREATE POLICY "Public kan zichtbare merken zien"
  ON public.partner_merken
  FOR SELECT
  TO anon
  USING (toon_op_website = true);

-- Validatie + rate-limit functie voor de partner REST-API
CREATE OR REPLACE FUNCTION public.validate_partner_api_token(_token_hash text)
RETURNS TABLE(partner_id uuid, allowed boolean, reden text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    RETURN QUERY SELECT NULL::uuid, false, 'invalid_token'::text;
    RETURN;
  END IF;

  -- Atomic upsert + increment voor rate limit
  INSERT INTO public.partner_api_rate_log (partner_id, minute_bucket, count)
  VALUES (v_partner, v_bucket, 1)
  ON CONFLICT (partner_id, minute_bucket)
  DO UPDATE SET count = public.partner_api_rate_log.count + 1
  RETURNING count INTO v_count;

  -- Update last_used (best effort, geen blok)
  UPDATE public.partner_api_tokens
     SET last_used_at = now()
   WHERE id = v_token_id;

  IF v_count > v_limit THEN
    RETURN QUERY SELECT v_partner, false, 'rate_limited'::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT v_partner, true, NULL::text;
END;
$$;

-- Cleanup oude rate-log buckets ouder dan 1 uur
CREATE OR REPLACE FUNCTION public.cleanup_partner_api_rate_log()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.partner_api_rate_log WHERE minute_bucket < now() - interval '1 hour';
$$;