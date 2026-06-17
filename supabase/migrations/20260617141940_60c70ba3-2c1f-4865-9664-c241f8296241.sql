
-- Helper functions
CREATE OR REPLACE FUNCTION public.normalize_phone(_telefoon text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN _telefoon IS NULL THEN NULL
    WHEN length(regexp_replace(_telefoon, '\D', '', 'g')) < 6 THEN NULL
    ELSE right(regexp_replace(_telefoon, '\D', '', 'g'), 8)
  END;
$$;

CREATE OR REPLACE FUNCTION public.extract_huisnummer(_adres text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT NULLIF((regexp_match(coalesce(_adres,''), '(\d+)'))[1], '');
$$;

CREATE OR REPLACE FUNCTION public.normalize_postcode(_postcode text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT NULLIF(upper(regexp_replace(coalesce(_postcode,''), '\s', '', 'g')), '');
$$;

-- Negeerlijst tabel
CREATE TABLE public.lead_duplicaat_negeerlijst (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  lead_a_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  lead_b_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  genegeerd_door uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reden text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lead_pair_geordend CHECK (lead_a_id < lead_b_id),
  UNIQUE (partner_id, lead_a_id, lead_b_id)
);

CREATE INDEX idx_lead_dup_negeer_partner ON public.lead_duplicaat_negeerlijst(partner_id);
CREATE INDEX idx_lead_dup_negeer_a ON public.lead_duplicaat_negeerlijst(lead_a_id);
CREATE INDEX idx_lead_dup_negeer_b ON public.lead_duplicaat_negeerlijst(lead_b_id);

GRANT SELECT, INSERT, DELETE ON public.lead_duplicaat_negeerlijst TO authenticated;
GRANT ALL ON public.lead_duplicaat_negeerlijst TO service_role;

ALTER TABLE public.lead_duplicaat_negeerlijst ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner users zien eigen negeerlijst"
ON public.lead_duplicaat_negeerlijst FOR SELECT TO authenticated
USING (partner_id = get_user_partner_id(auth.uid()) OR is_superadmin(auth.uid()));

CREATE POLICY "Partner users maken negeerlijst-items"
ON public.lead_duplicaat_negeerlijst FOR INSERT TO authenticated
WITH CHECK (
  is_superadmin(auth.uid())
  OR (
    get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role, 'backoffice'::app_role, 'adviseur'::app_role])
    AND partner_id = get_user_partner_id(auth.uid())
  )
);

CREATE POLICY "Partner users verwijderen negeerlijst-items"
ON public.lead_duplicaat_negeerlijst FOR DELETE TO authenticated
USING (
  is_superadmin(auth.uid())
  OR (
    get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role, 'backoffice'::app_role])
    AND partner_id = get_user_partner_id(auth.uid())
  )
);

-- Duplicaten-view
CREATE OR REPLACE VIEW public.v_lead_duplicaten
WITH (security_invoker = true)
AS
WITH paren AS (
  -- E-mail match
  SELECT
    l1.partner_id,
    LEAST(l1.id, l2.id) AS lead_a_id,
    GREATEST(l1.id, l2.id) AS lead_b_id,
    'email'::text AS reden
  FROM public.leads l1
  JOIN public.leads l2
    ON l1.partner_id = l2.partner_id
   AND l1.id < l2.id
   AND lower(btrim(l1.email)) = lower(btrim(l2.email))
   AND coalesce(btrim(l1.email),'') <> ''

  UNION

  -- Telefoon match (laatste 8 cijfers)
  SELECT
    l1.partner_id,
    LEAST(l1.id, l2.id),
    GREATEST(l1.id, l2.id),
    'telefoon'
  FROM public.leads l1
  JOIN public.leads l2
    ON l1.partner_id = l2.partner_id
   AND l1.id < l2.id
   AND public.normalize_phone(l1.telefoon) IS NOT NULL
   AND public.normalize_phone(l1.telefoon) = public.normalize_phone(l2.telefoon)

  UNION

  -- Postcode + huisnummer
  SELECT
    l1.partner_id,
    LEAST(l1.id, l2.id),
    GREATEST(l1.id, l2.id),
    'adres'
  FROM public.leads l1
  JOIN public.leads l2
    ON l1.partner_id = l2.partner_id
   AND l1.id < l2.id
   AND public.normalize_postcode(l1.postcode) IS NOT NULL
   AND public.normalize_postcode(l1.postcode) = public.normalize_postcode(l2.postcode)
   AND public.extract_huisnummer(l1.adres) IS NOT NULL
   AND public.extract_huisnummer(l1.adres) = public.extract_huisnummer(l2.adres)
)
SELECT
  p.partner_id,
  p.lead_a_id,
  p.lead_b_id,
  array_agg(DISTINCT p.reden ORDER BY p.reden) AS match_redenen,
  count(*)::int AS score
FROM paren p
WHERE NOT EXISTS (
  SELECT 1 FROM public.lead_duplicaat_negeerlijst n
  WHERE n.partner_id = p.partner_id
    AND n.lead_a_id = p.lead_a_id
    AND n.lead_b_id = p.lead_b_id
)
GROUP BY p.partner_id, p.lead_a_id, p.lead_b_id;

GRANT SELECT ON public.v_lead_duplicaten TO authenticated;
