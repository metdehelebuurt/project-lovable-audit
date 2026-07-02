
CREATE TABLE IF NOT EXISTS public.affiliate_notificatie_voorkeuren (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  categorie text NOT NULL,
  in_app boolean NOT NULL DEFAULT true,
  email boolean NOT NULL DEFAULT false,
  browser boolean NOT NULL DEFAULT false,
  stiltijd_van time,
  stiltijd_tot time,
  temperaturen text[] NOT NULL DEFAULT ARRAY['koud','lauw','warm','heet']::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, categorie)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_notificatie_voorkeuren TO authenticated;
GRANT ALL ON public.affiliate_notificatie_voorkeuren TO service_role;

ALTER TABLE public.affiliate_notificatie_voorkeuren ENABLE ROW LEVEL SECURITY;

CREATE POLICY "eigen voorkeuren beheren"
  ON public.affiliate_notificatie_voorkeuren
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.trg_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS touch_updated_at_aff_notif ON public.affiliate_notificatie_voorkeuren;
CREATE TRIGGER touch_updated_at_aff_notif
BEFORE UPDATE ON public.affiliate_notificatie_voorkeuren
FOR EACH ROW EXECUTE FUNCTION public.trg_touch_updated_at();
