ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS iban text,
  ADD COLUMN IF NOT EXISTS iban_tnv text,
  ADD COLUMN IF NOT EXISTS bic text;