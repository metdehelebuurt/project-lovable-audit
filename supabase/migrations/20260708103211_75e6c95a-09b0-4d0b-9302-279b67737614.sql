CREATE OR REPLACE VIEW public.v_affiliate_lead_duplicaten
WITH (security_invoker = true) AS
WITH paren AS (
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
   AND (
        public.normalize_persoonsnaam(l1.contactpersoon) IS NULL
     OR public.normalize_persoonsnaam(l2.contactpersoon) IS NULL
     OR public.normalize_persoonsnaam(l1.contactpersoon) = public.normalize_persoonsnaam(l2.contactpersoon)
   )
  UNION
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
   AND (
        public.normalize_persoonsnaam(l1.contactpersoon) IS NULL
     OR public.normalize_persoonsnaam(l2.contactpersoon) IS NULL
     OR public.normalize_persoonsnaam(l1.contactpersoon) = public.normalize_persoonsnaam(l2.contactpersoon)
   )
  UNION
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
   AND public.normalize_persoonsnaam(l1.contactpersoon)
        IS NOT DISTINCT FROM public.normalize_persoonsnaam(l2.contactpersoon)
  UNION
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
   AND public.normalize_persoonsnaam(l1.contactpersoon)
        IS NOT DISTINCT FROM public.normalize_persoonsnaam(l2.contactpersoon)
  UNION
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
   AND public.normalize_persoonsnaam(l1.contactpersoon)
        IS NOT DISTINCT FROM public.normalize_persoonsnaam(l2.contactpersoon)
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