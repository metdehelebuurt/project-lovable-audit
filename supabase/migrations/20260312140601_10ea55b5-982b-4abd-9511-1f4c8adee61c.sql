
-- Extend producten INSERT policy to include installateur and partner_staff
DROP POLICY IF EXISTS "Producten aanmaken" ON public.producten;
CREATE POLICY "Producten aanmaken" ON public.producten
  FOR INSERT TO authenticated
  WITH CHECK (
    is_superadmin(auth.uid()) 
    OR (
      (get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role, 'installateur'::app_role]))
      AND (partner_id = get_user_partner_id(auth.uid()))
    )
  );

-- Extend producten UPDATE policy to include installateur and partner_staff
DROP POLICY IF EXISTS "Producten bijwerken" ON public.producten;
CREATE POLICY "Producten bijwerken" ON public.producten
  FOR UPDATE TO authenticated
  USING (
    is_superadmin(auth.uid()) 
    OR (
      (get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role, 'installateur'::app_role]))
      AND (partner_id = get_user_partner_id(auth.uid()))
    )
  );
