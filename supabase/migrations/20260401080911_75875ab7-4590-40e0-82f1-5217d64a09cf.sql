
-- Table 1: Admin-configurable add-on types
CREATE TABLE public.abonnement_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  naam text NOT NULL,
  slug text NOT NULL UNIQUE,
  type text NOT NULL DEFAULT 'adviseur',
  maand_prijs numeric NOT NULL DEFAULT 0,
  jaar_prijs numeric NOT NULL DEFAULT 0,
  beschrijving text,
  actief boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.abonnement_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Iedereen leest actieve addons" ON public.abonnement_addons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Superadmin beheert addons" ON public.abonnement_addons FOR ALL TO authenticated USING (is_superadmin(auth.uid())) WITH CHECK (is_superadmin(auth.uid()));

-- Table 2: Partner purchased add-ons
CREATE TABLE public.abonnement_addon_aankopen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  abonnement_id uuid REFERENCES public.abonnementen(id) ON DELETE CASCADE,
  addon_id uuid REFERENCES public.abonnement_addons(id) ON DELETE CASCADE NOT NULL,
  partner_id uuid REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  aantal integer NOT NULL DEFAULT 1,
  interval text NOT NULL DEFAULT 'maandelijks',
  maand_bedrag numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'actief',
  start_datum date NOT NULL DEFAULT CURRENT_DATE,
  eind_datum date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.abonnement_addon_aankopen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner ziet eigen addon aankopen" ON public.abonnement_addon_aankopen FOR SELECT TO authenticated USING (partner_id = get_user_partner_id(auth.uid()) OR is_superadmin(auth.uid()));
CREATE POLICY "Superadmin beheert addon aankopen" ON public.abonnement_addon_aankopen FOR ALL TO authenticated USING (is_superadmin(auth.uid())) WITH CHECK (is_superadmin(auth.uid()));
CREATE POLICY "Partner admin koopt addons" ON public.abonnement_addon_aankopen FOR INSERT TO authenticated WITH CHECK (get_user_role(auth.uid()) = 'partner_admin' AND partner_id = get_user_partner_id(auth.uid()));
CREATE POLICY "Partner admin wijzigt eigen addons" ON public.abonnement_addon_aankopen FOR UPDATE TO authenticated USING (get_user_role(auth.uid()) = 'partner_admin' AND partner_id = get_user_partner_id(auth.uid()));

-- Updated_at trigger for addons
CREATE TRIGGER update_abonnement_addons_updated_at BEFORE UPDATE ON public.abonnement_addons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
