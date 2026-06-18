
-- ============================================================
-- AFFILIATE SALES CRM — koude leads pool, eigen pipeline, gesprekken
-- ============================================================

-- Status enum voor affiliate leads
DO $$ BEGIN
  CREATE TYPE public.affiliate_lead_status AS ENUM (
    'nieuw', 'gebeld_geen_gehoor', 'gesprek_gepland', 'in_gesprek',
    'voorstel_verstuurd', 'gewonnen', 'verloren'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.affiliate_lead_bron AS ENUM ('platform_pool', 'eigen_import', 'referral_klik');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.affiliate_contact_type AS ENUM ('telefoon', 'email', 'notitie', 'afspraak');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1) affiliate_leads
CREATE TABLE IF NOT EXISTS public.affiliate_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bedrijfsnaam text NOT NULL,
  contactpersoon text,
  email text,
  telefoon text,
  branche text,
  regio text,
  website text,
  status public.affiliate_lead_status NOT NULL DEFAULT 'nieuw',
  geschatte_waarde numeric(12,2) DEFAULT 0,
  eigenaar_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  bron public.affiliate_lead_bron NOT NULL DEFAULT 'platform_pool',
  volgende_actie_datum date,
  notities text,
  gewonnen_partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  verloren_reden text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_leads TO authenticated;
GRANT ALL ON public.affiliate_leads TO service_role;

ALTER TABLE public.affiliate_leads ENABLE ROW LEVEL SECURITY;

-- helper: is huidige user een affiliate?
CREATE OR REPLACE FUNCTION public.is_affiliate(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.users WHERE id = _user_id AND rol = 'affiliate');
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.users WHERE id = _user_id AND rol = 'superadmin');
$$;

-- Affiliate ziet: eigen leads + pool (eigenaar_id IS NULL). Superadmin alles.
CREATE POLICY "affiliate_leads_select_own_or_pool"
  ON public.affiliate_leads FOR SELECT TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (public.is_affiliate(auth.uid()) AND (eigenaar_id = auth.uid() OR eigenaar_id IS NULL))
  );

-- Affiliate mag een lead aanmaken voor zichzelf (eigen_import). Superadmin altijd.
CREATE POLICY "affiliate_leads_insert"
  ON public.affiliate_leads FOR INSERT TO authenticated
  WITH CHECK (
    public.is_superadmin(auth.uid())
    OR (public.is_affiliate(auth.uid()) AND eigenaar_id = auth.uid() AND bron = 'eigen_import')
  );

-- Affiliate mag eigen leads updaten of een pool-lead claimen (eigenaar wordt zichzelf).
CREATE POLICY "affiliate_leads_update"
  ON public.affiliate_leads FOR UPDATE TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (public.is_affiliate(auth.uid()) AND (eigenaar_id = auth.uid() OR eigenaar_id IS NULL))
  )
  WITH CHECK (
    public.is_superadmin(auth.uid())
    OR (public.is_affiliate(auth.uid()) AND eigenaar_id = auth.uid())
  );

-- Affiliate mag eigen lead verwijderen, superadmin alles
CREATE POLICY "affiliate_leads_delete"
  ON public.affiliate_leads FOR DELETE TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (public.is_affiliate(auth.uid()) AND eigenaar_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_affiliate_leads_eigenaar ON public.affiliate_leads(eigenaar_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_leads_status ON public.affiliate_leads(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_leads_pool ON public.affiliate_leads(eigenaar_id) WHERE eigenaar_id IS NULL;

-- updated_at trigger (gebruik bestaande generieke functie als die er is)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_affiliate_leads_updated_at ON public.affiliate_leads;
CREATE TRIGGER trg_affiliate_leads_updated_at
  BEFORE UPDATE ON public.affiliate_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) contactmomenten
CREATE TABLE IF NOT EXISTS public.affiliate_lead_contactmomenten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.affiliate_leads(id) ON DELETE CASCADE,
  affiliate_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type public.affiliate_contact_type NOT NULL DEFAULT 'telefoon',
  uitkomst text,
  notitie text,
  duur_seconden integer,
  volgende_actie_datum date,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_lead_contactmomenten TO authenticated;
GRANT ALL ON public.affiliate_lead_contactmomenten TO service_role;

ALTER TABLE public.affiliate_lead_contactmomenten ENABLE ROW LEVEL SECURITY;

CREATE POLICY "affiliate_contact_select"
  ON public.affiliate_lead_contactmomenten FOR SELECT TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR affiliate_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.affiliate_leads l WHERE l.id = lead_id AND l.eigenaar_id = auth.uid())
  );

CREATE POLICY "affiliate_contact_insert"
  ON public.affiliate_lead_contactmomenten FOR INSERT TO authenticated
  WITH CHECK (
    public.is_superadmin(auth.uid())
    OR (affiliate_id = auth.uid() AND public.is_affiliate(auth.uid()))
  );

CREATE POLICY "affiliate_contact_update_delete_own"
  ON public.affiliate_lead_contactmomenten FOR UPDATE TO authenticated
  USING (public.is_superadmin(auth.uid()) OR affiliate_id = auth.uid())
  WITH CHECK (public.is_superadmin(auth.uid()) OR affiliate_id = auth.uid());

CREATE POLICY "affiliate_contact_delete"
  ON public.affiliate_lead_contactmomenten FOR DELETE TO authenticated
  USING (public.is_superadmin(auth.uid()) OR affiliate_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_affiliate_contact_lead ON public.affiliate_lead_contactmomenten(lead_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_contact_affiliate ON public.affiliate_lead_contactmomenten(affiliate_id);

-- 3) RPC voor atomic claim van een pool-lead
CREATE OR REPLACE FUNCTION public.claim_affiliate_lead(_lead_id uuid)
RETURNS public.affiliate_leads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user uuid := auth.uid();
  _row public.affiliate_leads;
BEGIN
  IF _user IS NULL THEN
    RAISE EXCEPTION 'Niet ingelogd';
  END IF;
  IF NOT public.is_affiliate(_user) AND NOT public.is_superadmin(_user) THEN
    RAISE EXCEPTION 'Alleen affiliates mogen leads claimen';
  END IF;

  UPDATE public.affiliate_leads
  SET eigenaar_id = _user, claimed_at = now(), status = CASE WHEN status = 'nieuw' THEN 'nieuw' ELSE status END
  WHERE id = _lead_id AND eigenaar_id IS NULL
  RETURNING * INTO _row;

  IF _row.id IS NULL THEN
    RAISE EXCEPTION 'Lead is al geclaimd of bestaat niet';
  END IF;

  RETURN _row;
END $$;

GRANT EXECUTE ON FUNCTION public.claim_affiliate_lead(uuid) TO authenticated;
