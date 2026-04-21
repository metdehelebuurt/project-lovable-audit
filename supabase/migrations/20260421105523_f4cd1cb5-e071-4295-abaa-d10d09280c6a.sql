-- ============ A. Profielvelden op users ============
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS functie text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS taal text DEFAULT 'nl';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Europe/Amsterdam';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS mfa_enabled boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarding_voltooid boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarding_stappen jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS handtekening_html text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS opmerking text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS uitgenodigd_op timestamptz;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS uitgenodigd_door uuid REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS uitnodiging_token text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS uitnodiging_verloopt timestamptz;

CREATE INDEX IF NOT EXISTS idx_users_uitnodiging_token ON public.users(uitnodiging_token) WHERE uitnodiging_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_partner ON public.users(partner_id);

-- ============ B. Email accounts per gebruiker ============
ALTER TABLE public.email_accounts DROP CONSTRAINT IF EXISTS email_accounts_partner_id_provider_key;
ALTER TABLE public.email_accounts DROP CONSTRAINT IF EXISTS email_accounts_user_id_provider_key;

-- Voeg unique constraint toe (alleen als hij nog niet bestaat)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_accounts_user_provider_key'
  ) THEN
    ALTER TABLE public.email_accounts
      ADD CONSTRAINT email_accounts_user_provider_key UNIQUE (user_id, provider);
  END IF;
END$$;

ALTER TABLE public.email_accounts ADD COLUMN IF NOT EXISTS is_default_voor_partner boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_email_accounts_user ON public.email_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_email_accounts_partner_default ON public.email_accounts(partner_id) WHERE is_default_voor_partner = true;

-- ============ C. Audit log ============
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid,
  actor_id uuid,
  target_user_id uuid,
  actie text NOT NULL,
  entity_type text,
  entity_id uuid,
  oude_waarde jsonb,
  nieuwe_waarde jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_partner_created ON public.audit_log(partner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_target_created ON public.audit_log(target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor_created ON public.audit_log(actor_id, created_at DESC);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Audit eigen partner lezen door admin" ON public.audit_log;
CREATE POLICY "Audit eigen partner lezen door admin"
  ON public.audit_log FOR SELECT TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (
      partner_id = public.get_user_partner_id(auth.uid())
      AND public.get_user_role(auth.uid()) = 'partner_admin'
    )
    OR target_user_id = auth.uid()
    OR actor_id = auth.uid()
  );

DROP POLICY IF EXISTS "Audit log insert via authenticated" ON public.audit_log;
CREATE POLICY "Audit log insert via authenticated"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    OR public.is_superadmin(auth.uid())
  );

-- ============ D. Afwezigheid ============
CREATE TABLE IF NOT EXISTS public.gebruiker_afwezigheid (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL,
  van date NOT NULL,
  tot date NOT NULL,
  reden text,
  vervanger_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT afwezigheid_periode_check CHECK (tot >= van)
);

CREATE INDEX IF NOT EXISTS idx_afwezigheid_user ON public.gebruiker_afwezigheid(user_id);
CREATE INDEX IF NOT EXISTS idx_afwezigheid_partner_periode ON public.gebruiker_afwezigheid(partner_id, van, tot);

ALTER TABLE public.gebruiker_afwezigheid ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Afwezigheid lezen binnen partner" ON public.gebruiker_afwezigheid;
CREATE POLICY "Afwezigheid lezen binnen partner"
  ON public.gebruiker_afwezigheid FOR SELECT TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR partner_id = public.get_user_partner_id(auth.uid())
  );

DROP POLICY IF EXISTS "Afwezigheid beheren door admin of zelf" ON public.gebruiker_afwezigheid;
CREATE POLICY "Afwezigheid beheren door admin of zelf"
  ON public.gebruiker_afwezigheid FOR ALL TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR user_id = auth.uid()
    OR (
      partner_id = public.get_user_partner_id(auth.uid())
      AND public.get_user_role(auth.uid()) = 'partner_admin'
    )
  )
  WITH CHECK (
    public.is_superadmin(auth.uid())
    OR user_id = auth.uid()
    OR (
      partner_id = public.get_user_partner_id(auth.uid())
      AND public.get_user_role(auth.uid()) = 'partner_admin'
    )
  );

-- ============ E. Permissie-overrides ============
CREATE TABLE IF NOT EXISTS public.gebruiker_permissies (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  partner_id uuid,
  permissies jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL
);

ALTER TABLE public.gebruiker_permissies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permissies lezen binnen partner" ON public.gebruiker_permissies;
CREATE POLICY "Permissies lezen binnen partner"
  ON public.gebruiker_permissies FOR SELECT TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR user_id = auth.uid()
    OR partner_id = public.get_user_partner_id(auth.uid())
  );

DROP POLICY IF EXISTS "Permissies beheren door admin" ON public.gebruiker_permissies;
CREATE POLICY "Permissies beheren door admin"
  ON public.gebruiker_permissies FOR ALL TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (
      partner_id = public.get_user_partner_id(auth.uid())
      AND public.get_user_role(auth.uid()) = 'partner_admin'
    )
  )
  WITH CHECK (
    public.is_superadmin(auth.uid())
    OR (
      partner_id = public.get_user_partner_id(auth.uid())
      AND public.get_user_role(auth.uid()) = 'partner_admin'
    )
  );

CREATE TRIGGER update_gebruiker_permissies_updated_at
  BEFORE UPDATE ON public.gebruiker_permissies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ F. MFA-vereisten per rol ============
CREATE TABLE IF NOT EXISTS public.mfa_vereisten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  rol public.app_role NOT NULL,
  verplicht boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_id, rol)
);

ALTER TABLE public.mfa_vereisten ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "MFA-vereisten lezen binnen partner" ON public.mfa_vereisten;
CREATE POLICY "MFA-vereisten lezen binnen partner"
  ON public.mfa_vereisten FOR SELECT TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR partner_id = public.get_user_partner_id(auth.uid())
  );

DROP POLICY IF EXISTS "MFA-vereisten beheren door admin" ON public.mfa_vereisten;
CREATE POLICY "MFA-vereisten beheren door admin"
  ON public.mfa_vereisten FOR ALL TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (
      partner_id = public.get_user_partner_id(auth.uid())
      AND public.get_user_role(auth.uid()) = 'partner_admin'
    )
  )
  WITH CHECK (
    public.is_superadmin(auth.uid())
    OR (
      partner_id = public.get_user_partner_id(auth.uid())
      AND public.get_user_role(auth.uid()) = 'partner_admin'
    )
  );

-- ============ G. Helper-functie voor audit-log inserts ============
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _partner_id uuid,
  _actor_id uuid,
  _target_user_id uuid,
  _actie text,
  _entity_type text,
  _entity_id uuid,
  _oude jsonb,
  _nieuwe jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
BEGIN
  INSERT INTO public.audit_log (partner_id, actor_id, target_user_id, actie, entity_type, entity_id, oude_waarde, nieuwe_waarde)
  VALUES (_partner_id, _actor_id, _target_user_id, _actie, _entity_type, _entity_id, _oude, _nieuwe)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

-- ============ H. Trigger voor user-wijzigingen ============
CREATE OR REPLACE FUNCTION public.audit_users_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_changes jsonb := '{}'::jsonb;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.rol IS DISTINCT FROM OLD.rol THEN
      v_changes := v_changes || jsonb_build_object('rol', jsonb_build_object('oud', OLD.rol, 'nieuw', NEW.rol));
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      v_changes := v_changes || jsonb_build_object('status', jsonb_build_object('oud', OLD.status, 'nieuw', NEW.status));
    END IF;
    IF v_changes <> '{}'::jsonb THEN
      INSERT INTO public.audit_log (partner_id, actor_id, target_user_id, actie, entity_type, entity_id, oude_waarde, nieuwe_waarde)
      VALUES (NEW.partner_id, v_actor, NEW.id, 'gebruiker_gewijzigd', 'users', NEW.id, NULL, v_changes);
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (partner_id, actor_id, target_user_id, actie, entity_type, entity_id, nieuwe_waarde)
    VALUES (NEW.partner_id, v_actor, NEW.id, 'gebruiker_aangemaakt', 'users', NEW.id,
            jsonb_build_object('rol', NEW.rol, 'email', NEW.email));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_users_changes ON public.users;
CREATE TRIGGER trg_audit_users_changes
  AFTER INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.audit_users_changes();