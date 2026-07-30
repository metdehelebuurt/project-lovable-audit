DROP POLICY IF EXISTS "Sales manager ziet alle offertes" ON public.offertes;
DROP POLICY IF EXISTS "Sales manager bewerkt offertes" ON public.offertes;
DROP POLICY IF EXISTS "Sales manager maakt offertes" ON public.offertes;
DROP POLICY IF EXISTS "Sales manager verwijdert offertes" ON public.offertes;

CREATE POLICY "Sales manager ziet eigen offertes"
ON public.offertes FOR SELECT TO authenticated
USING (public.get_user_role(auth.uid()) = 'sales_manager'::public.app_role AND adviseur_id = auth.uid());

CREATE POLICY "Sales manager maakt eigen offertes"
ON public.offertes FOR INSERT TO authenticated
WITH CHECK (public.get_user_role(auth.uid()) = 'sales_manager'::public.app_role AND adviseur_id = auth.uid());

CREATE POLICY "Sales manager bewerkt eigen offertes"
ON public.offertes FOR UPDATE TO authenticated
USING (public.get_user_role(auth.uid()) = 'sales_manager'::public.app_role AND adviseur_id = auth.uid())
WITH CHECK (public.get_user_role(auth.uid()) = 'sales_manager'::public.app_role AND adviseur_id = auth.uid());

CREATE POLICY "Sales manager verwijdert eigen offertes"
ON public.offertes FOR DELETE TO authenticated
USING (public.get_user_role(auth.uid()) = 'sales_manager'::public.app_role AND adviseur_id = auth.uid());