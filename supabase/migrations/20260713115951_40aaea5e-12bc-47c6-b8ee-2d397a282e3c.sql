ALTER TABLE public.documenten ADD COLUMN IF NOT EXISTS locatie text;
COMMENT ON COLUMN public.documenten.locatie IS 'Locatie waar de foto/document is genomen, bijv. Meterkast, Zolder, Voorgevel';