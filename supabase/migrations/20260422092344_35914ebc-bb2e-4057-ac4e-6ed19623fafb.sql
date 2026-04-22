
-- ============ 1. nummerreeks_config ============
CREATE TABLE IF NOT EXISTS public.nummerreeks_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  type text NOT NULL,
  subtype text NOT NULL DEFAULT 'regulier',
  prefix text NOT NULL DEFAULT 'VF',
  jaarformaat text NOT NULL DEFAULT 'YYYY',
  padding integer NOT NULL DEFAULT 4 CHECK (padding BETWEEN 1 AND 8),
  volgende_nummer integer NOT NULL DEFAULT 1 CHECK (volgende_nummer >= 1),
  reset_per_jaar boolean NOT NULL DEFAULT true,
  huidig_jaar integer NOT NULL DEFAULT extract(year from now())::integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_id, type, subtype)
);

CREATE INDEX IF NOT EXISTS idx_nummerreeks_partner ON public.nummerreeks_config(partner_id);

ALTER TABLE public.nummerreeks_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leden lezen reeks" ON public.nummerreeks_config FOR SELECT
USING (partner_id = public.get_user_partner_id(auth.uid()) OR public.is_superadmin(auth.uid()));

CREATE POLICY "admin beheert reeks" ON public.nummerreeks_config FOR ALL
USING (
  (partner_id = public.get_user_partner_id(auth.uid()) AND public.is_partner_admin_or_higher(auth.uid()))
  OR public.is_superadmin(auth.uid())
)
WITH CHECK (
  (partner_id = public.get_user_partner_id(auth.uid()) AND public.is_partner_admin_or_higher(auth.uid()))
  OR public.is_superadmin(auth.uid())
);

CREATE TRIGGER trg_nummerreeks_updated
  BEFORE UPDATE ON public.nummerreeks_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 2. Initialiseer reeksen vanuit bestaande facturen ============
WITH base AS (
  SELECT
    fd.partner_id,
    fd.type::text AS type,
    CASE WHEN fd.type::text = 'verkoopfactuur' AND fd.factuur_subtype = 'voorschot' THEN 'voorschot' ELSE 'regulier' END AS subtype,
    CASE
      WHEN fd.documentnummer ~ '\d+$' THEN (regexp_match(fd.documentnummer, '(\d+)$'))[1]::int
      ELSE 0
    END AS num
  FROM public.financiele_documenten fd
  WHERE extract(year from fd.created_at)::int = extract(year from now())::int
),
agg AS (
  SELECT partner_id, type, subtype, MAX(num) AS max_num
  FROM base
  GROUP BY partner_id, type, subtype
)
INSERT INTO public.nummerreeks_config (partner_id, type, subtype, prefix, volgende_nummer, huidig_jaar)
SELECT
  agg.partner_id,
  agg.type,
  agg.subtype,
  CASE
    WHEN agg.type = 'verkoopfactuur' AND agg.subtype = 'voorschot' THEN 'VS'
    WHEN agg.type = 'verkoopfactuur' THEN 'VF'
    WHEN agg.type = 'creditnota' THEN 'CN'
    WHEN agg.type = 'inkoopfactuur' THEN 'IF'
    WHEN agg.type = 'inkooporder' THEN 'IO'
    WHEN agg.type = 'pakbon' THEN 'PB'
    ELSE upper(left(agg.type,2))
  END,
  COALESCE(agg.max_num, 0) + 1,
  extract(year from now())::int
FROM agg
ON CONFLICT (partner_id, type, subtype) DO NOTHING;

-- ============ 3. Atomic nummer-generator ============
CREATE OR REPLACE FUNCTION public.generate_documentnummer_v2(
  _partner_id uuid,
  _type text,
  _subtype text DEFAULT 'regulier'
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _cfg public.nummerreeks_config%ROWTYPE;
  _default_prefix text;
  _huidig_jaar int := extract(year from now())::int;
  _nummer int;
  _jaar_str text;
BEGIN
  _default_prefix := CASE
    WHEN _type = 'verkoopfactuur' AND _subtype = 'voorschot' THEN 'VS'
    WHEN _type = 'verkoopfactuur' THEN 'VF'
    WHEN _type = 'creditnota' THEN 'CN'
    WHEN _type = 'inkoopfactuur' THEN 'IF'
    WHEN _type = 'inkooporder' THEN 'IO'
    WHEN _type = 'pakbon' THEN 'PB'
    ELSE upper(left(_type,2))
  END;

  INSERT INTO public.nummerreeks_config (partner_id, type, subtype, prefix, huidig_jaar)
  VALUES (_partner_id, _type, _subtype, _default_prefix, _huidig_jaar)
  ON CONFLICT (partner_id, type, subtype) DO NOTHING;

  -- Atomic claim: lees + reset + increment in één UPDATE, retourneer toegewezen nummer
  UPDATE public.nummerreeks_config
     SET volgende_nummer = CASE
           WHEN reset_per_jaar AND huidig_jaar < _huidig_jaar THEN 2
           ELSE volgende_nummer + 1
         END,
         huidig_jaar = CASE
           WHEN reset_per_jaar AND huidig_jaar < _huidig_jaar THEN _huidig_jaar
           ELSE huidig_jaar
         END,
         updated_at = now()
   WHERE partner_id = _partner_id AND type = _type AND subtype = _subtype
   RETURNING
     CASE
       WHEN reset_per_jaar AND huidig_jaar = _huidig_jaar AND volgende_nummer = 2 THEN 1
       ELSE volgende_nummer - 1
     END
   INTO _nummer;

  SELECT * INTO _cfg FROM public.nummerreeks_config
   WHERE partner_id = _partner_id AND type = _type AND subtype = _subtype;

  _jaar_str := CASE _cfg.jaarformaat
    WHEN 'YYYY' THEN to_char(now(), 'YYYY')
    WHEN 'YY' THEN to_char(now(), 'YY')
    ELSE NULL
  END;

  IF _jaar_str IS NULL THEN
    RETURN _cfg.prefix || '-' || lpad(_nummer::text, _cfg.padding, '0');
  ELSE
    RETURN _cfg.prefix || '-' || _jaar_str || '-' || lpad(_nummer::text, _cfg.padding, '0');
  END IF;
END;
$$;

-- ============ 4. UNIQUE constraint op (partner_id, documentnummer) ============
WITH duplicates AS (
  SELECT id, documentnummer, partner_id,
         row_number() OVER (PARTITION BY partner_id, documentnummer ORDER BY created_at) AS rn
  FROM public.financiele_documenten
)
UPDATE public.financiele_documenten fd
SET documentnummer = fd.documentnummer || '-DUP' || d.rn
FROM duplicates d
WHERE fd.id = d.id AND d.rn > 1;

ALTER TABLE public.financiele_documenten
  DROP CONSTRAINT IF EXISTS financiele_documenten_partner_documentnummer_uniek;
ALTER TABLE public.financiele_documenten
  ADD CONSTRAINT financiele_documenten_partner_documentnummer_uniek
  UNIQUE (partner_id, documentnummer);

-- ============ 5. factuur_historie ============
CREATE TABLE IF NOT EXISTS public.factuur_historie (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  financieel_document_id uuid NOT NULL REFERENCES public.financiele_documenten(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL,
  actor_id uuid,
  actie text NOT NULL,
  veld text,
  oude_waarde text,
  nieuwe_waarde text,
  notitie text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_factuur_historie_doc ON public.factuur_historie(financieel_document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_factuur_historie_partner ON public.factuur_historie(partner_id);

ALTER TABLE public.factuur_historie ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leden lezen historie" ON public.factuur_historie FOR SELECT
USING (partner_id = public.get_user_partner_id(auth.uid()) OR public.is_superadmin(auth.uid()));

-- ============ 6. Trigger: log wijzigingen ============
CREATE OR REPLACE FUNCTION public.log_factuur_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.factuur_historie (financieel_document_id, partner_id, actor_id, actie, nieuwe_waarde, metadata)
    VALUES (NEW.id, NEW.partner_id, COALESCE(v_actor, NEW.created_by), 'aangemaakt', NEW.documentnummer,
      jsonb_build_object('type', NEW.type, 'totaal', NEW.totaal_bedrag, 'status', NEW.status));
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.factuur_historie (financieel_document_id, partner_id, actor_id, actie, oude_waarde, metadata)
    VALUES (OLD.id, OLD.partner_id, v_actor, 'verwijderd', OLD.documentnummer,
      jsonb_build_object('status', OLD.status, 'totaal', OLD.totaal_bedrag));
    RETURN OLD;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.factuur_historie (financieel_document_id, partner_id, actor_id, actie, veld, oude_waarde, nieuwe_waarde)
    VALUES (NEW.id, NEW.partner_id, v_actor, 'status_gewijzigd', 'status', OLD.status::text, NEW.status::text);

    IF NEW.status::text = 'betaald' AND OLD.status::text <> 'betaald' THEN
      INSERT INTO public.factuur_historie (financieel_document_id, partner_id, actor_id, actie, metadata)
      VALUES (NEW.id, NEW.partner_id, v_actor, 'betaald_gemarkeerd',
        jsonb_build_object('betaald_op', NEW.betaald_op, 'via', NEW.betaald_via));
    END IF;

    IF NEW.status::text = 'verzonden' AND OLD.status::text <> 'verzonden' THEN
      INSERT INTO public.factuur_historie (financieel_document_id, partner_id, actor_id, actie)
      VALUES (NEW.id, NEW.partner_id, v_actor, 'verzonden');
    END IF;
  END IF;

  IF NEW.totaal_bedrag IS DISTINCT FROM OLD.totaal_bedrag THEN
    INSERT INTO public.factuur_historie (financieel_document_id, partner_id, actor_id, actie, veld, oude_waarde, nieuwe_waarde)
    VALUES (NEW.id, NEW.partner_id, v_actor, 'bewerkt', 'totaal_bedrag', OLD.totaal_bedrag::text, NEW.totaal_bedrag::text);
  END IF;

  IF NEW.factuurdatum IS DISTINCT FROM OLD.factuurdatum THEN
    INSERT INTO public.factuur_historie (financieel_document_id, partner_id, actor_id, actie, veld, oude_waarde, nieuwe_waarde)
    VALUES (NEW.id, NEW.partner_id, v_actor, 'bewerkt', 'factuurdatum', OLD.factuurdatum::text, NEW.factuurdatum::text);
  END IF;

  IF NEW.vervaldatum IS DISTINCT FROM OLD.vervaldatum THEN
    INSERT INTO public.factuur_historie (financieel_document_id, partner_id, actor_id, actie, veld, oude_waarde, nieuwe_waarde)
    VALUES (NEW.id, NEW.partner_id, v_actor, 'bewerkt', 'vervaldatum', OLD.vervaldatum::text, NEW.vervaldatum::text);
  END IF;

  IF NEW.regels::text IS DISTINCT FROM OLD.regels::text THEN
    INSERT INTO public.factuur_historie (financieel_document_id, partner_id, actor_id, actie, veld, notitie)
    VALUES (NEW.id, NEW.partner_id, v_actor, 'bewerkt', 'regels', 'Factuurregels gewijzigd');
  END IF;

  IF NEW.notities IS DISTINCT FROM OLD.notities THEN
    INSERT INTO public.factuur_historie (financieel_document_id, partner_id, actor_id, actie, veld)
    VALUES (NEW.id, NEW.partner_id, v_actor, 'bewerkt', 'notities');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_factuur_changes ON public.financiele_documenten;
CREATE TRIGGER trg_log_factuur_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.financiele_documenten
  FOR EACH ROW EXECUTE FUNCTION public.log_factuur_changes();
