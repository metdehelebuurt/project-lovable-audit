
CREATE TABLE public.email_oauth_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  partner_id UUID NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'started',
  error_code TEXT NULL,
  error_message TEXT NULL,
  email_adres_resultaat TEXT NULL,
  alias_request TEXT NULL,
  alias_status TEXT NULL,
  alias_error TEXT NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_oauth_attempts_user ON public.email_oauth_attempts (user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.email_oauth_attempts TO authenticated;
GRANT ALL ON public.email_oauth_attempts TO service_role;

ALTER TABLE public.email_oauth_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users zien eigen oauth pogingen"
ON public.email_oauth_attempts FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.user_has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "users maken eigen oauth pogingen"
ON public.email_oauth_attempts FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users updaten eigen oauth pogingen"
ON public.email_oauth_attempts FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.user_has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (user_id = auth.uid() OR public.user_has_role(auth.uid(), 'superadmin'::app_role));

CREATE TRIGGER trg_email_oauth_attempts_updated_at
BEFORE UPDATE ON public.email_oauth_attempts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
