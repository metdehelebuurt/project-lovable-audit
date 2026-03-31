
-- Create feedback_verzoeken table
CREATE TABLE public.feedback_verzoeken (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'feedback',
  titel text NOT NULL,
  beschrijving text NOT NULL,
  categorie text DEFAULT 'overig',
  prioriteit text DEFAULT 'normaal',
  status text DEFAULT 'nieuw',
  ai_samenvatting text,
  ai_tags jsonb DEFAULT '[]'::jsonb,
  bijlagen jsonb DEFAULT '[]'::jsonb,
  stemmen integer DEFAULT 0,
  admin_reactie text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedback_verzoeken ENABLE ROW LEVEL SECURITY;

-- Users see own feedback
CREATE POLICY "Users zien eigen feedback"
  ON public.feedback_verzoeken FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- All authenticated users can see feedback from same partner (for voting)
CREATE POLICY "Partner users zien partner feedback"
  ON public.feedback_verzoeken FOR SELECT TO authenticated
  USING (partner_id = get_user_partner_id(auth.uid()));

-- Superadmin sees all
CREATE POLICY "Superadmin ziet alle feedback"
  ON public.feedback_verzoeken FOR SELECT TO authenticated
  USING (is_superadmin(auth.uid()));

-- Any authenticated user can create
CREATE POLICY "Feedback aanmaken"
  ON public.feedback_verzoeken FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Superadmin and partner_admin can update (status, admin_reactie)
CREATE POLICY "Admin bewerkt feedback"
  ON public.feedback_verzoeken FOR UPDATE TO authenticated
  USING (
    is_superadmin(auth.uid()) 
    OR (get_user_role(auth.uid()) = 'partner_admin'::app_role AND partner_id = get_user_partner_id(auth.uid()))
    OR user_id = auth.uid()
  );

-- Superadmin can delete
CREATE POLICY "Superadmin verwijdert feedback"
  ON public.feedback_verzoeken FOR DELETE TO authenticated
  USING (is_superadmin(auth.uid()));

-- Updated_at trigger
CREATE TRIGGER update_feedback_verzoeken_updated_at
  BEFORE UPDATE ON public.feedback_verzoeken
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback_verzoeken;

-- Storage bucket for attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('feedback-bijlagen', 'feedback-bijlagen', false);

-- Storage RLS: authenticated users can upload
CREATE POLICY "Authenticated upload feedback bijlagen"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'feedback-bijlagen');

-- Storage RLS: users can read own uploads or admin reads all
CREATE POLICY "Read feedback bijlagen"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'feedback-bijlagen');
