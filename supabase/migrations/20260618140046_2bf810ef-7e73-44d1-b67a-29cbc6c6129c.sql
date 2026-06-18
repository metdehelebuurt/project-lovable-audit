DROP POLICY IF EXISTS affiliate_leads_insert ON public.affiliate_leads;
CREATE POLICY affiliate_leads_insert ON public.affiliate_leads
FOR INSERT TO authenticated
WITH CHECK (
  is_superadmin(auth.uid())
  OR (
    is_affiliate(auth.uid())
    AND (eigenaar_id = auth.uid() OR eigenaar_id IS NULL)
    AND bron = 'eigen_import'::affiliate_lead_bron
  )
);