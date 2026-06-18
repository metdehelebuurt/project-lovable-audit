-- Opvolg-regels per affiliate per lead-type
CREATE TABLE public.affiliate_opvolg_regels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL,
  lead_type text NOT NULL CHECK (lead_type IN ('demo','trial','terugbel','algemeen')),
  actief boolean NOT NULL DEFAULT true,
  aantal_herinneringen int NOT NULL DEFAULT 3 CHECK (aantal_herinneringen BETWEEN 0 AND 10),
  herinnering_termijnen_uren int[] NOT NULL DEFAULT ARRAY[24,72,168],
  escalatie_na_uren int NOT NULL DEFAULT 48 CHECK (escalatie_na_uren >= 0),
  escalatie_toegestaan boolean NOT NULL DEFAULT true,
  ai_herbereken_na_uren int NOT NULL DEFAULT 48,
  notitie text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (affiliate_id, lead_type)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_opvolg_regels TO authenticated;
GRANT ALL ON public.affiliate_opvolg_regels TO service_role;

ALTER TABLE public.affiliate_opvolg_regels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliate beheert eigen opvolg-regels"
ON public.affiliate_opvolg_regels
FOR ALL
TO authenticated
USING (affiliate_id = auth.uid())
WITH CHECK (affiliate_id = auth.uid());

CREATE POLICY "Service role volledige toegang opvolg-regels"
ON public.affiliate_opvolg_regels
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE TRIGGER trg_opvolg_regels_updated_at
BEFORE UPDATE ON public.affiliate_opvolg_regels
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Opvolg-log per lead
CREATE TABLE public.affiliate_opvolg_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  affiliate_id uuid NOT NULL,
  taak_id uuid,
  actie text NOT NULL,
  bron text NOT NULL DEFAULT 'systeem' CHECK (bron IN ('ai','cron','systeem','affiliate')),
  titel text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_opvolg_log_lead ON public.affiliate_opvolg_log(lead_id, created_at DESC);
CREATE INDEX idx_opvolg_log_affiliate ON public.affiliate_opvolg_log(affiliate_id, created_at DESC);

GRANT SELECT, INSERT ON public.affiliate_opvolg_log TO authenticated;
GRANT ALL ON public.affiliate_opvolg_log TO service_role;

ALTER TABLE public.affiliate_opvolg_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliate ziet eigen opvolg-log"
ON public.affiliate_opvolg_log
FOR SELECT
TO authenticated
USING (affiliate_id = auth.uid());

CREATE POLICY "Affiliate voegt eigen log toe"
ON public.affiliate_opvolg_log
FOR INSERT
TO authenticated
WITH CHECK (affiliate_id = auth.uid());

CREATE POLICY "Service role volledige toegang opvolg-log"
ON public.affiliate_opvolg_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
