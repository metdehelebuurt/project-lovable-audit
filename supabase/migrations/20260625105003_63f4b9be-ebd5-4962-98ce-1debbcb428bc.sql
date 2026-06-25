-- Vervang partiële unique index door echte UNIQUE constraint zodat ON CONFLICT (user_id, provider)
-- door PostgREST/upsert herkend wordt.
DROP INDEX IF EXISTS public.email_accounts_user_provider_uniq;

-- NULLs worden in btree als distinct beschouwd, dus partner-rijen (user_id IS NULL) blijven mogelijk
-- en worden alsnog uniek gemaakt door email_accounts_partner_org_provider_uniq.
ALTER TABLE public.email_accounts
  ADD CONSTRAINT email_accounts_user_provider_uniq UNIQUE (user_id, provider);