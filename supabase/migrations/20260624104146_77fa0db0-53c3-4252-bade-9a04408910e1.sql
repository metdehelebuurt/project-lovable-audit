ALTER TABLE public.affiliate_leads ADD COLUMN IF NOT EXISTS in_pipeline boolean NOT NULL DEFAULT false;

-- Backfill: leads die al actief opgevolgd worden blijven in pipeline; pure 'nieuw' leads gaan terug naar Leads.
UPDATE public.affiliate_leads
SET in_pipeline = true
WHERE status IN ('gebeld_geen_gehoor','gesprek_gepland','in_gesprek','voorstel_verstuurd','gewonnen','verloren');

UPDATE public.affiliate_leads
SET in_pipeline = false
WHERE status = 'nieuw';

CREATE INDEX IF NOT EXISTS idx_affiliate_leads_eigenaar_in_pipeline
  ON public.affiliate_leads (eigenaar_id, in_pipeline);