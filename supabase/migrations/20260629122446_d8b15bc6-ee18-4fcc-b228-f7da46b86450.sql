-- Allow superadmin to access affiliate-role users without break-glass.
-- Affiliates are an outward-facing role that needs centrale beheer; partner staff PII blijft beschermd.
DROP POLICY IF EXISTS "break_glass_superadmin_restrict" ON public.users;

CREATE POLICY "break_glass_superadmin_restrict"
ON public.users
FOR ALL
USING (
  id = auth.uid()
  OR NOT is_superadmin(auth.uid())
  OR partner_id IS NULL
  OR rol = 'affiliate'::app_role
  OR has_break_glass_access(auth.uid(), partner_id)
)
WITH CHECK (
  id = auth.uid()
  OR NOT is_superadmin(auth.uid())
  OR partner_id IS NULL
  OR rol = 'affiliate'::app_role
  OR has_break_glass_access(auth.uid(), partner_id)
);