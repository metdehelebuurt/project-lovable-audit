
-- Add email_provider column to partners
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS email_provider text;

-- Create email_accounts table
CREATE TABLE public.email_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  provider text NOT NULL CHECK (provider IN ('google', 'microsoft')),
  email_adres text NOT NULL,
  access_token text,
  refresh_token text,
  token_expiry timestamptz,
  scopes text[],
  actief boolean NOT NULL DEFAULT true,
  last_sync_at timestamptz,
  sync_cursor text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create email_berichten table
CREATE TABLE public.email_berichten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_account_id uuid REFERENCES public.email_accounts(id) ON DELETE CASCADE NOT NULL,
  partner_id uuid REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  provider_message_id text,
  richting text NOT NULL CHECK (richting IN ('inkomend', 'uitgaand')),
  van text NOT NULL,
  aan text NOT NULL,
  onderwerp text NOT NULL DEFAULT '',
  body_html text,
  body_text text,
  datum timestamptz NOT NULL DEFAULT now(),
  is_gelezen boolean NOT NULL DEFAULT false,
  labels text[],
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  klant_id uuid REFERENCES public.klanten(id) ON DELETE SET NULL,
  offerte_id uuid REFERENCES public.offertes(id) ON DELETE SET NULL,
  bijlagen jsonb DEFAULT '[]'::jsonb,
  thread_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_email_berichten_partner ON public.email_berichten(partner_id);
CREATE INDEX idx_email_berichten_lead ON public.email_berichten(lead_id);
CREATE INDEX idx_email_berichten_klant ON public.email_berichten(klant_id);
CREATE INDEX idx_email_berichten_offerte ON public.email_berichten(offerte_id);
CREATE INDEX idx_email_berichten_datum ON public.email_berichten(datum DESC);
CREATE INDEX idx_email_accounts_partner ON public.email_accounts(partner_id);
CREATE UNIQUE INDEX idx_email_berichten_provider_msg ON public.email_berichten(email_account_id, provider_message_id);

-- RLS on email_accounts
ALTER TABLE public.email_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own partner email accounts"
  ON public.email_accounts FOR SELECT TO authenticated
  USING (partner_id IN (SELECT partner_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update own partner email accounts"
  ON public.email_accounts FOR UPDATE TO authenticated
  USING (partner_id IN (SELECT partner_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert own partner email accounts"
  ON public.email_accounts FOR INSERT TO authenticated
  WITH CHECK (partner_id IN (SELECT partner_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can delete own partner email accounts"
  ON public.email_accounts FOR DELETE TO authenticated
  USING (partner_id IN (SELECT partner_id FROM public.users WHERE id = auth.uid()));

-- RLS on email_berichten
ALTER TABLE public.email_berichten ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own partner email messages"
  ON public.email_berichten FOR SELECT TO authenticated
  USING (partner_id IN (SELECT partner_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert own partner email messages"
  ON public.email_berichten FOR INSERT TO authenticated
  WITH CHECK (partner_id IN (SELECT partner_id FROM public.users WHERE id = auth.uid()));
