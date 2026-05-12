DROP POLICY IF EXISTS "Partner users maken contactmomenten" ON public.lead_contactmomenten;

CREATE POLICY "Partner users maken contactmomenten"
ON public.lead_contactmomenten
FOR INSERT
WITH CHECK (
  is_superadmin(auth.uid())
  OR (
    get_user_role(auth.uid()) = ANY (ARRAY[
      'partner_admin'::app_role,
      'partner_staff'::app_role,
      'adviseur'::app_role,
      'backoffice'::app_role,
      'installateur'::app_role
    ])
    AND partner_id = get_user_partner_id(auth.uid())
  )
);