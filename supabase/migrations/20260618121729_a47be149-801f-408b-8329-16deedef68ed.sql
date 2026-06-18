ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS is_affiliate boolean NOT NULL DEFAULT false;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS affiliate_sinds timestamptz;