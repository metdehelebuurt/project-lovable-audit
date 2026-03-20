
CREATE TABLE public.partner_product_teksten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.producten(id) ON DELETE CASCADE,
  offerte_tekst text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(partner_id, product_id)
);

ALTER TABLE public.partner_product_teksten ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner users zien eigen partner teksten"
ON public.partner_product_teksten FOR SELECT TO authenticated
USING (partner_id = get_user_partner_id(auth.uid()) OR is_superadmin(auth.uid()));

CREATE POLICY "Partner users maken eigen partner teksten"
ON public.partner_product_teksten FOR INSERT TO authenticated
WITH CHECK (
  (get_user_role(auth.uid()) = ANY(ARRAY['partner_admin','partner_staff','adviseur']::app_role[]))
  AND partner_id = get_user_partner_id(auth.uid())
  OR is_superadmin(auth.uid())
);

CREATE POLICY "Partner users bewerken eigen partner teksten"
ON public.partner_product_teksten FOR UPDATE TO authenticated
USING (
  (get_user_role(auth.uid()) = ANY(ARRAY['partner_admin','partner_staff','adviseur']::app_role[]))
  AND partner_id = get_user_partner_id(auth.uid())
  OR is_superadmin(auth.uid())
);

CREATE POLICY "Partner users verwijderen eigen partner teksten"
ON public.partner_product_teksten FOR DELETE TO authenticated
USING (
  (get_user_role(auth.uid()) = ANY(ARRAY['partner_admin','partner_staff']::app_role[]))
  AND partner_id = get_user_partner_id(auth.uid())
  OR is_superadmin(auth.uid())
);
