-- 1) Vervang UPDATE policy zodat installateur eigen opdracht kan updaten
DROP POLICY IF EXISTS "Opdrachten bijwerken" ON public.opdrachten;

CREATE POLICY "Opdrachten bijwerken"
ON public.opdrachten
FOR UPDATE
USING (
  is_superadmin(auth.uid())
  OR (
    get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role])
    AND partner_id = get_user_partner_id(auth.uid())
  )
  OR (
    get_user_role(auth.uid()) = 'adviseur'::app_role
    AND offerte_id IN (SELECT id FROM public.offertes WHERE adviseur_id = auth.uid())
  )
  OR (
    get_user_role(auth.uid()) = 'installateur'::app_role
    AND toegewezen_monteur_id = auth.uid()
  )
);

-- 2) Trigger die installateurs verbiedt om gevoelige velden te wijzigen
CREATE OR REPLACE FUNCTION public.installateur_opdracht_velden_whitelist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF get_user_role(auth.uid()) = 'installateur'::app_role
     AND NOT is_superadmin(auth.uid()) THEN
    -- Velden die installateur NIET mag wijzigen
    IF NEW.partner_id IS DISTINCT FROM OLD.partner_id
       OR NEW.offerte_id IS DISTINCT FROM OLD.offerte_id
       OR NEW.lead_id IS DISTINCT FROM OLD.lead_id
       OR NEW.schouw_id IS DISTINCT FROM OLD.schouw_id
       OR NEW.installatie_id IS DISTINCT FROM OLD.installatie_id
       OR NEW.klant_naam IS DISTINCT FROM OLD.klant_naam
       OR NEW.klant_email IS DISTINCT FROM OLD.klant_email
       OR NEW.klant_telefoon IS DISTINCT FROM OLD.klant_telefoon
       OR NEW.klant_adres IS DISTINCT FROM OLD.klant_adres
       OR NEW.klant_postcode IS DISTINCT FROM OLD.klant_postcode
       OR NEW.klant_plaats IS DISTINCT FROM OLD.klant_plaats
       OR NEW.regels::text IS DISTINCT FROM OLD.regels::text
       OR NEW.totaal_bedrag IS DISTINCT FROM OLD.totaal_bedrag
       OR NEW.toegewezen_monteur_id IS DISTINCT FROM OLD.toegewezen_monteur_id
       OR NEW.bevestiging_verzonden_op IS DISTINCT FROM OLD.bevestiging_verzonden_op THEN
      RAISE EXCEPTION 'Installateur mag deze velden niet wijzigen op opdracht';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS opdrachten_installateur_whitelist ON public.opdrachten;
CREATE TRIGGER opdrachten_installateur_whitelist
BEFORE UPDATE ON public.opdrachten
FOR EACH ROW
EXECUTE FUNCTION public.installateur_opdracht_velden_whitelist();