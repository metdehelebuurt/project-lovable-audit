-- 1. Storage bucket for schouw media
INSERT INTO storage.buckets (id, name, public)
VALUES ('schouw-media', 'schouw-media', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS policies
CREATE POLICY "Authenticated users can upload schouw media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'schouw-media');

CREATE POLICY "Authenticated users can view schouw media"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'schouw-media');

CREATE POLICY "Users can delete own schouw media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'schouw-media');

-- 3. Partners: adviseur sharing toggle
ALTER TABLE public.partners
ADD COLUMN IF NOT EXISTS adviseurs_delen_schouwen boolean NOT NULL DEFAULT false;

-- 4. Schouwen: extra columns
ALTER TABLE public.schouwen
ADD COLUMN IF NOT EXISTS fotos jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS checklist jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS aandachtspunten text;

-- 5. RLS policy: adviseur sees partner schouwen if shared
CREATE POLICY "Adviseur ziet partner schouwen indien gedeeld"
ON public.schouwen FOR SELECT TO authenticated
USING (
  get_user_role(auth.uid()) = 'adviseur'::app_role
  AND partner_id = get_user_partner_id(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.partners
    WHERE id = schouwen.partner_id
    AND adviseurs_delen_schouwen = true
  )
);