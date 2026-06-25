-- Voeg App-Password (IMAP/SMTP) ondersteuning toe aan email_accounts.
-- Bestaande OAuth-koppelingen blijven onaangetast.
ALTER TABLE public.email_accounts
  ADD COLUMN IF NOT EXISTS auth_method text NOT NULL DEFAULT 'oauth'
    CHECK (auth_method IN ('oauth','app_password','beide')),
  ADD COLUMN IF NOT EXISTS app_password_encrypted text,
  ADD COLUMN IF NOT EXISTS smtp_host text,
  ADD COLUMN IF NOT EXISTS smtp_port integer,
  ADD COLUMN IF NOT EXISTS imap_host text,
  ADD COLUMN IF NOT EXISTS imap_port integer,
  ADD COLUMN IF NOT EXISTS imap_last_uid bigint,
  ADD COLUMN IF NOT EXISTS last_send_method text
    CHECK (last_send_method IN ('oauth_api','smtp_app_password') OR last_send_method IS NULL),
  ADD COLUMN IF NOT EXISTS last_send_error text,
  ADD COLUMN IF NOT EXISTS last_send_error_at timestamptz;

COMMENT ON COLUMN public.email_accounts.auth_method IS
  'Welke auth-methodes zijn geconfigureerd: oauth (alleen API), app_password (alleen IMAP/SMTP), of beide (API met SMTP-fallback).';
COMMENT ON COLUMN public.email_accounts.app_password_encrypted IS
  'AES-GCM versleuteld Gmail App Password (base64). Sleutel: EMAIL_PASSWORD_ENCRYPTION_KEY (edge-function secret).';

-- Optioneel: maak partner_id nullable als dat nog niet zo is (affiliates hebben er soms geen).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='email_accounts'
      AND column_name='partner_id' AND is_nullable='NO'
  ) THEN
    ALTER TABLE public.email_accounts ALTER COLUMN partner_id DROP NOT NULL;
  END IF;
END $$;