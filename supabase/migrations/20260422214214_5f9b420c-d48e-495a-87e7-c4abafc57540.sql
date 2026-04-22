
-- ============================================
-- SPRINT 3: Leverancier-prijslijsten + Inkoop-ontvangsten + Retouren
-- ============================================

-- 1. LEVERANCIER_ARTIKELEN: prijslijsten per leverancier per product
CREATE TABLE public.leverancier_artikelen (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  leverancier_id uuid NOT NULL REFERENCES public.leveranciers(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.producten(id) ON DELETE CASCADE,
  leverancier_artikelnummer text,
  inkoopprijs numeric(12,2) NOT NULL DEFAULT 0,
  min_bestelhoeveelheid numeric(12,2) NOT NULL DEFAULT 1,
  levertijd_dagen integer DEFAULT 7,
  voorkeur boolean NOT NULL DEFAULT false,
  notities text,
  laatst_gewijzigd timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (leverancier_id, product_id)
);

CREATE INDEX idx_leverancier_artikelen_partner ON public.leverancier_artikelen(partner_id);
CREATE INDEX idx_leverancier_artikelen_product ON public.leverancier_artikelen(product_id);
CREATE INDEX idx_leverancier_artikelen_lev ON public.leverancier_artikelen(leverancier_id);

ALTER TABLE public.leverancier_artikelen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leverancier_artikelen_select_partner"
ON public.leverancier_artikelen FOR SELECT
USING (partner_id = public.get_user_partner_id(auth.uid()) OR public.is_superadmin(auth.uid()));

CREATE POLICY "leverancier_artikelen_insert_partner"
ON public.leverancier_artikelen FOR INSERT
WITH CHECK (partner_id = public.get_user_partner_id(auth.uid()) AND public.is_admin_tier(auth.uid()));

CREATE POLICY "leverancier_artikelen_update_partner"
ON public.leverancier_artikelen FOR UPDATE
USING (partner_id = public.get_user_partner_id(auth.uid()) AND public.is_admin_tier(auth.uid()));

CREATE POLICY "leverancier_artikelen_delete_partner"
ON public.leverancier_artikelen FOR DELETE
USING (partner_id = public.get_user_partner_id(auth.uid()) AND public.is_admin_tier(auth.uid()));

CREATE TRIGGER trg_leverancier_artikelen_updated
BEFORE UPDATE ON public.leverancier_artikelen
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. INKOOP_ONTVANGSTEN: registratie van ontvangen goederen per inkooporder
CREATE TABLE public.inkoop_ontvangsten (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  inkooporder_id uuid NOT NULL REFERENCES public.financiele_documenten(id) ON DELETE CASCADE,
  ontvangstdatum date NOT NULL DEFAULT current_date,
  ontvangen_door uuid REFERENCES public.users(id) ON DELETE SET NULL,
  regels jsonb NOT NULL DEFAULT '[]'::jsonb,
  fotos jsonb DEFAULT '[]'::jsonb,
  opmerking text,
  discrepantie boolean NOT NULL DEFAULT false,
  voorraad_geboekt boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inkoop_ontvangsten_partner ON public.inkoop_ontvangsten(partner_id);
CREATE INDEX idx_inkoop_ontvangsten_order ON public.inkoop_ontvangsten(inkooporder_id);

ALTER TABLE public.inkoop_ontvangsten ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inkoop_ontvangsten_select_partner"
ON public.inkoop_ontvangsten FOR SELECT
USING (partner_id = public.get_user_partner_id(auth.uid()) OR public.is_superadmin(auth.uid()));

CREATE POLICY "inkoop_ontvangsten_insert_partner"
ON public.inkoop_ontvangsten FOR INSERT
WITH CHECK (partner_id = public.get_user_partner_id(auth.uid()));

CREATE POLICY "inkoop_ontvangsten_update_partner"
ON public.inkoop_ontvangsten FOR UPDATE
USING (partner_id = public.get_user_partner_id(auth.uid()));

CREATE POLICY "inkoop_ontvangsten_delete_partner"
ON public.inkoop_ontvangsten FOR DELETE
USING (partner_id = public.get_user_partner_id(auth.uid()) AND public.is_admin_tier(auth.uid()));

CREATE TRIGGER trg_inkoop_ontvangsten_updated
BEFORE UPDATE ON public.inkoop_ontvangsten
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. RETOUREN: RMA voor klantretouren of leverancier-retouren
CREATE TABLE public.retouren (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  rma_nummer text NOT NULL,
  type text NOT NULL CHECK (type IN ('klant_retour','leverancier_retour')),
  status text NOT NULL DEFAULT 'aangemeld' CHECK (status IN ('aangemeld','goedgekeurd','verzonden','ontvangen','afgehandeld','afgewezen')),
  opdracht_id uuid REFERENCES public.opdrachten(id) ON DELETE SET NULL,
  installatie_id uuid REFERENCES public.installaties(id) ON DELETE SET NULL,
  klant_id uuid REFERENCES public.klanten(id) ON DELETE SET NULL,
  leverancier_id uuid REFERENCES public.leveranciers(id) ON DELETE SET NULL,
  inkooporder_id uuid REFERENCES public.financiele_documenten(id) ON DELETE SET NULL,
  regels jsonb NOT NULL DEFAULT '[]'::jsonb,
  reden text NOT NULL,
  oplossing text CHECK (oplossing IS NULL OR oplossing IN ('creditnota','vervangend_product','reparatie','geen')),
  fotos jsonb DEFAULT '[]'::jsonb,
  notities text,
  gemaakt_door uuid REFERENCES public.users(id) ON DELETE SET NULL,
  afgehandeld_op timestamptz,
  afgehandeld_door uuid REFERENCES public.users(id) ON DELETE SET NULL,
  creditnota_id uuid REFERENCES public.financiele_documenten(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_id, rma_nummer)
);

CREATE INDEX idx_retouren_partner ON public.retouren(partner_id);
CREATE INDEX idx_retouren_status ON public.retouren(status);
CREATE INDEX idx_retouren_opdracht ON public.retouren(opdracht_id);
CREATE INDEX idx_retouren_klant ON public.retouren(klant_id);
CREATE INDEX idx_retouren_leverancier ON public.retouren(leverancier_id);

ALTER TABLE public.retouren ENABLE ROW LEVEL SECURITY;

CREATE POLICY "retouren_select_partner"
ON public.retouren FOR SELECT
USING (partner_id = public.get_user_partner_id(auth.uid()) OR public.is_superadmin(auth.uid()));

CREATE POLICY "retouren_insert_partner"
ON public.retouren FOR INSERT
WITH CHECK (partner_id = public.get_user_partner_id(auth.uid()));

CREATE POLICY "retouren_update_partner"
ON public.retouren FOR UPDATE
USING (partner_id = public.get_user_partner_id(auth.uid()));

CREATE POLICY "retouren_delete_partner"
ON public.retouren FOR DELETE
USING (partner_id = public.get_user_partner_id(auth.uid()) AND public.is_admin_tier(auth.uid()));

CREATE TRIGGER trg_retouren_updated
BEFORE UPDATE ON public.retouren
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. RMA-nummergenerator
CREATE OR REPLACE FUNCTION public.generate_rma_nummer(_partner_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _year text;
  _count integer;
BEGIN
  _year := to_char(now(), 'YYYY');
  SELECT COUNT(*) + 1 INTO _count
  FROM public.retouren
  WHERE partner_id = _partner_id
    AND extract(year from created_at) = extract(year from now());
  RETURN 'RMA-' || _year || '-' || lpad(_count::text, 4, '0');
END;
$$;

-- 5. Trigger op inkoop_ontvangsten: zet voorraadmutaties weg en flag de inkooporder
CREATE OR REPLACE FUNCTION public.boek_voorraad_uit_ontvangst()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r jsonb;
  v_product_id uuid;
  v_aantal numeric;
  v_besteld numeric;
  v_totaal_ontvangen numeric;
  v_totaal_besteld numeric;
  v_discrepantie boolean := false;
BEGIN
  IF NEW.voorraad_geboekt = true THEN
    RETURN NEW;
  END IF;

  -- Loop door regels en boek voorraad bij
  FOR r IN SELECT * FROM jsonb_array_elements(NEW.regels)
  LOOP
    v_product_id := NULLIF(r->>'product_id','')::uuid;
    v_aantal := COALESCE((r->>'ontvangen_aantal')::numeric, 0);
    v_besteld := COALESCE((r->>'besteld_aantal')::numeric, 0);

    IF v_product_id IS NOT NULL AND v_aantal > 0 THEN
      INSERT INTO public.voorraad_mutaties (
        partner_id, product_id, type, aantal, referentie_type, referentie_id, notitie, gemaakt_door
      ) VALUES (
        NEW.partner_id, v_product_id, 'inkomend', v_aantal,
        'inkoop_ontvangst', NEW.id,
        'Ontvangst inkooporder ' || NEW.inkooporder_id::text,
        NEW.ontvangen_door
      );
    END IF;

    IF v_aantal <> v_besteld THEN
      v_discrepantie := true;
    END IF;
  END LOOP;

  NEW.voorraad_geboekt := true;
  NEW.discrepantie := v_discrepantie;

  -- Update status van inkooporder
  SELECT
    COALESCE(SUM((reg->>'aantal')::numeric), 0)
    INTO v_totaal_besteld
  FROM public.financiele_documenten fd,
       jsonb_array_elements(fd.regels) reg
  WHERE fd.id = NEW.inkooporder_id;

  SELECT COALESCE(SUM((reg->>'ontvangen_aantal')::numeric), 0)
    INTO v_totaal_ontvangen
  FROM public.inkoop_ontvangsten io,
       jsonb_array_elements(io.regels) reg
  WHERE io.inkooporder_id = NEW.inkooporder_id;

  IF v_totaal_ontvangen >= v_totaal_besteld AND v_totaal_besteld > 0 THEN
    UPDATE public.financiele_documenten
       SET status = 'volledig_ontvangen'
     WHERE id = NEW.inkooporder_id
       AND status::text NOT IN ('volledig_ontvangen','betaald');
  ELSIF v_totaal_ontvangen > 0 THEN
    UPDATE public.financiele_documenten
       SET status = 'deels_ontvangen'
     WHERE id = NEW.inkooporder_id
       AND status::text NOT IN ('volledig_ontvangen','betaald','deels_ontvangen');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_inkoop_ontvangst_voorraad
BEFORE INSERT ON public.inkoop_ontvangsten
FOR EACH ROW EXECUTE FUNCTION public.boek_voorraad_uit_ontvangst();

-- 6. Trigger op retouren: zet RMA-nummer en zorg voor voorraadmutatie bij type leverancier_retour
CREATE OR REPLACE FUNCTION public.set_rma_nummer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.rma_nummer IS NULL OR NEW.rma_nummer = '' THEN
    NEW.rma_nummer := public.generate_rma_nummer(NEW.partner_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_retouren_rma_nummer
BEFORE INSERT ON public.retouren
FOR EACH ROW EXECUTE FUNCTION public.set_rma_nummer();

-- 7. Helper: vind goedkoopste leverancier voor een product
CREATE OR REPLACE FUNCTION public.suggest_leverancier(_product_id uuid, _partner_id uuid)
RETURNS TABLE (leverancier_id uuid, leverancier_naam text, inkoopprijs numeric, levertijd_dagen integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT la.leverancier_id, l.naam, la.inkoopprijs, la.levertijd_dagen
  FROM public.leverancier_artikelen la
  JOIN public.leveranciers l ON l.id = la.leverancier_id
  WHERE la.product_id = _product_id
    AND la.partner_id = _partner_id
  ORDER BY la.voorkeur DESC, la.inkoopprijs ASC
  LIMIT 1;
$$;
