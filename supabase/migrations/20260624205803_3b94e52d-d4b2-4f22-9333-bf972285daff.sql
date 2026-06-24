
-- 1. Extend feedback_verzoeken
ALTER TABLE public.feedback_verzoeken
  ADD COLUMN IF NOT EXISTS gearchiveerd boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verwacht_klaar_op date,
  ADD COLUMN IF NOT EXISTS verwerkt_in_versie text,
  ADD COLUMN IF NOT EXISTS bevestiging_status text,
  ADD COLUMN IF NOT EXISTS bevestiging_opmerking text,
  ADD COLUMN IF NOT EXISTS bevestiging_op timestamptz;

CREATE INDEX IF NOT EXISTS feedback_verzoeken_gearchiveerd_idx
  ON public.feedback_verzoeken (gearchiveerd);
CREATE INDEX IF NOT EXISTS feedback_verzoeken_status_idx
  ON public.feedback_verzoeken (status);

-- 2. feedback_reacties
CREATE TABLE IF NOT EXISTS public.feedback_reacties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id uuid NOT NULL REFERENCES public.feedback_verzoeken(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bericht text NOT NULL,
  intern boolean NOT NULL DEFAULT false,
  soort text NOT NULL DEFAULT 'reactie',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback_reacties TO authenticated;
GRANT ALL ON public.feedback_reacties TO service_role;

ALTER TABLE public.feedback_reacties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin alles op feedback_reacties"
  ON public.feedback_reacties FOR ALL
  TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

CREATE POLICY "Indiener leest eigen niet-interne reacties"
  ON public.feedback_reacties FOR SELECT
  TO authenticated
  USING (
    intern = false
    AND EXISTS (
      SELECT 1 FROM public.feedback_verzoeken fv
      WHERE fv.id = feedback_reacties.feedback_id
        AND fv.user_id = auth.uid()
    )
  );

CREATE POLICY "Partner ziet partner reacties niet-intern"
  ON public.feedback_reacties FOR SELECT
  TO authenticated
  USING (
    intern = false
    AND EXISTS (
      SELECT 1 FROM public.feedback_verzoeken fv
      WHERE fv.id = feedback_reacties.feedback_id
        AND fv.partner_id = get_user_partner_id(auth.uid())
    )
  );

CREATE POLICY "Gebruiker plaatst eigen reactie op zichtbaar verzoek"
  ON public.feedback_reacties FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND intern = false
    AND EXISTS (
      SELECT 1 FROM public.feedback_verzoeken fv
      WHERE fv.id = feedback_reacties.feedback_id
        AND (fv.user_id = auth.uid()
             OR fv.partner_id = get_user_partner_id(auth.uid())
             OR is_superadmin(auth.uid()))
    )
  );

CREATE INDEX feedback_reacties_feedback_id_idx ON public.feedback_reacties (feedback_id, created_at);

-- 3. feedback_stemmen
CREATE TABLE IF NOT EXISTS public.feedback_stemmen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id uuid NOT NULL REFERENCES public.feedback_verzoeken(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (feedback_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.feedback_stemmen TO authenticated;
GRANT ALL ON public.feedback_stemmen TO service_role;

ALTER TABLE public.feedback_stemmen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gebruiker leest stemmen"
  ON public.feedback_stemmen FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gebruiker stemt zelf"
  ON public.feedback_stemmen FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Gebruiker trekt eigen stem in"
  ON public.feedback_stemmen FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
