
-- WP4: lead_eigenschappen table
CREATE TABLE public.lead_eigenschappen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.partners(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  woningtype text,
  bouwjaar integer,
  daktype text,
  dakrichting text,
  aantal_panelen integer,
  huidig_verbruik_kwh integer,
  huidige_energielabel text,
  gewenst_energielabel text,
  warmtepomp_interesse boolean DEFAULT false,
  batterij_interesse boolean DEFAULT false,
  laadpaal_interesse boolean DEFAULT false,
  isolatie_interesse boolean DEFAULT false,
  extra_json jsonb DEFAULT '{}',
  UNIQUE(lead_id)
);

ALTER TABLE public.lead_eigenschappen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner users zien eigen partner lead_eigenschappen" ON public.lead_eigenschappen
  FOR SELECT TO authenticated
  USING (partner_id = get_user_partner_id(auth.uid()) OR is_superadmin(auth.uid()));

CREATE POLICY "Partner users maken lead_eigenschappen" ON public.lead_eigenschappen
  FOR INSERT TO authenticated
  WITH CHECK (
    is_superadmin(auth.uid()) OR
    ((get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role, 'adviseur'::app_role]))
     AND partner_id = get_user_partner_id(auth.uid()))
  );

CREATE POLICY "Partner users bijwerken lead_eigenschappen" ON public.lead_eigenschappen
  FOR UPDATE TO authenticated
  USING (
    is_superadmin(auth.uid()) OR
    ((get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role, 'adviseur'::app_role]))
     AND partner_id = get_user_partner_id(auth.uid()))
  );

CREATE POLICY "Partner users verwijderen lead_eigenschappen" ON public.lead_eigenschappen
  FOR DELETE TO authenticated
  USING (
    is_superadmin(auth.uid()) OR
    ((get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role]))
     AND partner_id = get_user_partner_id(auth.uid()))
  );

-- WP5: lead_contactmomenten table
CREATE TABLE public.lead_contactmomenten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id),
  partner_id uuid NOT NULL REFERENCES public.partners(id),
  type text NOT NULL,
  richting text DEFAULT 'uitgaand',
  resultaat text,
  notitie text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.lead_contactmomenten ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner users zien eigen partner contactmomenten" ON public.lead_contactmomenten
  FOR SELECT TO authenticated
  USING (partner_id = get_user_partner_id(auth.uid()) OR is_superadmin(auth.uid()));

CREATE POLICY "Partner users maken contactmomenten" ON public.lead_contactmomenten
  FOR INSERT TO authenticated
  WITH CHECK (
    is_superadmin(auth.uid()) OR
    ((get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role, 'adviseur'::app_role]))
     AND partner_id = get_user_partner_id(auth.uid()))
  );

CREATE POLICY "Partner users verwijderen contactmomenten" ON public.lead_contactmomenten
  FOR DELETE TO authenticated
  USING (
    is_superadmin(auth.uid()) OR
    (user_id = auth.uid())
  );

-- Triggers for updated_at
CREATE TRIGGER update_lead_eigenschappen_updated_at
  BEFORE UPDATE ON public.lead_eigenschappen
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
