-- 1. Notificatie voorkeuren tabel
CREATE TABLE IF NOT EXISTS public.notificatie_voorkeuren (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  in_app boolean NOT NULL DEFAULT true,
  email boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, type)
);

ALTER TABLE public.notificatie_voorkeuren ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gebruiker ziet eigen voorkeuren"
  ON public.notificatie_voorkeuren FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Gebruiker beheert eigen voorkeuren"
  ON public.notificatie_voorkeuren FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER trg_notificatie_voorkeuren_updated
  BEFORE UPDATE ON public.notificatie_voorkeuren
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Trigger: ticket toegewezen / geëscaleerd
CREATE OR REPLACE FUNCTION public.notify_ticket_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Toewijzing
  IF TG_OP = 'INSERT' AND NEW.toegewezen_aan IS NOT NULL THEN
    INSERT INTO public.notificaties (user_id, titel, bericht, type, entity_type, entity_id)
    VALUES (NEW.toegewezen_aan,
            'Nieuw ticket toegewezen',
            format('Ticket %s: %s', NEW.ticketnummer, NEW.titel),
            'ticket_toegewezen', 'helpdesk_tickets', NEW.id);
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.toegewezen_aan IS DISTINCT FROM OLD.toegewezen_aan AND NEW.toegewezen_aan IS NOT NULL THEN
      INSERT INTO public.notificaties (user_id, titel, bericht, type, entity_type, entity_id)
      VALUES (NEW.toegewezen_aan,
              'Ticket toegewezen aan jou',
              format('Ticket %s: %s', NEW.ticketnummer, NEW.titel),
              'ticket_toegewezen', 'helpdesk_tickets', NEW.id);
    END IF;

    IF NEW.is_geescaleerd IS DISTINCT FROM OLD.is_geescaleerd 
       AND NEW.is_geescaleerd = true 
       AND NEW.toegewezen_aan IS NOT NULL THEN
      INSERT INTO public.notificaties (user_id, titel, bericht, type, entity_type, entity_id)
      VALUES (NEW.toegewezen_aan,
              'Ticket geëscaleerd',
              format('SLA overschreden voor ticket %s', NEW.ticketnummer),
              'ticket_escalatie', 'helpdesk_tickets', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_ticket_events ON public.helpdesk_tickets;
CREATE TRIGGER trg_notify_ticket_events
  AFTER INSERT OR UPDATE ON public.helpdesk_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_ticket_events();

-- 3. Trigger: nieuw inkomend bericht op ticket
CREATE OR REPLACE FUNCTION public.notify_ticket_bericht()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_toegewezen uuid;
  v_ticketnummer text;
BEGIN
  IF NEW.richting != 'inkomend' THEN
    RETURN NEW;
  END IF;

  SELECT toegewezen_aan, ticketnummer INTO v_toegewezen, v_ticketnummer
  FROM public.helpdesk_tickets
  WHERE id = NEW.ticket_id;

  IF v_toegewezen IS NOT NULL THEN
    INSERT INTO public.notificaties (user_id, titel, bericht, type, entity_type, entity_id)
    VALUES (v_toegewezen,
            'Nieuw bericht op ticket',
            format('Reactie op ticket %s', v_ticketnummer),
            'ticket_bericht', 'helpdesk_tickets', NEW.ticket_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_ticket_bericht ON public.helpdesk_ticket_berichten;
CREATE TRIGGER trg_notify_ticket_bericht
  AFTER INSERT ON public.helpdesk_ticket_berichten
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_ticket_bericht();

-- 4. Trigger: service-bezoek ingepland voor monteur
CREATE OR REPLACE FUNCTION public.notify_service_bezoek()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticketnummer text;
BEGIN
  IF NEW.monteur_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT ticketnummer INTO v_ticketnummer
  FROM public.helpdesk_tickets
  WHERE id = NEW.ticket_id;

  INSERT INTO public.notificaties (user_id, titel, bericht, type, entity_type, entity_id)
  VALUES (NEW.monteur_id,
          'Nieuw service-bezoek ingepland',
          format('Bezoek voor ticket %s op %s', COALESCE(v_ticketnummer,''), NEW.geplande_datum::text),
          'service_bezoek', 'helpdesk_service_bezoeken', NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_service_bezoek ON public.helpdesk_service_bezoeken;
CREATE TRIGGER trg_notify_service_bezoek
  AFTER INSERT ON public.helpdesk_service_bezoeken
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_service_bezoek();

-- 5. Trigger: factuur betaald
CREATE OR REPLACE FUNCTION public.notify_factuur_betaald()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status::text = 'betaald' AND OLD.status::text <> 'betaald' AND NEW.created_by IS NOT NULL THEN
    INSERT INTO public.notificaties (user_id, titel, bericht, type, entity_type, entity_id)
    VALUES (NEW.created_by,
            'Factuur betaald',
            format('Factuur %s is betaald (€ %s)', NEW.documentnummer, NEW.totaal_bedrag),
            'factuur_betaald', 'financiele_documenten', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_factuur_betaald ON public.financiele_documenten;
CREATE TRIGGER trg_notify_factuur_betaald
  AFTER UPDATE ON public.financiele_documenten
  FOR EACH ROW
  WHEN (NEW.type::text = 'verkoopfactuur')
  EXECUTE FUNCTION public.notify_factuur_betaald();