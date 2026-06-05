
-- 1. email_accounts: restrict access to OAuth tokens to owner/partner_admin/superadmin
DROP POLICY IF EXISTS "Users can view own partner email accounts" ON public.email_accounts;
DROP POLICY IF EXISTS "Users can update own partner email accounts" ON public.email_accounts;
DROP POLICY IF EXISTS "Users can delete own partner email accounts" ON public.email_accounts;

CREATE POLICY "Email account owner/admin can view"
ON public.email_accounts FOR SELECT
USING (
  user_id = auth.uid()
  OR (partner_id = public.get_user_partner_id(auth.uid()) AND public.get_user_role(auth.uid()) = 'partner_admin'::app_role)
  OR public.is_superadmin(auth.uid())
);

CREATE POLICY "Email account owner/admin can update"
ON public.email_accounts FOR UPDATE
USING (
  user_id = auth.uid()
  OR (partner_id = public.get_user_partner_id(auth.uid()) AND public.get_user_role(auth.uid()) = 'partner_admin'::app_role)
  OR public.is_superadmin(auth.uid())
);

CREATE POLICY "Email account owner/admin can delete"
ON public.email_accounts FOR DELETE
USING (
  user_id = auth.uid()
  OR (partner_id = public.get_user_partner_id(auth.uid()) AND public.get_user_role(auth.uid()) = 'partner_admin'::app_role)
  OR public.is_superadmin(auth.uid())
);

-- 2. schouw-media: partner-scoped upload/delete via schouw ownership
DROP POLICY IF EXISTS "Authenticated users can upload schouw media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own schouw media" ON storage.objects;

CREATE POLICY "Schouw media upload scoped to partner"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'schouw-media'
  AND EXISTS (
    SELECT 1 FROM public.schouwen s
    WHERE s.id::text = (storage.foldername(name))[1]
      AND (s.partner_id = public.get_user_partner_id(auth.uid()) OR public.is_superadmin(auth.uid()))
  )
);

CREATE POLICY "Schouw media delete scoped to partner"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'schouw-media'
  AND (
    public.is_superadmin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.schouwen s
      WHERE s.id::text = (storage.foldername(name))[1]
        AND s.partner_id = public.get_user_partner_id(auth.uid())
    )
  )
);

-- 3. feedback-bijlagen: scope by user folder
DROP POLICY IF EXISTS "Authenticated upload feedback bijlagen" ON storage.objects;
DROP POLICY IF EXISTS "Read feedback bijlagen" ON storage.objects;

CREATE POLICY "Feedback bijlagen upload own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'feedback-bijlagen'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Feedback bijlagen read own or admin"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'feedback-bijlagen'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_superadmin(auth.uid())
  )
);

-- 4. partner-assets DELETE: scope by partner_id folder
DROP POLICY IF EXISTS "Partner admins can delete assets" ON storage.objects;

CREATE POLICY "Partner admin delete own partner assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'partner-assets'
  AND (
    public.is_superadmin(auth.uid())
    OR (
      public.get_user_role(auth.uid()) = 'partner_admin'::app_role
      AND (storage.foldername(name))[1] = public.get_user_partner_id(auth.uid())::text
    )
  )
);
