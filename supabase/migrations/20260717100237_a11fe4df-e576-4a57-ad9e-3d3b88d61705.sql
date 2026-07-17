
-- === EMAIL ACCOUNTS: meerdere per gebruiker + primair ===
ALTER TABLE public.email_accounts
  ADD COLUMN IF NOT EXISTS is_primair boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS label text,
  ADD COLUMN IF NOT EXISTS laatst_gebruikt_op timestamptz;

-- Oude unieke (user_id, provider) constraint moet weg — gebruiker mag nu meerdere Gmail/Outlook koppelen.
ALTER TABLE public.email_accounts DROP CONSTRAINT IF EXISTS email_accounts_user_provider_key;
ALTER TABLE public.email_accounts DROP CONSTRAINT IF EXISTS email_accounts_user_provider_uniq;
DROP INDEX IF EXISTS public.email_accounts_user_provider_uniq;
DROP INDEX IF EXISTS public.idx_email_accounts_user_provider;

-- Wel uniek op (user_id, provider, email_adres) zodat hetzelfde adres niet dubbel gekoppeld raakt.
CREATE UNIQUE INDEX IF NOT EXISTS email_accounts_user_provider_email_uniq
  ON public.email_accounts (user_id, provider, lower(email_adres))
  WHERE user_id IS NOT NULL;

-- Max één primair actief adres per gebruiker.
CREATE UNIQUE INDEX IF NOT EXISTS email_accounts_primair_per_user
  ON public.email_accounts (user_id)
  WHERE is_primair = true AND actief = true AND user_id IS NOT NULL;

-- Backfill: bestaande actieve accounts krijgen is_primair=true (eerste per user).
WITH ranked AS (
  SELECT id,
         row_number() OVER (PARTITION BY user_id ORDER BY created_at ASC) AS rn
  FROM public.email_accounts
  WHERE user_id IS NOT NULL AND actief = true
)
UPDATE public.email_accounts ea
SET is_primair = true
FROM ranked
WHERE ea.id = ranked.id AND ranked.rn = 1;

-- Trigger: zorg dat max één primair per user en promoveer bij deactivatie.
CREATE OR REPLACE FUNCTION public.ensure_single_primary_email_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fallback_id uuid;
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.user_id IS NOT NULL THEN
    -- Als dit account primair wordt: reset de andere.
    IF NEW.is_primair AND NEW.actief THEN
      UPDATE public.email_accounts
      SET is_primair = false
      WHERE user_id = NEW.user_id
        AND id <> NEW.id
        AND is_primair = true;
    END IF;

    -- Eerste actief account van user: automatisch primair maken.
    IF NEW.actief AND NOT NEW.is_primair THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.email_accounts
        WHERE user_id = NEW.user_id AND actief = true AND is_primair = true AND id <> NEW.id
      ) THEN
        NEW.is_primair := true;
      END IF;
    END IF;

    -- Primair account gedeactiveerd? Promoveer ander account.
    IF TG_OP = 'UPDATE' AND OLD.is_primair AND (NOT NEW.is_primair OR NOT NEW.actief) THEN
      SELECT id INTO fallback_id
      FROM public.email_accounts
      WHERE user_id = NEW.user_id AND actief = true AND id <> NEW.id
      ORDER BY laatst_gebruikt_op DESC NULLS LAST, created_at ASC
      LIMIT 1;
      IF fallback_id IS NOT NULL THEN
        UPDATE public.email_accounts SET is_primair = true WHERE id = fallback_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_single_primary_email_account ON public.email_accounts;
CREATE TRIGGER trg_ensure_single_primary_email_account
BEFORE INSERT OR UPDATE ON public.email_accounts
FOR EACH ROW EXECUTE FUNCTION public.ensure_single_primary_email_account();

-- === GOOGLE CALENDAR ACCOUNTS: meerdere per gebruiker + primair + kleur ===
ALTER TABLE public.google_calendar_accounts
  ADD COLUMN IF NOT EXISTS is_primair boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS label text,
  ADD COLUMN IF NOT EXISTS kleur text;

-- Verwijder impliciete unique(user_id) als die bestaat.
ALTER TABLE public.google_calendar_accounts DROP CONSTRAINT IF EXISTS google_calendar_accounts_user_id_key;
DROP INDEX IF EXISTS public.google_calendar_accounts_user_id_key;

-- Uniek op (user_id, google_email) zodat hetzelfde Google-account niet dubbel gekoppeld raakt.
CREATE UNIQUE INDEX IF NOT EXISTS google_calendar_accounts_user_email_uniq
  ON public.google_calendar_accounts (user_id, lower(google_email));

CREATE UNIQUE INDEX IF NOT EXISTS google_calendar_accounts_primair_per_user
  ON public.google_calendar_accounts (user_id)
  WHERE is_primair = true AND actief = true;

WITH ranked AS (
  SELECT id,
         row_number() OVER (PARTITION BY user_id ORDER BY created_at ASC) AS rn
  FROM public.google_calendar_accounts
  WHERE actief = true
)
UPDATE public.google_calendar_accounts gca
SET is_primair = true
FROM ranked
WHERE gca.id = ranked.id AND ranked.rn = 1;

CREATE OR REPLACE FUNCTION public.ensure_single_primary_calendar_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fallback_id uuid;
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.user_id IS NOT NULL THEN
    IF NEW.is_primair AND NEW.actief THEN
      UPDATE public.google_calendar_accounts
      SET is_primair = false
      WHERE user_id = NEW.user_id
        AND id <> NEW.id
        AND is_primair = true;
    END IF;

    IF NEW.actief AND NOT NEW.is_primair THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.google_calendar_accounts
        WHERE user_id = NEW.user_id AND actief = true AND is_primair = true AND id <> NEW.id
      ) THEN
        NEW.is_primair := true;
      END IF;
    END IF;

    IF TG_OP = 'UPDATE' AND OLD.is_primair AND (NOT NEW.is_primair OR NOT NEW.actief) THEN
      SELECT id INTO fallback_id
      FROM public.google_calendar_accounts
      WHERE user_id = NEW.user_id AND actief = true AND id <> NEW.id
      ORDER BY created_at ASC
      LIMIT 1;
      IF fallback_id IS NOT NULL THEN
        UPDATE public.google_calendar_accounts SET is_primair = true WHERE id = fallback_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_single_primary_calendar_account ON public.google_calendar_accounts;
CREATE TRIGGER trg_ensure_single_primary_calendar_account
BEFORE INSERT OR UPDATE ON public.google_calendar_accounts
FOR EACH ROW EXECUTE FUNCTION public.ensure_single_primary_calendar_account();

-- === EVENT MAPPING: link naar specifiek agenda-account ===
ALTER TABLE public.google_calendar_event_mapping
  ADD COLUMN IF NOT EXISTS calendar_account_id uuid REFERENCES public.google_calendar_accounts(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_gcem_calendar_account_id
  ON public.google_calendar_event_mapping(calendar_account_id);

-- Backfill: koppel bestaande mappings aan het (huidige unieke) account van de user.
UPDATE public.google_calendar_event_mapping m
SET calendar_account_id = gca.id
FROM public.google_calendar_accounts gca
WHERE m.calendar_account_id IS NULL
  AND gca.user_id = m.user_id
  AND gca.actief = true;
