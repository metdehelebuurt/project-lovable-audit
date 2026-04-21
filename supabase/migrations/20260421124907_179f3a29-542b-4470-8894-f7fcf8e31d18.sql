-- Tabel 1: per partner, welke rollen mogen welke module
CREATE TABLE public.module_rol_toegang (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  module_key text NOT NULL,
  rol app_role NOT NULL,
  toegestaan boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  UNIQUE (partner_id, module_key, rol)
);

CREATE INDEX idx_module_rol_toegang_partner ON public.module_rol_toegang(partner_id);
CREATE INDEX idx_module_rol_toegang_lookup ON public.module_rol_toegang(partner_id, rol, module_key);

ALTER TABLE public.module_rol_toegang ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner admins beheren module-rolmatrix van eigen organisatie"
  ON public.module_rol_toegang
  FOR ALL
  USING (
    public.is_partner_admin_or_higher(auth.uid())
    AND (public.is_superadmin(auth.uid()) OR partner_id = public.get_user_partner_id(auth.uid()))
  )
  WITH CHECK (
    public.is_partner_admin_or_higher(auth.uid())
    AND (public.is_superadmin(auth.uid()) OR partner_id = public.get_user_partner_id(auth.uid()))
  );

CREATE POLICY "Gebruikers lezen rolmatrix van eigen partner"
  ON public.module_rol_toegang
  FOR SELECT
  USING (partner_id = public.get_user_partner_id(auth.uid()));

-- Tabel 2: per gebruiker, expliciete override per module
CREATE TABLE public.module_user_override (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  module_key text NOT NULL,
  toegestaan boolean NOT NULL,
  reden text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  UNIQUE (user_id, module_key)
);

CREATE INDEX idx_module_user_override_user ON public.module_user_override(user_id);
CREATE INDEX idx_module_user_override_partner ON public.module_user_override(partner_id);

ALTER TABLE public.module_user_override ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner admins beheren overrides van eigen organisatie"
  ON public.module_user_override
  FOR ALL
  USING (
    public.is_partner_admin_or_higher(auth.uid())
    AND (public.is_superadmin(auth.uid()) OR partner_id = public.get_user_partner_id(auth.uid()))
  )
  WITH CHECK (
    public.is_partner_admin_or_higher(auth.uid())
    AND (public.is_superadmin(auth.uid()) OR partner_id = public.get_user_partner_id(auth.uid()))
  );

CREATE POLICY "Gebruiker leest eigen overrides"
  ON public.module_user_override
  FOR SELECT
  USING (user_id = auth.uid());

-- Helper-functie voor effectieve toegang
CREATE OR REPLACE FUNCTION public.user_kan_module(_user_id uuid, _module_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT toegestaan FROM public.module_user_override
       WHERE user_id = _user_id AND module_key = _module_key
       LIMIT 1),
    (SELECT m.toegestaan FROM public.module_rol_toegang m
       JOIN public.users u ON u.partner_id = m.partner_id AND u.rol = m.rol
       WHERE u.id = _user_id AND m.module_key = _module_key
       LIMIT 1),
    true
  );
$$;

-- Trigger: updated_at bijwerken
CREATE TRIGGER trg_module_rol_toegang_updated_at
  BEFORE UPDATE ON public.module_rol_toegang
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_module_user_override_updated_at
  BEFORE UPDATE ON public.module_user_override
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Audit-trigger op overrides (per-gebruiker wijzigingen vastleggen)
CREATE OR REPLACE FUNCTION public.audit_module_user_override()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (partner_id, actor_id, target_user_id, actie, entity_type, entity_id, nieuwe_waarde)
    VALUES (NEW.partner_id, v_actor, NEW.user_id, 'module_override_toegevoegd', 'module_user_override', NEW.id,
            jsonb_build_object('module', NEW.module_key, 'toegestaan', NEW.toegestaan, 'reden', NEW.reden));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (partner_id, actor_id, target_user_id, actie, entity_type, entity_id, oude_waarde, nieuwe_waarde)
    VALUES (NEW.partner_id, v_actor, NEW.user_id, 'module_override_gewijzigd', 'module_user_override', NEW.id,
            jsonb_build_object('toegestaan', OLD.toegestaan, 'reden', OLD.reden),
            jsonb_build_object('toegestaan', NEW.toegestaan, 'reden', NEW.reden));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (partner_id, actor_id, target_user_id, actie, entity_type, entity_id, oude_waarde)
    VALUES (OLD.partner_id, v_actor, OLD.user_id, 'module_override_verwijderd', 'module_user_override', OLD.id,
            jsonb_build_object('module', OLD.module_key, 'toegestaan', OLD.toegestaan));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_audit_module_user_override
  AFTER INSERT OR UPDATE OR DELETE ON public.module_user_override
  FOR EACH ROW EXECUTE FUNCTION public.audit_module_user_override();