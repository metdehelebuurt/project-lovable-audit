ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS voorwaarden_geaccepteerd_op timestamptz;

CREATE OR REPLACE FUNCTION public.increment_affiliate_link_clicks(_link_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.affiliate_links SET clicks = COALESCE(clicks, 0) + 1 WHERE id = _link_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_affiliate_link_clicks(uuid) TO service_role, authenticated, anon;