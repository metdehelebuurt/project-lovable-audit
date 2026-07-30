ALTER FUNCTION public.trg_touch_updated_at() SET search_path = public;

DROP POLICY IF EXISTS inkoop_docs_read ON storage.objects;
DROP POLICY IF EXISTS inkoop_docs_insert ON storage.objects;
DROP POLICY IF EXISTS inkoop_docs_update ON storage.objects;
DROP POLICY IF EXISTS inkoop_docs_delete ON storage.objects;

CREATE POLICY inkoop_docs_read ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'inkoop-documenten'
  AND (
    public.is_superadmin(auth.uid())
    OR (storage.foldername(name))[1] = public.get_user_partner_id(auth.uid())::text
  )
);

CREATE POLICY inkoop_docs_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'inkoop-documenten'
  AND (
    public.is_superadmin(auth.uid())
    OR (storage.foldername(name))[1] = public.get_user_partner_id(auth.uid())::text
  )
);

CREATE POLICY inkoop_docs_update ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'inkoop-documenten'
  AND (
    public.is_superadmin(auth.uid())
    OR (storage.foldername(name))[1] = public.get_user_partner_id(auth.uid())::text
  )
)
WITH CHECK (
  bucket_id = 'inkoop-documenten'
  AND (
    public.is_superadmin(auth.uid())
    OR (storage.foldername(name))[1] = public.get_user_partner_id(auth.uid())::text
  )
);

CREATE POLICY inkoop_docs_delete ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'inkoop-documenten'
  AND (
    public.is_superadmin(auth.uid())
    OR (storage.foldername(name))[1] = public.get_user_partner_id(auth.uid())::text
  )
);