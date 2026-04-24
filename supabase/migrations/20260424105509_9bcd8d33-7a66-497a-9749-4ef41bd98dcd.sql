DROP POLICY IF EXISTS "Leads aanmaken door bevoegde rollen" ON public.leads;

CREATE POLICY "Leads aanmaken door bevoegde rollen"
ON public.leads
FOR INSERT
WITH CHECK (
  is_superadmin(auth.uid())
  OR (
    get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'backoffice'::app_role, 'partner_staff'::app_role, 'adviseur'::app_role])
    AND partner_id = get_user_partner_id(auth.uid())
  )
);