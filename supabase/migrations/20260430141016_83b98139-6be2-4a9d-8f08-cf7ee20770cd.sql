
-- Verruim partner-assets INSERT/UPDATE zodat een gebruiker zijn eigen
-- avatar kan uploaden onder `{user_id}/...`. Logo's blijven onder
-- `{partner_id}/...` en mogen alleen door beheerders.

DROP POLICY IF EXISTS "Partner admins can upload assets" ON storage.objects;
DROP POLICY IF EXISTS "Partner admins can update assets" ON storage.objects;

CREATE POLICY "Authenticated can upload partner assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'partner-assets'
  AND (
    public.is_superadmin(auth.uid())
    -- Beheerder mag overal binnen de bucket schrijven
    OR public.get_user_role(auth.uid()) = 'partner_admin'::app_role
    -- Iedere ingelogde gebruiker mag in zijn eigen map (avatars)
    OR (storage.foldername(name))[1] = auth.uid()::text
    -- Elke partner-medewerker mag in de map van zijn eigen partner
    OR (storage.foldername(name))[1] = (public.get_user_partner_id(auth.uid()))::text
  )
);

CREATE POLICY "Authenticated can update own partner assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'partner-assets'
  AND (
    public.is_superadmin(auth.uid())
    OR public.get_user_role(auth.uid()) = 'partner_admin'::app_role
    OR (storage.foldername(name))[1] = auth.uid()::text
    OR (storage.foldername(name))[1] = (public.get_user_partner_id(auth.uid()))::text
  )
)
WITH CHECK (
  bucket_id = 'partner-assets'
  AND (
    public.is_superadmin(auth.uid())
    OR public.get_user_role(auth.uid()) = 'partner_admin'::app_role
    OR (storage.foldername(name))[1] = auth.uid()::text
    OR (storage.foldername(name))[1] = (public.get_user_partner_id(auth.uid()))::text
  )
);

-- Sensible bucket limits (5 MB) en alleen images
UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY[
      'image/jpeg','image/png','image/webp','image/gif','image/svg+xml'
    ]
WHERE id = 'partner-assets';
