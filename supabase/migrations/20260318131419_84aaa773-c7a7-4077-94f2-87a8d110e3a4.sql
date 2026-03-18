
-- Create opdracht_status enum
CREATE TYPE public.opdracht_status AS ENUM (
  'nieuw', 'bevestigd', 'schouw_gepland', 'installatie_gepland', 'in_uitvoering', 'afgerond', 'geannuleerd'
);

-- Create opdrachten table
CREATE TABLE public.opdrachten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id),
  offerte_id uuid NOT NULL REFERENCES public.offertes(id),
  lead_id uuid REFERENCES public.leads(id),
  schouw_id uuid REFERENCES public.schouwen(id),
  installatie_id uuid REFERENCES public.installaties(id),
  klant_naam text NOT NULL,
  klant_email text,
  klant_telefoon text,
  klant_adres text,
  klant_postcode text,
  klant_plaats text,
  status opdracht_status NOT NULL DEFAULT 'nieuw',
  annulering_reden text,
  bevestiging_verzonden_op timestamptz,
  regels jsonb NOT NULL DEFAULT '[]'::jsonb,
  totaal_bedrag numeric NOT NULL DEFAULT 0,
  toegewezen_monteur_id uuid REFERENCES public.users(id),
  notities text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add annulering_reden to offertes
ALTER TABLE public.offertes ADD COLUMN IF NOT EXISTS annulering_reden text;

-- Enable RLS
ALTER TABLE public.opdrachten ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger
CREATE TRIGGER update_opdrachten_updated_at
  BEFORE UPDATE ON public.opdrachten
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notification trigger
CREATE TRIGGER notify_opdrachten_status
  AFTER UPDATE ON public.opdrachten
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_on_status_change();

-- RLS Policies
CREATE POLICY "Superadmin ziet alle opdrachten" ON public.opdrachten
  FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Partner users zien eigen partner opdrachten" ON public.opdrachten
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff')
    AND partner_id = public.get_user_partner_id(auth.uid())
  );

CREATE POLICY "Adviseur ziet eigen opdrachten" ON public.opdrachten
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'adviseur'
    AND offerte_id IN (SELECT id FROM public.offertes WHERE adviseur_id = auth.uid())
  );

CREATE POLICY "Installateur ziet eigen opdrachten" ON public.opdrachten
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'installateur'
    AND toegewezen_monteur_id = auth.uid()
  );

CREATE POLICY "Opdrachten aanmaken" ON public.opdrachten
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_superadmin(auth.uid())
    OR (public.get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff', 'adviseur')
        AND partner_id = public.get_user_partner_id(auth.uid()))
  );

CREATE POLICY "Opdrachten bijwerken" ON public.opdrachten
  FOR UPDATE TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (public.get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff')
        AND partner_id = public.get_user_partner_id(auth.uid()))
    OR (public.get_user_role(auth.uid()) = 'adviseur'
        AND offerte_id IN (SELECT id FROM public.offertes WHERE adviseur_id = auth.uid()))
  );

CREATE POLICY "Opdrachten verwijderen" ON public.opdrachten
  FOR DELETE TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (public.get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff')
        AND partner_id = public.get_user_partner_id(auth.uid()))
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.opdrachten;
