
CREATE TABLE public.offerte_herinneringen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offerte_id uuid NOT NULL REFERENCES public.offertes(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  herinnering_datum timestamptz NOT NULL,
  notitie text,
  status text NOT NULL DEFAULT 'gepland',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.offerte_herinneringen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner users zien eigen partner herinneringen"
ON public.offerte_herinneringen FOR SELECT TO authenticated
USING (partner_id = get_user_partner_id(auth.uid()) OR is_superadmin(auth.uid()));

CREATE POLICY "Partner users maken herinneringen"
ON public.offerte_herinneringen FOR INSERT TO authenticated
WITH CHECK (
  (get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff', 'adviseur')
   AND partner_id = get_user_partner_id(auth.uid()))
  OR is_superadmin(auth.uid())
);

CREATE POLICY "Partner users bijwerken herinneringen"
ON public.offerte_herinneringen FOR UPDATE TO authenticated
USING (
  (get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff', 'adviseur')
   AND partner_id = get_user_partner_id(auth.uid()))
  OR is_superadmin(auth.uid())
);

CREATE POLICY "Partner users verwijderen herinneringen"
ON public.offerte_herinneringen FOR DELETE TO authenticated
USING (
  (get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff', 'adviseur')
   AND partner_id = get_user_partner_id(auth.uid()))
  OR is_superadmin(auth.uid())
);
