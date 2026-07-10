CREATE POLICY "Sales manager ziet alle offertes"
ON public.offertes FOR SELECT TO authenticated
USING (public.get_user_role(auth.uid()) = 'sales_manager'::public.app_role);

CREATE POLICY "Sales manager maakt offertes"
ON public.offertes FOR INSERT TO authenticated
WITH CHECK (public.get_user_role(auth.uid()) = 'sales_manager'::public.app_role);

CREATE POLICY "Sales manager bewerkt offertes"
ON public.offertes FOR UPDATE TO authenticated
USING (public.get_user_role(auth.uid()) = 'sales_manager'::public.app_role);

CREATE POLICY "Sales manager verwijdert offertes"
ON public.offertes FOR DELETE TO authenticated
USING (public.get_user_role(auth.uid()) = 'sales_manager'::public.app_role);