
DROP POLICY IF EXISTS "Partner users bewerken eigen contactmomenten" ON public.lead_contactmomenten;
DROP POLICY IF EXISTS "Partner users verwijderen contactmomenten" ON public.lead_contactmomenten;

CREATE POLICY "Partner users bewerken contactmomenten"
ON public.lead_contactmomenten
FOR UPDATE
USING (
  is_superadmin(auth.uid())
  OR user_id = auth.uid()
  OR (
    partner_id = get_user_partner_id(auth.uid())
    AND get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role])
  )
)
WITH CHECK (
  is_superadmin(auth.uid())
  OR user_id = auth.uid()
  OR (
    partner_id = get_user_partner_id(auth.uid())
    AND get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role])
  )
);

CREATE POLICY "Partner users verwijderen contactmomenten"
ON public.lead_contactmomenten
FOR DELETE
USING (
  is_superadmin(auth.uid())
  OR user_id = auth.uid()
  OR (
    partner_id = get_user_partner_id(auth.uid())
    AND get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role])
  )
);
