CREATE POLICY "Adviseur ziet partner teamleden"
ON public.users FOR SELECT TO authenticated
USING (
  get_user_role(auth.uid()) = 'adviseur'::app_role
  AND partner_id = get_user_partner_id(auth.uid())
);