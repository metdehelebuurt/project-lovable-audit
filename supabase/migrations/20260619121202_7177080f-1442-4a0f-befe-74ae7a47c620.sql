
ALTER TABLE public.email_accounts
  ADD COLUMN IF NOT EXISTS last_sync_error TEXT,
  ADD COLUMN IF NOT EXISTS last_sync_error_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS needs_reauth BOOLEAN NOT NULL DEFAULT false;

-- Verwijder eventuele oude unieke constraint op (user_id, provider) die NULL-conflicten geeft
DO $$
DECLARE c text;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.email_accounts'::regclass
      AND contype = 'u'
      AND pg_get_constraintdef(oid) ILIKE '%(user_id, provider)%'
  LOOP
    EXECUTE format('ALTER TABLE public.email_accounts DROP CONSTRAINT %I', c);
  END LOOP;
END $$;

DROP INDEX IF EXISTS email_accounts_user_provider_key;
DROP INDEX IF EXISTS email_accounts_user_id_provider_key;

CREATE UNIQUE INDEX IF NOT EXISTS email_accounts_user_provider_uniq
  ON public.email_accounts (user_id, provider)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS email_accounts_partner_org_provider_uniq
  ON public.email_accounts (partner_id, provider, email_adres)
  WHERE user_id IS NULL;
