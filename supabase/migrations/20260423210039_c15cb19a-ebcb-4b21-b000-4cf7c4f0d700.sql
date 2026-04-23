-- Vervang twee bestaande SELECT-policies door één gecombineerde die ook 'backoffice' toelaat
DROP POLICY IF EXISTS "Adviseur ziet partner teamleden" ON public.users;
DROP POLICY IF EXISTS "Partner admin ziet eigen partner users" ON public.users;

CREATE POLICY "Partner team ziet partner users"
  ON public.users
  FOR SELECT
  USING (
    get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role, 'adviseur'::app_role, 'backoffice'::app_role])
    AND partner_id = get_user_partner_id(auth.uid())
  );