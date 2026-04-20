
-- Auto-zet SLA deadline bij aanmaken ticket
CREATE OR REPLACE FUNCTION public.set_helpdesk_sla_deadline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uren integer;
  _cfg record;
BEGIN
  IF NEW.sla_deadline IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT sla_uren_urgent, sla_uren_hoog, sla_uren_normaal, sla_uren_laag
    INTO _cfg
  FROM public.helpdesk_notificatie_config
  WHERE partner_id = NEW.partner_id
  LIMIT 1;

  _uren := CASE NEW.prioriteit::text
    WHEN 'urgent' THEN COALESCE(_cfg.sla_uren_urgent, 4)
    WHEN 'hoog' THEN COALESCE(_cfg.sla_uren_hoog, 24)
    WHEN 'normaal' THEN COALESCE(_cfg.sla_uren_normaal, 72)
    WHEN 'laag' THEN COALESCE(_cfg.sla_uren_laag, 168)
    ELSE 72
  END;

  IF NEW.type::text = 'storing' THEN
    _uren := LEAST(_uren, 4);
  END IF;

  NEW.sla_deadline := now() + (_uren || ' hours')::interval;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_helpdesk_sla_deadline ON public.helpdesk_tickets;
CREATE TRIGGER trg_helpdesk_sla_deadline
  BEFORE INSERT ON public.helpdesk_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_helpdesk_sla_deadline();

-- Markeer overschreden tickets als geëscaleerd
CREATE OR REPLACE FUNCTION public.mark_helpdesk_escalations(_partner_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count integer;
BEGIN
  UPDATE public.helpdesk_tickets
     SET is_geescaleerd = true,
         updated_at = now()
   WHERE partner_id = _partner_id
     AND is_geescaleerd = false
     AND status NOT IN ('opgelost', 'gesloten')
     AND sla_deadline IS NOT NULL
     AND sla_deadline < now();
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_status_partner
  ON public.helpdesk_tickets (partner_id, status);
CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_sla
  ON public.helpdesk_tickets (partner_id, sla_deadline)
  WHERE sla_deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_prio
  ON public.helpdesk_tickets (partner_id, prioriteit);
