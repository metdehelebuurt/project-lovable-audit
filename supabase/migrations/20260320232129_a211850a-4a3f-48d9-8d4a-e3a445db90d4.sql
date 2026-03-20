
CREATE TABLE public.lead_notities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  inhoud text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_notities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users zien eigen partner lead notities" ON public.lead_notities
  FOR SELECT TO authenticated
  USING (
    is_superadmin(auth.uid()) OR
    (partner_id = get_user_partner_id(auth.uid()))
  );

CREATE POLICY "Bevoegde rollen maken lead notities" ON public.lead_notities
  FOR INSERT TO authenticated
  WITH CHECK (
    is_superadmin(auth.uid()) OR
    ((get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','adviseur']::app_role[])) AND partner_id = get_user_partner_id(auth.uid()))
  );

CREATE POLICY "Eigen notities verwijderen" ON public.lead_notities
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR is_superadmin(auth.uid()));
