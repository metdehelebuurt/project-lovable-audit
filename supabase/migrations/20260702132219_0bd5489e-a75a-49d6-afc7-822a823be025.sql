ALTER TABLE public.documenten
  ADD COLUMN IF NOT EXISTS volgorde integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_documenten_entity_volgorde
  ON public.documenten(entity_type, entity_id, volgorde);

WITH ranked AS (
  SELECT id,
         row_number() OVER (PARTITION BY entity_type, entity_id ORDER BY created_at DESC) AS rn
  FROM public.documenten
)
UPDATE public.documenten d
   SET volgorde = ranked.rn
  FROM ranked
 WHERE d.id = ranked.id;