
-- Function to create notification on status changes
CREATE OR REPLACE FUNCTION public.notify_on_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _user_id uuid;
  _titel text;
  _bericht text;
  _entity_type text;
BEGIN
  _entity_type := TG_TABLE_NAME;
  
  -- Determine target user and message based on table
  IF TG_TABLE_NAME = 'leads' THEN
    _user_id := NEW.owner_user_id;
    _titel := 'Lead status gewijzigd';
    _bericht := format('Lead %s %s is gewijzigd naar %s', NEW.voornaam, NEW.achternaam, NEW.lead_status);
  ELSIF TG_TABLE_NAME = 'offertes' THEN
    _user_id := NEW.adviseur_id;
    _titel := 'Offerte status gewijzigd';
    _bericht := format('Offerte %s is gewijzigd naar %s', NEW.offertenummer, NEW.status);
  ELSIF TG_TABLE_NAME = 'installaties' THEN
    _user_id := COALESCE(NEW.installateur_id, NEW.consument_id);
    _titel := 'Installatie status gewijzigd';
    _bericht := format('Installatie voor %s is gewijzigd naar %s', COALESCE(NEW.consument_naam, 'onbekend'), NEW.status);
  ELSIF TG_TABLE_NAME = 'schouwen' THEN
    _user_id := NEW.adviseur_id;
    _titel := 'Schouw status gewijzigd';
    _bericht := format('Schouw %s is gewijzigd naar %s', NEW.schouw_nummer, NEW.status);
  END IF;

  IF _user_id IS NOT NULL THEN
    INSERT INTO public.notificaties (user_id, titel, bericht, type, entity_type, entity_id)
    VALUES (_user_id, _titel, _bericht, 'status_wijziging', _entity_type, NEW.id);
  END IF;

  RETURN NEW;
END;
$function$;

-- Triggers for each table
CREATE TRIGGER trg_leads_status_notify
  AFTER UPDATE OF lead_status ON public.leads
  FOR EACH ROW
  WHEN (OLD.lead_status IS DISTINCT FROM NEW.lead_status)
  EXECUTE FUNCTION public.notify_on_status_change();

CREATE TRIGGER trg_offertes_status_notify
  AFTER UPDATE OF status ON public.offertes
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_on_status_change();

CREATE TRIGGER trg_installaties_status_notify
  AFTER UPDATE OF status ON public.installaties
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_on_status_change();

CREATE TRIGGER trg_schouwen_status_notify
  AFTER UPDATE OF status ON public.schouwen
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_on_status_change();
