
CREATE TABLE IF NOT EXISTS public.offerte_email_attachment_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offerte_id uuid,
  partner_id uuid,
  user_id uuid,
  account_id uuid,
  account_type text NOT NULL,
  attachment_path text,
  bytes_size integer,
  pdf_valid boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  provider text,
  sent_message_id text,
  error text,
  request_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT offerte_email_attachment_audit_status_chk CHECK (
    status IN ('ok','missing_path','empty','invalid_pdf','storage_error','send_error','sent_without_attachment')
  ),
  CONSTRAINT offerte_email_attachment_audit_account_type_chk CHECK (
    account_type IN ('gmail_oauth','ms_graph_oauth','smtp_app_password','partner_smtp','unknown')
  )
);

CREATE INDEX IF NOT EXISTS idx_oeaa_offerte ON public.offerte_email_attachment_audit(offerte_id);
CREATE INDEX IF NOT EXISTS idx_oeaa_partner_created ON public.offerte_email_attachment_audit(partner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_oeaa_status ON public.offerte_email_attachment_audit(status) WHERE status <> 'ok';

GRANT SELECT ON public.offerte_email_attachment_audit TO authenticated;
GRANT ALL ON public.offerte_email_attachment_audit TO service_role;

ALTER TABLE public.offerte_email_attachment_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin ziet alle audit"
  ON public.offerte_email_attachment_audit FOR SELECT
  TO authenticated
  USING (is_superadmin(auth.uid()));

CREATE POLICY "Partner-admins zien hun eigen audit"
  ON public.offerte_email_attachment_audit FOR SELECT
  TO authenticated
  USING (
    partner_id IS NOT NULL
    AND partner_id = (SELECT u.partner_id FROM public.users u WHERE u.id = auth.uid())
    AND get_user_role(auth.uid()) IN ('partner_admin'::app_role, 'partner_staff'::app_role)
  );

CREATE POLICY "Service role beheert audit"
  ON public.offerte_email_attachment_audit FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Trigger: bij faalstatus een notificatie aanmaken (throttled 1x/uur/offerte).
CREATE OR REPLACE FUNCTION public.offerte_email_attachment_audit_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent_count int;
  v_admin_id uuid;
  v_titel text;
  v_bericht text;
BEGIN
  IF NEW.status = 'ok' THEN
    RETURN NEW;
  END IF;

  -- throttle: skip als er in laatste 60 min al een fail-audit voor dezelfde offerte was
  SELECT count(*) INTO v_recent_count
  FROM public.offerte_email_attachment_audit
  WHERE offerte_id = NEW.offerte_id
    AND status <> 'ok'
    AND id <> NEW.id
    AND created_at > now() - interval '1 hour';

  IF v_recent_count > 0 THEN
    RETURN NEW;
  END IF;

  v_titel := 'PDF-bijlage probleem bij offerte-mail';
  v_bericht := format(
    'Status: %s. Account type: %s. Reden: %s',
    NEW.status, NEW.account_type, COALESCE(NEW.error, 'onbekend')
  );

  -- notificatie voor verzender
  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO public.notificaties (user_id, type, titel, bericht, entity_type, entity_id)
    VALUES (NEW.user_id, 'offerte_pdf_alert', v_titel, v_bericht, 'offerte', NEW.offerte_id);
  END IF;

  -- notificatie voor partner_admins van dezelfde partner
  IF NEW.partner_id IS NOT NULL THEN
    FOR v_admin_id IN
      SELECT u.id FROM public.users u
      WHERE u.partner_id = NEW.partner_id
        AND get_user_role(u.id) = 'partner_admin'::app_role
        AND (NEW.user_id IS NULL OR u.id <> NEW.user_id)
    LOOP
      INSERT INTO public.notificaties (user_id, type, titel, bericht, entity_type, entity_id)
      VALUES (v_admin_id, 'offerte_pdf_alert', v_titel, v_bericht, 'offerte', NEW.offerte_id);
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_oeaa_notify ON public.offerte_email_attachment_audit;
CREATE TRIGGER trg_oeaa_notify
  AFTER INSERT ON public.offerte_email_attachment_audit
  FOR EACH ROW
  EXECUTE FUNCTION public.offerte_email_attachment_audit_notify();
