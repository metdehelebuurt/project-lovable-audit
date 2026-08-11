DROP POLICY IF EXISTS break_glass_superadmin_restrict ON public.users;

CREATE POLICY break_glass_superadmin_restrict
ON public.users
AS RESTRICTIVE
FOR UPDATE
USING (
  id = auth.uid()
  OR NOT public.is_superadmin(auth.uid())
  OR partner_id IS NULL
  OR rol = 'affiliate'::public.app_role
  OR public.has_break_glass_access(auth.uid(), partner_id)
)
WITH CHECK (
  id = auth.uid()
  OR NOT public.is_superadmin(auth.uid())
  OR partner_id IS NULL
  OR rol = 'affiliate'::public.app_role
  OR public.has_break_glass_access(auth.uid(), partner_id)
);

CREATE POLICY break_glass_superadmin_restrict_delete
ON public.users
AS RESTRICTIVE
FOR DELETE
USING (
  id = auth.uid()
  OR NOT public.is_superadmin(auth.uid())
  OR partner_id IS NULL
  OR rol = 'affiliate'::public.app_role
  OR public.has_break_glass_access(auth.uid(), partner_id)
);