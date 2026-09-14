ALTER TYPE public.product_categorie ADD VALUE IF NOT EXISTS 'isolatie';
ALTER TYPE public.product_rol ADD VALUE IF NOT EXISTS 'isolatiemateriaal';

ALTER TABLE public.opleverrapporten
  ADD COLUMN IF NOT EXISTS rapport_type text NOT NULL DEFAULT 'elektra';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'opleverrapporten_rapport_type_check'
  ) THEN
    ALTER TABLE public.opleverrapporten
      ADD CONSTRAINT opleverrapporten_rapport_type_check
      CHECK (rapport_type IN ('elektra', 'isolatie'));
  END IF;
END $$;