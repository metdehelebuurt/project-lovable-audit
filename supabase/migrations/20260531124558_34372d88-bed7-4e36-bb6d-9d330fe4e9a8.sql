
-- Daklayout-tool: opslag van ingetekende zonnepaneel-layouts

CREATE TABLE public.daklayouts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  gebruiker_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  schouw_id uuid REFERENCES public.schouwen(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  naam text NOT NULL DEFAULT 'Daklayout',
  adres text,
  postcode text,
  plaats text,
  lat double precision,
  lng double precision,
  product_id uuid REFERENCES public.producten(id) ON DELETE SET NULL,
  paneel_breedte_mm integer,
  paneel_lengte_mm integer,
  paneel_wp integer,
  dakvlakken jsonb NOT NULL DEFAULT '[]'::jsonb,
  panelen jsonb NOT NULL DEFAULT '[]'::jsonb,
  aantal_panelen integer NOT NULL DEFAULT 0,
  totaal_wp integer NOT NULL DEFAULT 0,
  snapshot_url text,
  notities text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_daklayouts_partner ON public.daklayouts(partner_id);
CREATE INDEX idx_daklayouts_schouw ON public.daklayouts(schouw_id);
CREATE INDEX idx_daklayouts_lead ON public.daklayouts(lead_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daklayouts TO authenticated;
GRANT ALL ON public.daklayouts TO service_role;

ALTER TABLE public.daklayouts ENABLE ROW LEVEL SECURITY;

-- Superadmin: alles
CREATE POLICY "Superadmin ziet alle daklayouts"
ON public.daklayouts FOR SELECT TO authenticated
USING (is_superadmin(auth.uid()));

-- Partner users zien eigen partner
CREATE POLICY "Partner users zien eigen partner daklayouts"
ON public.daklayouts FOR SELECT TO authenticated
USING (
  get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role, 'backoffice'::app_role])
  AND partner_id = get_user_partner_id(auth.uid())
);

-- Adviseur ziet eigen
CREATE POLICY "Adviseur ziet eigen daklayouts"
ON public.daklayouts FOR SELECT TO authenticated
USING (
  get_user_role(auth.uid()) = 'adviseur'::app_role
  AND (gebruiker_id = auth.uid() OR partner_id = get_user_partner_id(auth.uid()))
);

-- Installateur ziet eigen
CREATE POLICY "Installateur ziet eigen daklayouts"
ON public.daklayouts FOR SELECT TO authenticated
USING (
  get_user_role(auth.uid()) = 'installateur'::app_role
  AND gebruiker_id = auth.uid()
);

-- Insert: ingelogde partner-users + installateurs + adviseurs
CREATE POLICY "Daklayouts aanmaken"
ON public.daklayouts FOR INSERT TO authenticated
WITH CHECK (
  is_superadmin(auth.uid())
  OR (
    get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role, 'backoffice'::app_role, 'adviseur'::app_role, 'installateur'::app_role])
    AND partner_id = get_user_partner_id(auth.uid())
  )
);

-- Update: eigen of partner-admin
CREATE POLICY "Daklayouts bijwerken"
ON public.daklayouts FOR UPDATE TO authenticated
USING (
  is_superadmin(auth.uid())
  OR (
    get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role])
    AND partner_id = get_user_partner_id(auth.uid())
  )
  OR gebruiker_id = auth.uid()
);

-- Delete
CREATE POLICY "Daklayouts verwijderen"
ON public.daklayouts FOR DELETE TO authenticated
USING (
  is_superadmin(auth.uid())
  OR (
    get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role])
    AND partner_id = get_user_partner_id(auth.uid())
  )
  OR gebruiker_id = auth.uid()
);

CREATE TRIGGER update_daklayouts_updated_at
BEFORE UPDATE ON public.daklayouts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket voor snapshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('daklayouts', 'daklayouts', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: pad = partner_id/filename
CREATE POLICY "Daklayout snapshots lezen binnen partner"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'daklayouts'
  AND (
    is_superadmin(auth.uid())
    OR (storage.foldername(name))[1] = get_user_partner_id(auth.uid())::text
  )
);

CREATE POLICY "Daklayout snapshots uploaden binnen partner"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'daklayouts'
  AND (
    is_superadmin(auth.uid())
    OR (storage.foldername(name))[1] = get_user_partner_id(auth.uid())::text
  )
);

CREATE POLICY "Daklayout snapshots bijwerken binnen partner"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'daklayouts'
  AND (
    is_superadmin(auth.uid())
    OR (storage.foldername(name))[1] = get_user_partner_id(auth.uid())::text
  )
);

CREATE POLICY "Daklayout snapshots verwijderen binnen partner"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'daklayouts'
  AND (
    is_superadmin(auth.uid())
    OR (storage.foldername(name))[1] = get_user_partner_id(auth.uid())::text
  )
);
