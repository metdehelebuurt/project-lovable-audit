ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS geblokkeerd_betaal_url text;
ALTER TABLE public.partner_blokkades ADD COLUMN IF NOT EXISTS betaal_url text;