
-- ============================================
-- #5: Uitbreiden CHECK-constraint termijnschema
-- ============================================
ALTER TABLE public.offerte_termijnschema
  DROP CONSTRAINT IF EXISTS offerte_termijnschema_trigger_status_check;

ALTER TABLE public.offerte_termijnschema
  ADD CONSTRAINT offerte_termijnschema_trigger_status_check
  CHECK (trigger_status IS NULL OR trigger_status = ANY (ARRAY[
    'handmatig'::text,
    'opdracht_bevestigd'::text,
    'schouw_uitgevoerd'::text,
    'installatie_gepland'::text,
    'installatie_gestart'::text,
    'installatie_uitgevoerd'::text,
    'opgeleverd'::text
  ]));

-- ============================================
-- #6: lead_notities.intern + klant_notities tabel
-- ============================================
ALTER TABLE public.lead_notities
  ADD COLUMN IF NOT EXISTS intern boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.klant_notities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  klant_id uuid NOT NULL REFERENCES public.klanten(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  inhoud text NOT NULL,
  intern boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_klant_notities_klant ON public.klant_notities(klant_id);
CREATE INDEX IF NOT EXISTS idx_klant_notities_partner ON public.klant_notities(partner_id);

ALTER TABLE public.klant_notities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users zien eigen partner klant notities" ON public.klant_notities;
CREATE POLICY "Users zien eigen partner klant notities"
  ON public.klant_notities FOR SELECT TO authenticated
  USING (is_superadmin(auth.uid()) OR partner_id = get_user_partner_id(auth.uid()));

DROP POLICY IF EXISTS "Bevoegde rollen maken klant notities" ON public.klant_notities;
CREATE POLICY "Bevoegde rollen maken klant notities"
  ON public.klant_notities FOR INSERT TO authenticated
  WITH CHECK (
    is_superadmin(auth.uid())
    OR (
      get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role, 'backoffice'::app_role, 'adviseur'::app_role])
      AND partner_id = get_user_partner_id(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Eigen klant notities verwijderen" ON public.klant_notities;
CREATE POLICY "Eigen klant notities verwijderen"
  ON public.klant_notities FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR is_superadmin(auth.uid()));

-- ============================================
-- #3: Uitbreiden triggerfuncties met meer velden
-- ============================================
CREATE OR REPLACE FUNCTION public.log_lead_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_entity_change('lead', NEW.id, NEW.partner_id, 'aangemaakt', NULL, NULL, NULL,
      jsonb_build_object('naam', CONCAT(NEW.voornaam,' ',NEW.achternaam), 'status', NEW.lead_status));
    RETURN NEW;
  END IF;
  IF NEW.lead_status IS DISTINCT FROM OLD.lead_status THEN
    PERFORM public.log_entity_change('lead', NEW.id, NEW.partner_id, 'status_gewijzigd', 'lead_status', OLD.lead_status::text, NEW.lead_status::text);
  END IF;
  IF NEW.owner_user_id IS DISTINCT FROM OLD.owner_user_id THEN
    PERFORM public.log_entity_change('lead', NEW.id, NEW.partner_id, 'eigenaar_gewijzigd', 'owner_user_id', OLD.owner_user_id::text, NEW.owner_user_id::text);
  END IF;
  IF NEW.toegewezen_aan IS DISTINCT FROM OLD.toegewezen_aan THEN
    PERFORM public.log_entity_change('lead', NEW.id, NEW.partner_id, 'toegewezen', 'toegewezen_aan', OLD.toegewezen_aan::text, NEW.toegewezen_aan::text);
  END IF;
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    PERFORM public.log_entity_change('lead', NEW.id, NEW.partner_id, 'email_gewijzigd', 'email', OLD.email, NEW.email);
  END IF;
  IF NEW.telefoon IS DISTINCT FROM OLD.telefoon THEN
    PERFORM public.log_entity_change('lead', NEW.id, NEW.partner_id, 'telefoon_gewijzigd', 'telefoon', OLD.telefoon, NEW.telefoon);
  END IF;
  IF NEW.bron IS DISTINCT FROM OLD.bron THEN
    PERFORM public.log_entity_change('lead', NEW.id, NEW.partner_id, 'bron_gewijzigd', 'bron', OLD.bron, NEW.bron);
  END IF;
  IF NEW.adres IS DISTINCT FROM OLD.adres
     OR NEW.postcode IS DISTINCT FROM OLD.postcode
     OR NEW.plaats IS DISTINCT FROM OLD.plaats THEN
    PERFORM public.log_entity_change('lead', NEW.id, NEW.partner_id, 'adres_gewijzigd', 'adres',
      CONCAT_WS(' ', OLD.adres, OLD.postcode, OLD.plaats),
      CONCAT_WS(' ', NEW.adres, NEW.postcode, NEW.plaats));
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_klant_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_entity_change('klant', NEW.id, NEW.partner_id, 'aangemaakt', NULL, NULL, CONCAT(NEW.voornaam,' ',NEW.achternaam), NULL);
    RETURN NEW;
  END IF;
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    PERFORM public.log_entity_change('klant', NEW.id, NEW.partner_id, 'email_gewijzigd', 'email', OLD.email, NEW.email);
  END IF;
  IF NEW.telefoon IS DISTINCT FROM OLD.telefoon THEN
    PERFORM public.log_entity_change('klant', NEW.id, NEW.partner_id, 'telefoon_gewijzigd', 'telefoon', OLD.telefoon, NEW.telefoon);
  END IF;
  IF NEW.voornaam IS DISTINCT FROM OLD.voornaam OR NEW.achternaam IS DISTINCT FROM OLD.achternaam THEN
    PERFORM public.log_entity_change('klant', NEW.id, NEW.partner_id, 'naam_gewijzigd', 'naam',
      CONCAT(OLD.voornaam,' ',OLD.achternaam), CONCAT(NEW.voornaam,' ',NEW.achternaam));
  END IF;
  IF NEW.bedrijfsnaam IS DISTINCT FROM OLD.bedrijfsnaam THEN
    PERFORM public.log_entity_change('klant', NEW.id, NEW.partner_id, 'bedrijfsnaam_gewijzigd', 'bedrijfsnaam', OLD.bedrijfsnaam, NEW.bedrijfsnaam);
  END IF;
  IF NEW.adres IS DISTINCT FROM OLD.adres
     OR NEW.postcode IS DISTINCT FROM OLD.postcode
     OR NEW.plaats IS DISTINCT FROM OLD.plaats THEN
    PERFORM public.log_entity_change('klant', NEW.id, NEW.partner_id, 'adres_gewijzigd', 'adres',
      CONCAT_WS(' ', OLD.adres, OLD.postcode, OLD.plaats),
      CONCAT_WS(' ', NEW.adres, NEW.postcode, NEW.plaats));
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_offerte_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_entity_change('offerte', NEW.id, NEW.partner_id, 'aangemaakt', NULL, NULL, NEW.offertenummer,
      jsonb_build_object('totaal', NEW.totaal_bedrag));
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.log_entity_change('offerte', NEW.id, NEW.partner_id, 'status_gewijzigd', 'status', OLD.status::text, NEW.status::text);
    IF NEW.status::text = 'verzonden' THEN
      PERFORM public.log_entity_change('offerte', NEW.id, NEW.partner_id, 'verzonden', NULL, NULL, NEW.offertenummer, NULL);
    ELSIF NEW.status::text = 'geaccepteerd' THEN
      PERFORM public.log_entity_change('offerte', NEW.id, NEW.partner_id, 'geaccepteerd', NULL, NULL, NEW.offertenummer, NULL);
    ELSIF NEW.status::text = 'afgewezen' THEN
      PERFORM public.log_entity_change('offerte', NEW.id, NEW.partner_id, 'afgewezen', NULL, NULL, NEW.offertenummer, NULL);
    END IF;
  END IF;
  IF NEW.totaal_bedrag IS DISTINCT FROM OLD.totaal_bedrag THEN
    PERFORM public.log_entity_change('offerte', NEW.id, NEW.partner_id, 'bedrag_gewijzigd', 'totaal_bedrag', OLD.totaal_bedrag::text, NEW.totaal_bedrag::text);
  END IF;
  IF NEW.adviseur_id IS DISTINCT FROM OLD.adviseur_id THEN
    PERFORM public.log_entity_change('offerte', NEW.id, NEW.partner_id, 'adviseur_gewijzigd', 'adviseur_id', OLD.adviseur_id::text, NEW.adviseur_id::text);
  END IF;
  IF NEW.geldig_tot IS DISTINCT FROM OLD.geldig_tot THEN
    PERFORM public.log_entity_change('offerte', NEW.id, NEW.partner_id, 'datum_gewijzigd', 'geldig_tot', OLD.geldig_tot::text, NEW.geldig_tot::text);
  END IF;
  IF NEW.notities IS DISTINCT FROM OLD.notities THEN
    PERFORM public.log_entity_change('offerte', NEW.id, NEW.partner_id, 'bewerkt', 'notities', NULL, NULL, NULL);
  END IF;
  IF NEW.regels::text IS DISTINCT FROM OLD.regels::text THEN
    PERFORM public.log_entity_change('offerte', NEW.id, NEW.partner_id, 'bewerkt', 'regels', NULL, NULL, NULL);
  END IF;
  RETURN NEW;
END;
$function$;
