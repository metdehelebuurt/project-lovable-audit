
-- Klanten table
CREATE TABLE public.klanten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id),
  lead_id uuid REFERENCES public.leads(id),
  offerte_id uuid REFERENCES public.offertes(id),
  voornaam text NOT NULL,
  achternaam text NOT NULL,
  email text,
  telefoon text,
  bedrijfsnaam text,
  adres text,
  postcode text,
  plaats text,
  notities text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.klanten ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin ziet alle klanten" ON public.klanten FOR SELECT TO authenticated USING (is_superadmin(auth.uid()));
CREATE POLICY "Partner users zien eigen partner klanten" ON public.klanten FOR SELECT TO authenticated USING ((get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role])) AND (partner_id = get_user_partner_id(auth.uid())));
CREATE POLICY "Adviseur ziet eigen partner klanten" ON public.klanten FOR SELECT TO authenticated USING ((get_user_role(auth.uid()) = 'adviseur'::app_role) AND (partner_id = get_user_partner_id(auth.uid())));
CREATE POLICY "Klanten aanmaken" ON public.klanten FOR INSERT TO authenticated WITH CHECK (is_superadmin(auth.uid()) OR ((get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role, 'adviseur'::app_role])) AND (partner_id = get_user_partner_id(auth.uid()))));
CREATE POLICY "Klanten bijwerken" ON public.klanten FOR UPDATE TO authenticated USING (is_superadmin(auth.uid()) OR ((get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role])) AND (partner_id = get_user_partner_id(auth.uid()))));
CREATE POLICY "Klanten verwijderen" ON public.klanten FOR DELETE TO authenticated USING (is_superadmin(auth.uid()) OR ((get_user_role(auth.uid()) = 'partner_admin'::app_role) AND (partner_id = get_user_partner_id(auth.uid()))));

-- Afspraken table
CREATE TABLE public.afspraken (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id),
  adviseur_id uuid NOT NULL REFERENCES public.users(id),
  lead_id uuid REFERENCES public.leads(id),
  klant_id uuid REFERENCES public.klanten(id),
  type text NOT NULL DEFAULT 'thuisbezoek',
  titel text NOT NULL,
  datum date NOT NULL,
  start_tijd time,
  eind_tijd time,
  locatie text,
  notities text,
  status text NOT NULL DEFAULT 'gepland',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.afspraken ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin ziet alle afspraken" ON public.afspraken FOR SELECT TO authenticated USING (is_superadmin(auth.uid()));
CREATE POLICY "Partner users zien eigen partner afspraken" ON public.afspraken FOR SELECT TO authenticated USING ((get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role])) AND (partner_id = get_user_partner_id(auth.uid())));
CREATE POLICY "Adviseur ziet eigen afspraken" ON public.afspraken FOR SELECT TO authenticated USING ((get_user_role(auth.uid()) = 'adviseur'::app_role) AND (adviseur_id = auth.uid()));
CREATE POLICY "Afspraken aanmaken" ON public.afspraken FOR INSERT TO authenticated WITH CHECK (is_superadmin(auth.uid()) OR ((get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role, 'adviseur'::app_role])) AND (partner_id = get_user_partner_id(auth.uid()))));
CREATE POLICY "Afspraken bijwerken" ON public.afspraken FOR UPDATE TO authenticated USING (is_superadmin(auth.uid()) OR ((get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role])) AND (partner_id = get_user_partner_id(auth.uid()))) OR ((get_user_role(auth.uid()) = 'adviseur'::app_role) AND (adviseur_id = auth.uid())));
CREATE POLICY "Afspraken verwijderen" ON public.afspraken FOR DELETE TO authenticated USING (is_superadmin(auth.uid()) OR ((get_user_role(auth.uid()) = 'partner_admin'::app_role) AND (partner_id = get_user_partner_id(auth.uid()))));

-- Updated_at triggers
CREATE TRIGGER update_klanten_updated_at BEFORE UPDATE ON public.klanten FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_afspraken_updated_at BEFORE UPDATE ON public.afspraken FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
