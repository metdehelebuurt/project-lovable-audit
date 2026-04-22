-- Sprint 2: Logistiek & serienummers
-- ============================================

-- 1) opdracht_zendingen
CREATE TABLE public.opdracht_zendingen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  opdracht_id uuid NOT NULL,
  vervoerder text NOT NULL DEFAULT 'eigen_bezorging',
  trackingnummer text,
  tracking_url text,
  status text NOT NULL DEFAULT 'gepland', -- gepland | onderweg | geleverd | geannuleerd
  verzenddatum timestamptz,
  verwachte_leverdatum date,
  afleverdatum timestamptz,
  ontvangen_door text,
  foto_aflevering_url text,
  notitie text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_opdracht_zendingen_opdracht ON public.opdracht_zendingen(opdracht_id);
CREATE INDEX idx_opdracht_zendingen_partner_status ON public.opdracht_zendingen(partner_id, status);

ALTER TABLE public.opdracht_zendingen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner kan zendingen zien"
  ON public.opdracht_zendingen FOR SELECT
  USING (public.is_superadmin(auth.uid()) OR partner_id = public.get_user_partner_id(auth.uid()));

CREATE POLICY "Partner kan zendingen aanmaken"
  ON public.opdracht_zendingen FOR INSERT
  WITH CHECK (public.is_superadmin(auth.uid()) OR partner_id = public.get_user_partner_id(auth.uid()));

CREATE POLICY "Partner kan zendingen bijwerken"
  ON public.opdracht_zendingen FOR UPDATE
  USING (public.is_superadmin(auth.uid()) OR partner_id = public.get_user_partner_id(auth.uid()));

CREATE POLICY "Partner kan zendingen verwijderen"
  ON public.opdracht_zendingen FOR DELETE
  USING (public.is_superadmin(auth.uid()) OR partner_id = public.get_user_partner_id(auth.uid()));

CREATE TRIGGER set_opdracht_zendingen_updated_at
  BEFORE UPDATE ON public.opdracht_zendingen
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) product_serienummers
CREATE TABLE public.product_serienummers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  product_id uuid NOT NULL,
  serienummer text NOT NULL,
  opdracht_id uuid,
  installatie_id uuid,
  klant_id uuid,
  zending_id uuid REFERENCES public.opdracht_zendingen(id) ON DELETE SET NULL,
  levering_datum date,
  garantie_einddatum date,
  garantie_maanden integer,
  status text NOT NULL DEFAULT 'geleverd', -- voorraad | geleverd | geinstalleerd | retour | defect
  notitie text,
  geregistreerd_door uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_product_serienummers_uniek
  ON public.product_serienummers(partner_id, product_id, serienummer);
CREATE INDEX idx_product_serienummers_klant ON public.product_serienummers(klant_id);
CREATE INDEX idx_product_serienummers_installatie ON public.product_serienummers(installatie_id);
CREATE INDEX idx_product_serienummers_opdracht ON public.product_serienummers(opdracht_id);

ALTER TABLE public.product_serienummers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner kan serienummers zien"
  ON public.product_serienummers FOR SELECT
  USING (public.is_superadmin(auth.uid()) OR partner_id = public.get_user_partner_id(auth.uid()));

CREATE POLICY "Partner kan serienummers aanmaken"
  ON public.product_serienummers FOR INSERT
  WITH CHECK (public.is_superadmin(auth.uid()) OR partner_id = public.get_user_partner_id(auth.uid()));

CREATE POLICY "Partner kan serienummers bijwerken"
  ON public.product_serienummers FOR UPDATE
  USING (public.is_superadmin(auth.uid()) OR partner_id = public.get_user_partner_id(auth.uid()));

CREATE POLICY "Partner kan serienummers verwijderen"
  ON public.product_serienummers FOR DELETE
  USING (public.is_superadmin(auth.uid()) OR partner_id = public.get_user_partner_id(auth.uid()));

CREATE TRIGGER set_product_serienummers_updated_at
  BEFORE UPDATE ON public.product_serienummers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();