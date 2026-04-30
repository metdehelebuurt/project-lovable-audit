
-- Verruim RLS voor product-images zodat partner-gebruikers daadwerkelijk kunnen uploaden.
-- Oorzaak van de bug: oude policy vereiste exact `{partner_id}/...` prefix,
-- maar bestaande upload-code gebruikt o.a. `{productId}/...`, `datasheets/...` en `handleidingen/...`.
-- Daardoor faalde elke upload (behalve superadmin) silently met een RLS-violation.

DROP POLICY IF EXISTS "Partner users can insert own product images" ON storage.objects;
DROP POLICY IF EXISTS "Partner users can update own product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;

-- INSERT: superadmin altijd; partner-rollen mogen uploaden ongeacht prefix
-- (catalogus is een gedeeld asset; bestanden bevatten geen klantdata).
CREATE POLICY "Partner users can insert product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (
    public.is_superadmin(auth.uid())
    OR public.get_user_role(auth.uid()) = ANY (
      ARRAY['partner_admin'::app_role, 'partner_staff'::app_role, 'adviseur'::app_role, 'installateur'::app_role]
    )
  )
);

CREATE POLICY "Partner users can update product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (
    public.is_superadmin(auth.uid())
    OR public.get_user_role(auth.uid()) = ANY (
      ARRAY['partner_admin'::app_role, 'partner_staff'::app_role, 'adviseur'::app_role]
    )
  )
)
WITH CHECK (
  bucket_id = 'product-images'
  AND (
    public.is_superadmin(auth.uid())
    OR public.get_user_role(auth.uid()) = ANY (
      ARRAY['partner_admin'::app_role, 'partner_staff'::app_role, 'adviseur'::app_role]
    )
  )
);

CREATE POLICY "Partner admins can delete product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (
    public.is_superadmin(auth.uid())
    OR public.get_user_role(auth.uid()) = 'partner_admin'::app_role
  )
);

-- Bucket limits: 10 MB en alleen images + PDF (datasheets/handleidingen).
UPDATE storage.buckets
SET file_size_limit = 10485760,
    allowed_mime_types = ARRAY[
      'image/jpeg','image/png','image/webp','image/gif','image/svg+xml','application/pdf'
    ]
WHERE id = 'product-images';
