ALTER TABLE public.affiliate_leads
  ADD COLUMN IF NOT EXISTS ai_bedrijf_samenvatting text,
  ADD COLUMN IF NOT EXISTS ai_bedrijf_kansen jsonb,
  ADD COLUMN IF NOT EXISTS ai_bedrijf_samenvatting_op timestamptz;