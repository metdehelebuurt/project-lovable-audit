ALTER TABLE public.affiliate_terugbel_afspraken
  ADD COLUMN IF NOT EXISTS collega_user_id uuid NULL REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_affiliate_terugbel_collega ON public.affiliate_terugbel_afspraken(collega_user_id);