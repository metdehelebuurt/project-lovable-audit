ALTER TABLE public.affiliate_leads
  ADD COLUMN IF NOT EXISTS winning_play_samenvatting TEXT,
  ADD COLUMN IF NOT EXISTS winning_play_hoogtepunten JSONB,
  ADD COLUMN IF NOT EXISTS winning_play_bijgewerkt_op TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.sales_coaching_tips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  eigenaar_id UUID NOT NULL,
  gegenereerd_op TIMESTAMPTZ NOT NULL DEFAULT now(),
  tips JSONB NOT NULL,
  context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (eigenaar_id, gegenereerd_op)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_coaching_tips TO authenticated;
GRANT ALL ON public.sales_coaching_tips TO service_role;

ALTER TABLE public.sales_coaching_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coaching_tips_select_self"
  ON public.sales_coaching_tips FOR SELECT
  TO authenticated
  USING (
    eigenaar_id = auth.uid()
    OR public.user_has_role(auth.uid(), 'superadmin'::app_role)
    OR public.user_has_role(auth.uid(), 'sales_manager'::app_role)
  );

CREATE POLICY "coaching_tips_manager_write"
  ON public.sales_coaching_tips FOR ALL
  TO authenticated
  USING (
    public.user_has_role(auth.uid(), 'superadmin'::app_role)
    OR public.user_has_role(auth.uid(), 'sales_manager'::app_role)
  )
  WITH CHECK (
    public.user_has_role(auth.uid(), 'superadmin'::app_role)
    OR public.user_has_role(auth.uid(), 'sales_manager'::app_role)
  );

CREATE INDEX IF NOT EXISTS sales_coaching_tips_eigenaar_idx ON public.sales_coaching_tips (eigenaar_id, gegenereerd_op DESC);