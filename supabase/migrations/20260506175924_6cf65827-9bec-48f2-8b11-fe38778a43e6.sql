-- Voeg sleutel + bijlage_default toe aan bestaande email_templates
ALTER TABLE public.email_templates
  ADD COLUMN IF NOT EXISTS sleutel text,
  ADD COLUMN IF NOT EXISTS bijlage_default boolean NOT NULL DEFAULT true;

-- Unique constraint per partner + sleutel (alleen als sleutel niet null)
CREATE UNIQUE INDEX IF NOT EXISTS uq_email_templates_partner_sleutel
  ON public.email_templates(partner_id, sleutel)
  WHERE sleutel IS NOT NULL;