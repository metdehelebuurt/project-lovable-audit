
CREATE TABLE public.partner_product_datasheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.producten(id) ON DELETE CASCADE,
  datasheet_type text NOT NULL DEFAULT 'gegenereerd',
  datasheet_url text,
  generated_specs jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(partner_id, product_id)
);

ALTER TABLE public.partner_product_datasheets ENABLE ROW LEVEL SECURITY;

-- Partner users can see their own datasheets
CREATE POLICY "Partner users zien eigen partner datasheets"
  ON public.partner_product_datasheets
  FOR SELECT
  TO authenticated
  USING (partner_id = get_user_partner_id(auth.uid()));

-- Partner users can insert their own datasheets
CREATE POLICY "Partner users maken eigen datasheets"
  ON public.partner_product_datasheets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role, 'adviseur'::app_role]))
    AND partner_id = get_user_partner_id(auth.uid())
  );

-- Partner users can update their own datasheets
CREATE POLICY "Partner users bijwerken eigen datasheets"
  ON public.partner_product_datasheets
  FOR UPDATE
  TO authenticated
  USING (
    (get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role, 'adviseur'::app_role]))
    AND partner_id = get_user_partner_id(auth.uid())
  );

-- Partner users can delete their own datasheets
CREATE POLICY "Partner users verwijderen eigen datasheets"
  ON public.partner_product_datasheets
  FOR DELETE
  TO authenticated
  USING (
    (get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role]))
    AND partner_id = get_user_partner_id(auth.uid())
  );

-- Superadmin sees all
CREATE POLICY "Superadmin ziet alle datasheets"
  ON public.partner_product_datasheets
  FOR ALL
  TO authenticated
  USING (is_superadmin(auth.uid()));
