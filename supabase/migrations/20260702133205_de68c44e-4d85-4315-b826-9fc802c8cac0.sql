ALTER TABLE public.documenten ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[];
CREATE INDEX IF NOT EXISTS documenten_tags_idx ON public.documenten USING gin (tags);