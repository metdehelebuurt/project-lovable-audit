ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS onboarding_voltooid_op timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_overgeslagen_op timestamptz,
  ADD COLUMN IF NOT EXISTS voorkeuren jsonb NOT NULL DEFAULT '{}'::jsonb;