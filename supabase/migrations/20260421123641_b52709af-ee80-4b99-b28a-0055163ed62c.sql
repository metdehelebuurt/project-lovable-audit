-- 1. financiele_documenten: drop oude SELECT-policy die adviseur toegang gaf
DROP POLICY IF EXISTS "Partner admin/staff zien eigen documenten" ON public.financiele_documenten;
DROP POLICY IF EXISTS "Partner admin verwijdert documenten" ON public.financiele_documenten;
DROP POLICY IF EXISTS "Partner admin/staff bewerken documenten" ON public.financiele_documenten;
DROP POLICY IF EXISTS "Partner admin/staff maken documenten" ON public.financiele_documenten;

-- INSERT-policy via is_admin_tier (incl. backoffice)
CREATE POLICY "financieel_admin_only_insert"
  ON public.financiele_documenten
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_superadmin(auth.uid())
    OR (is_admin_tier(auth.uid()) AND partner_id = get_user_partner_id(auth.uid()))
  );

-- 2. leads: UPDATE/DELETE policies aanpassen zodat backoffice ook mag
DROP POLICY IF EXISTS "Leads bijwerken door bevoegde rollen" ON public.leads;
DROP POLICY IF EXISTS "Leads verwijderen door admin rollen" ON public.leads;

CREATE POLICY "Leads bijwerken door bevoegde rollen"
  ON public.leads
  FOR UPDATE
  TO authenticated
  USING (
    is_superadmin(auth.uid())
    OR (is_admin_tier(auth.uid()) AND partner_id = get_user_partner_id(auth.uid()))
    OR (get_user_role(auth.uid()) = 'partner_staff'::app_role AND partner_id = get_user_partner_id(auth.uid()))
    OR (get_user_role(auth.uid()) = 'adviseur'::app_role AND owner_user_id = auth.uid())
  );

CREATE POLICY "Leads verwijderen door admin rollen"
  ON public.leads
  FOR DELETE
  TO authenticated
  USING (
    is_superadmin(auth.uid())
    OR (is_admin_tier(auth.uid()) AND partner_id = get_user_partner_id(auth.uid()))
    OR (get_user_role(auth.uid()) = 'partner_staff'::app_role AND partner_id = get_user_partner_id(auth.uid()))
  );

-- Backoffice mag ook alle leads van eigen partner zien
CREATE POLICY "Backoffice ziet eigen partner leads"
  ON public.leads
  FOR SELECT
  TO authenticated
  USING (
    get_user_role(auth.uid()) = 'backoffice'::app_role
    AND partner_id = get_user_partner_id(auth.uid())
  );

-- 3. offertes: UPDATE/DELETE backoffice toevoegen + SELECT
DROP POLICY IF EXISTS "Offertes bijwerken" ON public.offertes;
DROP POLICY IF EXISTS "Offertes verwijderen" ON public.offertes;

CREATE POLICY "Offertes bijwerken"
  ON public.offertes
  FOR UPDATE
  TO authenticated
  USING (
    is_superadmin(auth.uid())
    OR (is_admin_tier(auth.uid()) AND partner_id = get_user_partner_id(auth.uid()))
    OR (get_user_role(auth.uid()) = 'partner_staff'::app_role AND partner_id = get_user_partner_id(auth.uid()))
    OR (get_user_role(auth.uid()) = 'adviseur'::app_role AND adviseur_id = auth.uid())
    OR (get_user_role(auth.uid()) = 'consument'::app_role AND klant_email = (SELECT email FROM users WHERE id = auth.uid()))
  );

CREATE POLICY "Offertes verwijderen"
  ON public.offertes
  FOR DELETE
  TO authenticated
  USING (
    is_superadmin(auth.uid())
    OR (is_admin_tier(auth.uid()) AND partner_id = get_user_partner_id(auth.uid()))
    OR (get_user_role(auth.uid()) = 'partner_staff'::app_role AND partner_id = get_user_partner_id(auth.uid()))
  );

CREATE POLICY "Backoffice ziet eigen partner offertes"
  ON public.offertes
  FOR SELECT
  TO authenticated
  USING (
    get_user_role(auth.uid()) = 'backoffice'::app_role
    AND partner_id = get_user_partner_id(auth.uid())
  );

-- 4. installaties: UPDATE/DELETE backoffice toevoegen + SELECT
DROP POLICY IF EXISTS "Installaties bijwerken" ON public.installaties;
DROP POLICY IF EXISTS "Installaties verwijderen" ON public.installaties;

CREATE POLICY "Installaties bijwerken"
  ON public.installaties
  FOR UPDATE
  TO authenticated
  USING (
    is_superadmin(auth.uid())
    OR (is_admin_tier(auth.uid()) AND partner_id = get_user_partner_id(auth.uid()))
    OR (get_user_role(auth.uid()) = 'partner_staff'::app_role AND partner_id = get_user_partner_id(auth.uid()))
    OR (get_user_role(auth.uid()) = 'installateur'::app_role AND installateur_id = auth.uid())
  );

CREATE POLICY "Installaties verwijderen"
  ON public.installaties
  FOR DELETE
  TO authenticated
  USING (
    is_superadmin(auth.uid())
    OR (is_admin_tier(auth.uid()) AND partner_id = get_user_partner_id(auth.uid()))
    OR (get_user_role(auth.uid()) = 'partner_staff'::app_role AND partner_id = get_user_partner_id(auth.uid()))
  );

CREATE POLICY "Backoffice ziet eigen partner installaties"
  ON public.installaties
  FOR SELECT
  TO authenticated
  USING (
    get_user_role(auth.uid()) = 'backoffice'::app_role
    AND partner_id = get_user_partner_id(auth.uid())
  );