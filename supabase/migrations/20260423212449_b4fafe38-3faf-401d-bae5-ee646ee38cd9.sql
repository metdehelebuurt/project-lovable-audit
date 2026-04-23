-- 1. Kolom toevoegen
ALTER TABLE public.installaties
  ADD COLUMN IF NOT EXISTS schouw_id uuid NULL REFERENCES public.schouwen(id) ON DELETE SET NULL;

-- 2. Index
CREATE INDEX IF NOT EXISTS idx_installaties_schouw_id ON public.installaties(schouw_id);

-- 3a. Backfill via opdracht.schouw_id
UPDATE public.installaties i
   SET schouw_id = o.schouw_id
  FROM public.opdrachten o
 WHERE i.opdracht_id = o.id
   AND i.schouw_id IS NULL
   AND o.schouw_id IS NOT NULL;

-- 3b. Backfill via lead_id (meest recente uitgevoerde schouw per partner)
WITH kandidaten AS (
  SELECT DISTINCT ON (s.lead_id, s.partner_id)
         s.lead_id, s.partner_id, s.id AS schouw_id
    FROM public.schouwen s
   WHERE s.lead_id IS NOT NULL
     AND s.status = 'uitgevoerd'
   ORDER BY s.lead_id, s.partner_id, s.geplande_datum DESC NULLS LAST, s.created_at DESC
)
UPDATE public.installaties i
   SET schouw_id = k.schouw_id
  FROM kandidaten k
 WHERE i.schouw_id IS NULL
   AND i.lead_id = k.lead_id
   AND i.partner_id = k.partner_id;