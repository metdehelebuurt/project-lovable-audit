ALTER TABLE public.opleverrapporten
  ADD COLUMN IF NOT EXISTS klant_view_token uuid,
  ADD COLUMN IF NOT EXISTS klant_view_token_expires_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_opleverrapporten_klant_view_token
  ON public.opleverrapporten(klant_view_token)
  WHERE klant_view_token IS NOT NULL;