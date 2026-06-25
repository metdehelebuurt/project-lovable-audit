
-- Batch 2: terugbel_gepland status + no-show + reminder kolommen + stale tracking
ALTER TYPE public.affiliate_lead_status ADD VALUE IF NOT EXISTS 'terugbel_gepland' BEFORE 'gesprek_gepland';

ALTER TABLE public.affiliate_terugbel_afspraken
  ADD COLUMN IF NOT EXISTS noshow boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS noshow_gemeld_op timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_24u_op timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_1u_op timestamptz;

CREATE INDEX IF NOT EXISTS idx_affiliate_terugbel_geplande_open
  ON public.affiliate_terugbel_afspraken(geplande_op)
  WHERE afgehandeld_op IS NULL;

ALTER TABLE public.affiliate_leads
  ADD COLUMN IF NOT EXISTS stale_gemeld_op timestamptz;
