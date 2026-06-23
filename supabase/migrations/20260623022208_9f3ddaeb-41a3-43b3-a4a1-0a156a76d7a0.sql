
-- 1) Temperatuur enum
DO $$ BEGIN
  CREATE TYPE public.lead_temperatuur AS ENUM ('koud','lauw','warm','heet');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Nieuwe kolommen op affiliate_leads
ALTER TABLE public.affiliate_leads
  ADD COLUMN IF NOT EXISTS temperatuur public.lead_temperatuur NOT NULL DEFAULT 'koud',
  ADD COLUMN IF NOT EXISTS volgende_actie_op timestamptz,
  ADD COLUMN IF NOT EXISTS fase_slug text;

-- 3) Backfill van bestaande sales_fase enum naar nieuwe velden
UPDATE public.affiliate_leads
   SET fase_slug = CASE sales_fase::text
                     WHEN 'koud'           THEN 'nieuw'
                     WHEN 'benaderd'       THEN 'benaderd'
                     WHEN 'warm'           THEN 'benaderd'
                     WHEN 'gekwalificeerd' THEN 'gekwalificeerd'
                     WHEN 'doorgezet'      THEN 'gekwalificeerd'
                     WHEN 'gewonnen'       THEN 'gewonnen'
                     WHEN 'verloren'       THEN 'verloren'
                     ELSE 'nieuw'
                   END,
       temperatuur = CASE sales_fase::text
                       WHEN 'koud'     THEN 'koud'::public.lead_temperatuur
                       WHEN 'warm'     THEN 'warm'::public.lead_temperatuur
                       WHEN 'gewonnen' THEN 'heet'::public.lead_temperatuur
                       WHEN 'verloren' THEN 'koud'::public.lead_temperatuur
                       ELSE 'lauw'::public.lead_temperatuur
                     END
 WHERE fase_slug IS NULL;

ALTER TABLE public.affiliate_leads
  ALTER COLUMN fase_slug SET DEFAULT 'nieuw',
  ALTER COLUMN fase_slug SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_affiliate_leads_fase_slug ON public.affiliate_leads(fase_slug);
CREATE INDEX IF NOT EXISTS idx_affiliate_leads_temperatuur ON public.affiliate_leads(temperatuur);
CREATE INDEX IF NOT EXISTS idx_affiliate_leads_volgende_actie ON public.affiliate_leads(volgende_actie_op);

-- 4) Pipeline-configuratie per gebruiker
CREATE TABLE IF NOT EXISTS public.pipeline_configuraties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  fase_key text NOT NULL,
  label text NOT NULL,
  kleur text NOT NULL DEFAULT 'slate',
  volgorde int NOT NULL DEFAULT 0,
  is_eindfase boolean NOT NULL DEFAULT false,
  is_won boolean NOT NULL DEFAULT false,
  default_temperatuur public.lead_temperatuur,
  zichtbaar boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, fase_key)
);

CREATE INDEX IF NOT EXISTS idx_pipeline_config_user_volgorde
  ON public.pipeline_configuraties(user_id, volgorde);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_configuraties TO authenticated;
GRANT ALL ON public.pipeline_configuraties TO service_role;

ALTER TABLE public.pipeline_configuraties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Eigen pipeline beheren" ON public.pipeline_configuraties;
CREATE POLICY "Eigen pipeline beheren"
  ON public.pipeline_configuraties
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR public.is_superadmin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_superadmin(auth.uid()));

CREATE OR REPLACE FUNCTION public.update_pipeline_configuraties_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_pipeline_configuraties_updated_at ON public.pipeline_configuraties;
CREATE TRIGGER trg_pipeline_configuraties_updated_at
  BEFORE UPDATE ON public.pipeline_configuraties
  FOR EACH ROW EXECUTE FUNCTION public.update_pipeline_configuraties_updated_at();

-- 5) Seed-functie voor default pipeline
CREATE OR REPLACE FUNCTION public.seed_default_pipeline(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.pipeline_configuraties (user_id, fase_key, label, kleur, volgorde, is_eindfase, is_won, default_temperatuur)
  VALUES
    (_user_id, 'nieuw',          'Nieuw',          'slate',   10, false, false, 'koud'),
    (_user_id, 'benaderd',       'Benaderd',       'blue',    20, false, false, 'lauw'),
    (_user_id, 'gekwalificeerd', 'Gekwalificeerd', 'violet',  30, false, false, 'warm'),
    (_user_id, 'voorstel',       'Voorstel',       'amber',   40, false, false, 'warm'),
    (_user_id, 'onderhandeling', 'Onderhandeling', 'orange',  50, false, false, 'heet'),
    (_user_id, 'gewonnen',       'Gewonnen',       'emerald', 60, true,  true,  'heet'),
    (_user_id, 'verloren',       'Verloren',       'rose',    70, true,  false, 'koud')
  ON CONFLICT (user_id, fase_key) DO NOTHING;
END $$;

REVOKE ALL ON FUNCTION public.seed_default_pipeline(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.seed_default_pipeline(uuid) TO authenticated;

-- 6) RPC: huidige pipeline ophalen (seed indien nodig)
CREATE OR REPLACE FUNCTION public.get_my_pipeline()
RETURNS SETOF public.pipeline_configuraties
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_count int;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'niet ingelogd'; END IF;
  SELECT count(*) INTO v_count FROM public.pipeline_configuraties WHERE user_id = v_uid;
  IF v_count = 0 THEN PERFORM public.seed_default_pipeline(v_uid); END IF;
  RETURN QUERY
    SELECT * FROM public.pipeline_configuraties
     WHERE user_id = v_uid
     ORDER BY volgorde ASC, created_at ASC;
END $$;

REVOKE ALL ON FUNCTION public.get_my_pipeline() FROM public;
GRANT EXECUTE ON FUNCTION public.get_my_pipeline() TO authenticated;

-- 7) Uitgebreide doorzet-RPC met temperatuur + volgende actie
CREATE OR REPLACE FUNCTION public.admin_doorzetten_naar_affiliate_v2(
  _lead_id uuid,
  _affiliate_id uuid,
  _notitie text DEFAULT NULL,
  _temperatuur public.lead_temperatuur DEFAULT NULL,
  _volgende_actie_op timestamptz DEFAULT NULL
) RETURNS public.affiliate_leads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.affiliate_leads;
BEGIN
  IF NOT public.is_superadmin(v_uid) THEN
    RAISE EXCEPTION 'alleen platformbeheerder mag leads doorzetten';
  END IF;

  UPDATE public.affiliate_leads
     SET eigenaar_id = _affiliate_id,
         claimed_at = CASE WHEN _affiliate_id IS NOT NULL THEN now() ELSE NULL END,
         sales_fase = 'doorgezet',
         fase_slug = COALESCE(fase_slug, 'benaderd'),
         temperatuur = COALESCE(_temperatuur, temperatuur),
         volgende_actie_op = COALESCE(_volgende_actie_op, volgende_actie_op),
         doorgezet_op = now(),
         toegewezen_door_admin_id = v_uid,
         status = COALESCE(status, 'nieuw'::affiliate_lead_status),
         updated_at = now()
   WHERE id = _lead_id
   RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN RAISE EXCEPTION 'lead niet gevonden'; END IF;

  IF _notitie IS NOT NULL AND length(trim(_notitie)) > 0 THEN
    INSERT INTO public.affiliate_lead_contactmomenten (lead_id, user_id, type, notitie)
    VALUES (_lead_id, v_uid, 'notitie', _notitie);
  END IF;

  RETURN v_row;
END $$;

REVOKE ALL ON FUNCTION public.admin_doorzetten_naar_affiliate_v2(uuid, uuid, text, public.lead_temperatuur, timestamptz) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_doorzetten_naar_affiliate_v2(uuid, uuid, text, public.lead_temperatuur, timestamptz) TO authenticated;

-- 8) RPC: lead-fase updaten met validatie tegen pipeline van eigenaar (of zelf bij geen eigenaar)
CREATE OR REPLACE FUNCTION public.update_lead_fase(_lead_id uuid, _fase_slug text)
RETURNS public.affiliate_leads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_exists boolean;
  v_row public.affiliate_leads;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'niet ingelogd'; END IF;
  SELECT eigenaar_id INTO v_owner FROM public.affiliate_leads WHERE id = _lead_id;
  IF v_owner IS NULL THEN v_owner := v_uid; END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.pipeline_configuraties
     WHERE user_id = v_owner AND fase_key = _fase_slug
  ) INTO v_exists;

  IF NOT v_exists THEN
    -- seed default pipeline voor eigenaar en hercheck
    PERFORM public.seed_default_pipeline(v_owner);
    SELECT EXISTS(
      SELECT 1 FROM public.pipeline_configuraties
       WHERE user_id = v_owner AND fase_key = _fase_slug
    ) INTO v_exists;
    IF NOT v_exists THEN
      RAISE EXCEPTION 'fase % bestaat niet in pipeline van eigenaar', _fase_slug;
    END IF;
  END IF;

  UPDATE public.affiliate_leads
     SET fase_slug = _fase_slug, updated_at = now()
   WHERE id = _lead_id
   RETURNING * INTO v_row;

  RETURN v_row;
END $$;

REVOKE ALL ON FUNCTION public.update_lead_fase(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.update_lead_fase(uuid, text) TO authenticated;
