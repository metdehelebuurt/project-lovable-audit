
-- Feedback privacy: externe gebruikers zien alleen eigen items.
-- Behalve superadmin (alles), sales_manager (alles) en partner_admin (eigen partner).

-- ============== feedback_verzoeken ==============
DROP POLICY IF EXISTS "Partner users zien partner feedback" ON public.feedback_verzoeken;
DROP POLICY IF EXISTS "Roadmap publiek leesbaar" ON public.feedback_verzoeken;

REVOKE SELECT ON public.feedback_verzoeken FROM anon;

CREATE POLICY "Sales manager ziet alle feedback"
  ON public.feedback_verzoeken FOR SELECT TO authenticated
  USING (public.is_sales_manager(auth.uid()));

CREATE POLICY "Partner admin ziet partner feedback"
  ON public.feedback_verzoeken FOR SELECT TO authenticated
  USING (
    public.user_has_role(auth.uid(), 'partner_admin'::public.app_role)
    AND partner_id = public.get_user_partner_id(auth.uid())
  );

-- Vervang UPDATE policy: alleen indiener, superadmin, sales_manager of partner_admin van eigen partner
DROP POLICY IF EXISTS "Admin bewerkt feedback" ON public.feedback_verzoeken;
CREATE POLICY "Beheerders en indiener bewerken feedback"
  ON public.feedback_verzoeken FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_superadmin(auth.uid())
    OR public.is_sales_manager(auth.uid())
    OR (
      public.user_has_role(auth.uid(), 'partner_admin'::public.app_role)
      AND partner_id = public.get_user_partner_id(auth.uid())
    )
  );

-- ============== feedback_reacties ==============
DROP POLICY IF EXISTS "Partner ziet partner reacties niet-intern" ON public.feedback_reacties;

CREATE POLICY "Sales manager leest reacties"
  ON public.feedback_reacties FOR SELECT TO authenticated
  USING (intern = false AND public.is_sales_manager(auth.uid()));

CREATE POLICY "Partner admin leest partner reacties"
  ON public.feedback_reacties FOR SELECT TO authenticated
  USING (
    intern = false
    AND public.user_has_role(auth.uid(), 'partner_admin'::public.app_role)
    AND EXISTS (
      SELECT 1 FROM public.feedback_verzoeken fv
      WHERE fv.id = feedback_reacties.feedback_id
        AND fv.partner_id = public.get_user_partner_id(auth.uid())
    )
  );

-- Vervang INSERT policy: reageren mag alleen op feedback die je zelf hebt ingestuurd
-- (of als superadmin / sales_manager / partner_admin van eigen partner)
DROP POLICY IF EXISTS "Gebruiker plaatst eigen reactie op zichtbaar verzoek" ON public.feedback_reacties;
CREATE POLICY "Gebruiker plaatst reactie op toegestane feedback"
  ON public.feedback_reacties FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND intern = false
    AND EXISTS (
      SELECT 1 FROM public.feedback_verzoeken fv
      WHERE fv.id = feedback_reacties.feedback_id
        AND (
          fv.user_id = auth.uid()
          OR public.is_superadmin(auth.uid())
          OR public.is_sales_manager(auth.uid())
          OR (
            public.user_has_role(auth.uid(), 'partner_admin'::public.app_role)
            AND fv.partner_id = public.get_user_partner_id(auth.uid())
          )
        )
    )
  );
