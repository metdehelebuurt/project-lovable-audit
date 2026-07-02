CREATE TABLE public.contactpersonen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  klant_id uuid REFERENCES public.klanten(id) ON DELETE CASCADE,
  voornaam text NOT NULL,
  achternaam text,
  functie text,
  email text,
  telefoon text,
  mobiel text,
  is_hoofdcontact boolean NOT NULL DEFAULT false,
  notitie text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contactpersonen_scope_check CHECK (
    (lead_id IS NOT NULL AND klant_id IS NULL) OR
    (lead_id IS NULL AND klant_id IS NOT NULL)
  )
);

CREATE INDEX contactpersonen_lead_idx ON public.contactpersonen(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX contactpersonen_klant_idx ON public.contactpersonen(klant_id) WHERE klant_id IS NOT NULL;
CREATE INDEX contactpersonen_partner_idx ON public.contactpersonen(partner_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contactpersonen TO authenticated;
GRANT ALL ON public.contactpersonen TO service_role;

ALTER TABLE public.contactpersonen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users zien contactpersonen eigen partner"
  ON public.contactpersonen FOR SELECT
  USING (is_superadmin(auth.uid()) OR partner_id = get_user_partner_id(auth.uid()));

CREATE POLICY "Bevoegde rollen maken contactpersonen"
  ON public.contactpersonen FOR INSERT
  WITH CHECK (
    is_superadmin(auth.uid()) OR (
      get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role, 'backoffice'::app_role, 'adviseur'::app_role])
      AND partner_id = get_user_partner_id(auth.uid())
    )
  );

CREATE POLICY "Bevoegde rollen wijzigen contactpersonen"
  ON public.contactpersonen FOR UPDATE
  USING (
    is_superadmin(auth.uid()) OR (
      get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role, 'backoffice'::app_role, 'adviseur'::app_role])
      AND partner_id = get_user_partner_id(auth.uid())
    )
  );

CREATE POLICY "Bevoegde rollen verwijderen contactpersonen"
  ON public.contactpersonen FOR DELETE
  USING (
    is_superadmin(auth.uid()) OR (
      get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role, 'backoffice'::app_role, 'adviseur'::app_role])
      AND partner_id = get_user_partner_id(auth.uid())
    )
  );

CREATE POLICY "break_glass_superadmin_restrict"
  ON public.contactpersonen FOR ALL
  USING ((NOT is_superadmin(auth.uid())) OR has_break_glass_access(auth.uid(), partner_id))
  WITH CHECK ((NOT is_superadmin(auth.uid())) OR has_break_glass_access(auth.uid(), partner_id));

CREATE TRIGGER update_contactpersonen_updated_at
  BEFORE UPDATE ON public.contactpersonen
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Only one hoofdcontact per lead/klant
CREATE UNIQUE INDEX contactpersonen_uniek_hoofdcontact_lead
  ON public.contactpersonen(lead_id) WHERE is_hoofdcontact = true AND lead_id IS NOT NULL;
CREATE UNIQUE INDEX contactpersonen_uniek_hoofdcontact_klant
  ON public.contactpersonen(klant_id) WHERE is_hoofdcontact = true AND klant_id IS NOT NULL;