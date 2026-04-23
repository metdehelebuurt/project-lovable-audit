-- Voeg 'backoffice' rol toe aan bestaande partner-allowlist policies zodat
-- backoffice-gebruikers dezelfde data zien/beheren als partner_staff binnen hun partner.

-- ============ KLANTEN ============
DROP POLICY IF EXISTS "Partner users zien eigen partner klanten" ON public.klanten;
CREATE POLICY "Partner users zien eigen partner klanten" ON public.klanten
FOR SELECT TO authenticated
USING (get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice']::app_role[])
       AND partner_id = get_user_partner_id(auth.uid()));

DROP POLICY IF EXISTS "Klanten aanmaken" ON public.klanten;
CREATE POLICY "Klanten aanmaken" ON public.klanten
FOR INSERT TO authenticated
WITH CHECK (is_superadmin(auth.uid()) OR (
  get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice','adviseur']::app_role[])
  AND partner_id = get_user_partner_id(auth.uid())));

DROP POLICY IF EXISTS "Klanten bijwerken" ON public.klanten;
CREATE POLICY "Klanten bijwerken" ON public.klanten
FOR UPDATE TO authenticated
USING (is_superadmin(auth.uid()) OR (
  get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice']::app_role[])
  AND partner_id = get_user_partner_id(auth.uid())));

-- ============ SCHOUWEN ============
DROP POLICY IF EXISTS "Partner users zien eigen partner schouwen" ON public.schouwen;
CREATE POLICY "Partner users zien eigen partner schouwen" ON public.schouwen
FOR SELECT TO authenticated
USING (get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice']::app_role[])
       AND partner_id = get_user_partner_id(auth.uid()));

DROP POLICY IF EXISTS "Schouwen aanmaken" ON public.schouwen;
CREATE POLICY "Schouwen aanmaken" ON public.schouwen
FOR INSERT TO authenticated
WITH CHECK (is_superadmin(auth.uid()) OR (
  get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice','adviseur']::app_role[])
  AND partner_id = get_user_partner_id(auth.uid())));

DROP POLICY IF EXISTS "Schouwen verwijderen" ON public.schouwen;
CREATE POLICY "Schouwen verwijderen" ON public.schouwen
FOR DELETE TO authenticated
USING (is_superadmin(auth.uid()) OR (
  get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice']::app_role[])
  AND partner_id = get_user_partner_id(auth.uid())));

-- ============ OPDRACHTEN ============
DROP POLICY IF EXISTS "Partner users zien eigen partner opdrachten" ON public.opdrachten;
CREATE POLICY "Partner users zien eigen partner opdrachten" ON public.opdrachten
FOR SELECT TO authenticated
USING (get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice']::app_role[])
       AND partner_id = get_user_partner_id(auth.uid()));

DROP POLICY IF EXISTS "Opdrachten aanmaken" ON public.opdrachten;
CREATE POLICY "Opdrachten aanmaken" ON public.opdrachten
FOR INSERT TO authenticated
WITH CHECK (is_superadmin(auth.uid()) OR (
  get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice','adviseur']::app_role[])
  AND partner_id = get_user_partner_id(auth.uid())));

DROP POLICY IF EXISTS "Opdrachten verwijderen" ON public.opdrachten;
CREATE POLICY "Opdrachten verwijderen" ON public.opdrachten
FOR DELETE TO authenticated
USING (is_superadmin(auth.uid()) OR (
  get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice']::app_role[])
  AND partner_id = get_user_partner_id(auth.uid())));

-- ============ AFSPRAKEN ============
DROP POLICY IF EXISTS "Partner users zien eigen partner afspraken" ON public.afspraken;
CREATE POLICY "Partner users zien eigen partner afspraken" ON public.afspraken
FOR SELECT TO authenticated
USING (get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice']::app_role[])
       AND partner_id = get_user_partner_id(auth.uid()));

DROP POLICY IF EXISTS "Afspraken aanmaken" ON public.afspraken;
CREATE POLICY "Afspraken aanmaken" ON public.afspraken
FOR INSERT TO authenticated
WITH CHECK (is_superadmin(auth.uid()) OR (
  get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice','adviseur']::app_role[])
  AND partner_id = get_user_partner_id(auth.uid())));

DROP POLICY IF EXISTS "Afspraken bijwerken" ON public.afspraken;
CREATE POLICY "Afspraken bijwerken" ON public.afspraken
FOR UPDATE TO authenticated
USING (is_superadmin(auth.uid())
       OR ((get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice']::app_role[]))
           AND partner_id = get_user_partner_id(auth.uid()))
       OR ((get_user_role(auth.uid()) = 'adviseur'::app_role) AND adviseur_id = auth.uid()));

-- ============ CONSUMENTEN ============
DROP POLICY IF EXISTS "Partner users zien eigen partner consumenten" ON public.consumenten;
CREATE POLICY "Partner users zien eigen partner consumenten" ON public.consumenten
FOR SELECT TO authenticated
USING (get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice','adviseur']::app_role[])
       AND partner_id = get_user_partner_id(auth.uid()));

DROP POLICY IF EXISTS "Consumenten aanmaken" ON public.consumenten;
CREATE POLICY "Consumenten aanmaken" ON public.consumenten
FOR INSERT TO authenticated
WITH CHECK (is_superadmin(auth.uid()) OR (
  get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice','adviseur']::app_role[])
  AND partner_id = get_user_partner_id(auth.uid())));

DROP POLICY IF EXISTS "Consumenten bijwerken" ON public.consumenten;
CREATE POLICY "Consumenten bijwerken" ON public.consumenten
FOR UPDATE TO authenticated
USING (is_superadmin(auth.uid())
       OR ((get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice']::app_role[]))
           AND partner_id = get_user_partner_id(auth.uid()))
       OR (user_id = auth.uid()));

-- ============ DOCUMENTEN ============
DROP POLICY IF EXISTS "Partner users zien eigen partner documenten" ON public.documenten;
CREATE POLICY "Partner users zien eigen partner documenten" ON public.documenten
FOR SELECT TO authenticated
USING (get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice']::app_role[])
       AND partner_id = get_user_partner_id(auth.uid()));

DROP POLICY IF EXISTS "Documenten aanmaken" ON public.documenten;
CREATE POLICY "Documenten aanmaken" ON public.documenten
FOR INSERT TO authenticated
WITH CHECK (is_superadmin(auth.uid()) OR (
  get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice','adviseur']::app_role[])
  AND partner_id = get_user_partner_id(auth.uid())));

DROP POLICY IF EXISTS "Documenten bijwerken" ON public.documenten;
CREATE POLICY "Documenten bijwerken" ON public.documenten
FOR UPDATE TO authenticated
USING (is_superadmin(auth.uid()) OR (
  get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice']::app_role[])
  AND partner_id = get_user_partner_id(auth.uid())));

DROP POLICY IF EXISTS "Documenten verwijderen" ON public.documenten;
CREATE POLICY "Documenten verwijderen" ON public.documenten
FOR DELETE TO authenticated
USING (is_superadmin(auth.uid()) OR (
  get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice']::app_role[])
  AND partner_id = get_user_partner_id(auth.uid())));

-- ============ HELPDESK_TICKETS ============
DROP POLICY IF EXISTS "Partner backoffice ziet eigen tickets" ON public.helpdesk_tickets;
CREATE POLICY "Partner backoffice ziet eigen tickets" ON public.helpdesk_tickets
FOR SELECT TO authenticated
USING (get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice','adviseur']::app_role[])
       AND partner_id = get_user_partner_id(auth.uid()));

DROP POLICY IF EXISTS "Tickets aanmaken" ON public.helpdesk_tickets;
CREATE POLICY "Tickets aanmaken" ON public.helpdesk_tickets
FOR INSERT TO authenticated
WITH CHECK (is_superadmin(auth.uid()) OR (
  get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice','adviseur','installateur']::app_role[])
  AND partner_id = get_user_partner_id(auth.uid())
  AND gemaakt_door = auth.uid()));

DROP POLICY IF EXISTS "Tickets bijwerken" ON public.helpdesk_tickets;
CREATE POLICY "Tickets bijwerken" ON public.helpdesk_tickets
FOR UPDATE TO authenticated
USING (is_superadmin(auth.uid())
       OR ((get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice','adviseur']::app_role[]))
           AND partner_id = get_user_partner_id(auth.uid()))
       OR ((get_user_role(auth.uid()) = 'installateur'::app_role)
           AND partner_id = get_user_partner_id(auth.uid())
           AND (toegewezen_aan = auth.uid() OR gemaakt_door = auth.uid())));

-- ============ HELPDESK_SERVICE_BEZOEKEN ============
DROP POLICY IF EXISTS "Service bezoeken zichtbaar binnen partner" ON public.helpdesk_service_bezoeken;
CREATE POLICY "Service bezoeken zichtbaar binnen partner" ON public.helpdesk_service_bezoeken
FOR SELECT TO authenticated
USING (is_superadmin(auth.uid()) OR (
  partner_id = get_user_partner_id(auth.uid())
  AND ((get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice','adviseur']::app_role[]))
       OR monteur_id = auth.uid())));

DROP POLICY IF EXISTS "Service bezoeken aanmaken" ON public.helpdesk_service_bezoeken;
CREATE POLICY "Service bezoeken aanmaken" ON public.helpdesk_service_bezoeken
FOR INSERT TO authenticated
WITH CHECK (is_superadmin(auth.uid()) OR (
  partner_id = get_user_partner_id(auth.uid())
  AND get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice','adviseur']::app_role[])));

DROP POLICY IF EXISTS "Service bezoeken bijwerken" ON public.helpdesk_service_bezoeken;
CREATE POLICY "Service bezoeken bijwerken" ON public.helpdesk_service_bezoeken
FOR UPDATE TO authenticated
USING (is_superadmin(auth.uid()) OR (
  partner_id = get_user_partner_id(auth.uid())
  AND ((get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice']::app_role[]))
       OR monteur_id = auth.uid())));

-- ============ HELPDESK_KENNIS_ARTIKELEN ============
DROP POLICY IF EXISTS "Gepubliceerde KB binnen partner" ON public.helpdesk_kennis_artikelen;
CREATE POLICY "Gepubliceerde KB binnen partner" ON public.helpdesk_kennis_artikelen
FOR SELECT TO authenticated
USING (is_superadmin(auth.uid()) OR (
  partner_id = get_user_partner_id(auth.uid())
  AND (status = 'gepubliceerd'::helpdesk_artikel_status
       OR gemaakt_door = auth.uid()
       OR get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','backoffice']::app_role[]))));

DROP POLICY IF EXISTS "KB aanmaken binnen partner" ON public.helpdesk_kennis_artikelen;
CREATE POLICY "KB aanmaken binnen partner" ON public.helpdesk_kennis_artikelen
FOR INSERT TO authenticated
WITH CHECK (is_superadmin(auth.uid()) OR (
  partner_id = get_user_partner_id(auth.uid())
  AND get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice','adviseur','installateur']::app_role[])));

DROP POLICY IF EXISTS "KB bijwerken (partner_admin of auteur)" ON public.helpdesk_kennis_artikelen;
CREATE POLICY "KB bijwerken (partner_admin of auteur)" ON public.helpdesk_kennis_artikelen
FOR UPDATE TO authenticated
USING (is_superadmin(auth.uid()) OR (
  partner_id = get_user_partner_id(auth.uid())
  AND (get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','backoffice']::app_role[])
       OR gemaakt_door = auth.uid())));

-- ============ LEVERANCIERS ============
DROP POLICY IF EXISTS "Partner admin/staff zien eigen leveranciers" ON public.leveranciers;
CREATE POLICY "Partner admin/staff zien eigen leveranciers" ON public.leveranciers
FOR SELECT TO authenticated
USING (get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice','adviseur']::app_role[])
       AND partner_id = get_user_partner_id(auth.uid()));

DROP POLICY IF EXISTS "Partner admin/staff maken leveranciers" ON public.leveranciers;
CREATE POLICY "Partner admin/staff maken leveranciers" ON public.leveranciers
FOR INSERT TO authenticated
WITH CHECK (is_superadmin(auth.uid()) OR (
  get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice']::app_role[])
  AND partner_id = get_user_partner_id(auth.uid())));

DROP POLICY IF EXISTS "Partner admin/staff bewerken leveranciers" ON public.leveranciers;
CREATE POLICY "Partner admin/staff bewerken leveranciers" ON public.leveranciers
FOR UPDATE TO authenticated
USING (is_superadmin(auth.uid()) OR (
  get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice']::app_role[])
  AND partner_id = get_user_partner_id(auth.uid())));

-- ============ AUDIT_LOG (alleen SELECT verbreden) ============
DROP POLICY IF EXISTS "Audit eigen partner lezen door admin" ON public.audit_log;
CREATE POLICY "Audit eigen partner lezen door admin" ON public.audit_log
FOR SELECT TO authenticated
USING (is_superadmin(auth.uid())
       OR (partner_id = get_user_partner_id(auth.uid())
           AND get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','backoffice']::app_role[]))
       OR target_user_id = auth.uid()
       OR actor_id = auth.uid());

-- ============ INSTALLATEUR_VOORKEUREN (alleen SELECT verbreden) ============
DROP POLICY IF EXISTS "installateur_voorkeuren_select_self" ON public.installateur_voorkeuren;
CREATE POLICY "installateur_voorkeuren_select_self" ON public.installateur_voorkeuren
FOR SELECT TO public
USING (user_id = auth.uid()
       OR is_superadmin(auth.uid())
       OR (get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','backoffice']::app_role[])
           AND user_id IN (SELECT id FROM public.users WHERE partner_id = get_user_partner_id(auth.uid()))));
