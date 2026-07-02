ALTER TABLE public.producten
  ADD COLUMN IF NOT EXISTS omvormer_modulair BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS heeft_backup_box BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.product_serienummers
  ADD COLUMN IF NOT EXISTS component_type TEXT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_serienummers_component_type_check'
  ) THEN
    ALTER TABLE public.product_serienummers
      ADD CONSTRAINT product_serienummers_component_type_check
      CHECK (component_type IS NULL OR component_type IN ('batterij','omvormer','backup_box'));
  END IF;
END $$;