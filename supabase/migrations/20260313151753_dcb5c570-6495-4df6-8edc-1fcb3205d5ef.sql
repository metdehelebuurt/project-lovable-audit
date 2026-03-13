ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS smtp_host text,
  ADD COLUMN IF NOT EXISTS smtp_port integer DEFAULT 587,
  ADD COLUMN IF NOT EXISTS smtp_user text,
  ADD COLUMN IF NOT EXISTS smtp_pass_encrypted text,
  ADD COLUMN IF NOT EXISTS afzender_email text,
  ADD COLUMN IF NOT EXISTS afzender_naam text;