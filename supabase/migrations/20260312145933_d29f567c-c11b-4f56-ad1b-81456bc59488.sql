
-- Add branding columns to partners
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS primaire_kleur text DEFAULT '#5B58E1',
  ADD COLUMN IF NOT EXISTS secundaire_kleur text DEFAULT '#1a1a2e',
  ADD COLUMN IF NOT EXISTS bedrijfsslogan text;

-- Add include options to offertes
ALTER TABLE public.offertes
  ADD COLUMN IF NOT EXISTS include_schouw boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS include_energieadvies boolean DEFAULT false;

-- Create partner-assets storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('partner-assets', 'partner-assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for partner-assets bucket
CREATE POLICY "Partner admins can upload assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'partner-assets'
  AND (
    public.is_superadmin(auth.uid())
    OR public.get_user_role(auth.uid()) = 'partner_admin'
  )
);

CREATE POLICY "Partner admins can update assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'partner-assets'
  AND (
    public.is_superadmin(auth.uid())
    OR public.get_user_role(auth.uid()) = 'partner_admin'
  )
);

CREATE POLICY "Partner admins can delete assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'partner-assets'
  AND (
    public.is_superadmin(auth.uid())
    OR public.get_user_role(auth.uid()) = 'partner_admin'
  )
);

CREATE POLICY "Anyone can view partner assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'partner-assets');

-- Allow partner_admin to update their own partner branding
CREATE POLICY "Partner admin kan eigen partner branding bijwerken"
ON public.partners FOR UPDATE
TO authenticated
USING (
  (public.get_user_role(auth.uid()) = 'partner_admin')
  AND (id = public.get_user_partner_id(auth.uid()))
);
