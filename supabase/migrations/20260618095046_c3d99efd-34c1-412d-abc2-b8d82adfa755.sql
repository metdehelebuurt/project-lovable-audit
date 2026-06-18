ALTER TABLE public.schouwen
  ADD COLUMN IF NOT EXISTS is_self_service boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS self_service_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS self_service_completed_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS schouwen_self_service_token_key
  ON public.schouwen (self_service_token);