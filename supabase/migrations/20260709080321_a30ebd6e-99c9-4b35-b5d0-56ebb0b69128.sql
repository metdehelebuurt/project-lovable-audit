
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS trial_aangemaakt_door_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS trial_aangemaakt_op timestamptz,
  ADD COLUMN IF NOT EXISTS demo_data_geseed_op timestamptz,
  ADD COLUMN IF NOT EXISTS demo_data_geseed_door_id uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- Backfill trial_aangemaakt_op voor bestaande trial-partners
UPDATE public.partners
SET trial_aangemaakt_op = created_at
WHERE trial_aangemaakt_op IS NULL AND abonnement_type = 'trial';

-- Backfill demo_data_geseed_op als er demo-notities zichtbaar zijn (leads met '⚡ Demo:')
UPDATE public.partners p
SET demo_data_geseed_op = p.created_at
WHERE demo_data_geseed_op IS NULL
  AND EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.partner_id = p.id
      AND (l.notities ILIKE '%⚡ Demo:%' OR l.notities ILIKE '%Demo:%')
  );
