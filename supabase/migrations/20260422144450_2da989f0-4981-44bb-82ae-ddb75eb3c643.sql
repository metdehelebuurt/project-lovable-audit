ALTER TABLE public.opleverrapporten
  ADD COLUMN IF NOT EXISTS extra_velden jsonb NOT NULL DEFAULT '{}'::jsonb;