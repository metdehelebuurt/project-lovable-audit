-- RLS policies voor de facturen-bucket zodat partner-medewerkers gearchiveerde
-- factuur-PDFs kunnen uploaden, lezen en updaten voor hun eigen partner.
-- Padconventie: {partner_id}/factuur/{docId}.pdf

-- Bestaande policies opruimen om duplicaten te voorkomen
DROP POLICY IF EXISTS "Partners kunnen factuur-PDFs lezen" ON storage.objects;
DROP POLICY IF EXISTS "Partners kunnen factuur-PDFs uploaden" ON storage.objects;
DROP POLICY IF EXISTS "Partners kunnen factuur-PDFs bijwerken" ON storage.objects;
DROP POLICY IF EXISTS "Superadmins beheren alle factuur-PDFs" ON storage.objects;

-- SELECT: lezen toegestaan voor superadmin én voor partner-medewerkers van de juiste partner
CREATE POLICY "Partners kunnen factuur-PDFs lezen"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'facturen'
  AND (
    public.is_superadmin(auth.uid())
    OR (
      (storage.foldername(name))[1] = public.get_user_partner_id(auth.uid())::text
      AND EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
          AND u.rol IN ('partner_admin','partner_staff','backoffice','adviseur','installateur')
      )
    )
  )
);

-- INSERT: uploaden toegestaan voor superadmin én partner-medewerkers (admin/staff/backoffice)
CREATE POLICY "Partners kunnen factuur-PDFs uploaden"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'facturen'
  AND (
    public.is_superadmin(auth.uid())
    OR (
      (storage.foldername(name))[1] = public.get_user_partner_id(auth.uid())::text
      AND EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
          AND u.rol IN ('partner_admin','partner_staff','backoffice')
      )
    )
  )
);

-- UPDATE (voor upsert) toegestaan voor zelfde groep
CREATE POLICY "Partners kunnen factuur-PDFs bijwerken"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'facturen'
  AND (
    public.is_superadmin(auth.uid())
    OR (
      (storage.foldername(name))[1] = public.get_user_partner_id(auth.uid())::text
      AND EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
          AND u.rol IN ('partner_admin','partner_staff','backoffice')
      )
    )
  )
);
