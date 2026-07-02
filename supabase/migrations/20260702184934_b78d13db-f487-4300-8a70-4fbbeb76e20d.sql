-- Track duplicate opleverrapporten and enable realtime for shared editing
ALTER TABLE public.opleverrapporten
  ADD COLUMN IF NOT EXISTS duplicaat_van_id uuid REFERENCES public.opleverrapporten(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS duplicaat_reden text;

CREATE INDEX IF NOT EXISTS idx_opleverrapporten_opdracht_id ON public.opleverrapporten(opdracht_id);
CREATE INDEX IF NOT EXISTS idx_opleverrapporten_installatie_id ON public.opleverrapporten(installatie_id);

-- Enable realtime so backoffice and monteur zien elkaars wijzigingen live
ALTER TABLE public.opleverrapporten REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'opleverrapporten'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.opleverrapporten';
  END IF;
END$$;