-- 1) Auto-log historie bij wijzigingen op helpdesk_tickets
CREATE OR REPLACE FUNCTION public.log_helpdesk_ticket_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.helpdesk_ticket_historie (ticket_id, partner_id, user_id, actie, details)
    VALUES (NEW.id, NEW.partner_id, COALESCE(v_user, NEW.gemaakt_door), 'aangemaakt',
            jsonb_build_object('ticketnummer', NEW.ticketnummer, 'titel', NEW.titel));
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.helpdesk_ticket_historie (ticket_id, partner_id, user_id, actie, veld, oude_waarde, nieuwe_waarde)
    VALUES (NEW.id, NEW.partner_id, v_user, 'status_gewijzigd', 'status', OLD.status::text, NEW.status::text);
  END IF;

  IF NEW.prioriteit IS DISTINCT FROM OLD.prioriteit THEN
    INSERT INTO public.helpdesk_ticket_historie (ticket_id, partner_id, user_id, actie, veld, oude_waarde, nieuwe_waarde)
    VALUES (NEW.id, NEW.partner_id, v_user, 'prioriteit_gewijzigd', 'prioriteit', OLD.prioriteit::text, NEW.prioriteit::text);
  END IF;

  IF NEW.toegewezen_aan IS DISTINCT FROM OLD.toegewezen_aan THEN
    INSERT INTO public.helpdesk_ticket_historie (ticket_id, partner_id, user_id, actie, veld, oude_waarde, nieuwe_waarde)
    VALUES (NEW.id, NEW.partner_id, v_user, 'toegewezen_gewijzigd', 'toegewezen_aan',
            OLD.toegewezen_aan::text, NEW.toegewezen_aan::text);
  END IF;

  IF NEW.is_geescaleerd IS DISTINCT FROM OLD.is_geescaleerd AND NEW.is_geescaleerd = true THEN
    INSERT INTO public.helpdesk_ticket_historie (ticket_id, partner_id, user_id, actie, details)
    VALUES (NEW.id, NEW.partner_id, v_user, 'geescaleerd',
            jsonb_build_object('reden', COALESCE(NEW.escalatie_reden, 'sla_overschreden')));
  END IF;

  IF NEW.opgelost_op IS DISTINCT FROM OLD.opgelost_op AND NEW.opgelost_op IS NOT NULL THEN
    INSERT INTO public.helpdesk_ticket_historie (ticket_id, partner_id, user_id, actie)
    VALUES (NEW.id, NEW.partner_id, v_user, 'opgelost');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_helpdesk_ticket_changes ON public.helpdesk_tickets;
CREATE TRIGGER trg_log_helpdesk_ticket_changes
AFTER INSERT OR UPDATE ON public.helpdesk_tickets
FOR EACH ROW EXECUTE FUNCTION public.log_helpdesk_ticket_changes();

-- 2) Notify-events naar edge function via pg_net
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.notify_helpdesk_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_event text;
  v_url text;
  v_anon text;
BEGIN
  v_url := 'https://xmguipmetciwvzeyxugu.supabase.co/functions/v1/helpdesk-notify';
  v_anon := current_setting('app.settings.anon_key', true);

  IF TG_OP = 'INSERT' THEN
    v_event := CASE WHEN NEW.type::text = 'storing' THEN 'storing' ELSE 'nieuw_ticket' END;
  ELSIF NEW.toegewezen_aan IS DISTINCT FROM OLD.toegewezen_aan AND NEW.toegewezen_aan IS NOT NULL THEN
    v_event := 'toewijzing';
  ELSIF NEW.is_geescaleerd IS DISTINCT FROM OLD.is_geescaleerd AND NEW.is_geescaleerd = true THEN
    v_event := 'escalatie';
  ELSIF NEW.opgelost_op IS DISTINCT FROM OLD.opgelost_op AND NEW.opgelost_op IS NOT NULL THEN
    v_event := 'oplossing';
  ELSE
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'event', v_event,
      'ticket_id', NEW.id,
      'partner_id', NEW.partner_id
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_helpdesk_events failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_helpdesk_events ON public.helpdesk_tickets;
CREATE TRIGGER trg_notify_helpdesk_events
AFTER INSERT OR UPDATE ON public.helpdesk_tickets
FOR EACH ROW EXECUTE FUNCTION public.notify_helpdesk_events();