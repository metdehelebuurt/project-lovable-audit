-- Helper: admin-tier (superadmin, partner_admin, backoffice)
CREATE OR REPLACE FUNCTION public.is_admin_tier(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = _user_id
      AND rol IN ('superadmin', 'partner_admin', 'backoffice')
  );
$$;

-- Helper: partner-admin-tier (superadmin + partner_admin only)
CREATE OR REPLACE FUNCTION public.is_partner_admin_or_higher(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = _user_id
      AND rol IN ('superadmin', 'partner_admin')
  );
$$;

-- Publieke product-view zonder inkoopprijs (voor adviseur/installateur)
DO $$
DECLARE
  col_list text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ')
    INTO col_list
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'producten'
    AND column_name <> 'inkoopprijs';

  IF col_list IS NOT NULL THEN
    EXECUTE format('CREATE OR REPLACE VIEW public.producten_publiek AS SELECT %s FROM public.producten', col_list);
    EXECUTE 'GRANT SELECT ON public.producten_publiek TO authenticated';
  END IF;
END $$;

-- Financiele documenten: alleen admin-tier
DROP POLICY IF EXISTS "Partner staff/admin can manage financial docs" ON public.financiele_documenten;
DROP POLICY IF EXISTS "Adviseur kan eigen offerte facturen zien" ON public.financiele_documenten;
DROP POLICY IF EXISTS "financieel_admin_only_select" ON public.financiele_documenten;
DROP POLICY IF EXISTS "financieel_admin_only_modify" ON public.financiele_documenten;

CREATE POLICY "financieel_admin_only_select" ON public.financiele_documenten
FOR SELECT TO authenticated
USING (
  public.is_superadmin(auth.uid())
  OR (public.is_admin_tier(auth.uid()) AND partner_id = public.get_user_partner_id(auth.uid()))
);

CREATE POLICY "financieel_admin_only_modify" ON public.financiele_documenten
FOR ALL TO authenticated
USING (
  public.is_superadmin(auth.uid())
  OR (public.is_admin_tier(auth.uid()) AND partner_id = public.get_user_partner_id(auth.uid()))
)
WITH CHECK (
  public.is_superadmin(auth.uid())
  OR (public.is_admin_tier(auth.uid()) AND partner_id = public.get_user_partner_id(auth.uid()))
);

-- Leveranciers: alleen admin-tier
DROP POLICY IF EXISTS "leveranciers_admin_only" ON public.leveranciers;
CREATE POLICY "leveranciers_admin_only" ON public.leveranciers
FOR ALL TO authenticated
USING (
  public.is_superadmin(auth.uid())
  OR (public.is_admin_tier(auth.uid()) AND partner_id = public.get_user_partner_id(auth.uid()))
)
WITH CHECK (
  public.is_superadmin(auth.uid())
  OR (public.is_admin_tier(auth.uid()) AND partner_id = public.get_user_partner_id(auth.uid()))
);
