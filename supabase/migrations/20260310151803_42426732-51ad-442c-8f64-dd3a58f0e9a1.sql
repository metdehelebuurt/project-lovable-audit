
-- =============================================
-- MIJNHUIS.NU DATABASE SCHEMA - FASE 1
-- =============================================

-- 1. ENUMS
CREATE TYPE public.app_role AS ENUM ('superadmin', 'partner_admin', 'partner_staff', 'adviseur', 'installateur', 'consument');
CREATE TYPE public.user_status AS ENUM ('actief', 'inactief');
CREATE TYPE public.partner_status AS ENUM ('in_review', 'actief', 'inactief', 'geblokkeerd');
CREATE TYPE public.lead_status AS ENUM ('nieuw', 'gekwalificeerd', 'offerte_verzonden', 'klant', 'verloren');
CREATE TYPE public.schouw_categorie AS ENUM ('zonnepanelen', 'warmtepomp', 'isolatie_dak', 'isolatie_muur', 'isolatie_vloer', 'hr_glas', 'ventilatie', 'thuisbatterij');
CREATE TYPE public.schouw_status AS ENUM ('gepland', 'uitgevoerd', 'geannuleerd');
CREATE TYPE public.offerte_status AS ENUM ('concept', 'verzonden', 'geaccepteerd', 'afgewezen', 'verlopen');
CREATE TYPE public.installatie_status AS ENUM ('gepland', 'in_uitvoering', 'afgerond', 'geannuleerd');
CREATE TYPE public.ticket_prioriteit AS ENUM ('laag', 'normaal', 'hoog', 'urgent');
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_behandeling', 'wacht_op_klant', 'opgelost', 'gesloten');
CREATE TYPE public.document_entity_type AS ENUM ('lead', 'schouw', 'offerte', 'installatie');
CREATE TYPE public.document_type AS ENUM ('contract', 'foto', 'certificaat', 'rapport', 'overig');
CREATE TYPE public.product_categorie AS ENUM ('zonnepanelen', 'thuisbatterij', 'warmtepomp', 'laadpaal', 'omvormer', 'accessoires', 'installatiemateriaal');
CREATE TYPE public.product_status AS ENUM ('actief', 'uitgefaseerd', 'niet_beschikbaar');

-- 2. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 3. PARTNERS TABLE
CREATE TABLE public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  naam TEXT NOT NULL,
  email TEXT,
  telefoonnummer TEXT,
  website TEXT,
  adres TEXT,
  postcode TEXT,
  plaats TEXT,
  kvk TEXT,
  btw TEXT,
  contactpersoon_voornaam TEXT,
  contactpersoon_achternaam TEXT,
  contactpersoon_functie TEXT,
  contactpersoon_email TEXT,
  contactpersoon_telefoon TEXT,
  contract_startdatum DATE,
  contract_type TEXT,
  commissie_percentage NUMERIC,
  status public.partner_status NOT NULL DEFAULT 'in_review',
  abonnement_type TEXT,
  licentie_adviseurs INTEGER,
  licentie_installateurs INTEGER,
  feature_flags_json JSONB,
  logo_url TEXT,
  notities TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON public.partners
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. USERS TABLE (profiles linked to auth.users)
CREATE TABLE public.users (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  rol public.app_role NOT NULL DEFAULT 'consument',
  voornaam TEXT NOT NULL,
  achternaam TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefoon TEXT,
  status public.user_status NOT NULL DEFAULT 'actief',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. SECURITY DEFINER FUNCTIONS (for RLS without recursion)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rol FROM public.users WHERE id = _user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_partner_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT partner_id FROM public.users WHERE id = _user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = _user_id AND rol = 'superadmin');
$$;

-- 6. LEADS TABLE
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  voornaam TEXT NOT NULL,
  achternaam TEXT NOT NULL,
  email TEXT NOT NULL,
  telefoon TEXT,
  bedrijfsnaam TEXT,
  adres TEXT,
  postcode TEXT,
  plaats TEXT,
  lead_status public.lead_status NOT NULL DEFAULT 'nieuw',
  bron TEXT,
  notities TEXT,
  toegewezen_aan UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. SCHOUWEN TABLE
CREATE TABLE public.schouwen (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schouw_nummer TEXT NOT NULL UNIQUE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  adviseur_id UUID NOT NULL REFERENCES public.users(id),
  installateur_id UUID REFERENCES public.users(id),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  categorie public.schouw_categorie NOT NULL,
  status public.schouw_status NOT NULL DEFAULT 'gepland',
  geplande_datum DATE NOT NULL,
  klant_email TEXT,
  consument_naam TEXT,
  notities TEXT,
  gegevens JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_schouwen_updated_at BEFORE UPDATE ON public.schouwen
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. OFFERTES TABLE
CREATE TABLE public.offertes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offertenummer TEXT NOT NULL UNIQUE,
  lead_id UUID REFERENCES public.leads(id),
  schouw_id UUID REFERENCES public.schouwen(id),
  adviseur_id UUID NOT NULL REFERENCES public.users(id),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  klant_naam TEXT NOT NULL,
  klant_email TEXT NOT NULL,
  klant_telefoon TEXT,
  klant_adres TEXT,
  klant_postcode TEXT,
  klant_plaats TEXT,
  status public.offerte_status NOT NULL DEFAULT 'concept',
  regels JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotaal NUMERIC NOT NULL DEFAULT 0,
  btw_bedrag NUMERIC NOT NULL DEFAULT 0,
  totaal_bedrag NUMERIC NOT NULL DEFAULT 0,
  geldig_tot DATE NOT NULL DEFAULT (now() + interval '30 days')::date,
  betalingsvoorwaarden TEXT DEFAULT '30 dagen netto',
  notities TEXT,
  feedback_berichten JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_offertes_updated_at BEFORE UPDATE ON public.offertes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. PRODUCTEN TABLE
CREATE TABLE public.producten (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  naam TEXT NOT NULL,
  categorie public.product_categorie NOT NULL,
  merk TEXT,
  model TEXT,
  omschrijving TEXT,
  status public.product_status NOT NULL DEFAULT 'actief',
  prijs_excl_btw NUMERIC NOT NULL DEFAULT 0,
  kostprijs NUMERIC,
  eenheid TEXT DEFAULT 'stuk',
  voorraad INTEGER,
  btw_percentage INTEGER DEFAULT 21,
  max_korting_euro NUMERIC,
  max_korting_percentage NUMERIC,
  product_code TEXT,
  leverancier TEXT,
  artikelnummer TEXT,
  ean_code TEXT,
  levertijd TEXT,
  garantie_jaren INTEGER,
  certificeringen TEXT,
  installatie_instructies TEXT,
  onderhoud TEXT,
  afbeelding_url TEXT,
  afbeeldingen JSONB,
  specs JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_producten_updated_at BEFORE UPDATE ON public.producten
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. INSTALLATIES TABLE
CREATE TABLE public.installaties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  offerte_id UUID REFERENCES public.offertes(id),
  lead_id UUID REFERENCES public.leads(id),
  installateur_id UUID REFERENCES public.users(id),
  consument_id UUID REFERENCES public.users(id),
  consument_naam TEXT,
  status public.installatie_status NOT NULL DEFAULT 'gepland',
  geplande_startdatum DATE,
  geplande_einddatum DATE,
  notities TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_installaties_updated_at BEFORE UPDATE ON public.installaties
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. TICKETS TABLE
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  consument_id UUID NOT NULL REFERENCES public.users(id),
  ticketnummer TEXT NOT NULL UNIQUE,
  onderwerp TEXT NOT NULL,
  categorie TEXT,
  prioriteit public.ticket_prioriteit NOT NULL DEFAULT 'normaal',
  beschrijving TEXT NOT NULL,
  status public.ticket_status NOT NULL DEFAULT 'open',
  berichten_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON public.tickets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. DOCUMENTEN TABLE
CREATE TABLE public.documenten (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  entity_type public.document_entity_type NOT NULL,
  entity_id UUID NOT NULL,
  consument_id UUID REFERENCES public.users(id),
  naam TEXT NOT NULL,
  type public.document_type NOT NULL DEFAULT 'overig',
  bestand_url TEXT NOT NULL,
  bestand_grootte INTEGER,
  mime_type TEXT,
  geupload_door_id UUID NOT NULL REFERENCES public.users(id),
  beschrijving TEXT,
  tags JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_documenten_updated_at BEFORE UPDATE ON public.documenten
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 13. NOTIFICATIES TABLE
CREATE TABLE public.notificaties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  titel TEXT NOT NULL,
  bericht TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  gelezen BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. CONSUMENTEN TABLE
CREATE TABLE public.consumenten (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id),
  voornaam TEXT,
  achternaam TEXT,
  email TEXT,
  telefoon TEXT,
  adres TEXT,
  postcode TEXT,
  plaats TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_consumenten_updated_at BEFORE UPDATE ON public.consumenten
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- PARTNERS RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin ziet alle partners" ON public.partners
  FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Users zien eigen partner" ON public.partners
  FOR SELECT TO authenticated
  USING (id = public.get_user_partner_id(auth.uid()));

CREATE POLICY "Superadmin kan partners aanmaken" ON public.partners
  FOR INSERT TO authenticated
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmin kan partners bijwerken" ON public.partners
  FOR UPDATE TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmin kan partners verwijderen" ON public.partners
  FOR DELETE TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- USERS RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users zien eigen profiel" ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Superadmin ziet alle users" ON public.users
  FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Partner admin ziet eigen partner users" ON public.users
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff')
    AND partner_id = public.get_user_partner_id(auth.uid())
  );

CREATE POLICY "Superadmin kan users aanmaken" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Partner admin kan users aanmaken" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'partner_admin'
    AND partner_id = public.get_user_partner_id(auth.uid())
  );

CREATE POLICY "Users kunnen eigen profiel bijwerken" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Superadmin kan users bijwerken" ON public.users
  FOR UPDATE TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Partner admin kan partner users bijwerken" ON public.users
  FOR UPDATE TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'partner_admin'
    AND partner_id = public.get_user_partner_id(auth.uid())
  );

CREATE POLICY "Superadmin kan users verwijderen" ON public.users
  FOR DELETE TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Partner admin kan partner users verwijderen" ON public.users
  FOR DELETE TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'partner_admin'
    AND partner_id = public.get_user_partner_id(auth.uid())
  );

-- LEADS RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin ziet alle leads" ON public.leads
  FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Partner users zien eigen partner leads" ON public.leads
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff')
    AND partner_id = public.get_user_partner_id(auth.uid())
  );

CREATE POLICY "Adviseur ziet eigen leads" ON public.leads
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'adviseur'
    AND owner_user_id = auth.uid()
  );

CREATE POLICY "Leads aanmaken door bevoegde rollen" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_superadmin(auth.uid())
    OR (
      public.get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff', 'adviseur')
      AND partner_id = public.get_user_partner_id(auth.uid())
    )
  );

CREATE POLICY "Leads bijwerken door bevoegde rollen" ON public.leads
  FOR UPDATE TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (
      public.get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff')
      AND partner_id = public.get_user_partner_id(auth.uid())
    )
    OR (
      public.get_user_role(auth.uid()) = 'adviseur'
      AND owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Leads verwijderen door admin rollen" ON public.leads
  FOR DELETE TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (
      public.get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff')
      AND partner_id = public.get_user_partner_id(auth.uid())
    )
  );

-- SCHOUWEN RLS
ALTER TABLE public.schouwen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin ziet alle schouwen" ON public.schouwen
  FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Partner users zien eigen partner schouwen" ON public.schouwen
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff')
    AND partner_id = public.get_user_partner_id(auth.uid())
  );

CREATE POLICY "Adviseur ziet eigen schouwen" ON public.schouwen
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'adviseur'
    AND adviseur_id = auth.uid()
  );

CREATE POLICY "Installateur ziet eigen schouwen" ON public.schouwen
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'installateur'
    AND installateur_id = auth.uid()
  );

CREATE POLICY "Consument ziet eigen schouwen" ON public.schouwen
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'consument'
    AND klant_email = (SELECT email FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Schouwen aanmaken" ON public.schouwen
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_superadmin(auth.uid())
    OR (
      public.get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff', 'adviseur')
      AND partner_id = public.get_user_partner_id(auth.uid())
    )
  );

CREATE POLICY "Schouwen bijwerken" ON public.schouwen
  FOR UPDATE TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (
      public.get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff')
      AND partner_id = public.get_user_partner_id(auth.uid())
    )
    OR (
      public.get_user_role(auth.uid()) = 'adviseur'
      AND adviseur_id = auth.uid()
    )
  );

CREATE POLICY "Schouwen verwijderen" ON public.schouwen
  FOR DELETE TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (
      public.get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff')
      AND partner_id = public.get_user_partner_id(auth.uid())
    )
  );

-- OFFERTES RLS
ALTER TABLE public.offertes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin ziet alle offertes" ON public.offertes
  FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Partner users zien eigen partner offertes" ON public.offertes
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff')
    AND partner_id = public.get_user_partner_id(auth.uid())
  );

CREATE POLICY "Adviseur ziet eigen offertes" ON public.offertes
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'adviseur'
    AND adviseur_id = auth.uid()
  );

CREATE POLICY "Consument ziet eigen offertes" ON public.offertes
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'consument'
    AND klant_email = (SELECT email FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Offertes aanmaken" ON public.offertes
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_superadmin(auth.uid())
    OR (
      public.get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff', 'adviseur')
      AND partner_id = public.get_user_partner_id(auth.uid())
    )
  );

CREATE POLICY "Offertes bijwerken" ON public.offertes
  FOR UPDATE TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (
      public.get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff')
      AND partner_id = public.get_user_partner_id(auth.uid())
    )
    OR (
      public.get_user_role(auth.uid()) = 'adviseur'
      AND adviseur_id = auth.uid()
    )
    OR (
      public.get_user_role(auth.uid()) = 'consument'
      AND klant_email = (SELECT email FROM public.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Offertes verwijderen" ON public.offertes
  FOR DELETE TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (
      public.get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff')
      AND partner_id = public.get_user_partner_id(auth.uid())
    )
  );

-- PRODUCTEN RLS
ALTER TABLE public.producten ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Iedereen kan producten lezen" ON public.producten
  FOR SELECT TO authenticated
  USING (
    partner_id IS NULL
    OR public.is_superadmin(auth.uid())
    OR partner_id = public.get_user_partner_id(auth.uid())
  );

CREATE POLICY "Producten aanmaken" ON public.producten
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_superadmin(auth.uid())
    OR (
      public.get_user_role(auth.uid()) = 'partner_admin'
      AND partner_id = public.get_user_partner_id(auth.uid())
    )
  );

CREATE POLICY "Producten bijwerken" ON public.producten
  FOR UPDATE TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (
      public.get_user_role(auth.uid()) = 'partner_admin'
      AND partner_id = public.get_user_partner_id(auth.uid())
    )
  );

CREATE POLICY "Producten verwijderen" ON public.producten
  FOR DELETE TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (
      public.get_user_role(auth.uid()) = 'partner_admin'
      AND partner_id = public.get_user_partner_id(auth.uid())
    )
  );

-- INSTALLATIES RLS
ALTER TABLE public.installaties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin ziet alle installaties" ON public.installaties
  FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Partner users zien eigen partner installaties" ON public.installaties
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff')
    AND partner_id = public.get_user_partner_id(auth.uid())
  );

CREATE POLICY "Installateur ziet eigen installaties" ON public.installaties
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'installateur'
    AND installateur_id = auth.uid()
  );

CREATE POLICY "Installaties aanmaken" ON public.installaties
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_superadmin(auth.uid())
    OR (
      public.get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff')
      AND partner_id = public.get_user_partner_id(auth.uid())
    )
  );

CREATE POLICY "Installaties bijwerken" ON public.installaties
  FOR UPDATE TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (
      public.get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff')
      AND partner_id = public.get_user_partner_id(auth.uid())
    )
    OR (
      public.get_user_role(auth.uid()) = 'installateur'
      AND installateur_id = auth.uid()
    )
  );

CREATE POLICY "Installaties verwijderen" ON public.installaties
  FOR DELETE TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (
      public.get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff')
      AND partner_id = public.get_user_partner_id(auth.uid())
    )
  );

-- TICKETS RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin ziet alle tickets" ON public.tickets
  FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Partner users zien eigen partner tickets" ON public.tickets
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff')
    AND partner_id = public.get_user_partner_id(auth.uid())
  );

CREATE POLICY "Consument ziet eigen tickets" ON public.tickets
  FOR SELECT TO authenticated
  USING (consument_id = auth.uid());

CREATE POLICY "Tickets aanmaken" ON public.tickets
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_superadmin(auth.uid())
    OR (
      public.get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff')
      AND partner_id = public.get_user_partner_id(auth.uid())
    )
    OR consument_id = auth.uid()
  );

CREATE POLICY "Tickets bijwerken" ON public.tickets
  FOR UPDATE TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (
      public.get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff')
      AND partner_id = public.get_user_partner_id(auth.uid())
    )
    OR consument_id = auth.uid()
  );

-- DOCUMENTEN RLS
ALTER TABLE public.documenten ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin ziet alle documenten" ON public.documenten
  FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Partner users zien eigen partner documenten" ON public.documenten
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff')
    AND partner_id = public.get_user_partner_id(auth.uid())
  );

CREATE POLICY "Consument ziet eigen documenten" ON public.documenten
  FOR SELECT TO authenticated
  USING (consument_id = auth.uid());

CREATE POLICY "Documenten aanmaken" ON public.documenten
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_superadmin(auth.uid())
    OR (
      public.get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff', 'adviseur')
      AND partner_id = public.get_user_partner_id(auth.uid())
    )
  );

CREATE POLICY "Documenten bijwerken" ON public.documenten
  FOR UPDATE TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (
      public.get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff')
      AND partner_id = public.get_user_partner_id(auth.uid())
    )
  );

CREATE POLICY "Documenten verwijderen" ON public.documenten
  FOR DELETE TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (
      public.get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff')
      AND partner_id = public.get_user_partner_id(auth.uid())
    )
  );

-- NOTIFICATIES RLS
ALTER TABLE public.notificaties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users zien eigen notificaties" ON public.notificaties
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Notificaties aanmaken (systeem)" ON public.notificaties
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_superadmin(auth.uid())
    OR public.get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff')
  );

CREATE POLICY "Users markeren eigen notificaties als gelezen" ON public.notificaties
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- CONSUMENTEN RLS
ALTER TABLE public.consumenten ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin ziet alle consumenten" ON public.consumenten
  FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Partner users zien eigen partner consumenten" ON public.consumenten
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff', 'adviseur')
    AND partner_id = public.get_user_partner_id(auth.uid())
  );

CREATE POLICY "Consument ziet eigen record" ON public.consumenten
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Consumenten aanmaken" ON public.consumenten
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_superadmin(auth.uid())
    OR (
      public.get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff', 'adviseur')
      AND partner_id = public.get_user_partner_id(auth.uid())
    )
  );

CREATE POLICY "Consumenten bijwerken" ON public.consumenten
  FOR UPDATE TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (
      public.get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff')
      AND partner_id = public.get_user_partner_id(auth.uid())
    )
    OR user_id = auth.uid()
  );

-- INDEXES for performance
CREATE INDEX idx_users_partner_id ON public.users(partner_id);
CREATE INDEX idx_users_rol ON public.users(rol);
CREATE INDEX idx_leads_partner_id ON public.leads(partner_id);
CREATE INDEX idx_leads_owner ON public.leads(owner_user_id);
CREATE INDEX idx_schouwen_partner_id ON public.schouwen(partner_id);
CREATE INDEX idx_schouwen_adviseur ON public.schouwen(adviseur_id);
CREATE INDEX idx_offertes_partner_id ON public.offertes(partner_id);
CREATE INDEX idx_offertes_adviseur ON public.offertes(adviseur_id);
CREATE INDEX idx_offertes_klant_email ON public.offertes(klant_email);
CREATE INDEX idx_producten_partner_id ON public.producten(partner_id);
CREATE INDEX idx_producten_categorie ON public.producten(categorie);
CREATE INDEX idx_installaties_partner_id ON public.installaties(partner_id);
CREATE INDEX idx_installaties_installateur ON public.installaties(installateur_id);
CREATE INDEX idx_tickets_partner_id ON public.tickets(partner_id);
CREATE INDEX idx_tickets_consument ON public.tickets(consument_id);
CREATE INDEX idx_notificaties_user ON public.notificaties(user_id);
CREATE INDEX idx_notificaties_gelezen ON public.notificaties(user_id, gelezen);
CREATE INDEX idx_consumenten_partner ON public.consumenten(partner_id);
CREATE INDEX idx_consumenten_user ON public.consumenten(user_id);
CREATE INDEX idx_documenten_entity ON public.documenten(entity_type, entity_id);
