
ALTER TABLE public.affiliate_email_templates
  ADD COLUMN IF NOT EXISTS actie_default text NULL;

ALTER TABLE public.affiliate_email_templates
  DROP CONSTRAINT IF EXISTS affiliate_email_templates_actie_default_check;

ALTER TABLE public.affiliate_email_templates
  ADD CONSTRAINT affiliate_email_templates_actie_default_check
  CHECK (actie_default IS NULL OR actie_default IN (
    'demo_klant','demo_collega',
    'terugbel_klant','terugbel_collega',
    'trial_klant'
  ));

CREATE UNIQUE INDEX IF NOT EXISTS affiliate_email_templates_actie_default_uniq
  ON public.affiliate_email_templates(user_id, actie_default)
  WHERE actie_default IS NOT NULL;
