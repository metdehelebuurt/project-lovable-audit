-- 1. users: permissieve break-glass policy vervangen door restrictive
DROP POLICY IF EXISTS "break_glass_superadmin_restrict" ON public.users;

CREATE POLICY "break_glass_superadmin_restrict"
ON public.users
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (
  (id = auth.uid())
  OR (NOT public.is_superadmin(auth.uid()))
  OR (partner_id IS NULL)
  OR (rol = 'affiliate'::app_role)
  OR public.has_break_glass_access(auth.uid(), partner_id)
)
WITH CHECK (
  (id = auth.uid())
  OR (NOT public.is_superadmin(auth.uid()))
  OR (partner_id IS NULL)
  OR (rol = 'affiliate'::app_role)
  OR public.has_break_glass_access(auth.uid(), partner_id)
);

-- 2. contactpersonen: idem, standaardvariant
DROP POLICY IF EXISTS "break_glass_superadmin_restrict" ON public.contactpersonen;

CREATE POLICY "break_glass_superadmin_restrict"
ON public.contactpersonen
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (
  (NOT public.is_superadmin(auth.uid()))
  OR public.has_break_glass_access(auth.uid(), partner_id)
)
WITH CHECK (
  (NOT public.is_superadmin(auth.uid()))
  OR public.has_break_glass_access(auth.uid(), partner_id)
);

-- 3. Guard: faal zolang er nog een permissieve break-glass policy bestaat
DO $$
DECLARE
  fout text;
BEGIN
  SELECT string_agg(c.relname, ', ')
    INTO fout
  FROM pg_policy p
  JOIN pg_class c ON c.oid = p.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND p.polname = 'break_glass_superadmin_restrict'
    AND p.polpermissive;

  IF fout IS NOT NULL THEN
    RAISE EXCEPTION 'break-glass policy staat permissief op: %', fout;
  END IF;
END $$;