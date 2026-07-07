-- Sales manager/admin read-only leestoegang op klant_notities
DROP POLICY IF EXISTS "Sales rollen zien alle klant notities" ON public.klant_notities;
CREATE POLICY "Sales rollen zien alle klant notities"
  ON public.klant_notities FOR SELECT TO authenticated
  USING (
    public.is_sales_manager(auth.uid())
    OR public.is_sales_admin(auth.uid())
  );