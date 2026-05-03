
ALTER TABLE public.lead_contactmomenten
  ADD COLUMN IF NOT EXISTS klant_id uuid REFERENCES public.klanten(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS gebeurd_op timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.lead_contactmomenten
  ALTER COLUMN lead_id DROP NOT NULL;

ALTER TABLE public.lead_contactmomenten
  DROP CONSTRAINT IF EXISTS lead_contactmomenten_lead_or_klant_chk;
ALTER TABLE public.lead_contactmomenten
  ADD CONSTRAINT lead_contactmomenten_lead_or_klant_chk
  CHECK (lead_id IS NOT NULL OR klant_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_lead_contactmomenten_klant_id
  ON public.lead_contactmomenten(klant_id);
CREATE INDEX IF NOT EXISTS idx_lead_contactmomenten_gebeurd_op
  ON public.lead_contactmomenten(gebeurd_op DESC);
