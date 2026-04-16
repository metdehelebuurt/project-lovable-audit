
-- Create document type enum
CREATE TYPE public.financieel_document_type AS ENUM (
  'verkoopfactuur', 'creditnota', 'inkoopfactuur', 'inkooporder', 'pakbon'
);

-- Create document status enum
CREATE TYPE public.financieel_document_status AS ENUM (
  'concept', 'verzonden', 'betaald', 'verlopen', 'gecrediteerd',
  'ontvangen', 'goedgekeurd',
  'deels_ontvangen', 'volledig_ontvangen',
  'aangemaakt', 'afgeleverd'
);

-- ============================================================
-- LEVERANCIERS TABLE
-- ============================================================
CREATE TABLE public.leveranciers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id uuid NOT NULL,
  naam text NOT NULL,
  email text,
  telefoon text,
  adres text,
  postcode text,
  plaats text,
  kvk_nummer text,
  btw_nummer text,
  iban text,
  contactpersoon text,
  notities text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.leveranciers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner admin/staff zien eigen leveranciers"
  ON public.leveranciers FOR SELECT TO authenticated
  USING (
    (get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role, 'adviseur'::app_role]))
    AND partner_id = get_user_partner_id(auth.uid())
  );

CREATE POLICY "Superadmin ziet alle leveranciers"
  ON public.leveranciers FOR SELECT TO authenticated
  USING (is_superadmin(auth.uid()));

CREATE POLICY "Partner admin/staff maken leveranciers"
  ON public.leveranciers FOR INSERT TO authenticated
  WITH CHECK (
    is_superadmin(auth.uid()) OR (
      (get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role]))
      AND partner_id = get_user_partner_id(auth.uid())
    )
  );

CREATE POLICY "Partner admin/staff bewerken leveranciers"
  ON public.leveranciers FOR UPDATE TO authenticated
  USING (
    is_superadmin(auth.uid()) OR (
      (get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role]))
      AND partner_id = get_user_partner_id(auth.uid())
    )
  );

CREATE POLICY "Partner admin verwijdert leveranciers"
  ON public.leveranciers FOR DELETE TO authenticated
  USING (
    is_superadmin(auth.uid()) OR (
      get_user_role(auth.uid()) = 'partner_admin'::app_role
      AND partner_id = get_user_partner_id(auth.uid())
    )
  );

CREATE TRIGGER update_leveranciers_updated_at
  BEFORE UPDATE ON public.leveranciers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- FINANCIELE_DOCUMENTEN TABLE
-- ============================================================
CREATE TABLE public.financiele_documenten (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id uuid NOT NULL,
  type public.financieel_document_type NOT NULL,
  documentnummer text NOT NULL,
  status public.financieel_document_status NOT NULL DEFAULT 'concept',
  klant_id uuid REFERENCES public.klanten(id) ON DELETE SET NULL,
  leverancier_id uuid REFERENCES public.leveranciers(id) ON DELETE SET NULL,
  opdracht_id uuid,
  offerte_id uuid REFERENCES public.offertes(id) ON DELETE SET NULL,
  regels jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotaal numeric NOT NULL DEFAULT 0,
  btw_bedrag numeric NOT NULL DEFAULT 0,
  totaal_bedrag numeric NOT NULL DEFAULT 0,
  korting_totaal numeric NOT NULL DEFAULT 0,
  factuurdatum date NOT NULL DEFAULT CURRENT_DATE,
  vervaldatum date,
  betaald_op timestamp with time zone,
  betaald_via text,
  betalingstermijn_dagen integer NOT NULL DEFAULT 30,
  notities text,
  pdf_url text,
  verzonden_op timestamp with time zone,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.financiele_documenten ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner admin/staff zien eigen documenten"
  ON public.financiele_documenten FOR SELECT TO authenticated
  USING (
    (get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role, 'adviseur'::app_role]))
    AND partner_id = get_user_partner_id(auth.uid())
  );

CREATE POLICY "Superadmin ziet alle financiele documenten"
  ON public.financiele_documenten FOR SELECT TO authenticated
  USING (is_superadmin(auth.uid()));

CREATE POLICY "Partner admin/staff maken documenten"
  ON public.financiele_documenten FOR INSERT TO authenticated
  WITH CHECK (
    is_superadmin(auth.uid()) OR (
      (get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role, 'adviseur'::app_role]))
      AND partner_id = get_user_partner_id(auth.uid())
    )
  );

CREATE POLICY "Partner admin/staff bewerken documenten"
  ON public.financiele_documenten FOR UPDATE TO authenticated
  USING (
    is_superadmin(auth.uid()) OR (
      (get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role]))
      AND partner_id = get_user_partner_id(auth.uid())
    )
  );

CREATE POLICY "Partner admin verwijdert documenten"
  ON public.financiele_documenten FOR DELETE TO authenticated
  USING (
    is_superadmin(auth.uid()) OR (
      get_user_role(auth.uid()) = 'partner_admin'::app_role
      AND partner_id = get_user_partner_id(auth.uid())
    )
  );

CREATE TRIGGER update_financiele_documenten_updated_at
  BEFORE UPDATE ON public.financiele_documenten
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- AUTO-NUMBERING FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_financieel_documentnummer(
  _partner_id uuid,
  _type public.financieel_document_type
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _prefix text;
  _year text;
  _count integer;
BEGIN
  _year := to_char(now(), 'YYYY');
  
  CASE _type
    WHEN 'verkoopfactuur' THEN _prefix := 'VF';
    WHEN 'creditnota' THEN _prefix := 'CN';
    WHEN 'inkoopfactuur' THEN _prefix := 'IF';
    WHEN 'inkooporder' THEN _prefix := 'IO';
    WHEN 'pakbon' THEN _prefix := 'PB';
  END CASE;
  
  SELECT COUNT(*) + 1 INTO _count
  FROM public.financiele_documenten
  WHERE partner_id = _partner_id
    AND type = _type
    AND extract(year from created_at) = extract(year from now());
  
  RETURN _prefix || '-' || _year || '-' || lpad(_count::text, 4, '0');
END;
$$;

-- Index for performance
CREATE INDEX idx_financiele_documenten_partner_type ON public.financiele_documenten(partner_id, type);
CREATE INDEX idx_financiele_documenten_status ON public.financiele_documenten(status);
CREATE INDEX idx_financiele_documenten_klant ON public.financiele_documenten(klant_id);
CREATE INDEX idx_financiele_documenten_leverancier ON public.financiele_documenten(leverancier_id);
CREATE INDEX idx_leveranciers_partner ON public.leveranciers(partner_id);
