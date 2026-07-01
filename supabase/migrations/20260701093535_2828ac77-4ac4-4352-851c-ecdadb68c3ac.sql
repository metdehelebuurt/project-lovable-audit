DROP INDEX IF EXISTS public.idx_email_accounts_partner_provider;
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_accounts_user_provider
  ON public.email_accounts (user_id, provider);