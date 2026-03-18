-- Add INSERT policy for product-images storage
CREATE POLICY "Authenticated users can insert product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Add UPDATE policy for product-images storage (needed for upsert)
CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-images');