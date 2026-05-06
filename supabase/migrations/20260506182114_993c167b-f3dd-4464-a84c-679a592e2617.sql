-- 1. Nieuwe enum waarde toevoegen
ALTER TYPE offerte_status ADD VALUE IF NOT EXISTS 'geconverteerd_extern';

-- 2. Trigger functie: bij accepteren, andere open offertes van dezelfde lead sluiten
CREATE OR REPLACE FUNCTION public.sluit_andere_offertes_bij_acceptatie()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Alleen als status zojuist op 'geaccepteerd' is gezet
  IF NEW.status::text = 'geaccepteerd'
     AND (OLD.status IS NULL OR OLD.status::text <> 'geaccepteerd')
     AND NEW.lead_id IS NOT NULL THEN
    UPDATE public.offertes
       SET status = 'geconverteerd_extern'::offerte_status,
           updated_at = now()
     WHERE lead_id = NEW.lead_id
       AND id <> NEW.id
       AND status::text IN ('concept', 'verzonden');
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_sluit_andere_offertes_bij_acceptatie ON public.offertes;
CREATE TRIGGER trg_sluit_andere_offertes_bij_acceptatie
AFTER UPDATE OF status ON public.offertes
FOR EACH ROW
EXECUTE FUNCTION public.sluit_andere_offertes_bij_acceptatie();