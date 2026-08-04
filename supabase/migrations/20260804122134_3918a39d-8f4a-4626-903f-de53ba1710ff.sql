CREATE OR REPLACE FUNCTION public.affiliate_lead_fase_van_status(_status text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE _status
    WHEN 'nieuw' THEN 'nieuw'
    WHEN 'nieuw_campagne' THEN 'nieuw'
    WHEN 'nieuw_demo_voltooid' THEN 'nieuw'
    WHEN 'gebeld_geen_gehoor' THEN 'benaderd'
    WHEN 'mail_gestuurd' THEN 'benaderd'
    WHEN 'terugbel_gepland' THEN 'benaderd'
    WHEN 'gesprek_gepland' THEN 'gekwalificeerd'
    WHEN 'demo_gepland' THEN 'gekwalificeerd'
    WHEN 'in_gesprek' THEN 'gekwalificeerd'
    WHEN 'voorstel_verstuurd' THEN 'voorstel'
    WHEN 'trial_gestart' THEN 'trial'
    WHEN 'gewonnen' THEN 'gewonnen'
    WHEN 'verloren' THEN 'verloren'
    ELSE NULL
  END
$$;

CREATE OR REPLACE FUNCTION public.sync_affiliate_lead_fase()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_fase text;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
    IF NEW.fase_slug IS DISTINCT FROM OLD.fase_slug THEN RETURN NEW; END IF;
  END IF;

  v_fase := public.affiliate_lead_fase_van_status(NEW.status::text);
  IF v_fase IS NOT NULL THEN
    NEW.fase_slug := v_fase;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_affiliate_lead_fase ON public.affiliate_leads;
CREATE TRIGGER trg_sync_affiliate_lead_fase
BEFORE INSERT OR UPDATE OF status ON public.affiliate_leads
FOR EACH ROW EXECUTE FUNCTION public.sync_affiliate_lead_fase();

UPDATE public.affiliate_leads l
SET fase_slug = public.affiliate_lead_fase_van_status(l.status::text)
WHERE l.fase_slug = 'nieuw'
  AND public.affiliate_lead_fase_van_status(l.status::text) IS NOT NULL
  AND public.affiliate_lead_fase_van_status(l.status::text) <> 'nieuw';