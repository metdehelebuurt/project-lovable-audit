
-- ============================================================
-- 1. affiliate_tier op users
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.affiliate_tier AS ENUM ('brons','zilver','goud');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS affiliate_tier public.affiliate_tier DEFAULT 'brons';

-- ============================================================
-- 2. affiliate_instellingen uitbreiden
-- ============================================================
ALTER TABLE public.affiliate_instellingen
  ADD COLUMN IF NOT EXISTS auto_rotatie_actief boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tier_commissies jsonb NOT NULL DEFAULT '{"brons":10,"zilver":15,"goud":20}'::jsonb;

-- ============================================================
-- 3. affiliate_terugbel_afspraken
-- ============================================================
CREATE TABLE IF NOT EXISTS public.affiliate_terugbel_afspraken (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.affiliate_leads(id) ON DELETE CASCADE,
  affiliate_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  geplande_op timestamptz NOT NULL,
  notitie text,
  afgehandeld_op timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_terugbel_afspraken TO authenticated;
GRANT ALL ON public.affiliate_terugbel_afspraken TO service_role;
ALTER TABLE public.affiliate_terugbel_afspraken ENABLE ROW LEVEL SECURITY;

CREATE POLICY "terugbel_select_own" ON public.affiliate_terugbel_afspraken
  FOR SELECT TO authenticated
  USING (is_superadmin(auth.uid()) OR affiliate_id = auth.uid());

CREATE POLICY "terugbel_insert_own" ON public.affiliate_terugbel_afspraken
  FOR INSERT TO authenticated
  WITH CHECK (is_superadmin(auth.uid()) OR affiliate_id = auth.uid());

CREATE POLICY "terugbel_update_own" ON public.affiliate_terugbel_afspraken
  FOR UPDATE TO authenticated
  USING (is_superadmin(auth.uid()) OR affiliate_id = auth.uid())
  WITH CHECK (is_superadmin(auth.uid()) OR affiliate_id = auth.uid());

CREATE POLICY "terugbel_delete_own" ON public.affiliate_terugbel_afspraken
  FOR DELETE TO authenticated
  USING (is_superadmin(auth.uid()) OR affiliate_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_terugbel_affiliate_datum
  ON public.affiliate_terugbel_afspraken(affiliate_id, geplande_op);

CREATE TRIGGER trg_terugbel_updated_at
  BEFORE UPDATE ON public.affiliate_terugbel_afspraken
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 4. affiliate_targets
-- ============================================================
CREATE TABLE IF NOT EXISTS public.affiliate_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  jaar int NOT NULL,
  maand int NOT NULL CHECK (maand BETWEEN 1 AND 12),
  target_omzet numeric(12,2) NOT NULL DEFAULT 0,
  target_klanten int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (affiliate_id, jaar, maand)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_targets TO authenticated;
GRANT ALL ON public.affiliate_targets TO service_role;
ALTER TABLE public.affiliate_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "targets_select" ON public.affiliate_targets
  FOR SELECT TO authenticated
  USING (is_superadmin(auth.uid()) OR affiliate_id = auth.uid());

CREATE POLICY "targets_superadmin_write" ON public.affiliate_targets
  FOR ALL TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

CREATE TRIGGER trg_targets_updated_at
  BEFORE UPDATE ON public.affiliate_targets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 5. affiliate_onboarding_taken
-- ============================================================
CREATE TABLE IF NOT EXISTS public.affiliate_onboarding_taken (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  taak_key text NOT NULL,
  label text NOT NULL,
  voltooid_op timestamptz,
  volgorde int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (affiliate_id, taak_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_onboarding_taken TO authenticated;
GRANT ALL ON public.affiliate_onboarding_taken TO service_role;
ALTER TABLE public.affiliate_onboarding_taken ENABLE ROW LEVEL SECURITY;

CREATE POLICY "onboarding_select_own" ON public.affiliate_onboarding_taken
  FOR SELECT TO authenticated
  USING (is_superadmin(auth.uid()) OR affiliate_id = auth.uid());

CREATE POLICY "onboarding_update_own" ON public.affiliate_onboarding_taken
  FOR UPDATE TO authenticated
  USING (is_superadmin(auth.uid()) OR affiliate_id = auth.uid())
  WITH CHECK (is_superadmin(auth.uid()) OR affiliate_id = auth.uid());

CREATE POLICY "onboarding_superadmin_write" ON public.affiliate_onboarding_taken
  FOR INSERT TO authenticated
  WITH CHECK (is_superadmin(auth.uid()));

CREATE POLICY "onboarding_superadmin_delete" ON public.affiliate_onboarding_taken
  FOR DELETE TO authenticated
  USING (is_superadmin(auth.uid()));

CREATE TRIGGER trg_onboarding_updated_at
  BEFORE UPDATE ON public.affiliate_onboarding_taken
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 6. Notificatie-trigger: nieuwe pool-lead
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_affiliates_nieuwe_pool_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user record;
BEGIN
  IF NEW.eigenaar_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  FOR v_user IN
    SELECT id FROM public.users WHERE rol = 'affiliate' AND status = 'actief'
  LOOP
    INSERT INTO public.notificaties (user_id, titel, bericht, type, entity_type, entity_id)
    VALUES (
      v_user.id,
      'Nieuwe lead in pool',
      format('%s is beschikbaar om te claimen', NEW.bedrijfsnaam),
      'affiliate_pool_lead',
      'affiliate_leads',
      NEW.id
    );
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_affiliates_pool_lead ON public.affiliate_leads;
CREATE TRIGGER trg_notify_affiliates_pool_lead
  AFTER INSERT ON public.affiliate_leads
  FOR EACH ROW EXECUTE FUNCTION public.notify_affiliates_nieuwe_pool_lead();

-- ============================================================
-- 7. Notificatie-trigger: commissie uitbetaald
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_affiliate_commissie_uitbetaald()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'uitbetaald' AND (OLD.status IS DISTINCT FROM 'uitbetaald') AND NEW.affiliate_id IS NOT NULL THEN
    INSERT INTO public.notificaties (user_id, titel, bericht, type, entity_type, entity_id)
    VALUES (
      NEW.affiliate_id,
      'Commissie uitbetaald',
      format('Je commissie van € %s is uitbetaald', to_char(NEW.bedrag, 'FM999G999D00')),
      'affiliate_commissie_uitbetaald',
      'affiliate_commissies',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_affiliate_commissie ON public.affiliate_commissies;
CREATE TRIGGER trg_notify_affiliate_commissie
  AFTER UPDATE ON public.affiliate_commissies
  FOR EACH ROW EXECUTE FUNCTION public.notify_affiliate_commissie_uitbetaald();

-- ============================================================
-- 8. Realtime publicatie
-- ============================================================
DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliate_leads';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliate_terugbel_afspraken';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 9. Indexen voor duplicate-check
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_affiliate_leads_email ON public.affiliate_leads (lower(email));
CREATE INDEX IF NOT EXISTS idx_affiliate_leads_telefoon ON public.affiliate_leads (telefoon);
