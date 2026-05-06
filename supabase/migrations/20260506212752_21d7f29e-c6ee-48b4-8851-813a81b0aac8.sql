-- Backfill: dedupe per partner op lowercase merk én slug
WITH src AS (
  SELECT DISTINCT ON (p.partner_id, lower(trim(p.merk)))
    p.partner_id,
    trim(p.merk) AS merk,
    COALESCE(NULLIF(public.slugify_partner_naam(p.merk), ''), 'merk-' || substring(md5(p.merk),1,8)) AS slug
  FROM public.producten p
  WHERE p.partner_id IS NOT NULL AND p.merk IS NOT NULL AND trim(p.merk) <> ''
  ORDER BY p.partner_id, lower(trim(p.merk)), p.created_at
),
dedup AS (
  SELECT DISTINCT ON (partner_id, slug) partner_id, merk, slug
  FROM src
  ORDER BY partner_id, slug, merk
)
INSERT INTO public.partner_merken (partner_id, merk, slug, toon_op_website)
SELECT d.partner_id, d.merk, d.slug, true
FROM dedup d
WHERE NOT EXISTS (
  SELECT 1 FROM public.partner_merken pm
  WHERE pm.partner_id = d.partner_id AND (pm.merk = d.merk OR pm.slug = d.slug)
);

CREATE OR REPLACE FUNCTION public.ensure_partner_merk_exists()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_slug text;
  v_base text;
  v_attempt int := 0;
BEGIN
  IF NEW.partner_id IS NULL OR NEW.merk IS NULL OR trim(NEW.merk) = '' THEN
    RETURN NEW;
  END IF;
  IF EXISTS (SELECT 1 FROM public.partner_merken WHERE partner_id = NEW.partner_id AND lower(merk) = lower(trim(NEW.merk))) THEN
    RETURN NEW;
  END IF;
  v_base := COALESCE(NULLIF(public.slugify_partner_naam(NEW.merk), ''), 'merk-' || substring(md5(NEW.merk),1,8));
  v_slug := v_base;
  WHILE EXISTS (SELECT 1 FROM public.partner_merken WHERE partner_id = NEW.partner_id AND slug = v_slug) LOOP
    v_attempt := v_attempt + 1;
    v_slug := v_base || '-' || v_attempt;
  END LOOP;
  INSERT INTO public.partner_merken (partner_id, merk, slug, toon_op_website)
  VALUES (NEW.partner_id, trim(NEW.merk), v_slug, true)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_partner_merk ON public.producten;
CREATE TRIGGER trg_ensure_partner_merk
AFTER INSERT OR UPDATE OF merk, partner_id ON public.producten
FOR EACH ROW EXECUTE FUNCTION public.ensure_partner_merk_exists();