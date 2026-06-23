
ALTER TABLE public.pipeline_configuraties
  ADD COLUMN IF NOT EXISTS vereist_volgende_actie boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sla_dagen integer;

UPDATE public.pipeline_configuraties SET vereist_volgende_actie = false WHERE is_eindfase = true;

CREATE TABLE IF NOT EXISTS public.lead_bronnen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  categorie text NOT NULL DEFAULT 'overig',
  kleur text NOT NULL DEFAULT 'slate',
  actief boolean NOT NULL DEFAULT true,
  default_temperatuur lead_temperatuur DEFAULT 'koud',
  score_gewicht integer NOT NULL DEFAULT 0,
  volgorde integer NOT NULL DEFAULT 100,
  eigenaar_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_bronnen TO authenticated;
GRANT ALL ON public.lead_bronnen TO service_role;

ALTER TABLE public.lead_bronnen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Iedereen kan lead_bronnen lezen"
  ON public.lead_bronnen FOR SELECT TO authenticated USING (true);

CREATE POLICY "Superadmin beheert lead_bronnen"
  ON public.lead_bronnen FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

INSERT INTO public.lead_bronnen (slug, label, categorie, kleur, default_temperatuur, score_gewicht, volgorde) VALUES
  ('platform_pool', 'Platform pool', 'import', 'slate', 'koud', 5, 10),
  ('eigen_import', 'Eigen import', 'import', 'cyan', 'koud', 10, 20),
  ('referral_klik', 'Referral / klik', 'referral', 'emerald', 'lauw', 25, 30),
  ('sales_admin', 'Sales admin (handmatig)', 'outbound', 'violet', 'lauw', 15, 40),
  ('inbound_formulier', 'Inbound formulier', 'inbound', 'amber', 'warm', 30, 50),
  ('ai_scrape', 'AI-scrape', 'ai', 'fuchsia', 'koud', 8, 60)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.affiliate_leads
  ADD COLUMN IF NOT EXISTS lead_score_basis integer,
  ADD COLUMN IF NOT EXISTS lead_score_basis_details jsonb,
  ADD COLUMN IF NOT EXISTS bron_id uuid REFERENCES public.lead_bronnen(id) ON DELETE SET NULL;

UPDATE public.affiliate_leads l
  SET bron_id = b.id
  FROM public.lead_bronnen b
  WHERE l.bron_id IS NULL AND b.slug = l.bron::text;

CREATE INDEX IF NOT EXISTS idx_affiliate_leads_bron_id ON public.affiliate_leads(bron_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_leads_score ON public.affiliate_leads(lead_score_basis);

CREATE TABLE IF NOT EXISTS public.sales_snippets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eigenaar_id uuid NOT NULL DEFAULT auth.uid(),
  kanaal text NOT NULL CHECK (kanaal IN ('email','whatsapp','sms')),
  temperatuur lead_temperatuur,
  titel text NOT NULL,
  onderwerp text,
  body text NOT NULL,
  volgorde integer NOT NULL DEFAULT 100,
  actief boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_snippets TO authenticated;
GRANT ALL ON public.sales_snippets TO service_role;

ALTER TABLE public.sales_snippets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Eigenaar of superadmin leest snippets"
  ON public.sales_snippets FOR SELECT TO authenticated
  USING (eigenaar_id = auth.uid() OR public.is_superadmin(auth.uid()));

CREATE POLICY "Eigenaar of superadmin beheert snippets"
  ON public.sales_snippets FOR ALL TO authenticated
  USING (eigenaar_id = auth.uid() OR public.is_superadmin(auth.uid()))
  WITH CHECK (eigenaar_id = auth.uid() OR public.is_superadmin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_sales_snippets_eigenaar ON public.sales_snippets(eigenaar_id);

CREATE OR REPLACE FUNCTION public.calc_lead_score_basis()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_bron_gewicht int := 0;
  v_compleet int := 0;
  v_temp_score int := 0;
  v_stil_dagen int;
  v_score int;
BEGIN
  IF NEW.bron_id IS NOT NULL THEN
    SELECT COALESCE(score_gewicht, 0) INTO v_bron_gewicht FROM public.lead_bronnen WHERE id = NEW.bron_id;
  END IF;
  IF NEW.email IS NOT NULL AND length(NEW.email) > 3 THEN v_compleet := v_compleet + 10; END IF;
  IF NEW.telefoon IS NOT NULL AND length(NEW.telefoon) > 5 THEN v_compleet := v_compleet + 10; END IF;
  IF NEW.website IS NOT NULL AND length(NEW.website) > 3 THEN v_compleet := v_compleet + 5; END IF;
  IF NEW.contactpersoon IS NOT NULL AND length(NEW.contactpersoon) > 1 THEN v_compleet := v_compleet + 5; END IF;
  v_temp_score := CASE NEW.temperatuur
    WHEN 'heet' THEN 30 WHEN 'warm' THEN 20 WHEN 'lauw' THEN 10 ELSE 0
  END;
  v_stil_dagen := GREATEST(0, EXTRACT(DAY FROM (now() - COALESCE(NEW.updated_at, NEW.created_at, now())))::int);
  v_score := LEAST(100, GREATEST(0, v_bron_gewicht + v_compleet + v_temp_score - LEAST(20, v_stil_dagen)));
  NEW.lead_score_basis := v_score;
  NEW.lead_score_basis_details := jsonb_build_object(
    'bron_gewicht', v_bron_gewicht,
    'compleetheid', v_compleet,
    'temperatuur', v_temp_score,
    'stil_dagen', v_stil_dagen,
    'berekend_op', now()
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_calc_lead_score_basis ON public.affiliate_leads;
CREATE TRIGGER trg_calc_lead_score_basis
  BEFORE INSERT OR UPDATE OF email, telefoon, website, contactpersoon, temperatuur, bron_id
  ON public.affiliate_leads
  FOR EACH ROW EXECUTE FUNCTION public.calc_lead_score_basis();

UPDATE public.affiliate_leads SET updated_at = updated_at WHERE lead_score_basis IS NULL;

CREATE OR REPLACE FUNCTION public.sync_volgende_actie()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.volgende_actie_op IS DISTINCT FROM OLD.volgende_actie_op THEN
      NEW.volgende_actie_datum := CASE WHEN NEW.volgende_actie_op IS NULL THEN NULL ELSE NEW.volgende_actie_op::date END;
    ELSIF NEW.volgende_actie_datum IS DISTINCT FROM OLD.volgende_actie_datum AND NEW.volgende_actie_op = OLD.volgende_actie_op THEN
      NEW.volgende_actie_op := CASE WHEN NEW.volgende_actie_datum IS NULL THEN NULL ELSE (NEW.volgende_actie_datum::timestamptz + interval '9 hours') END;
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    IF NEW.volgende_actie_op IS NOT NULL AND NEW.volgende_actie_datum IS NULL THEN
      NEW.volgende_actie_datum := NEW.volgende_actie_op::date;
    ELSIF NEW.volgende_actie_datum IS NOT NULL AND NEW.volgende_actie_op IS NULL THEN
      NEW.volgende_actie_op := NEW.volgende_actie_datum::timestamptz + interval '9 hours';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_volgende_actie ON public.affiliate_leads;
CREATE TRIGGER trg_sync_volgende_actie
  BEFORE INSERT OR UPDATE OF volgende_actie_op, volgende_actie_datum
  ON public.affiliate_leads
  FOR EACH ROW EXECUTE FUNCTION public.sync_volgende_actie();

CREATE OR REPLACE FUNCTION public.update_lead_fase(_lead_id uuid, _fase_slug text)
RETURNS public.affiliate_leads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.affiliate_leads;
  v_eigenaar uuid;
  v_fase public.pipeline_configuraties;
BEGIN
  SELECT * INTO v_lead FROM public.affiliate_leads WHERE id = _lead_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead niet gevonden'; END IF;
  v_eigenaar := COALESCE(v_lead.eigenaar_id, v_lead.toegewezen_door_admin_id, v_lead.created_by, auth.uid());
  SELECT * INTO v_fase FROM public.pipeline_configuraties
    WHERE user_id = v_eigenaar AND fase_key = _fase_slug LIMIT 1;
  IF NOT FOUND THEN
    SELECT * INTO v_fase FROM public.pipeline_configuraties
      WHERE user_id = auth.uid() AND fase_key = _fase_slug LIMIT 1;
  END IF;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Onbekende fase: %', _fase_slug;
  END IF;
  IF COALESCE(v_fase.vereist_volgende_actie, false) AND NOT COALESCE(v_fase.is_eindfase, false) THEN
    IF v_lead.volgende_actie_op IS NULL OR v_lead.volgende_actie_op < now() THEN
      RAISE EXCEPTION 'volgende_actie_verplicht: De fase "%" vereist een toekomstige volgende-actie.', v_fase.label
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  UPDATE public.affiliate_leads SET fase_slug = _fase_slug, updated_at = now()
    WHERE id = _lead_id RETURNING * INTO v_lead;
  RETURN v_lead;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_lead_fase(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_touch_lead_bronnen ON public.lead_bronnen;
CREATE TRIGGER trg_touch_lead_bronnen BEFORE UPDATE ON public.lead_bronnen
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_touch_sales_snippets ON public.sales_snippets;
CREATE TRIGGER trg_touch_sales_snippets BEFORE UPDATE ON public.sales_snippets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
