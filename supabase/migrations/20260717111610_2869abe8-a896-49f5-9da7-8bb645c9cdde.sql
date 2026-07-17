
-- Fix recursie in primair-triggers: promoveer-fallback alleen op top-level
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
    IF NEW.is_primair AND NEW.actief THEN
      UPDATE public.email_accounts
      SET is_primair = false
      WHERE user_id = NEW.user_id
        AND id <> NEW.id
        AND is_primair = true;
    END IF;

    IF NEW.actief AND NOT NEW.is_primair THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.email_accounts
        WHERE user_id = NEW.user_id AND actief = true AND is_primair = true AND id <> NEW.id
      ) THEN
        NEW.is_primair := true;
      END IF;
    END IF;

    -- Alleen op top-level trigger promoveren, anders recursie/conflict.
    IF TG_OP = 'UPDATE' AND OLD.is_primair AND (NOT NEW.is_primair OR NOT NEW.actief) AND pg_trigger_depth() = 1 THEN
      SELECT id INTO fallback_id
      FROM public.email_accounts
      WHERE user_id = NEW.user_id AND actief = true AND id <> NEW.id AND is_primair = false
      ORDER BY laatst_gebruikt_op DESC NULLS LAST, created_at ASC
      LIMIT 1;
      IF fallback_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.email_accounts
        WHERE user_id = NEW.user_id AND actief = true AND is_primair = true AND id <> NEW.id
      ) THEN
        UPDATE public.email_accounts SET is_primair = true WHERE id = fallback_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

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

    IF TG_OP = 'UPDATE' AND OLD.is_primair AND (NOT NEW.is_primair OR NOT NEW.actief) AND pg_trigger_depth() = 1 THEN
      SELECT id INTO fallback_id
      FROM public.google_calendar_accounts
      WHERE user_id = NEW.user_id AND actief = true AND id <> NEW.id AND is_primair = false
      ORDER BY created_at ASC
      LIMIT 1;
      IF fallback_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.google_calendar_accounts
        WHERE user_id = NEW.user_id AND actief = true AND is_primair = true AND id <> NEW.id
      ) THEN
        UPDATE public.google_calendar_accounts SET is_primair = true WHERE id = fallback_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Corrigeer eventueel bestaande dubbele primair-rijen (mocht dat bestaan)
WITH ranked AS (
  SELECT id,
         row_number() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
  FROM public.email_accounts
  WHERE actief = true AND is_primair = true AND user_id IS NOT NULL
)
UPDATE public.email_accounts ea SET is_primair = false
FROM ranked WHERE ea.id = ranked.id AND ranked.rn > 1;

WITH ranked AS (
  SELECT id,
         row_number() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
  FROM public.google_calendar_accounts
  WHERE actief = true AND is_primair = true AND user_id IS NOT NULL
)
UPDATE public.google_calendar_accounts ea SET is_primair = false
FROM ranked WHERE ea.id = ranked.id AND ranked.rn > 1;
