-- 1. Status enum uitbreiden
ALTER TYPE helpdesk_ticket_status ADD VALUE IF NOT EXISTS 'wacht_op_onderdeel';
ALTER TYPE helpdesk_ticket_status ADD VALUE IF NOT EXISTS 'ingepland';
ALTER TYPE helpdesk_ticket_status ADD VALUE IF NOT EXISTS 'onderweg';

-- 2. Bron-locatie enum uitbreiden
ALTER TYPE helpdesk_bron_locatie ADD VALUE IF NOT EXISTS 'portal';
ALTER TYPE helpdesk_bron_locatie ADD VALUE IF NOT EXISTS 'whatsapp';

-- 3. CSAT tabel
CREATE TABLE IF NOT EXISTS public.helpdesk_csat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL,
  partner_id UUID NOT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
  opmerking TEXT,
  ingevuld_door TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_helpdesk_csat_ticket ON public.helpdesk_csat(ticket_id);
CREATE INDEX IF NOT EXISTS idx_helpdesk_csat_partner ON public.helpdesk_csat(partner_id);

ALTER TABLE public.helpdesk_csat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CSAT zichtbaar binnen partner"
ON public.helpdesk_csat FOR SELECT TO authenticated
USING (is_superadmin(auth.uid()) OR partner_id = get_user_partner_id(auth.uid()));

CREATE POLICY "CSAT aanmaken binnen partner"
ON public.helpdesk_csat FOR INSERT TO authenticated
WITH CHECK (partner_id = get_user_partner_id(auth.uid()) OR is_superadmin(auth.uid()));

-- 4. E-mail sjablonen tabel
CREATE TABLE IF NOT EXISTS public.helpdesk_email_sjablonen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL,
  naam TEXT NOT NULL,
  onderwerp TEXT NOT NULL,
  inhoud TEXT NOT NULL,
  variabelen JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_helpdesk_email_sjablonen_partner ON public.helpdesk_email_sjablonen(partner_id);

ALTER TABLE public.helpdesk_email_sjablonen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sjablonen zichtbaar binnen partner"
ON public.helpdesk_email_sjablonen FOR SELECT TO authenticated
USING (is_superadmin(auth.uid()) OR partner_id = get_user_partner_id(auth.uid()));

CREATE POLICY "Sjablonen beheren door partner_admin/staff"
ON public.helpdesk_email_sjablonen FOR ALL TO authenticated
USING (is_superadmin(auth.uid()) OR (get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role]) AND partner_id = get_user_partner_id(auth.uid())))
WITH CHECK (is_superadmin(auth.uid()) OR (get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role]) AND partner_id = get_user_partner_id(auth.uid())));

-- 5. KB views increment functie
CREATE OR REPLACE FUNCTION public.increment_kb_views(_artikel_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.helpdesk_kennis_artikelen
  SET views = COALESCE(views, 0) + 1
  WHERE id = _artikel_id;
END;
$$;

-- 6. Trigger: koppel inkomende e-mails automatisch aan ticket via [TKT-YYYY-NNNN]
CREATE OR REPLACE FUNCTION public.link_email_to_helpdesk_ticket()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match TEXT;
  v_ticket_id UUID;
BEGIN
  -- Zoek [TKT-YYYY-NNNN] in onderwerp
  v_match := substring(NEW.onderwerp FROM 'TKT-\d{4}-\d{4,}');
  IF v_match IS NOT NULL THEN
    SELECT id INTO v_ticket_id
    FROM public.helpdesk_tickets
    WHERE ticketnummer = v_match
      AND partner_id = NEW.partner_id
    LIMIT 1;

    IF v_ticket_id IS NOT NULL THEN
      INSERT INTO public.helpdesk_ticket_berichten (
        ticket_id, partner_id, auteur_id, richting, inhoud
      ) VALUES (
        v_ticket_id,
        NEW.partner_id,
        COALESCE((SELECT id FROM public.users WHERE partner_id = NEW.partner_id AND rol = 'partner_admin' LIMIT 1), NEW.partner_id),
        CASE WHEN NEW.richting = 'inkomend' THEN 'inkomend' ELSE 'uitgaand' END,
        '📧 ' || NEW.onderwerp || E'\n\n' || COALESCE(NEW.body_text, regexp_replace(COALESCE(NEW.body_html, ''), '<[^>]+>', '', 'g'))
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_link_email_to_ticket ON public.email_berichten;
CREATE TRIGGER trg_link_email_to_ticket
AFTER INSERT ON public.email_berichten
FOR EACH ROW
EXECUTE FUNCTION public.link_email_to_helpdesk_ticket();