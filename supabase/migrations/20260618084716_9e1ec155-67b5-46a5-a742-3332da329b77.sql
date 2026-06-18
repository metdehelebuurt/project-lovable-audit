
CREATE TABLE public.feedback_notificatie_voorkeuren (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_bug boolean NOT NULL DEFAULT true,
  inapp_bug boolean NOT NULL DEFAULT true,
  email_functieverzoek boolean NOT NULL DEFAULT true,
  inapp_functieverzoek boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback_notificatie_voorkeuren TO authenticated;
GRANT ALL ON public.feedback_notificatie_voorkeuren TO service_role;

ALTER TABLE public.feedback_notificatie_voorkeuren ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Eigen voorkeuren beheren"
  ON public.feedback_notificatie_voorkeuren
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_feedback_notificatie_voorkeuren_updated
  BEFORE UPDATE ON public.feedback_notificatie_voorkeuren
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
