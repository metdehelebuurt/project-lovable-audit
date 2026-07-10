CREATE POLICY "Sales manager ziet alle partners"
ON public.partners
FOR SELECT
TO authenticated
USING (
  public.get_user_role(auth.uid()) = 'sales_manager'::public.app_role
);