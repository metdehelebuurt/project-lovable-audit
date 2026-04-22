
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS mollie_customer_id text,
  ADD COLUMN IF NOT EXISTS mollie_mandate_id text,
  ADD COLUMN IF NOT EXISTS mollie_mandate_status text;

ALTER TABLE public.abonnementen
  ADD COLUMN IF NOT EXISTS mollie_subscription_id text,
  ADD COLUMN IF NOT EXISTS mollie_status text,
  ADD COLUMN IF NOT EXISTS mandaat_vereist_voor date;

ALTER TABLE public.abonnement_addon_aankopen
  ADD COLUMN IF NOT EXISTS mollie_subscription_id text,
  ADD COLUMN IF NOT EXISTS mollie_payment_id text;

ALTER TABLE public.facturen
  ADD COLUMN IF NOT EXISTS mollie_payment_id text,
  ADD COLUMN IF NOT EXISTS mollie_payment_status text,
  ADD COLUMN IF NOT EXISTS mollie_checkout_url text;

CREATE TABLE IF NOT EXISTS public.mollie_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  mollie_payment_id text,
  mollie_subscription_id text,
  mollie_mandate_id text,
  mollie_customer_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed boolean NOT NULL DEFAULT false,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mollie_webhook_events_payment ON public.mollie_webhook_events(mollie_payment_id);
CREATE INDEX IF NOT EXISTS idx_mollie_webhook_events_subscription ON public.mollie_webhook_events(mollie_subscription_id);
CREATE INDEX IF NOT EXISTS idx_mollie_webhook_events_processed ON public.mollie_webhook_events(processed, created_at);

ALTER TABLE public.mollie_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin kan webhook events bekijken"
  ON public.mollie_webhook_events
  FOR SELECT
  TO authenticated
  USING (public.is_superadmin(auth.uid()));
