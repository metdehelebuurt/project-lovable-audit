-- 1. Subtype en termijn-velden op financiele_documenten
ALTER TABLE public.financiele_documenten
  ADD COLUMN IF NOT EXISTS factuur_subtype text NOT NULL DEFAULT 'regulier'
    CHECK (factuur_subtype IN ('regulier','voorschot','eindafrekening')),
  ADD COLUMN IF NOT EXISTS termijn_volgnummer integer,
  ADD COLUMN IF NOT EXISTS termijn_totaal integer,
  ADD COLUMN IF NOT EXISTS termijn_percentage numeric,
  ADD COLUMN IF NOT EXISTS voorschot_van_facturen uuid[];

CREATE INDEX IF NOT EXISTS idx_fd_subtype_offerte
  ON public.financiele_documenten(offerte_id, factuur_subtype);

-- 2. Termijnschema-tabel
CREATE TABLE IF NOT EXISTS public.offerte_termijnschema (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offerte_id uuid NOT NULL REFERENCES public.offertes(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL,
  volgnummer integer NOT NULL,
  omschrijving text NOT NULL,
  percentage numeric NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  trigger_status text CHECK (trigger_status IN ('handmatig','opdracht_bevestigd','installatie_gepland','installatie_uitgevoerd','opgeleverd')),
  factuur_id uuid REFERENCES public.financiele_documenten(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','gefactureerd','betaald','overgeslagen')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(offerte_id, volgnummer)
);

CREATE INDEX IF NOT EXISTS idx_termijnschema_offerte ON public.offerte_termijnschema(offerte_id);
CREATE INDEX IF NOT EXISTS idx_termijnschema_partner ON public.offerte_termijnschema(partner_id);

ALTER TABLE public.offerte_termijnschema ENABLE ROW LEVEL SECURITY;

-- RLS: admin-tier en partner_staff mogen beheren binnen partner; adviseurs alleen eigen offertes lezen
CREATE POLICY "Admin tier en staff beheren termijnschema"
  ON public.offerte_termijnschema
  FOR ALL
  USING (
    public.is_superadmin(auth.uid())
    OR (
      partner_id = public.get_user_partner_id(auth.uid())
      AND public.get_user_role(auth.uid()) IN ('partner_admin','backoffice','partner_staff')
    )
  )
  WITH CHECK (
    public.is_superadmin(auth.uid())
    OR (
      partner_id = public.get_user_partner_id(auth.uid())
      AND public.get_user_role(auth.uid()) IN ('partner_admin','backoffice','partner_staff')
    )
  );

CREATE POLICY "Adviseurs lezen termijnschema eigen offertes"
  ON public.offerte_termijnschema
  FOR SELECT
  USING (
    partner_id = public.get_user_partner_id(auth.uid())
    AND public.get_user_role(auth.uid()) = 'adviseur'
    AND EXISTS (
      SELECT 1 FROM public.offertes o
      WHERE o.id = offerte_termijnschema.offerte_id
        AND o.adviseur_id = auth.uid()
    )
  );

CREATE TRIGGER trg_termijnschema_updated_at
  BEFORE UPDATE ON public.offerte_termijnschema
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Documentnummering uitbreiden met voorschot-prefix
CREATE OR REPLACE FUNCTION public.generate_financieel_documentnummer(
  _partner_id uuid,
  _type public.financieel_document_type,
  _subtype text DEFAULT 'regulier'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _prefix text;
  _year text;
  _count integer;
BEGIN
  _year := to_char(now(), 'YYYY');

  IF _type = 'verkoopfactuur' AND _subtype = 'voorschot' THEN
    _prefix := 'VS';
    SELECT COUNT(*) + 1 INTO _count
    FROM public.financiele_documenten
    WHERE partner_id = _partner_id
      AND type = 'verkoopfactuur'
      AND factuur_subtype = 'voorschot'
      AND extract(year from created_at) = extract(year from now());
  ELSE
    CASE _type
      WHEN 'verkoopfactuur' THEN _prefix := 'VF';
      WHEN 'creditnota' THEN _prefix := 'CN';
      WHEN 'inkoopfactuur' THEN _prefix := 'IF';
      WHEN 'inkooporder' THEN _prefix := 'IO';
      WHEN 'pakbon' THEN _prefix := 'PB';
    END CASE;

    SELECT COUNT(*) + 1 INTO _count
    FROM public.financiele_documenten
    WHERE partner_id = _partner_id
      AND type = _type
      AND COALESCE(factuur_subtype,'regulier') <> 'voorschot'
      AND extract(year from created_at) = extract(year from now());
  END IF;

  RETURN _prefix || '-' || _year || '-' || lpad(_count::text, 4, '0');
END;
$function$;