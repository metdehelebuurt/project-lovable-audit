
CREATE TABLE public.email_routing_config (
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  bron text NOT NULL DEFAULT 'partner_default' CHECK (bron IN ('partner_default','gebruiker_persoonlijk','specifiek_account')),
  email_account_id uuid REFERENCES public.email_accounts(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  PRIMARY KEY (partner_id, document_type),
  CHECK (document_type IN ('offerte','orderbevestiging','factuur','herinnering','chat_klant','chat_lead','notificatie','algemeen'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_routing_config TO authenticated;
GRANT ALL ON public.email_routing_config TO service_role;

ALTER TABLE public.email_routing_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Iedereen binnen partner mag lezen"
  ON public.email_routing_config FOR SELECT TO authenticated
  USING (partner_id = public.get_user_partner_id(auth.uid()));

CREATE POLICY "Partner admin mag schrijven"
  ON public.email_routing_config FOR ALL TO authenticated
  USING (partner_id = public.get_user_partner_id(auth.uid()) AND public.get_user_role(auth.uid()) IN ('partner_admin','superadmin'))
  WITH CHECK (partner_id = public.get_user_partner_id(auth.uid()) AND public.get_user_role(auth.uid()) IN ('partner_admin','superadmin'));

CREATE POLICY "Service role volle toegang routing"
  ON public.email_routing_config FOR ALL TO service_role
  USING (true) WITH CHECK (true);

INSERT INTO public.email_routing_config (partner_id, document_type, bron)
SELECT p.id, dt.t, 'partner_default'
FROM public.partners p
CROSS JOIN (VALUES ('offerte'),('orderbevestiging'),('factuur'),('herinnering'),('chat_klant'),('chat_lead'),('notificatie'),('algemeen')) AS dt(t)
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.seed_email_routing_voor_nieuwe_partner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.email_routing_config (partner_id, document_type, bron)
  SELECT NEW.id, dt.t, 'partner_default'
  FROM (VALUES ('offerte'),('orderbevestiging'),('factuur'),('herinnering'),('chat_klant'),('chat_lead'),('notificatie'),('algemeen')) AS dt(t)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_seed_email_routing
AFTER INSERT ON public.partners
FOR EACH ROW EXECUTE FUNCTION public.seed_email_routing_voor_nieuwe_partner();

ALTER TABLE public.email_berichten
  ADD COLUMN IF NOT EXISTS document_type text,
  ADD COLUMN IF NOT EXISTS via_account_id uuid REFERENCES public.email_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS bron_method text;

CREATE OR REPLACE FUNCTION public.touch_email_routing_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_touch_email_routing
BEFORE UPDATE ON public.email_routing_config
FOR EACH ROW EXECUTE FUNCTION public.touch_email_routing_updated_at();
