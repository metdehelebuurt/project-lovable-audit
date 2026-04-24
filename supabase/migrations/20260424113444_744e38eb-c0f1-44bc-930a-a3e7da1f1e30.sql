-- =========================================================
-- BREAK-GLASS ACCESS SYSTEM voor superadmins
-- =========================================================

CREATE TABLE public.superadmin_access_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  superadmin_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  reden text NOT NULL,
  verleend_op timestamptz NOT NULL DEFAULT now(),
  vervalt_op timestamptz NOT NULL,
  notify_partner boolean NOT NULL DEFAULT true,
  ingetrokken_op timestamptz,
  ingetrokken_door uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sag_superadmin ON public.superadmin_access_grants(superadmin_user_id, vervalt_op);
CREATE INDEX idx_sag_partner ON public.superadmin_access_grants(partner_id, vervalt_op);
CREATE INDEX idx_sag_active ON public.superadmin_access_grants(superadmin_user_id, partner_id)
  WHERE ingetrokken_op IS NULL;

-- =========================================================
-- VALIDATIE TRIGGER
-- =========================================================

CREATE OR REPLACE FUNCTION public.validate_superadmin_access_grant()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF length(trim(NEW.reden)) < 10 THEN
    RAISE EXCEPTION 'Reden moet minimaal 10 tekens bevatten';
  END IF;

  IF NEW.vervalt_op <= NEW.verleend_op THEN
    RAISE EXCEPTION 'Vervaldatum moet na verleend_op liggen';
  END IF;

  IF NEW.vervalt_op > NEW.verleend_op + interval '24 hours' THEN
    RAISE EXCEPTION 'Maximale duur van break-glass toegang is 24 uur';
  END IF;

  IF NOT public.is_superadmin(NEW.superadmin_user_id) THEN
    RAISE EXCEPTION 'Alleen superadmins kunnen break-glass toegang krijgen';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_sag
BEFORE INSERT OR UPDATE ON public.superadmin_access_grants
FOR EACH ROW EXECUTE FUNCTION public.validate_superadmin_access_grant();

-- =========================================================
-- AUDIT TRIGGER
-- =========================================================

CREATE OR REPLACE FUNCTION public.audit_superadmin_access_grant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (partner_id, actor_id, target_user_id, actie, entity_type, entity_id, nieuwe_waarde)
    VALUES (NEW.partner_id, NEW.superadmin_user_id, NEW.superadmin_user_id,
            'break_glass_verleend', 'superadmin_access_grants', NEW.id,
            jsonb_build_object('reden', NEW.reden, 'vervalt_op', NEW.vervalt_op, 'notify_partner', NEW.notify_partner));
  ELSIF TG_OP = 'UPDATE' AND NEW.ingetrokken_op IS NOT NULL AND OLD.ingetrokken_op IS NULL THEN
    INSERT INTO public.audit_log (partner_id, actor_id, target_user_id, actie, entity_type, entity_id, nieuwe_waarde)
    VALUES (NEW.partner_id, NEW.ingetrokken_door, NEW.superadmin_user_id,
            'break_glass_ingetrokken', 'superadmin_access_grants', NEW.id,
            jsonb_build_object('ingetrokken_op', NEW.ingetrokken_op));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_sag
AFTER INSERT OR UPDATE ON public.superadmin_access_grants
FOR EACH ROW EXECUTE FUNCTION public.audit_superadmin_access_grant();

-- =========================================================
-- HELPER FUNCTIE: has_break_glass_access
-- =========================================================

CREATE OR REPLACE FUNCTION public.has_break_glass_access(_user_id uuid, _partner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.superadmin_access_grants
    WHERE superadmin_user_id = _user_id
      AND partner_id = _partner_id
      AND ingetrokken_op IS NULL
      AND vervalt_op > now()
  );
$$;

-- =========================================================
-- RLS
-- =========================================================

ALTER TABLE public.superadmin_access_grants ENABLE ROW LEVEL SECURITY;

-- Superadmin ziet eigen grants
CREATE POLICY "Superadmin ziet eigen grants"
ON public.superadmin_access_grants
FOR SELECT
USING (
  is_superadmin(auth.uid())
  AND superadmin_user_id = auth.uid()
);

-- Partner_admin ziet grants op eigen partner (transparantie)
CREATE POLICY "Partner admin ziet grants op eigen partner"
ON public.superadmin_access_grants
FOR SELECT
USING (
  get_user_role(auth.uid()) = 'partner_admin'::app_role
  AND partner_id = get_user_partner_id(auth.uid())
);

-- Superadmin maakt eigen grants aan
CREATE POLICY "Superadmin maakt eigen grants"
ON public.superadmin_access_grants
FOR INSERT
WITH CHECK (
  is_superadmin(auth.uid())
  AND superadmin_user_id = auth.uid()
);

-- Superadmin trekt eigen grants in (alleen ingetrokken_op/door velden)
CREATE POLICY "Superadmin trekt eigen grants in"
ON public.superadmin_access_grants
FOR UPDATE
USING (
  is_superadmin(auth.uid())
  AND superadmin_user_id = auth.uid()
)
WITH CHECK (
  is_superadmin(auth.uid())
  AND superadmin_user_id = auth.uid()
);

-- GEEN delete policy → grants zijn permanent (audit-trail)