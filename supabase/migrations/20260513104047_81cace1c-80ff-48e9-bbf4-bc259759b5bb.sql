CREATE OR REPLACE FUNCTION public.notify_afspraak_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_when text;
BEGIN
  v_when := to_char(COALESCE(NEW.datum, OLD.datum), 'DD-MM-YYYY')
            || COALESCE(' ' || to_char(COALESCE(NEW.start_tijd, OLD.start_tijd), 'HH24:MI'), '');

  IF TG_OP = 'INSERT' THEN
    IF NEW.adviseur_id IS NOT NULL THEN
      INSERT INTO public.notificaties (user_id, type, titel, bericht, entity_type, entity_id)
      VALUES (NEW.adviseur_id, 'afspraak_ingepland',
              'Nieuwe afspraak ingepland',
              format('%s op %s', NEW.titel, v_when),
              'afspraken', NEW.id);
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Adviseur gewisseld: oude krijgt verwijderd-melding, nieuwe ingepland-melding
    IF NEW.adviseur_id IS DISTINCT FROM OLD.adviseur_id THEN
      IF OLD.adviseur_id IS NOT NULL THEN
        INSERT INTO public.notificaties (user_id, type, titel, bericht, entity_type, entity_id)
        VALUES (OLD.adviseur_id, 'afspraak_verwijderd',
                'Afspraak verwijderd uit je agenda',
                format('%s op %s is overgedragen aan een collega', OLD.titel, v_when),
                'afspraken', OLD.id);
      END IF;
      IF NEW.adviseur_id IS NOT NULL THEN
        INSERT INTO public.notificaties (user_id, type, titel, bericht, entity_type, entity_id)
        VALUES (NEW.adviseur_id, 'afspraak_ingepland',
                'Nieuwe afspraak ingepland',
                format('%s op %s', NEW.titel, v_when),
                'afspraken', NEW.id);
      END IF;
    -- Annulering
    ELSIF NEW.status = 'geannuleerd' AND OLD.status IS DISTINCT FROM 'geannuleerd' AND NEW.adviseur_id IS NOT NULL THEN
      INSERT INTO public.notificaties (user_id, type, titel, bericht, entity_type, entity_id)
      VALUES (NEW.adviseur_id, 'afspraak_geannuleerd',
              'Afspraak geannuleerd',
              format('%s op %s is geannuleerd', NEW.titel, v_when),
              'afspraken', NEW.id);
    -- Wijziging van datum/tijd/locatie/titel
    ELSIF (NEW.datum IS DISTINCT FROM OLD.datum
           OR NEW.start_tijd IS DISTINCT FROM OLD.start_tijd
           OR NEW.eind_tijd IS DISTINCT FROM OLD.eind_tijd
           OR NEW.locatie IS DISTINCT FROM OLD.locatie
           OR NEW.titel IS DISTINCT FROM OLD.titel)
          AND NEW.adviseur_id IS NOT NULL THEN
      INSERT INTO public.notificaties (user_id, type, titel, bericht, entity_type, entity_id)
      VALUES (NEW.adviseur_id, 'afspraak_gewijzigd',
              'Afspraak gewijzigd',
              format('%s — nu op %s', NEW.titel, v_when),
              'afspraken', NEW.id);
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.adviseur_id IS NOT NULL THEN
      INSERT INTO public.notificaties (user_id, type, titel, bericht, entity_type, entity_id)
      VALUES (OLD.adviseur_id, 'afspraak_verwijderd',
              'Afspraak verwijderd',
              format('%s op %s is verwijderd', OLD.titel, v_when),
              'afspraken', OLD.id);
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_afspraken_notify ON public.afspraken;
CREATE TRIGGER trg_afspraken_notify
AFTER INSERT OR UPDATE OR DELETE ON public.afspraken
FOR EACH ROW EXECUTE FUNCTION public.notify_afspraak_events();