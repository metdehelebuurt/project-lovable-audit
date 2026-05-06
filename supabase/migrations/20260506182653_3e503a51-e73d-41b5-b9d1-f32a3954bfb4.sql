-- ENUMs
DO $$ BEGIN
  CREATE TYPE keuring_type AS ENUM ('zonnepanelen', 'thuisbatterij', 'combi');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE keuring_status AS ENUM ('gepland', 'in_uitvoering', 'afgerond', 'achterstallig', 'geannuleerd');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE keuring_resultaat AS ENUM ('goedgekeurd', 'goedgekeurd_met_opmerkingen', 'afgekeurd');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1. Hoofdtabel keuringen
CREATE TABLE IF NOT EXISTS public.keuringen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  keuringnummer text,
  type keuring_type NOT NULL,
  status keuring_status NOT NULL DEFAULT 'gepland',

  -- Koppelingen (alle optioneel, minstens één van klant_id of object_omschrijving)
  klant_id uuid,
  installatie_id uuid,
  object_omschrijving text,

  -- Adres voor losse keuringen (overschrijft klant adres)
  locatie_adres text,
  locatie_postcode text,
  locatie_plaats text,

  -- Planning
  geplande_datum date NOT NULL,
  uitgevoerd_op timestamptz,
  uitgevoerd_door_id uuid,

  -- Normenkader / context
  normenkader text[] NOT NULL DEFAULT ARRAY['NEN 1010', 'NEN 3140', 'Scope 12']::text[],
  uitgevoerd_door_naam text,
  uitgevoerd_door_certificering text,

  -- Resultaat
  resultaat keuring_resultaat,
  score_percentage numeric(5,2),
  conclusie text,
  aanbevelingen text,
  volgende_keuring_datum date,
  next_keuring_id uuid,

  -- Handtekeningen (base64 png) en PDF
  handtekening_monteur text,
  handtekening_klant text,
  handtekening_klant_naam text,
  pdf_url text,
  pdf_hash text,
  pdf_gegenereerd_op timestamptz,

  -- Notificaties
  herinnering_verstuurd_op timestamptz,

  -- Audit
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_keuringen_partner ON public.keuringen(partner_id);
CREATE INDEX IF NOT EXISTS idx_keuringen_klant ON public.keuringen(klant_id);
CREATE INDEX IF NOT EXISTS idx_keuringen_installatie ON public.keuringen(installatie_id);
CREATE INDEX IF NOT EXISTS idx_keuringen_status ON public.keuringen(status);
CREATE INDEX IF NOT EXISTS idx_keuringen_geplande_datum ON public.keuringen(geplande_datum);
CREATE INDEX IF NOT EXISTS idx_keuringen_uitgevoerd_door ON public.keuringen(uitgevoerd_door_id);

-- 2. Checklist items
CREATE TABLE IF NOT EXISTS public.keuring_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keuring_id uuid NOT NULL REFERENCES public.keuringen(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL,
  categorie text NOT NULL,
  label text NOT NULL,
  norm_referentie text,
  blokkerend boolean NOT NULL DEFAULT false,
  volgorde int NOT NULL DEFAULT 0,
  -- Antwoord
  antwoord text CHECK (antwoord IN ('ok','nok','nvt') OR antwoord IS NULL),
  opmerking text,
  foto_pad text,
  meetwaarde text,
  beoordeeld_op timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_keuring_checklist_keuring ON public.keuring_checklist_items(keuring_id);

-- 3. PDF versies
CREATE TABLE IF NOT EXISTS public.keuring_pdf_versies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keuring_id uuid NOT NULL REFERENCES public.keuringen(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL,
  versie int NOT NULL,
  pdf_path text NOT NULL,
  pdf_hash text,
  bestandsgrootte int,
  gegenereerd_door uuid,
  reden text,
  status_op_moment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_keuring_pdf_keuring ON public.keuring_pdf_versies(keuring_id);

-- 4. Templates per partner per type
CREATE TABLE IF NOT EXISTS public.keuring_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  type keuring_type NOT NULL,
  naam text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  -- JSONB array: [{ categorie, items: [{ label, norm_referentie, blokkerend }] }]
  structuur jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_id, type, naam)
);

-- 5. Intervallen per partner per type (in maanden)
CREATE TABLE IF NOT EXISTS public.keuring_intervallen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  type keuring_type NOT NULL,
  interval_maanden int NOT NULL DEFAULT 12,
  herinner_dagen_vooraf int NOT NULL DEFAULT 30,
  auto_volgende boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_id, type)
);

-- updated_at triggers
CREATE TRIGGER trg_keuringen_updated_at
  BEFORE UPDATE ON public.keuringen
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_keuring_templates_updated_at
  BEFORE UPDATE ON public.keuring_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_keuring_intervallen_updated_at
  BEFORE UPDATE ON public.keuring_intervallen
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= Numbering =============
CREATE OR REPLACE FUNCTION public.generate_keuringnummer(_partner_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _year text;
  _count integer;
BEGIN
  _year := to_char(now(), 'YYYY');
  SELECT COUNT(*) + 1 INTO _count
  FROM public.keuringen
  WHERE partner_id = _partner_id
    AND extract(year from created_at) = extract(year from now());
  RETURN 'KEU-' || _year || '-' || lpad(_count::text, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.set_keuringnummer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.keuringnummer IS NULL OR NEW.keuringnummer = '' THEN
    NEW.keuringnummer := public.generate_keuringnummer(NEW.partner_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_keuringnummer
  BEFORE INSERT ON public.keuringen
  FOR EACH ROW EXECUTE FUNCTION public.set_keuringnummer();

-- ============= Auto-volgende keuring bij afronden =============
CREATE OR REPLACE FUNCTION public.plan_volgende_keuring()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_interval_m int;
  v_auto boolean;
  v_next_id uuid;
  v_next_datum date;
BEGIN
  IF NEW.status::text <> 'afgerond' OR OLD.status::text = 'afgerond' THEN
    RETURN NEW;
  END IF;
  IF NEW.next_keuring_id IS NOT NULL THEN
    RETURN NEW; -- al gepland
  END IF;

  SELECT interval_maanden, auto_volgende
    INTO v_interval_m, v_auto
  FROM public.keuring_intervallen
  WHERE partner_id = NEW.partner_id AND type = NEW.type
  LIMIT 1;

  IF v_interval_m IS NULL THEN
    v_interval_m := CASE NEW.type
      WHEN 'zonnepanelen' THEN 48  -- Scope 12: 4 jaar
      WHEN 'thuisbatterij' THEN 12
      ELSE 12
    END;
    v_auto := true;
  END IF;

  IF v_auto IS DISTINCT FROM true THEN
    RETURN NEW;
  END IF;

  v_next_datum := COALESCE(NEW.uitgevoerd_op::date, CURRENT_DATE) + (v_interval_m || ' months')::interval;

  INSERT INTO public.keuringen (
    partner_id, type, status, klant_id, installatie_id, object_omschrijving,
    locatie_adres, locatie_postcode, locatie_plaats,
    geplande_datum, normenkader, created_by
  ) VALUES (
    NEW.partner_id, NEW.type, 'gepland', NEW.klant_id, NEW.installatie_id, NEW.object_omschrijving,
    NEW.locatie_adres, NEW.locatie_postcode, NEW.locatie_plaats,
    v_next_datum, NEW.normenkader, NEW.uitgevoerd_door_id
  ) RETURNING id INTO v_next_id;

  NEW.next_keuring_id := v_next_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_plan_volgende_keuring
  BEFORE UPDATE OF status ON public.keuringen
  FOR EACH ROW EXECUTE FUNCTION public.plan_volgende_keuring();

-- ============= RLS =============
ALTER TABLE public.keuringen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keuring_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keuring_pdf_versies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keuring_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keuring_intervallen ENABLE ROW LEVEL SECURITY;

-- keuringen
CREATE POLICY "Partner medewerkers zien eigen keuringen"
ON public.keuringen FOR SELECT
USING (
  is_superadmin(auth.uid())
  OR (
    partner_id = get_user_partner_id(auth.uid())
    AND (
      get_user_role(auth.uid()) <> 'installateur'::app_role
      OR uitgevoerd_door_id = auth.uid()
    )
  )
);

CREATE POLICY "Partner admin/staff/adviseur beheren keuringen"
ON public.keuringen FOR ALL
USING (
  is_superadmin(auth.uid())
  OR (
    partner_id = get_user_partner_id(auth.uid())
    AND get_user_role(auth.uid()) = ANY(ARRAY['partner_admin'::app_role, 'partner_staff'::app_role, 'adviseur'::app_role, 'backoffice'::app_role])
  )
)
WITH CHECK (
  is_superadmin(auth.uid())
  OR (
    partner_id = get_user_partner_id(auth.uid())
    AND get_user_role(auth.uid()) = ANY(ARRAY['partner_admin'::app_role, 'partner_staff'::app_role, 'adviseur'::app_role, 'backoffice'::app_role])
  )
);

CREATE POLICY "Installateur werkt eigen keuring bij"
ON public.keuringen FOR UPDATE
USING (
  partner_id = get_user_partner_id(auth.uid())
  AND uitgevoerd_door_id = auth.uid()
)
WITH CHECK (
  partner_id = get_user_partner_id(auth.uid())
  AND uitgevoerd_door_id = auth.uid()
);

-- checklist items
CREATE POLICY "Partner medewerkers lezen checklist items"
ON public.keuring_checklist_items FOR SELECT
USING (
  is_superadmin(auth.uid())
  OR partner_id = get_user_partner_id(auth.uid())
);

CREATE POLICY "Partner medewerkers beheren checklist items"
ON public.keuring_checklist_items FOR ALL
USING (
  is_superadmin(auth.uid())
  OR partner_id = get_user_partner_id(auth.uid())
)
WITH CHECK (
  is_superadmin(auth.uid())
  OR partner_id = get_user_partner_id(auth.uid())
);

-- pdf versies
CREATE POLICY "Partner lezen pdf versies"
ON public.keuring_pdf_versies FOR SELECT
USING (
  is_superadmin(auth.uid())
  OR partner_id = get_user_partner_id(auth.uid())
);

CREATE POLICY "Partner schrijven pdf versies"
ON public.keuring_pdf_versies FOR INSERT
WITH CHECK (
  is_superadmin(auth.uid())
  OR partner_id = get_user_partner_id(auth.uid())
);

-- templates
CREATE POLICY "Partner medewerkers lezen templates"
ON public.keuring_templates FOR SELECT
USING (
  is_superadmin(auth.uid())
  OR partner_id = get_user_partner_id(auth.uid())
);

CREATE POLICY "Partner admin beheert templates"
ON public.keuring_templates FOR ALL
USING (
  is_superadmin(auth.uid())
  OR (
    partner_id = get_user_partner_id(auth.uid())
    AND is_partner_admin_or_higher(auth.uid())
  )
)
WITH CHECK (
  is_superadmin(auth.uid())
  OR (
    partner_id = get_user_partner_id(auth.uid())
    AND is_partner_admin_or_higher(auth.uid())
  )
);

-- intervallen
CREATE POLICY "Partner medewerkers lezen intervallen"
ON public.keuring_intervallen FOR SELECT
USING (
  is_superadmin(auth.uid())
  OR partner_id = get_user_partner_id(auth.uid())
);

CREATE POLICY "Partner admin beheert intervallen"
ON public.keuring_intervallen FOR ALL
USING (
  is_superadmin(auth.uid())
  OR (
    partner_id = get_user_partner_id(auth.uid())
    AND is_partner_admin_or_higher(auth.uid())
  )
)
WITH CHECK (
  is_superadmin(auth.uid())
  OR (
    partner_id = get_user_partner_id(auth.uid())
    AND is_partner_admin_or_higher(auth.uid())
  )
);

-- ============= Storage bucket =============
INSERT INTO storage.buckets (id, name, public)
VALUES ('keuring-bijlagen', 'keuring-bijlagen', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Partner leest eigen keuring bijlagen"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'keuring-bijlagen'
  AND (
    is_superadmin(auth.uid())
    OR (storage.foldername(name))[1] = get_user_partner_id(auth.uid())::text
  )
);

CREATE POLICY "Partner upload eigen keuring bijlagen"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'keuring-bijlagen'
  AND (
    is_superadmin(auth.uid())
    OR (storage.foldername(name))[1] = get_user_partner_id(auth.uid())::text
  )
);

CREATE POLICY "Partner verwijdert eigen keuring bijlagen"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'keuring-bijlagen'
  AND (
    is_superadmin(auth.uid())
    OR (storage.foldername(name))[1] = get_user_partner_id(auth.uid())::text
  )
);