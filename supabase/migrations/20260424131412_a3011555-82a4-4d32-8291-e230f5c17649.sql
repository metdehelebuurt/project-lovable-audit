
-- ============================================================================
-- INKOOP MODULE — Fundering
-- ============================================================================

-- 1) Nieuwe statussen toevoegen aan financieel_document_status enum (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'wacht_goedkeuring' AND enumtypid = 'public.financieel_document_status'::regtype) THEN
    ALTER TYPE public.financieel_document_status ADD VALUE 'wacht_goedkeuring';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'geannuleerd' AND enumtypid = 'public.financieel_document_status'::regtype) THEN
    ALTER TYPE public.financieel_document_status ADD VALUE 'geannuleerd';
  END IF;
END $$;

-- 2) Extra velden op financiele_documenten voor inkooporders
ALTER TABLE public.financiele_documenten
  ADD COLUMN IF NOT EXISTS gewenste_leverdatum date,
  ADD COLUMN IF NOT EXISTS bevestigde_leverdatum date,
  ADD COLUMN IF NOT EXISTS leveringsadres jsonb,
  ADD COLUMN IF NOT EXISTS goedgekeurd_door_id uuid,
  ADD COLUMN IF NOT EXISTS goedgekeurd_op timestamptz,
  ADD COLUMN IF NOT EXISTS verzonden_door_id uuid,
  ADD COLUMN IF NOT EXISTS verzonden_via text,
  ADD COLUMN IF NOT EXISTS email_bericht_id uuid,
  ADD COLUMN IF NOT EXISTS leverancier_referentie text,
  ADD COLUMN IF NOT EXISTS interne_notities text;

-- 3) Inkoop-instellingen per organisatie
CREATE TABLE IF NOT EXISTS public.inkoop_instellingen (
  partner_id uuid PRIMARY KEY,
  goedkeuring_modus text NOT NULL DEFAULT 'geen' CHECK (goedkeuring_modus IN ('geen', 'drempel', 'altijd')),
  goedkeuring_drempel_bedrag numeric NOT NULL DEFAULT 1000,
  verzend_modus text NOT NULL DEFAULT 'eigen_email' CHECK (verzend_modus IN ('eigen_email', 'pdf_download')),
  auto_voorstellen boolean NOT NULL DEFAULT true,
  leveringsadres jsonb,
  standaard_betalingstermijn_dagen int NOT NULL DEFAULT 30,
  standaard_email_template text,
  vereist_leverancier_bevestiging boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inkoop_instellingen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bekijken: eigen organisatie" ON public.inkoop_instellingen
FOR SELECT TO authenticated USING (partner_id = public.get_user_partner_id(auth.uid()) OR public.is_superadmin(auth.uid()));

CREATE POLICY "Beheren: admin tier eigen organisatie" ON public.inkoop_instellingen
FOR ALL TO authenticated
USING (partner_id = public.get_user_partner_id(auth.uid()) AND public.is_admin_tier(auth.uid()))
WITH CHECK (partner_id = public.get_user_partner_id(auth.uid()) AND public.is_admin_tier(auth.uid()));

CREATE POLICY "Superadmin via break-glass" ON public.inkoop_instellingen
AS RESTRICTIVE FOR ALL TO authenticated
USING (NOT public.is_superadmin(auth.uid()) OR public.has_break_glass_access(auth.uid(), partner_id))
WITH CHECK (NOT public.is_superadmin(auth.uid()) OR public.has_break_glass_access(auth.uid(), partner_id));

CREATE TRIGGER trg_inkoop_instellingen_updated
BEFORE UPDATE ON public.inkoop_instellingen
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Inkoopvoorstellen
CREATE TABLE IF NOT EXISTS public.inkoop_voorstellen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  product_id uuid NOT NULL,
  leverancier_id uuid,
  aantal numeric NOT NULL DEFAULT 0,
  reden text NOT NULL CHECK (reden IN ('tekort_opdracht', 'onder_minimum', 'handmatig')),
  opdracht_id uuid,
  inkoopprijs numeric,
  levertijd_dagen int,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'verwerkt', 'genegeerd')),
  inkooporder_id uuid,
  verwerkt_door_id uuid,
  verwerkt_op timestamptz,
  notitie text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inkoop_voorstellen_partner_status
  ON public.inkoop_voorstellen(partner_id, status);
CREATE INDEX IF NOT EXISTS idx_inkoop_voorstellen_leverancier
  ON public.inkoop_voorstellen(leverancier_id);

ALTER TABLE public.inkoop_voorstellen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bekijken: eigen organisatie" ON public.inkoop_voorstellen
FOR SELECT TO authenticated USING (partner_id = public.get_user_partner_id(auth.uid()) OR public.is_superadmin(auth.uid()));

CREATE POLICY "Beheren: admin tier eigen organisatie" ON public.inkoop_voorstellen
FOR ALL TO authenticated
USING (partner_id = public.get_user_partner_id(auth.uid()) AND public.is_admin_tier(auth.uid()))
WITH CHECK (partner_id = public.get_user_partner_id(auth.uid()) AND public.is_admin_tier(auth.uid()));

CREATE POLICY "Superadmin via break-glass" ON public.inkoop_voorstellen
AS RESTRICTIVE FOR ALL TO authenticated
USING (NOT public.is_superadmin(auth.uid()) OR public.has_break_glass_access(auth.uid(), partner_id))
WITH CHECK (NOT public.is_superadmin(auth.uid()) OR public.has_break_glass_access(auth.uid(), partner_id));

CREATE TRIGGER trg_inkoop_voorstellen_updated
BEFORE UPDATE ON public.inkoop_voorstellen
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Inkoop factuur-match (3-way: order, ontvangst, factuur)
CREATE TABLE IF NOT EXISTS public.inkoop_factuur_match (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  inkoopfactuur_id uuid NOT NULL,
  inkooporder_id uuid,
  ontvangst_id uuid,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'akkoord', 'discrepantie', 'goedgekeurd_handmatig')),
  totaal_besteld numeric NOT NULL DEFAULT 0,
  totaal_ontvangen numeric NOT NULL DEFAULT 0,
  totaal_gefactureerd numeric NOT NULL DEFAULT 0,
  verschil_bedrag numeric NOT NULL DEFAULT 0,
  notitie text,
  goedgekeurd_door_id uuid,
  goedgekeurd_op timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inkoop_factuur_match_partner_status
  ON public.inkoop_factuur_match(partner_id, status);

ALTER TABLE public.inkoop_factuur_match ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bekijken: eigen organisatie" ON public.inkoop_factuur_match
FOR SELECT TO authenticated USING (partner_id = public.get_user_partner_id(auth.uid()) OR public.is_superadmin(auth.uid()));

CREATE POLICY "Beheren: admin tier eigen organisatie" ON public.inkoop_factuur_match
FOR ALL TO authenticated
USING (partner_id = public.get_user_partner_id(auth.uid()) AND public.is_admin_tier(auth.uid()))
WITH CHECK (partner_id = public.get_user_partner_id(auth.uid()) AND public.is_admin_tier(auth.uid()));

CREATE POLICY "Superadmin via break-glass" ON public.inkoop_factuur_match
AS RESTRICTIVE FOR ALL TO authenticated
USING (NOT public.is_superadmin(auth.uid()) OR public.has_break_glass_access(auth.uid(), partner_id))
WITH CHECK (NOT public.is_superadmin(auth.uid()) OR public.has_break_glass_access(auth.uid(), partner_id));

CREATE TRIGGER trg_inkoop_factuur_match_updated
BEFORE UPDATE ON public.inkoop_factuur_match
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6) RPC: bereken_inkoop_voorstellen — slimme suggesties
CREATE OR REPLACE FUNCTION public.bereken_inkoop_voorstellen(_partner_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int := 0;
  r record;
  v_huidige_voorraad numeric;
  v_gereserveerd numeric;
  v_vrij numeric;
  v_tekort numeric;
  v_lev record;
BEGIN
  -- Eerst alle openstaande automatische voorstellen leegmaken (handmatige blijven)
  DELETE FROM public.inkoop_voorstellen
   WHERE partner_id = _partner_id
     AND status = 'open'
     AND reden IN ('tekort_opdracht', 'onder_minimum');

  -- Loop door alle producten van de organisatie met min.voorraad of openstaande reserveringen
  FOR r IN
    SELECT p.id AS product_id, p.naam, p.eenheid,
           COALESCE(p.min_voorraad, 0) AS min_voorraad
      FROM public.producten p
     WHERE (p.partner_id = _partner_id OR p.partner_id IS NULL)
       AND p.actief = true
  LOOP
    v_huidige_voorraad := public.get_voorraad_stand(r.product_id);
    v_gereserveerd := public.get_gereserveerd(r.product_id);
    v_vrij := v_huidige_voorraad - v_gereserveerd;

    v_tekort := 0;
    IF v_vrij < r.min_voorraad THEN
      v_tekort := r.min_voorraad - v_vrij;
    END IF;

    IF v_tekort > 0 THEN
      -- Zoek voorkeursleverancier + prijs
      SELECT la.leverancier_id, la.inkoopprijs, la.levertijd_dagen, la.min_bestelhoeveelheid
        INTO v_lev
        FROM public.leverancier_artikelen la
       WHERE la.product_id = r.product_id
         AND la.partner_id = _partner_id
       ORDER BY la.voorkeur DESC, la.inkoopprijs ASC
       LIMIT 1;

      INSERT INTO public.inkoop_voorstellen (
        partner_id, product_id, leverancier_id, aantal, reden,
        inkoopprijs, levertijd_dagen, status
      ) VALUES (
        _partner_id, r.product_id, v_lev.leverancier_id,
        GREATEST(v_tekort, COALESCE(v_lev.min_bestelhoeveelheid, 1)),
        CASE WHEN v_vrij < 0 THEN 'tekort_opdracht' ELSE 'onder_minimum' END,
        v_lev.inkoopprijs, v_lev.levertijd_dagen, 'open'
      );
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

-- 7) RPC: voorstellen omzetten naar concept-inkooporders (gegroepeerd per leverancier)
CREATE OR REPLACE FUNCTION public.inkoop_voorstellen_naar_concept(_voorstel_ids uuid[])
RETURNS TABLE(inkooporder_id uuid, leverancier_id uuid, regelcount int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_partner_id uuid := public.get_user_partner_id(auth.uid());
  v_user uuid := auth.uid();
  r record;
  v_doc_id uuid;
  v_doc_nr text;
  v_regels jsonb;
  v_subtotaal numeric;
  v_btw numeric;
  v_totaal numeric;
BEGIN
  IF v_partner_id IS NULL OR NOT public.is_admin_tier(v_user) THEN
    RAISE EXCEPTION 'Geen rechten';
  END IF;

  FOR r IN
    SELECT v.leverancier_id,
           jsonb_agg(jsonb_build_object(
             'product_id', v.product_id,
             'omschrijving', COALESCE(p.naam, 'Onbekend product'),
             'aantal', v.aantal,
             'eenheid', COALESCE(p.eenheid, 'stuks'),
             'prijs', COALESCE(v.inkoopprijs, 0),
             'btw_percentage', 21,
             'totaal', v.aantal * COALESCE(v.inkoopprijs, 0)
           )) AS regels,
           array_agg(v.id) AS voorstel_ids,
           SUM(v.aantal * COALESCE(v.inkoopprijs, 0)) AS subtotaal
      FROM public.inkoop_voorstellen v
      LEFT JOIN public.producten p ON p.id = v.product_id
     WHERE v.id = ANY(_voorstel_ids)
       AND v.partner_id = v_partner_id
       AND v.status = 'open'
       AND v.leverancier_id IS NOT NULL
     GROUP BY v.leverancier_id
  LOOP
    v_subtotaal := COALESCE(r.subtotaal, 0);
    v_btw := round(v_subtotaal * 0.21, 2);
    v_totaal := v_subtotaal + v_btw;
    v_doc_nr := public.generate_financieel_documentnummer(v_partner_id, 'inkooporder', 'regulier');

    INSERT INTO public.financiele_documenten (
      partner_id, type, factuur_subtype, status, documentnummer,
      created_by, leverancier_id, factuurdatum, regels,
      subtotaal, btw_bedrag, totaal_bedrag,
      betalingstermijn_dagen
    ) VALUES (
      v_partner_id, 'inkooporder', 'regulier', 'concept', v_doc_nr,
      v_user, r.leverancier_id, current_date, r.regels,
      v_subtotaal, v_btw, v_totaal, 30
    ) RETURNING id INTO v_doc_id;

    UPDATE public.inkoop_voorstellen
       SET status = 'verwerkt',
           inkooporder_id = v_doc_id,
           verwerkt_door_id = v_user,
           verwerkt_op = now()
     WHERE id = ANY(r.voorstel_ids);

    inkooporder_id := v_doc_id;
    leverancier_id := r.leverancier_id;
    regelcount := jsonb_array_length(r.regels);
    RETURN NEXT;
  END LOOP;

  RETURN;
END;
$$;

-- 8) Helper: actief email-account voor user
CREATE OR REPLACE VIEW public.v_user_email_account AS
SELECT id, user_id, partner_id, provider, email_adres, actief
  FROM public.email_accounts
 WHERE actief = true;

-- 9) Audit-trigger op inkoop-acties (financiele_documenten van type inkooporder)
CREATE OR REPLACE FUNCTION public.log_inkooporder_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.type::text <> 'inkooporder' THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_entity_change('inkooporder', NEW.id, NEW.partner_id, 'aangemaakt', NULL, NULL, NEW.documentnummer,
      jsonb_build_object('totaal', NEW.totaal_bedrag, 'leverancier_id', NEW.leverancier_id));
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.log_entity_change('inkooporder', NEW.id, NEW.partner_id, 'status_gewijzigd', 'status', OLD.status::text, NEW.status::text);
  END IF;
  IF NEW.goedgekeurd_op IS DISTINCT FROM OLD.goedgekeurd_op AND NEW.goedgekeurd_op IS NOT NULL THEN
    PERFORM public.log_entity_change('inkooporder', NEW.id, NEW.partner_id, 'goedgekeurd', NULL, NULL, NEW.documentnummer,
      jsonb_build_object('door', NEW.goedgekeurd_door_id));
  END IF;
  IF NEW.verzonden_op IS DISTINCT FROM OLD.verzonden_op AND NEW.verzonden_op IS NOT NULL THEN
    PERFORM public.log_entity_change('inkooporder', NEW.id, NEW.partner_id, 'verzonden', NULL, NULL, NEW.documentnummer,
      jsonb_build_object('via', NEW.verzonden_via, 'door', NEW.verzonden_door_id));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_inkooporder ON public.financiele_documenten;
CREATE TRIGGER trg_log_inkooporder
AFTER INSERT OR UPDATE ON public.financiele_documenten
FOR EACH ROW EXECUTE FUNCTION public.log_inkooporder_changes();

-- 10) Module-keys defaults: zorg dat nieuwe modules geregistreerd zijn voor toegangscheck
-- (opt-in: alleen rijen toevoegen die nog niet bestaan voor superadmin/partner_admin/backoffice)
DO $$
DECLARE
  p record;
BEGIN
  FOR p IN SELECT id FROM public.partners LOOP
    INSERT INTO public.module_rol_toegang (partner_id, module_key, rol, toegestaan) VALUES
      (p.id, 'inkoop', 'backoffice', true),
      (p.id, 'inkoop_voorstellen', 'backoffice', true),
      (p.id, 'inkoop_match', 'backoffice', true)
    ON CONFLICT (partner_id, module_key, rol) DO NOTHING;
  END LOOP;
END $$;
