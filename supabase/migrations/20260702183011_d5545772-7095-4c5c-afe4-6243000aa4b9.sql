
ALTER TABLE public.inkoop_ontvangsten
  ADD COLUMN IF NOT EXISTS pakbon_nummer text,
  ADD COLUMN IF NOT EXISTS vervoerder text,
  ADD COLUMN IF NOT EXISTS tracking_nummer text,
  ADD COLUMN IF NOT EXISTS chauffeur_naam text,
  ADD COLUMN IF NOT EXISTS aflever_locatie text,
  ADD COLUMN IF NOT EXISTS staat_zending text,
  ADD COLUMN IF NOT EXISTS ontvangst_document_url text,
  ADD COLUMN IF NOT EXISTS sn_per_regel jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS document_ids jsonb NOT NULL DEFAULT '[]'::jsonb;

DROP POLICY IF EXISTS "inkoop_docs_read" ON storage.objects;
CREATE POLICY "inkoop_docs_read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'inkoop-documenten');

DROP POLICY IF EXISTS "inkoop_docs_insert" ON storage.objects;
CREATE POLICY "inkoop_docs_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'inkoop-documenten');

DROP POLICY IF EXISTS "inkoop_docs_update" ON storage.objects;
CREATE POLICY "inkoop_docs_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'inkoop-documenten');

DROP POLICY IF EXISTS "inkoop_docs_delete" ON storage.objects;
CREATE POLICY "inkoop_docs_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'inkoop-documenten');
