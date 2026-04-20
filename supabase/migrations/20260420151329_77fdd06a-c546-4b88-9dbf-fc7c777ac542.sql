
-- 1. Storage bucket voor email bijlagen
INSERT INTO storage.buckets (id, name, public)
VALUES ('email-bijlagen', 'email-bijlagen', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies voor bucket: pad = {partner_id}/...
CREATE POLICY "Partner users kunnen email bijlagen lezen"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'email-bijlagen'
  AND (storage.foldername(name))[1] = get_user_partner_id(auth.uid())::text
);

CREATE POLICY "Partner users kunnen email bijlagen uploaden"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'email-bijlagen'
  AND (storage.foldername(name))[1] = get_user_partner_id(auth.uid())::text
);

CREATE POLICY "Partner users kunnen email bijlagen verwijderen"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'email-bijlagen'
  AND (storage.foldername(name))[1] = get_user_partner_id(auth.uid())::text
);

-- Service role mag alles (voor edge functions)
CREATE POLICY "Service role volledige toegang email bijlagen"
ON storage.objects FOR ALL TO service_role
USING (bucket_id = 'email-bijlagen')
WITH CHECK (bucket_id = 'email-bijlagen');

-- 2. Extra emails kolom op klanten
ALTER TABLE public.klanten
  ADD COLUMN IF NOT EXISTS extra_emails text[] NOT NULL DEFAULT '{}';

-- 3. Indexen voor snelle email lookup
CREATE INDEX IF NOT EXISTS idx_email_berichten_van_lower
  ON public.email_berichten(lower(van));
CREATE INDEX IF NOT EXISTS idx_email_berichten_aan_lower
  ON public.email_berichten(lower(aan));

-- 4. Trigger: automatisch klant_id invullen op basis van email match
CREATE OR REPLACE FUNCTION public.match_email_bericht_to_klant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  zoek_email text;
  gevonden_klant_id uuid;
BEGIN
  IF NEW.klant_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Bepaal welk adres we matchen: bij inkomend = van, bij uitgaand = aan
  zoek_email := lower(CASE WHEN NEW.richting = 'inkomend' THEN NEW.van ELSE NEW.aan END);

  IF zoek_email IS NULL OR zoek_email = '' THEN
    RETURN NEW;
  END IF;

  SELECT id INTO gevonden_klant_id
  FROM public.klanten
  WHERE partner_id = NEW.partner_id
    AND (
      lower(email) = zoek_email
      OR zoek_email = ANY(SELECT lower(unnest(extra_emails)))
    )
  LIMIT 1;

  IF gevonden_klant_id IS NOT NULL THEN
    NEW.klant_id := gevonden_klant_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_match_email_bericht_to_klant ON public.email_berichten;
CREATE TRIGGER trg_match_email_bericht_to_klant
  BEFORE INSERT ON public.email_berichten
  FOR EACH ROW
  EXECUTE FUNCTION public.match_email_bericht_to_klant();

-- 5. Eenmalige backfill voor bestaande berichten zonder klant_id
UPDATE public.email_berichten eb
SET klant_id = k.id
FROM public.klanten k
WHERE eb.klant_id IS NULL
  AND eb.partner_id = k.partner_id
  AND (
    lower(k.email) = lower(CASE WHEN eb.richting = 'inkomend' THEN eb.van ELSE eb.aan END)
    OR lower(CASE WHEN eb.richting = 'inkomend' THEN eb.van ELSE eb.aan END) = ANY(SELECT lower(unnest(k.extra_emails)))
  );
