
DROP POLICY IF EXISTS "Systeem schrijft entiteit historie" ON public.entiteit_historie;
CREATE POLICY "Systeem schrijft entiteit historie"
ON public.entiteit_historie FOR INSERT TO authenticated
WITH CHECK (
  is_superadmin(auth.uid())
  OR partner_id IS NULL
  OR partner_id = get_user_partner_id(auth.uid())
);
