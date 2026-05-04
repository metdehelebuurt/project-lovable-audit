CREATE TABLE IF NOT EXISTS public.installatie_gereedheid_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  installatie_id uuid NOT NULL REFERENCES public.installaties(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL,
  item_key text NOT NULL,
  voltooid_op timestamptz NOT NULL DEFAULT now(),
  voltooid_door uuid,
  notitie text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (installatie_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_inst_gereedh_override_install
  ON public.installatie_gereedheid_overrides(installatie_id);

ALTER TABLE public.installatie_gereedheid_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner ziet gereedheid overrides"
ON public.installatie_gereedheid_overrides FOR SELECT TO authenticated
USING (is_superadmin(auth.uid()) OR partner_id = get_user_partner_id(auth.uid()));

CREATE POLICY "Backoffice beheert gereedheid overrides"
ON public.installatie_gereedheid_overrides FOR ALL TO authenticated
USING (
  is_superadmin(auth.uid())
  OR (partner_id = get_user_partner_id(auth.uid())
      AND get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice']::app_role[]))
)
WITH CHECK (
  is_superadmin(auth.uid())
  OR (partner_id = get_user_partner_id(auth.uid())
      AND get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice']::app_role[]))
);

CREATE TRIGGER trg_inst_gereedh_override_upd
BEFORE UPDATE ON public.installatie_gereedheid_overrides
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();