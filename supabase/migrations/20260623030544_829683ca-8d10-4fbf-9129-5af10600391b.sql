ALTER TABLE public.affiliate_leads
  ADD COLUMN IF NOT EXISTS adres text,
  ADD COLUMN IF NOT EXISTS postcode text,
  ADD COLUMN IF NOT EXISTS plaats text;