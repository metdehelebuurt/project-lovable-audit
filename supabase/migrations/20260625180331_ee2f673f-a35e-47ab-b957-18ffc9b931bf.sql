
-- 1. Schrijfstijl per user (één rij per user)
CREATE TABLE public.ai_template_schrijfstijl (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profiel_samenvatting text DEFAULT '',
  voorkeuren jsonb NOT NULL DEFAULT '{}'::jsonb,
  generaties_sinds_consolidatie int NOT NULL DEFAULT 0,
  laatst_geconsolideerd_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_template_schrijfstijl TO authenticated;
GRANT ALL ON public.ai_template_schrijfstijl TO service_role;

ALTER TABLE public.ai_template_schrijfstijl ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schrijfstijl_eigen_select" ON public.ai_template_schrijfstijl
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "schrijfstijl_eigen_insert" ON public.ai_template_schrijfstijl
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "schrijfstijl_eigen_update" ON public.ai_template_schrijfstijl
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "schrijfstijl_eigen_delete" ON public.ai_template_schrijfstijl
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_ai_template_schrijfstijl_updated
  BEFORE UPDATE ON public.ai_template_schrijfstijl
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Generatie-log
CREATE TABLE public.ai_template_generaties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bron text NOT NULL,                       -- 'affiliate' | 'sales' | etc
  template_key text,                        -- key/id van het template
  mode text NOT NULL DEFAULT 'volledig',    -- volledig|alleen_onderwerp|ab_variant
  input_onderwerp text,
  input_body text,
  instellingen jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_onderwerp text,
  output_body text,
  output_uitleg text,
  status text NOT NULL DEFAULT 'voorgesteld', -- voorgesteld|toegepast|verworpen|bewerkt
  finale_onderwerp text,
  finale_body text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_template_generaties_user ON public.ai_template_generaties(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_template_generaties TO authenticated;
GRANT ALL ON public.ai_template_generaties TO service_role;

ALTER TABLE public.ai_template_generaties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "generaties_eigen_select" ON public.ai_template_generaties
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "generaties_eigen_insert" ON public.ai_template_generaties
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "generaties_eigen_update" ON public.ai_template_generaties
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "generaties_eigen_delete" ON public.ai_template_generaties
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_ai_template_generaties_updated
  BEFORE UPDATE ON public.ai_template_generaties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Vrije feedback-zinnen
CREATE TABLE public.ai_template_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generatie_id uuid REFERENCES public.ai_template_generaties(id) ON DELETE SET NULL,
  feedback text NOT NULL,
  sentiment text,             -- 'positief' | 'negatief' | 'neutraal'
  verwerkt_in_profiel boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_template_feedback_user ON public.ai_template_feedback(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_template_feedback TO authenticated;
GRANT ALL ON public.ai_template_feedback TO service_role;

ALTER TABLE public.ai_template_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedback_eigen_select" ON public.ai_template_feedback
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "feedback_eigen_insert" ON public.ai_template_feedback
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "feedback_eigen_update" ON public.ai_template_feedback
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "feedback_eigen_delete" ON public.ai_template_feedback
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
