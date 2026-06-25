-- 1. Enum uitbreiden met nieuwe statussen
ALTER TYPE public.affiliate_lead_status ADD VALUE IF NOT EXISTS 'nieuw_campagne';
ALTER TYPE public.affiliate_lead_status ADD VALUE IF NOT EXISTS 'nieuw_demo_voltooid';

-- 2. Pijplijn-configuratie tabel per partner
CREATE TABLE IF NOT EXISTS public.affiliate_pipeline_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  status_key text NOT NULL,
  label text NOT NULL,
  kleur text NOT NULL DEFAULT 'slate',
  volgorde integer NOT NULL DEFAULT 100,
  zichtbaar boolean NOT NULL DEFAULT true,
  is_systeem boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_id, status_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_pipeline_config TO authenticated;
GRANT ALL ON public.affiliate_pipeline_config TO service_role;

ALTER TABLE public.affiliate_pipeline_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leden lezen eigen partner pipeline config"
ON public.affiliate_pipeline_config FOR SELECT TO authenticated
USING (
  partner_id = public.get_user_partner_id(auth.uid())
  OR public.is_superadmin(auth.uid())
);

CREATE POLICY "Admin beheert partner pipeline config"
ON public.affiliate_pipeline_config FOR ALL TO authenticated
USING (
  public.is_superadmin(auth.uid())
  OR (
    partner_id = public.get_user_partner_id(auth.uid())
    AND public.get_user_role(auth.uid()) IN ('partner_admin', 'sales_manager')
  )
)
WITH CHECK (
  public.is_superadmin(auth.uid())
  OR (
    partner_id = public.get_user_partner_id(auth.uid())
    AND public.get_user_role(auth.uid()) IN ('partner_admin', 'sales_manager')
  )
);

CREATE TRIGGER trg_aff_pipeline_config_updated
BEFORE UPDATE ON public.affiliate_pipeline_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Seed-functie voor systeem-fases
CREATE OR REPLACE FUNCTION public.seed_affiliate_pipeline_config(_partner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.affiliate_pipeline_config (partner_id, status_key, label, kleur, volgorde, is_systeem)
  VALUES
    (_partner_id, 'nieuw',                'Nieuw - Koude leads',  'slate',   10,  true),
    (_partner_id, 'nieuw_campagne',       'Nieuw - Campagne',      'blue',    20,  true),
    (_partner_id, 'nieuw_demo_voltooid',  'Nieuw - Demo voltooid', 'emerald', 30,  true),
    (_partner_id, 'gebeld_geen_gehoor',   'Gebeld, geen gehoor',   'amber',   40,  true),
    (_partner_id, 'mail_gestuurd',        'Mail gestuurd',         'cyan',    50,  true),
    (_partner_id, 'terugbel_gepland',     'Terugbel gepland',      'violet',  60,  true),
    (_partner_id, 'gesprek_gepland',      'Gesprek gepland',       'blue',    70,  true),
    (_partner_id, 'demo_gepland',         'Demo gepland',          'fuchsia', 80,  true),
    (_partner_id, 'in_gesprek',           'In gesprek',            'teal',    90,  true),
    (_partner_id, 'voorstel_verstuurd',   'Voorstel verstuurd',    'orange',  100, true),
    (_partner_id, 'trial_gestart',        'Trial gestart',         'teal',    110, true),
    (_partner_id, 'gewonnen',             'Gewonnen',              'emerald', 120, true),
    (_partner_id, 'verloren',             'Verloren',              'rose',    130, true)
  ON CONFLICT (partner_id, status_key) DO NOTHING;
END;
$$;

-- Seed voor alle bestaande partners
DO $$
DECLARE p_id uuid;
BEGIN
  FOR p_id IN SELECT id FROM public.partners LOOP
    PERFORM public.seed_affiliate_pipeline_config(p_id);
  END LOOP;
END $$;

-- Trigger: bij nieuwe partner automatisch seeden
CREATE OR REPLACE FUNCTION public.trg_seed_partner_pipeline()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.seed_affiliate_pipeline_config(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seed_partner_pipeline_after_insert ON public.partners;
CREATE TRIGGER trg_seed_partner_pipeline_after_insert
AFTER INSERT ON public.partners
FOR EACH ROW EXECUTE FUNCTION public.trg_seed_partner_pipeline();

-- 4. Auto-trigger: demo afgehandeld → status nieuw_demo_voltooid
CREATE OR REPLACE FUNCTION public.trg_demo_voltooid_zet_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.type = 'demo'
     AND NEW.afgehandeld_op IS NOT NULL
     AND (OLD.afgehandeld_op IS NULL)
     AND NEW.lead_id IS NOT NULL THEN
    UPDATE public.affiliate_leads
    SET status = 'nieuw_demo_voltooid'::public.affiliate_lead_status
    WHERE id = NEW.lead_id
      AND status IN ('nieuw'::public.affiliate_lead_status,
                     'nieuw_campagne'::public.affiliate_lead_status,
                     'demo_gepland'::public.affiliate_lead_status,
                     'gebeld_geen_gehoor'::public.affiliate_lead_status,
                     'mail_gestuurd'::public.affiliate_lead_status);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_demo_voltooid_zet_status ON public.affiliate_terugbel_afspraken;
CREATE TRIGGER trg_demo_voltooid_zet_status
AFTER UPDATE ON public.affiliate_terugbel_afspraken
FOR EACH ROW EXECUTE FUNCTION public.trg_demo_voltooid_zet_status();
