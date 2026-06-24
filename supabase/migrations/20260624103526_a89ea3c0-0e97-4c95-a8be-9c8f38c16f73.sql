
-- Normalize website: strip protocol, www., trailing slash, lowercase. Return null when too short.
CREATE OR REPLACE FUNCTION public.normalize_website(_input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _input IS NULL THEN NULL
    ELSE NULLIF(
      regexp_replace(
        regexp_replace(
          regexp_replace(lower(btrim(_input)), '^https?://', '', 'i'),
          '^www\.', '', 'i'
        ),
        '/+$', ''
      ),
      ''
    )
  END
$$;

-- Normalize bedrijfsnaam: lowercase, strip legal forms + non-alnum, trim. Returns null when result < 3 chars.
CREATE OR REPLACE FUNCTION public.normalize_bedrijfsnaam(_input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _input IS NULL THEN NULL
    ELSE (
      SELECT CASE WHEN length(s) >= 3 THEN s ELSE NULL END
      FROM (
        SELECT regexp_replace(
          regexp_replace(
            lower(btrim(_input)),
            '\m(b\.?v\.?|n\.?v\.?|v\.?o\.?f\.?|holding|group|nederland)\M',
            '',
            'gi'
          ),
          '[^a-z0-9]+', '', 'g'
        ) AS s
      ) t
    )
  END
$$;

-- Negeerlijst tabel
CREATE TABLE IF NOT EXISTS public.lead_duplicaat_negeerlijst_affiliate (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  eigenaar_id uuid NOT NULL,
  lead_a_id uuid NOT NULL REFERENCES public.affiliate_leads(id) ON DELETE CASCADE,
  lead_b_id uuid NOT NULL REFERENCES public.affiliate_leads(id) ON DELETE CASCADE,
  genegeerd_door uuid NOT NULL,
  reden text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lead_duplicaat_negeerlijst_affiliate_ord CHECK (lead_a_id < lead_b_id),
  CONSTRAINT lead_duplicaat_negeerlijst_affiliate_uniek UNIQUE (lead_a_id, lead_b_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_duplicaat_negeerlijst_affiliate TO authenticated;
GRANT ALL ON public.lead_duplicaat_negeerlijst_affiliate TO service_role;

ALTER TABLE public.lead_duplicaat_negeerlijst_affiliate ENABLE ROW LEVEL SECURITY;

CREATE POLICY "neg_aff_select_eigen_of_admin"
ON public.lead_duplicaat_negeerlijst_affiliate
FOR SELECT
TO authenticated
USING (
  eigenaar_id = auth.uid()
  OR public.is_superadmin(auth.uid())
);

CREATE POLICY "neg_aff_insert_eigen_of_admin"
ON public.lead_duplicaat_negeerlijst_affiliate
FOR INSERT
TO authenticated
WITH CHECK (
  (eigenaar_id = auth.uid() AND genegeerd_door = auth.uid())
  OR public.is_superadmin(auth.uid())
);

CREATE POLICY "neg_aff_delete_eigen_of_admin"
ON public.lead_duplicaat_negeerlijst_affiliate
FOR DELETE
TO authenticated
USING (
  eigenaar_id = auth.uid()
  OR public.is_superadmin(auth.uid())
);

-- View
CREATE OR REPLACE VIEW public.v_affiliate_lead_duplicaten
WITH (security_invoker = true)
AS
WITH paren AS (
  -- e-mail
  SELECT l1.eigenaar_id,
         LEAST(l1.id, l2.id)    AS lead_a_id,
         GREATEST(l1.id, l2.id) AS lead_b_id,
         'email'::text AS reden
  FROM public.affiliate_leads l1
  JOIN public.affiliate_leads l2
    ON l1.eigenaar_id IS NOT DISTINCT FROM l2.eigenaar_id
   AND l1.id < l2.id
   AND lower(btrim(l1.email)) = lower(btrim(l2.email))
   AND COALESCE(btrim(l1.email), '') <> ''
  UNION
  -- telefoon
  SELECT l1.eigenaar_id,
         LEAST(l1.id, l2.id),
         GREATEST(l1.id, l2.id),
         'telefoon'
  FROM public.affiliate_leads l1
  JOIN public.affiliate_leads l2
    ON l1.eigenaar_id IS NOT DISTINCT FROM l2.eigenaar_id
   AND l1.id < l2.id
   AND public.normalize_phone(l1.telefoon) IS NOT NULL
   AND public.normalize_phone(l1.telefoon) = public.normalize_phone(l2.telefoon)
  UNION
  -- website
  SELECT l1.eigenaar_id,
         LEAST(l1.id, l2.id),
         GREATEST(l1.id, l2.id),
         'website'
  FROM public.affiliate_leads l1
  JOIN public.affiliate_leads l2
    ON l1.eigenaar_id IS NOT DISTINCT FROM l2.eigenaar_id
   AND l1.id < l2.id
   AND public.normalize_website(l1.website) IS NOT NULL
   AND public.normalize_website(l1.website) = public.normalize_website(l2.website)
  UNION
  -- bedrijfsnaam
  SELECT l1.eigenaar_id,
         LEAST(l1.id, l2.id),
         GREATEST(l1.id, l2.id),
         'bedrijfsnaam'
  FROM public.affiliate_leads l1
  JOIN public.affiliate_leads l2
    ON l1.eigenaar_id IS NOT DISTINCT FROM l2.eigenaar_id
   AND l1.id < l2.id
   AND public.normalize_bedrijfsnaam(l1.bedrijfsnaam) IS NOT NULL
   AND public.normalize_bedrijfsnaam(l1.bedrijfsnaam) = public.normalize_bedrijfsnaam(l2.bedrijfsnaam)
  UNION
  -- adres (postcode + huisnummer)
  SELECT l1.eigenaar_id,
         LEAST(l1.id, l2.id),
         GREATEST(l1.id, l2.id),
         'adres'
  FROM public.affiliate_leads l1
  JOIN public.affiliate_leads l2
    ON l1.eigenaar_id IS NOT DISTINCT FROM l2.eigenaar_id
   AND l1.id < l2.id
   AND public.normalize_postcode(l1.postcode) IS NOT NULL
   AND public.normalize_postcode(l1.postcode) = public.normalize_postcode(l2.postcode)
   AND public.extract_huisnummer(l1.adres) IS NOT NULL
   AND public.extract_huisnummer(l1.adres) = public.extract_huisnummer(l2.adres)
)
SELECT eigenaar_id,
       lead_a_id,
       lead_b_id,
       array_agg(DISTINCT reden ORDER BY reden) AS match_redenen,
       count(*)::integer AS score
FROM paren p
WHERE NOT EXISTS (
  SELECT 1 FROM public.lead_duplicaat_negeerlijst_affiliate n
  WHERE n.lead_a_id = p.lead_a_id
    AND n.lead_b_id = p.lead_b_id
)
GROUP BY eigenaar_id, lead_a_id, lead_b_id;

GRANT SELECT ON public.v_affiliate_lead_duplicaten TO authenticated;
