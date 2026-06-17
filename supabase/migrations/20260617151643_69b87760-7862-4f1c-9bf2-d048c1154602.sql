DROP POLICY IF EXISTS "Bevoegde rollen maken lead notities" ON public.lead_notities;
CREATE POLICY "Bevoegde rollen maken lead notities" ON public.lead_notities
FOR INSERT TO authenticated
WITH CHECK (
  is_superadmin(auth.uid())
  OR (
    get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role, 'backoffice'::app_role, 'adviseur'::app_role, 'installateur'::app_role])
    AND partner_id = get_user_partner_id(auth.uid())
  )
);