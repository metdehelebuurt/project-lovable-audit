
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS partner_slug text;

CREATE OR REPLACE FUNCTION public.slugify_partner_naam(_naam text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT regexp_replace(
           regexp_replace(
             lower(coalesce(_naam, '')),
             '[^a-z0-9]+', '-', 'g'
           ),
           '(^-+|-+$)', '', 'g'
         );
$$;

WITH base AS (
  SELECT id,
         COALESCE(NULLIF(public.slugify_partner_naam(naam), ''), 'partner-' || substring(id::text, 1, 8)) AS slug,
         ROW_NUMBER() OVER (
           PARTITION BY COALESCE(NULLIF(public.slugify_partner_naam(naam), ''), 'partner-' || substring(id::text, 1, 8))
           ORDER BY created_at NULLS LAST
         ) AS rn
  FROM public.partners
  WHERE partner_slug IS NULL
)
UPDATE public.partners p
SET partner_slug = CASE WHEN b.rn = 1 THEN b.slug ELSE b.slug || '-' || b.rn END
FROM base b
WHERE p.id = b.id;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_partners_partner_slug
  ON public.partners (partner_slug)
  WHERE partner_slug IS NOT NULL;

CREATE OR REPLACE FUNCTION public.set_partner_slug_default()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  candidate text;
  attempt int := 0;
  final_slug text;
BEGIN
  IF NEW.partner_slug IS NOT NULL AND NEW.partner_slug <> '' THEN
    RETURN NEW;
  END IF;
  candidate := COALESCE(NULLIF(public.slugify_partner_naam(NEW.naam), ''), 'partner-' || substring(NEW.id::text, 1, 8));
  final_slug := candidate;
  WHILE EXISTS (SELECT 1 FROM public.partners WHERE partner_slug = final_slug AND id <> NEW.id) LOOP
    attempt := attempt + 1;
    final_slug := candidate || '-' || attempt;
  END LOOP;
  NEW.partner_slug := final_slug;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_partner_slug ON public.partners;
CREATE TRIGGER trg_set_partner_slug
BEFORE INSERT ON public.partners
FOR EACH ROW EXECUTE FUNCTION public.set_partner_slug_default();

CREATE OR REPLACE FUNCTION public.get_partner_by_slug(_slug text)
RETURNS TABLE (
  id uuid,
  naam text,
  partner_slug text,
  logo_url text,
  logo_url_donker text,
  primaire_kleur text,
  website text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.naam, p.partner_slug, p.logo_url, p.logo_url_donker, p.primaire_kleur, p.website
  FROM public.partners p
  WHERE p.partner_slug = _slug
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_partner_by_slug(text) TO anon, authenticated;
