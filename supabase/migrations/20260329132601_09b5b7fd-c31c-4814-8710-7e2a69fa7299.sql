
-- IMAP config columns on partners
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS imap_host text,
  ADD COLUMN IF NOT EXISTS imap_port integer DEFAULT 993,
  ADD COLUMN IF NOT EXISTS imap_user text,
  ADD COLUMN IF NOT EXISTS imap_pass_encrypted text,
  ADD COLUMN IF NOT EXISTS imap_use_ssl boolean DEFAULT true;

-- Email log table for tracking all sent emails
CREATE TABLE IF NOT EXISTS public.email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  offerte_id uuid,
  ontvanger_email text NOT NULL,
  onderwerp text NOT NULL,
  html_body text,
  status text NOT NULL DEFAULT 'verzonden',
  type text NOT NULL DEFAULT 'offerte',
  verzonden_door_id uuid,
  imap_saved boolean DEFAULT false,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner users zien eigen partner email_log" ON public.email_log
  FOR SELECT TO authenticated
  USING (partner_id = get_user_partner_id(auth.uid()) OR is_superadmin(auth.uid()));

CREATE POLICY "Email_log aanmaken" ON public.email_log
  FOR INSERT TO authenticated
  WITH CHECK (
    is_superadmin(auth.uid()) OR
    (get_user_role(auth.uid()) = ANY(ARRAY['partner_admin','partner_staff','adviseur']::app_role[])
     AND partner_id = get_user_partner_id(auth.uid()))
  );

-- Email templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  naam text NOT NULL,
  onderwerp text NOT NULL,
  html_body text NOT NULL,
  type text NOT NULL DEFAULT 'offerte',
  standaard boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner users zien eigen email_templates" ON public.email_templates
  FOR SELECT TO authenticated
  USING (partner_id = get_user_partner_id(auth.uid()) OR is_superadmin(auth.uid()));

CREATE POLICY "Partner admin beheert email_templates" ON public.email_templates
  FOR ALL TO authenticated
  USING (
    (get_user_role(auth.uid()) = ANY(ARRAY['partner_admin','partner_staff']::app_role[])
     AND partner_id = get_user_partner_id(auth.uid()))
    OR is_superadmin(auth.uid())
  );
