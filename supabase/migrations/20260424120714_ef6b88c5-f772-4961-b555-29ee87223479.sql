-- Break-glass restrictive policy laag
-- Voor elke partner-data tabel: superadmin krijgt alleen toegang als er een actieve grant is voor die partner_id
-- Niet-superadmins worden niet beïnvloed door deze RESTRICTIVE policy

DO $$
DECLARE
  t text;
  partner_tables text[] := ARRAY[
    'abonnement_addon_aankopen','abonnement_wijzigingen','abonnementen',
    'affiliate_commissies','affiliate_referrals','afspraken',
    'consumenten','documenten','email_log','email_templates',
    'entiteit_historie','facturen','factuur_historie','feedback_verzoeken',
    'financiele_documenten','gebruiker_afwezigheid','gebruiker_permissies',
    'helpdesk_csat','helpdesk_email_sjablonen','helpdesk_kennis_artikelen',
    'helpdesk_kennis_media','helpdesk_notificatie_config','helpdesk_service_bezoeken',
    'helpdesk_ticket_ai_sessies','helpdesk_ticket_berichten','helpdesk_ticket_bijlagen',
    'helpdesk_ticket_historie','helpdesk_ticket_taken','helpdesk_tickets',
    'inkoop_ontvangsten','installatie_checklist_items','installatie_checklist_templates',
    'installatie_historie','installatie_notities','installaties',
    'klant_notities','klanten','lead_contactmomenten','lead_eigenschappen',
    'lead_notities','leads','leverancier_artikelen','leveranciers',
    'mfa_vereisten','module_rol_toegang','module_user_override',
    'nummerreeks_config','offerte_herinneringen','offerte_termijnschema','offertes',
    'opdracht_zendingen','opdrachten','opleverrapport_audit','opleverrapport_pdf_versies',
    'opleverrapporten','partner_product_datasheets','partner_product_teksten',
    'product_serienummers','producten','retouren','schouwen','tickets',
    'users','voorraad_mutaties','voorraad_reserveringen','web_widgets'
  ];
BEGIN
  FOREACH t IN ARRAY partner_tables LOOP
    -- Verwijder eerdere versie (idempotent)
    EXECUTE format('DROP POLICY IF EXISTS "break_glass_superadmin_restrict" ON public.%I', t);

    -- RESTRICTIVE policy: voor superadmins moet er een actieve grant zijn voor de partner_id van de rij
    -- Voor niet-superadmins is is_superadmin(auth.uid()) = false, dus de restrictive eis is automatisch waar
    EXECUTE format($f$
      CREATE POLICY "break_glass_superadmin_restrict"
      ON public.%I
      AS RESTRICTIVE
      FOR ALL
      TO authenticated
      USING (
        NOT public.is_superadmin(auth.uid())
        OR public.has_break_glass_access(auth.uid(), partner_id)
      )
      WITH CHECK (
        NOT public.is_superadmin(auth.uid())
        OR public.has_break_glass_access(auth.uid(), partner_id)
      )
    $f$, t);
  END LOOP;
END $$;

-- Aparte tabellen die NIET via partner_id afgeschermd worden:
-- - audit_log: superadmin moet alle audit-events kunnen zien (toezicht)
-- - superadmin_access_grants: superadmin moet eigen grants kunnen aanmaken/intrekken
-- - offerte_berichten, schouw_*: hebben geen direct partner_id of zijn al via klant/offerte beperkt
-- Deze blijven via hun bestaande PERMISSIVE policies werken.

-- Comment voor documentatie
COMMENT ON FUNCTION public.has_break_glass_access(uuid, uuid) IS
  'Break-glass check: retourneert true als superadmin een actieve, niet-ingetrokken, niet-vervallen access grant heeft voor de opgegeven partner_id. Wordt gebruikt in RESTRICTIVE RLS policies op alle partner-data tabellen.';