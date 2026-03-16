-- Affiliate links table
CREATE TABLE public.affiliate_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  clicks integer NOT NULL DEFAULT 0,
  actief boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliate ziet eigen links" ON public.affiliate_links FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Affiliate maakt eigen links" ON public.affiliate_links FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND get_user_role(auth.uid()) = 'affiliate');
CREATE POLICY "Affiliate bewerkt eigen links" ON public.affiliate_links FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Affiliate verwijdert eigen links" ON public.affiliate_links FOR DELETE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Superadmin ziet alle affiliate_links" ON public.affiliate_links FOR SELECT TO authenticated
  USING (is_superadmin(auth.uid()));
CREATE POLICY "Superadmin bewerkt alle affiliate_links" ON public.affiliate_links FOR UPDATE TO authenticated
  USING (is_superadmin(auth.uid()));

-- Kortingscodes table
CREATE TABLE public.kortingscodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  korting_type text NOT NULL,
  korting_waarde numeric NOT NULL,
  max_gebruik integer,
  aantal_gebruikt integer NOT NULL DEFAULT 0,
  geldig_tot date,
  actief boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.kortingscodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliate ziet eigen codes" ON public.kortingscodes FOR SELECT TO authenticated
  USING (affiliate_id = auth.uid());
CREATE POLICY "Affiliate maakt eigen codes" ON public.kortingscodes FOR INSERT TO authenticated
  WITH CHECK (affiliate_id = auth.uid() AND get_user_role(auth.uid()) = 'affiliate');
CREATE POLICY "Affiliate bewerkt eigen codes" ON public.kortingscodes FOR UPDATE TO authenticated
  USING (affiliate_id = auth.uid());
CREATE POLICY "Affiliate verwijdert eigen codes" ON public.kortingscodes FOR DELETE TO authenticated
  USING (affiliate_id = auth.uid());
CREATE POLICY "Superadmin ziet alle kortingscodes" ON public.kortingscodes FOR SELECT TO authenticated
  USING (is_superadmin(auth.uid()));
CREATE POLICY "Superadmin bewerkt alle kortingscodes" ON public.kortingscodes FOR UPDATE TO authenticated
  USING (is_superadmin(auth.uid()));
CREATE POLICY "Publiek leest actieve kortingscodes" ON public.kortingscodes FOR SELECT TO anon
  USING (actief = true);

-- Affiliate referrals table
CREATE TABLE public.affiliate_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  kortingscode_id uuid REFERENCES public.kortingscodes(id) ON DELETE SET NULL,
  affiliate_link_id uuid REFERENCES public.affiliate_links(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'actief',
  commissie_percentage numeric NOT NULL DEFAULT 10,
  commissie_verdiend numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliate ziet eigen referrals" ON public.affiliate_referrals FOR SELECT TO authenticated
  USING (affiliate_id = auth.uid());
CREATE POLICY "Superadmin ziet alle referrals" ON public.affiliate_referrals FOR SELECT TO authenticated
  USING (is_superadmin(auth.uid()));
CREATE POLICY "Superadmin bewerkt referrals" ON public.affiliate_referrals FOR UPDATE TO authenticated
  USING (is_superadmin(auth.uid()));

-- Affiliate instellingen (singleton)
CREATE TABLE public.affiliate_instellingen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  max_korting_percentage numeric NOT NULL DEFAULT 25,
  max_korting_vast_bedrag numeric NOT NULL DEFAULT 50,
  standaard_commissie_percentage numeric NOT NULL DEFAULT 10,
  max_commissie_percentage numeric NOT NULL DEFAULT 30,
  min_abonnement_maanden integer NOT NULL DEFAULT 3,
  cookie_dagen integer NOT NULL DEFAULT 30,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.affiliate_instellingen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin beheert instellingen" ON public.affiliate_instellingen FOR ALL TO authenticated
  USING (is_superadmin(auth.uid()));
CREATE POLICY "Affiliate leest instellingen" ON public.affiliate_instellingen FOR SELECT TO authenticated
  USING (get_user_role(auth.uid()) = 'affiliate');
CREATE POLICY "Publiek leest affiliate instellingen" ON public.affiliate_instellingen FOR SELECT TO anon
  USING (true);

INSERT INTO public.affiliate_instellingen (id) VALUES (gen_random_uuid());

-- Abonnementen table
CREATE TABLE public.abonnementen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid UNIQUE NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'trial',
  status text NOT NULL DEFAULT 'actief',
  maand_bedrag numeric NOT NULL DEFAULT 0,
  start_datum date NOT NULL DEFAULT CURRENT_DATE,
  verloop_datum date,
  affiliate_referral_id uuid REFERENCES public.affiliate_referrals(id) ON DELETE SET NULL,
  kortingscode_id uuid REFERENCES public.kortingscodes(id) ON DELETE SET NULL,
  korting_actief_tot date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.abonnementen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner ziet eigen abonnement" ON public.abonnementen FOR SELECT TO authenticated
  USING (partner_id = get_user_partner_id(auth.uid()));
CREATE POLICY "Superadmin ziet alle abonnementen" ON public.abonnementen FOR SELECT TO authenticated
  USING (is_superadmin(auth.uid()));
CREATE POLICY "Superadmin bewerkt abonnementen" ON public.abonnementen FOR UPDATE TO authenticated
  USING (is_superadmin(auth.uid()));
CREATE POLICY "Superadmin maakt abonnementen" ON public.abonnementen FOR INSERT TO authenticated
  WITH CHECK (is_superadmin(auth.uid()));
CREATE POLICY "Affiliate ziet referral abonnementen" ON public.abonnementen FOR SELECT TO authenticated
  USING (affiliate_referral_id IN (SELECT id FROM public.affiliate_referrals WHERE affiliate_id = auth.uid()));

CREATE TRIGGER update_affiliate_instellingen_updated_at BEFORE UPDATE ON public.affiliate_instellingen
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_abonnementen_updated_at BEFORE UPDATE ON public.abonnementen
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();