-- 1. Geschatte duur op tickets en service-bezoeken
ALTER TABLE public.helpdesk_tickets
  ADD COLUMN IF NOT EXISTS geschatte_duur_minuten integer;

ALTER TABLE public.helpdesk_service_bezoeken
  ADD COLUMN IF NOT EXISTS geschatte_duur_minuten integer;

-- 2. Kanaal-type en externe contactvelden op berichten
ALTER TABLE public.helpdesk_ticket_berichten
  ADD COLUMN IF NOT EXISTS kanaal_type text NOT NULL DEFAULT 'intern',
  ADD COLUMN IF NOT EXISTS extern_naam text,
  ADD COLUMN IF NOT EXISTS extern_email text,
  ADD COLUMN IF NOT EXISTS extern_organisatie text,
  ADD COLUMN IF NOT EXISTS extern_telefoon text;

-- Check constraint voor kanaal_type
DO $$ BEGIN
  ALTER TABLE public.helpdesk_ticket_berichten
    ADD CONSTRAINT helpdesk_ticket_berichten_kanaal_type_check
    CHECK (kanaal_type IN ('klant', 'fabrikant', 'leverancier', 'monteur', 'intern'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Trigger: installateur mag geen berichten naar klanten sturen
CREATE OR REPLACE FUNCTION public.restrict_installateur_berichten()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role app_role;
BEGIN
  v_role := public.get_user_role(auth.uid());

  IF v_role = 'installateur'::app_role AND NOT public.is_superadmin(auth.uid()) THEN
    IF NEW.kanaal_type = 'klant' OR NEW.richting = 'uitgaand' THEN
      RAISE EXCEPTION 'Installateurs mogen geen berichten naar klanten sturen. Gebruik intern of monteur kanaal.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_restrict_installateur_berichten ON public.helpdesk_ticket_berichten;
CREATE TRIGGER trg_restrict_installateur_berichten
  BEFORE INSERT ON public.helpdesk_ticket_berichten
  FOR EACH ROW
  EXECUTE FUNCTION public.restrict_installateur_berichten();