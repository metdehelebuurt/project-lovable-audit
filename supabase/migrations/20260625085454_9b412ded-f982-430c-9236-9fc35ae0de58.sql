
CREATE TABLE public.affiliate_email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  template_key TEXT NOT NULL,
  onderwerp TEXT NOT NULL,
  body_html TEXT NOT NULL,
  afzender_naam TEXT,
  actief BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, template_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_email_templates TO authenticated;
GRANT ALL ON public.affiliate_email_templates TO service_role;

ALTER TABLE public.affiliate_email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliate beheert eigen templates"
  ON public.affiliate_email_templates FOR ALL
  TO authenticated
  USING (auth.uid() = user_id OR public.is_superadmin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_superadmin(auth.uid()));

CREATE TRIGGER trg_affiliate_email_templates_updated_at
  BEFORE UPDATE ON public.affiliate_email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
