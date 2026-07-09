ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS trial_bron text;

-- Backfill bestaande trial-partners.
UPDATE public.partners p
SET trial_bron = CASE
  WHEN EXISTS (SELECT 1 FROM public.affiliate_referrals r WHERE r.partner_id = p.id) THEN 'affiliate'
  WHEN p.trial_aangemaakt_door_id IS NOT NULL THEN 'sales'
  WHEN p.abonnement_type = 'trial' THEN 'selfservice'
  ELSE NULL
END
WHERE trial_bron IS NULL;

CREATE INDEX IF NOT EXISTS partners_trial_bron_idx ON public.partners(trial_bron) WHERE trial_bron IS NOT NULL;