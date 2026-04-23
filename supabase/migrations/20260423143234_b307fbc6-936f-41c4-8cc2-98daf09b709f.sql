ALTER TABLE public.abonnement_wijzigingen
  DROP CONSTRAINT IF EXISTS abonnement_wijzigingen_user_id_fkey;

ALTER TABLE public.abonnement_wijzigingen
  ADD CONSTRAINT abonnement_wijzigingen_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;