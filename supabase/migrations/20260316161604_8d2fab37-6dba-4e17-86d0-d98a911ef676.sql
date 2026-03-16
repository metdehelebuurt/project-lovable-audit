
-- Make offertes.partner_id nullable so affiliates can create offers without a partner
ALTER TABLE public.offertes ALTER COLUMN partner_id DROP NOT NULL;

-- RLS: Affiliate can SELECT own offertes (where adviseur_id = auth.uid())
CREATE POLICY "Affiliate ziet eigen offertes"
ON public.offertes
FOR SELECT
TO authenticated
USING (
  (get_user_role(auth.uid()) = 'affiliate'::app_role) AND (adviseur_id = auth.uid())
);

-- RLS: Affiliate can INSERT offertes
CREATE POLICY "Affiliate maakt offertes"
ON public.offertes
FOR INSERT
TO authenticated
WITH CHECK (
  (get_user_role(auth.uid()) = 'affiliate'::app_role) AND (adviseur_id = auth.uid())
);

-- RLS: Affiliate can UPDATE own offertes
CREATE POLICY "Affiliate bewerkt eigen offertes"
ON public.offertes
FOR UPDATE
TO authenticated
USING (
  (get_user_role(auth.uid()) = 'affiliate'::app_role) AND (adviseur_id = auth.uid())
);

-- RLS: Affiliate can SELECT own leads
CREATE POLICY "Affiliate ziet eigen leads"
ON public.leads
FOR SELECT
TO authenticated
USING (
  (get_user_role(auth.uid()) = 'affiliate'::app_role) AND (owner_user_id = auth.uid())
);

-- RLS: Affiliate can INSERT leads
CREATE POLICY "Affiliate maakt leads"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (
  (get_user_role(auth.uid()) = 'affiliate'::app_role) AND (owner_user_id = auth.uid())
);

-- RLS: Affiliate can UPDATE own leads
CREATE POLICY "Affiliate bewerkt eigen leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (
  (get_user_role(auth.uid()) = 'affiliate'::app_role) AND (owner_user_id = auth.uid())
);

-- Also allow affiliate to INSERT referrals (needed for system)
CREATE POLICY "Affiliate maakt referrals"
ON public.affiliate_referrals
FOR INSERT
TO authenticated
WITH CHECK (
  (affiliate_id = auth.uid()) AND (get_user_role(auth.uid()) = 'affiliate'::app_role)
);

-- Superadmin can create kortingscodes for any affiliate
CREATE POLICY "Superadmin maakt kortingscodes"
ON public.kortingscodes
FOR INSERT
TO authenticated
WITH CHECK (is_superadmin(auth.uid()));

-- Superadmin can delete kortingscodes
CREATE POLICY "Superadmin verwijdert kortingscodes"
ON public.kortingscodes
FOR DELETE
TO authenticated
USING (is_superadmin(auth.uid()));
