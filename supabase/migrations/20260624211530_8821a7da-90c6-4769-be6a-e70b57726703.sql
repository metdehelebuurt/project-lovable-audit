ALTER TABLE public.feedback_verzoeken ADD COLUMN IF NOT EXISTS csat_score smallint CHECK (csat_score BETWEEN 1 AND 5);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='feedback_verzoeken' AND policyname='Roadmap publiek leesbaar'
  ) THEN
    CREATE POLICY "Roadmap publiek leesbaar" ON public.feedback_verzoeken
      FOR SELECT TO anon, authenticated
      USING (gearchiveerd IS NOT TRUE AND status <> 'afgewezen');
  END IF;
END $$;

GRANT SELECT ON public.feedback_verzoeken TO anon;