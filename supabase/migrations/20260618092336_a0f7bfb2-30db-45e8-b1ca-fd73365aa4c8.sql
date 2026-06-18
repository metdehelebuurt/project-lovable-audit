
CREATE TABLE public.offerte_auto_herinnering_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL UNIQUE REFERENCES public.partners(id) ON DELETE CASCADE,
  actief boolean NOT NULL DEFAULT false,
  dagen_voor_verloop integer[] NOT NULL DEFAULT '{2}',
  dagen_na_verloop integer[] NOT NULL DEFAULT '{1,7}',
  email_template_id uuid REFERENCES public.email_templates(id) ON DELETE SET NULL,
  alleen_werkdagen boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.offerte_auto_herinnering_config TO authenticated;
GRANT ALL ON public.offerte_auto_herinnering_config TO service_role;

ALTER TABLE public.offerte_auto_herinnering_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin tier kan eigen partner config bekijken"
  ON public.offerte_auto_herinnering_config FOR SELECT
  TO authenticated
  USING (public.is_admin_tier(auth.uid()) AND partner_id = public.get_user_partner_id(auth.uid()));

CREATE POLICY "Admin tier kan eigen partner config beheren"
  ON public.offerte_auto_herinnering_config FOR ALL
  TO authenticated
  USING (public.is_admin_tier(auth.uid()) AND partner_id = public.get_user_partner_id(auth.uid()))
  WITH CHECK (public.is_admin_tier(auth.uid()) AND partner_id = public.get_user_partner_id(auth.uid()));

CREATE TRIGGER trg_offerte_auto_herinnering_config_updated
  BEFORE UPDATE ON public.offerte_auto_herinnering_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.offerte_auto_herinnering_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offerte_id uuid NOT NULL REFERENCES public.offertes(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL,
  fase text NOT NULL CHECK (fase IN ('voor_verloop','na_verloop')),
  dag_offset integer NOT NULL,
  verzonden_op timestamptz NOT NULL DEFAULT now(),
  ontvanger_email text,
  fout text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (offerte_id, fase, dag_offset)
);

GRANT SELECT ON public.offerte_auto_herinnering_log TO authenticated;
GRANT ALL ON public.offerte_auto_herinnering_log TO service_role;

ALTER TABLE public.offerte_auto_herinnering_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner medewerkers kunnen eigen log lezen"
  ON public.offerte_auto_herinnering_log FOR SELECT
  TO authenticated
  USING (partner_id = public.get_user_partner_id(auth.uid()));

CREATE INDEX idx_offerte_auto_herinnering_log_partner ON public.offerte_auto_herinnering_log(partner_id, offerte_id);
