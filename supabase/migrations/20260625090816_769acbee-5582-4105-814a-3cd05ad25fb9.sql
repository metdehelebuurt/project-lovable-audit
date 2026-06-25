-- Helper: is_sales_manager / is_sales_admin (superadmin OF sales_manager)
CREATE OR REPLACE FUNCTION public.is_sales_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = _user_id AND rol = 'sales_manager'::public.app_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_sales_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = _user_id
      AND rol IN ('superadmin'::public.app_role, 'sales_manager'::public.app_role)
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_sales_manager(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_sales_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_sales_manager(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_sales_admin(uuid) TO authenticated, service_role;

-- Promoot bas@mijnhuis.nu (alleen als hij niet al superadmin is)
UPDATE public.users
SET rol = 'sales_manager'::public.app_role
WHERE lower(email) = 'bas@mijnhuis.nu'
  AND rol <> 'superadmin'::public.app_role;

-- Sales Manager: volledig inzicht & beheer op affiliate-tabellen
-- (analoog aan bestaande superadmin-policies, maar via is_sales_admin)
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'affiliate_leads',
    'affiliate_lead_contactmomenten',
    'affiliate_lead_imports',
    'affiliate_terugbel_afspraken',
    'affiliate_opvolg_taken',
    'affiliate_opvolg_log',
    'affiliate_opvolg_regels',
    'affiliate_referrals',
    'affiliate_commissies',
    'affiliate_targets',
    'affiliate_links',
    'affiliate_email_templates',
    'affiliate_instellingen',
    'affiliate_onboarding_taken'
  ] LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS "sales_admin_full_access" ON public.%I;', t
    );
    EXECUTE format(
      'CREATE POLICY "sales_admin_full_access" ON public.%I
       AS PERMISSIVE FOR ALL TO authenticated
       USING (public.is_sales_admin(auth.uid()))
       WITH CHECK (public.is_sales_admin(auth.uid()));',
      t
    );
  END LOOP;
END$$;
