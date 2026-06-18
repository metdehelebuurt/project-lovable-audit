CREATE TABLE public.affiliate_lead_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bestandsnaam text NOT NULL,
  totaal_rijen integer NOT NULL DEFAULT 0,
  geimporteerd integer NOT NULL DEFAULT 0,
  afgekeurd integer NOT NULL DEFAULT 0,
  kolom_mapping jsonb,
  waarschuwingen jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.affiliate_lead_imports TO authenticated;
GRANT ALL ON public.affiliate_lead_imports TO service_role;

ALTER TABLE public.affiliate_lead_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins kunnen importgeschiedenis zien"
ON public.affiliate_lead_imports FOR SELECT
TO authenticated
USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmins kunnen importgeschiedenis aanmaken"
ON public.affiliate_lead_imports FOR INSERT
TO authenticated
WITH CHECK (public.is_superadmin(auth.uid()) AND created_by = auth.uid());

CREATE INDEX idx_affiliate_lead_imports_created_at ON public.affiliate_lead_imports(created_at DESC);