-- 1. AI-velden op affiliate_leads
ALTER TABLE public.affiliate_leads
  ADD COLUMN IF NOT EXISTS ai_score int NULL,
  ADD COLUMN IF NOT EXISTS ai_score_reden text NULL,
  ADD COLUMN IF NOT EXISTS ai_volgende_actie text NULL,
  ADD COLUMN IF NOT EXISTS ai_volgende_actie_op timestamptz NULL,
  ADD COLUMN IF NOT EXISTS laatst_gescoord_op timestamptz NULL;

-- 2. Opvolg-taken tabel
CREATE TABLE IF NOT EXISTS public.affiliate_opvolg_taken (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lead_id uuid NULL REFERENCES public.affiliate_leads(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'anders' CHECK (type IN ('bel','mail','demo','trial_check','whatsapp','anders')),
  titel text NOT NULL,
  notitie text NULL,
  due_op timestamptz NOT NULL,
  voltooid_op timestamptz NULL,
  bron text NOT NULL DEFAULT 'handmatig' CHECK (bron IN ('handmatig','ai','automatisch')),
  prioriteit text NOT NULL DEFAULT 'normaal' CHECK (prioriteit IN ('laag','normaal','hoog')),
  herinnering_verstuurd_op timestamptz NULL,
  escalatie_verstuurd_op timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_opvolg_taken TO authenticated;
GRANT ALL ON public.affiliate_opvolg_taken TO service_role;

ALTER TABLE public.affiliate_opvolg_taken ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliate ziet eigen opvolg-taken"
  ON public.affiliate_opvolg_taken FOR SELECT TO authenticated
  USING (affiliate_id = auth.uid());

CREATE POLICY "Affiliate beheert eigen opvolg-taken (insert)"
  ON public.affiliate_opvolg_taken FOR INSERT TO authenticated
  WITH CHECK (affiliate_id = auth.uid());

CREATE POLICY "Affiliate beheert eigen opvolg-taken (update)"
  ON public.affiliate_opvolg_taken FOR UPDATE TO authenticated
  USING (affiliate_id = auth.uid()) WITH CHECK (affiliate_id = auth.uid());

CREATE POLICY "Affiliate verwijdert eigen opvolg-taken"
  ON public.affiliate_opvolg_taken FOR DELETE TO authenticated
  USING (affiliate_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_opvolg_taken_affiliate_due ON public.affiliate_opvolg_taken(affiliate_id, due_op);
CREATE INDEX IF NOT EXISTS idx_opvolg_taken_lead ON public.affiliate_opvolg_taken(lead_id);

CREATE OR REPLACE FUNCTION public.tg_opvolg_taken_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_opvolg_taken_updated_at ON public.affiliate_opvolg_taken;
CREATE TRIGGER trg_opvolg_taken_updated_at
  BEFORE UPDATE ON public.affiliate_opvolg_taken
  FOR EACH ROW EXECUTE FUNCTION public.tg_opvolg_taken_updated_at();

-- 3. Trial-opvolging idempotentie velden
ALTER TABLE public.affiliate_referrals
  ADD COLUMN IF NOT EXISTS trial_check_uitgevoerd_op timestamptz NULL,
  ADD COLUMN IF NOT EXISTS trial_laatste_herinnering_op timestamptz NULL;