
ALTER TABLE public.affiliate_leads
  ADD COLUMN IF NOT EXISTS risico_score text,
  ADD COLUMN IF NOT EXISTS risico_reden text,
  ADD COLUMN IF NOT EXISTS risico_next_step text,
  ADD COLUMN IF NOT EXISTS risico_bijgewerkt_op timestamptz;

CREATE TABLE IF NOT EXISTS public.sales_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gebruiker_id uuid NOT NULL,
  datum date NOT NULL DEFAULT current_date,
  inhoud jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gebruiker_id, datum)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_briefings TO authenticated;
GRANT ALL ON public.sales_briefings TO service_role;

ALTER TABLE public.sales_briefings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gebruiker leest eigen briefing"
  ON public.sales_briefings FOR SELECT
  USING (auth.uid() = gebruiker_id);

CREATE POLICY "Gebruiker beheert eigen briefing"
  ON public.sales_briefings FOR ALL
  USING (auth.uid() = gebruiker_id)
  WITH CHECK (auth.uid() = gebruiker_id);
