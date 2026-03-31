
-- 1. Tabel: abonnement_plannen
CREATE TABLE public.abonnement_plannen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  naam text NOT NULL,
  slug text NOT NULL UNIQUE,
  beschrijving text,
  maand_prijs numeric NOT NULL DEFAULT 0,
  jaar_prijs numeric NOT NULL DEFAULT 0,
  max_leads integer,
  max_offertes integer,
  max_gebruikers integer,
  max_adviseurs integer,
  max_installateurs integer,
  modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  voorwaarden text,
  actief boolean NOT NULL DEFAULT true,
  volgorde integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.abonnement_plannen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Iedereen leest actieve plannen" ON public.abonnement_plannen
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Superadmin beheert plannen" ON public.abonnement_plannen
  FOR ALL TO authenticated USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

-- 2. Uitbreiden abonnementen
ALTER TABLE public.abonnementen
  ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.abonnement_plannen(id),
  ADD COLUMN IF NOT EXISTS interval text NOT NULL DEFAULT 'maandelijks',
  ADD COLUMN IF NOT EXISTS volgende_factuur_datum date,
  ADD COLUMN IF NOT EXISTS opzeg_datum date,
  ADD COLUMN IF NOT EXISTS opzegtermijn_dagen integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS notities text,
  ADD COLUMN IF NOT EXISTS korting_percentage numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS korting_vast_bedrag numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS korting_reden text,
  ADD COLUMN IF NOT EXISTS gratis_maanden integer NOT NULL DEFAULT 0;

-- Partner admin kan eigen abonnement beperkt bijwerken (opzeggen)
CREATE POLICY "Partner admin bewerkt eigen abonnement" ON public.abonnementen
  FOR UPDATE TO authenticated
  USING (
    (get_user_role(auth.uid()) = 'partner_admin'::app_role)
    AND (partner_id = get_user_partner_id(auth.uid()))
  );

-- 3. Tabel: facturen
CREATE TABLE public.facturen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  abonnement_id uuid REFERENCES public.abonnementen(id),
  partner_id uuid NOT NULL REFERENCES public.partners(id),
  factuurnummer text NOT NULL UNIQUE,
  bedrag_excl_btw numeric NOT NULL DEFAULT 0,
  btw_bedrag numeric NOT NULL DEFAULT 0,
  totaal_bedrag numeric NOT NULL DEFAULT 0,
  korting_bedrag numeric NOT NULL DEFAULT 0,
  periode_start date NOT NULL,
  periode_eind date NOT NULL,
  status text NOT NULL DEFAULT 'concept',
  betaald_op timestamptz,
  betaald_via text,
  pdf_url text,
  notities text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.facturen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner ziet eigen facturen" ON public.facturen
  FOR SELECT TO authenticated
  USING (partner_id = get_user_partner_id(auth.uid()));

CREATE POLICY "Superadmin beheert facturen" ON public.facturen
  FOR ALL TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

-- 4. Tabel: abonnement_wijzigingen (audit log)
CREATE TABLE public.abonnement_wijzigingen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  abonnement_id uuid REFERENCES public.abonnementen(id),
  partner_id uuid NOT NULL REFERENCES public.partners(id),
  user_id uuid REFERENCES auth.users(id),
  type text NOT NULL,
  van_plan_id uuid REFERENCES public.abonnement_plannen(id),
  naar_plan_id uuid REFERENCES public.abonnement_plannen(id),
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.abonnement_wijzigingen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner ziet eigen wijzigingen" ON public.abonnement_wijzigingen
  FOR SELECT TO authenticated
  USING (partner_id = get_user_partner_id(auth.uid()));

CREATE POLICY "Superadmin beheert wijzigingen" ON public.abonnement_wijzigingen
  FOR ALL TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

-- 5. Tabel: affiliate_commissies
CREATE TABLE public.affiliate_commissies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.users(id),
  partner_id uuid REFERENCES public.partners(id),
  abonnement_id uuid REFERENCES public.abonnementen(id),
  type text NOT NULL DEFAULT 'eenmalig',
  bedrag numeric NOT NULL DEFAULT 0,
  percentage numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'gepland',
  factuur_id uuid REFERENCES public.facturen(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_commissies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliate ziet eigen commissies" ON public.affiliate_commissies
  FOR SELECT TO authenticated
  USING (affiliate_id = auth.uid());

CREATE POLICY "Superadmin beheert commissies" ON public.affiliate_commissies
  FOR ALL TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

-- 6. Tabel: abonnement_notificaties_config
CREATE TABLE public.abonnement_notificaties_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dagen_voor_verloop integer[] NOT NULL DEFAULT '{7,3,1}',
  email_bij_factuur boolean NOT NULL DEFAULT true,
  email_bij_verloop boolean NOT NULL DEFAULT true,
  email_bij_opzegging boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.abonnement_notificaties_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin beheert notificatie config" ON public.abonnement_notificaties_config
  FOR ALL TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

CREATE POLICY "Iedereen leest notificatie config" ON public.abonnement_notificaties_config
  FOR SELECT TO authenticated USING (true);

-- Storage bucket voor facturen
INSERT INTO storage.buckets (id, name, public) VALUES ('facturen', 'facturen', false);

-- RLS op storage voor facturen
CREATE POLICY "Superadmin upload facturen" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'facturen' AND is_superadmin(auth.uid()));

CREATE POLICY "Partner download eigen facturen" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'facturen' AND (
    is_superadmin(auth.uid()) OR
    (storage.foldername(name))[1] = get_user_partner_id(auth.uid())::text
  ));

-- Seed default plannen
INSERT INTO public.abonnement_plannen (naam, slug, beschrijving, maand_prijs, jaar_prijs, max_leads, max_offertes, max_gebruikers, max_adviseurs, max_installateurs, modules, features, volgorde) VALUES
('Starter', 'starter', 'Basisfunctionaliteit voor kleine bedrijven', 49, 470, 50, 25, 3, 2, 1,
 '["leads","offertes","schouwen","planning","producten"]'::jsonb,
 '["basis_rapportage","email_templates"]'::jsonb, 1),
('Professional', 'professional', 'Uitgebreide tools voor groeiende bedrijven', 99, 950, 250, 100, 10, 5, 3,
 '["leads","offertes","schouwen","opdrachten","installaties","planning","producten","analytics","documenten","energieadvies","tools","webtools","thuisbatterij"]'::jsonb,
 '["basis_rapportage","email_templates","geavanceerde_rapportage","webtools","thuisbatterij_selector","document_beheer"]'::jsonb, 2),
('Enterprise', 'enterprise', 'Alles onbeperkt met white-label en affiliate programma', 199, 1910, NULL, NULL, NULL, NULL, NULL,
 '["leads","offertes","schouwen","opdrachten","installaties","planning","producten","analytics","documenten","energieadvies","tools","webtools","thuisbatterij","affiliates"]'::jsonb,
 '["basis_rapportage","email_templates","geavanceerde_rapportage","webtools","thuisbatterij_selector","document_beheer","affiliate_programma","white_label","api_toegang"]'::jsonb, 3);

-- Updated_at triggers
CREATE TRIGGER update_abonnement_plannen_updated_at BEFORE UPDATE ON public.abonnement_plannen
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
