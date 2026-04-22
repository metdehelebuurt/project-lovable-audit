ALTER TABLE public.opleverrapporten
  ADD COLUMN IF NOT EXISTS opdracht_id uuid REFERENCES public.opdrachten(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_opleverrapporten_opdracht_id ON public.opleverrapporten(opdracht_id);