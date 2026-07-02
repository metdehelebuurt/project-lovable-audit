DROP POLICY IF EXISTS "Partner users can insert product images" ON storage.objects;
CREATE POLICY "Partner users can insert product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (
    is_superadmin(auth.uid())
    OR get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role, 'backoffice'::app_role, 'adviseur'::app_role, 'installateur'::app_role])
  )
);

DROP POLICY IF EXISTS "Partner users can update product images" ON storage.objects;
CREATE POLICY "Partner users can update product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (
    is_superadmin(auth.uid())
    OR get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role, 'backoffice'::app_role, 'adviseur'::app_role])
  )
)
WITH CHECK (
  bucket_id = 'product-images'
  AND (
    is_superadmin(auth.uid())
    OR get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role, 'backoffice'::app_role, 'adviseur'::app_role])
  )
);