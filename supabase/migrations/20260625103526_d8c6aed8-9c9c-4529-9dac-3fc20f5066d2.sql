
-- 1. Tabel voor extra (additieve) rollen
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rol public.app_role NOT NULL,
  toegekend_door uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, rol)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_select_self_or_admin" ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_superadmin(auth.uid())
    OR public.is_sales_admin(auth.uid())
    OR (
      public.is_partner_admin_or_higher(auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = user_roles.user_id
          AND u.partner_id = public.get_user_partner_id(auth.uid())
      )
    )
  );

-- Schrijven gebeurt enkel via edge function met service-role; geen INSERT/UPDATE/DELETE policy voor authenticated.

CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON public.user_roles(user_id);

-- 2. Helpers
CREATE OR REPLACE FUNCTION public.user_has_role(_user_id uuid, _rol public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT
    EXISTS (SELECT 1 FROM public.users WHERE id = _user_id AND rol = _rol)
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND rol = _rol);
$$;

CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS public.app_role[]
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT ARRAY(
    SELECT DISTINCT r FROM (
      SELECT rol AS r FROM public.users WHERE id = _user_id
      UNION
      SELECT rol AS r FROM public.user_roles WHERE user_id = _user_id
    ) t WHERE r IS NOT NULL
  );
$$;

-- 3. is_affiliate uitbreiden zodat hybride gebruikers ook tellen
CREATE OR REPLACE FUNCTION public.is_affiliate(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT public.user_has_role(_user_id, 'affiliate'::public.app_role);
$$;

-- 4. Specifieke policy op affiliate_instellingen die nog hard op get_user_role checkt
DROP POLICY IF EXISTS "Affiliate leest instellingen" ON public.affiliate_instellingen;
CREATE POLICY "Affiliate leest instellingen" ON public.affiliate_instellingen
  FOR SELECT TO authenticated
  USING (public.user_has_role(auth.uid(), 'affiliate'::public.app_role));
