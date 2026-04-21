-- Add facturatie tracking columns to offertes
ALTER TABLE public.offertes
  ADD COLUMN IF NOT EXISTS gefactureerd_op timestamptz,
  ADD COLUMN IF NOT EXISTS gefactureerd_bedrag numeric NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_offertes_gefactureerd
  ON public.offertes(gefactureerd_op)
  WHERE gefactureerd_op IS NOT NULL;

-- Trigger function: sync offertes.gefactureerd_op + gefactureerd_bedrag
CREATE OR REPLACE FUNCTION public.sync_offerte_facturatie_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _offerte_id uuid;
  _totaal numeric;
  _eerste timestamptz;
BEGIN
  -- Bepaal de relevante offerte_id (NEW bij insert/update, OLD bij delete)
  IF TG_OP = 'DELETE' THEN
    _offerte_id := OLD.offerte_id;
  ELSE
    _offerte_id := NEW.offerte_id;
  END IF;

  IF _offerte_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Som van alle niet-concept verkoopfacturen voor deze offerte
  SELECT COALESCE(SUM(totaal_bedrag), 0), MIN(COALESCE(verzonden_op, factuurdatum::timestamptz, created_at))
    INTO _totaal, _eerste
  FROM public.financiele_documenten
  WHERE offerte_id = _offerte_id
    AND type = 'verkoopfactuur'
    AND status <> 'concept';

  UPDATE public.offertes
     SET gefactureerd_bedrag = _totaal,
         gefactureerd_op = CASE WHEN _totaal > 0 THEN _eerste ELSE NULL END
   WHERE id = _offerte_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_offerte_facturatie_status ON public.financiele_documenten;
CREATE TRIGGER trg_sync_offerte_facturatie_status
AFTER INSERT OR UPDATE OF status, totaal_bedrag, offerte_id, verzonden_op OR DELETE
ON public.financiele_documenten
FOR EACH ROW
EXECUTE FUNCTION public.sync_offerte_facturatie_status();