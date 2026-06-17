-- Sta installateurs toe documenten toe te voegen en (eigen) bij te werken/verwijderen
DROP POLICY IF EXISTS "Documenten aanmaken" ON public.documenten;
CREATE POLICY "Documenten aanmaken" ON public.documenten
FOR INSERT TO authenticated
WITH CHECK (
  is_superadmin(auth.uid())
  OR (
    get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role,'partner_staff'::app_role,'backoffice'::app_role,'adviseur'::app_role,'installateur'::app_role])
    AND partner_id = get_user_partner_id(auth.uid())
  )
);

DROP POLICY IF EXISTS "Documenten verwijderen" ON public.documenten;
CREATE POLICY "Documenten verwijderen" ON public.documenten
FOR DELETE TO authenticated
USING (
  is_superadmin(auth.uid())
  OR (
    get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role,'partner_staff'::app_role,'backoffice'::app_role])
    AND partner_id = get_user_partner_id(auth.uid())
  )
  OR (
    geupload_door_id = auth.uid()
    AND get_user_role(auth.uid()) = ANY (ARRAY['adviseur'::app_role,'installateur'::app_role])
  )
);