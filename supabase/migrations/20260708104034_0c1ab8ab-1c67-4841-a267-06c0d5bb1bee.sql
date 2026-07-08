
CREATE TABLE IF NOT EXISTS public.sales_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  kleur TEXT,
  omschrijving TEXT,
  aangemaakt_door UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_tags TO authenticated;
GRANT ALL ON public.sales_tags TO service_role;

ALTER TABLE public.sales_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sales-tags zichtbaar voor geauthenticeerde gebruikers"
  ON public.sales_tags FOR SELECT TO authenticated USING (true);

CREATE POLICY "Sales-tags toevoegen voor sales-rollen"
  ON public.sales_tags FOR INSERT TO authenticated
  WITH CHECK (
    public.is_superadmin(auth.uid())
    OR public.user_has_role(auth.uid(), 'sales_manager')
  );
CREATE POLICY "Sales-tags wijzigen voor sales-rollen"
  ON public.sales_tags FOR UPDATE TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR public.user_has_role(auth.uid(), 'sales_manager')
  );
CREATE POLICY "Sales-tags verwijderen voor sales-rollen"
  ON public.sales_tags FOR DELETE TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR public.user_has_role(auth.uid(), 'sales_manager')
  );

CREATE OR REPLACE FUNCTION public.sales_tags_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_sales_tags_updated ON public.sales_tags;
CREATE TRIGGER trg_sales_tags_updated
  BEFORE UPDATE ON public.sales_tags
  FOR EACH ROW EXECUTE FUNCTION public.sales_tags_touch_updated_at();

INSERT INTO public.sales_tags (slug, label)
SELECT DISTINCT lower(btrim(t)), lower(btrim(t))
  FROM public.affiliate_leads, unnest(tags) AS t
 WHERE btrim(t) <> ''
ON CONFLICT (slug) DO NOTHING;

CREATE OR REPLACE FUNCTION public.mag_sales_tags_beheren(_uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_superadmin(_uid)
      OR public.user_has_role(_uid, 'sales_manager');
$$;

CREATE OR REPLACE FUNCTION public.sales_leads_tags_toevoegen(
  _lead_ids uuid[],
  _tags text[]
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_norm text[];
  v_count int;
BEGIN
  IF NOT public.mag_sales_tags_beheren(v_uid) THEN
    RAISE EXCEPTION 'geen rechten voor sales-tag beheer';
  END IF;
  SELECT array_agg(DISTINCT lower(btrim(t))) INTO v_norm
    FROM unnest(_tags) AS t WHERE btrim(t) <> '';
  IF v_norm IS NULL OR array_length(v_norm, 1) = 0 THEN
    RETURN 0;
  END IF;
  INSERT INTO public.sales_tags (slug, label, aangemaakt_door)
  SELECT s, s, v_uid FROM unnest(v_norm) AS s
  ON CONFLICT (slug) DO NOTHING;

  WITH bijgewerkt AS (
    UPDATE public.affiliate_leads l
       SET tags = (
         SELECT COALESCE(array_agg(DISTINCT x), '{}'::text[])
           FROM unnest(COALESCE(l.tags, '{}'::text[]) || v_norm) AS x
       ),
       updated_at = now()
     WHERE l.id = ANY(_lead_ids)
     RETURNING l.id
  )
  SELECT count(*) INTO v_count FROM bijgewerkt;
  RETURN v_count;
END; $$;

CREATE OR REPLACE FUNCTION public.sales_leads_tags_verwijderen(
  _lead_ids uuid[],
  _tags text[]
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_norm text[];
  v_count int;
BEGIN
  IF NOT public.mag_sales_tags_beheren(v_uid) THEN
    RAISE EXCEPTION 'geen rechten voor sales-tag beheer';
  END IF;
  SELECT array_agg(DISTINCT lower(btrim(t))) INTO v_norm
    FROM unnest(_tags) AS t WHERE btrim(t) <> '';
  IF v_norm IS NULL THEN RETURN 0; END IF;
  WITH bijgewerkt AS (
    UPDATE public.affiliate_leads l
       SET tags = COALESCE((
         SELECT array_agg(x) FROM unnest(l.tags) AS x WHERE NOT (x = ANY(v_norm))
       ), '{}'::text[]),
       updated_at = now()
     WHERE l.id = ANY(_lead_ids)
     RETURNING l.id
  )
  SELECT count(*) INTO v_count FROM bijgewerkt;
  RETURN v_count;
END; $$;

CREATE OR REPLACE FUNCTION public.sales_tag_hernoemen(
  _oud text,
  _nieuw text
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_oud text := lower(btrim(_oud));
  v_nieuw text := lower(btrim(_nieuw));
  v_count int;
BEGIN
  IF NOT public.mag_sales_tags_beheren(v_uid) THEN
    RAISE EXCEPTION 'geen rechten voor sales-tag beheer';
  END IF;
  IF v_oud = '' OR v_nieuw = '' THEN
    RAISE EXCEPTION 'oude en nieuwe naam zijn verplicht';
  END IF;
  IF v_oud = v_nieuw THEN RETURN 0; END IF;

  IF EXISTS (SELECT 1 FROM public.sales_tags WHERE slug = v_nieuw) THEN
    DELETE FROM public.sales_tags WHERE slug = v_oud;
  ELSE
    UPDATE public.sales_tags SET slug = v_nieuw, label = v_nieuw WHERE slug = v_oud;
    INSERT INTO public.sales_tags (slug, label, aangemaakt_door)
    VALUES (v_nieuw, v_nieuw, v_uid) ON CONFLICT (slug) DO NOTHING;
  END IF;

  WITH bijgewerkt AS (
    UPDATE public.affiliate_leads l
       SET tags = (
         SELECT COALESCE(array_agg(DISTINCT CASE WHEN x = v_oud THEN v_nieuw ELSE x END), '{}'::text[])
           FROM unnest(l.tags) AS x
       ),
       updated_at = now()
     WHERE v_oud = ANY(l.tags)
     RETURNING l.id
  )
  SELECT count(*) INTO v_count FROM bijgewerkt;
  RETURN v_count;
END; $$;

CREATE OR REPLACE FUNCTION public.sales_tag_verwijderen(
  _slug text,
  _ook_van_leads boolean DEFAULT true
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_slug text := lower(btrim(_slug));
  v_count int := 0;
BEGIN
  IF NOT public.mag_sales_tags_beheren(v_uid) THEN
    RAISE EXCEPTION 'geen rechten voor sales-tag beheer';
  END IF;
  IF v_slug = '' THEN RAISE EXCEPTION 'slug verplicht'; END IF;

  DELETE FROM public.sales_tags WHERE slug = v_slug;

  IF _ook_van_leads THEN
    WITH bijgewerkt AS (
      UPDATE public.affiliate_leads l
         SET tags = COALESCE((
           SELECT array_agg(x) FROM unnest(l.tags) AS x WHERE x <> v_slug
         ), '{}'::text[]),
         updated_at = now()
       WHERE v_slug = ANY(l.tags)
       RETURNING l.id
    )
    SELECT count(*) INTO v_count FROM bijgewerkt;
  END IF;
  RETURN v_count;
END; $$;

CREATE OR REPLACE VIEW public.sales_tags_met_aantal AS
  SELECT
    t.id,
    t.slug,
    t.label,
    t.kleur,
    t.omschrijving,
    t.created_at,
    t.updated_at,
    COALESCE(g.aantal, 0)::int AS aantal_leads
  FROM public.sales_tags t
  LEFT JOIN (
    SELECT lower(btrim(x)) AS slug, count(*) AS aantal
      FROM public.affiliate_leads, unnest(tags) AS x
     WHERE btrim(x) <> ''
     GROUP BY 1
  ) g ON g.slug = t.slug;

GRANT SELECT ON public.sales_tags_met_aantal TO authenticated;
