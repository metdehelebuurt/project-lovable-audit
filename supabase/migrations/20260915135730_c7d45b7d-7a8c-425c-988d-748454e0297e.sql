ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS geblokkeerd_op timestamptz,
  ADD COLUMN IF NOT EXISTS geblokkeerd_reden text,
  ADD COLUMN IF NOT EXISTS geblokkeerd_door_id uuid;

CREATE TABLE IF NOT EXISTS public.partner_blokkades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  actie text NOT NULL CHECK (actie IN ('blokkeren','deblokkeren')),
  reden text NOT NULL,
  uitgevoerd_door_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.partner_blokkades TO authenticated;
GRANT ALL ON public.partner_blokkades TO service_role;

ALTER TABLE public.partner_blokkades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin leest blokkades"
ON public.partner_blokkades FOR SELECT TO authenticated
USING (public.is_superadmin(auth.uid()));

CREATE INDEX IF NOT EXISTS partner_blokkades_partner_idx ON public.partner_blokkades(partner_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.partner_is_geblokkeerd(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    JOIN public.partners p ON p.id = u.partner_id
    WHERE u.id = _user_id
      AND p.status = 'geblokkeerd'
      AND u.rol <> 'superadmin'
  )
$$;

CREATE POLICY "Geblokkeerde partner mag niet schrijven"
ON public.leads AS RESTRICTIVE FOR ALL TO authenticated
USING (true)
WITH CHECK (NOT public.partner_is_geblokkeerd(auth.uid()));

CREATE POLICY "Geblokkeerde partner mag niet schrijven"
ON public.offertes AS RESTRICTIVE FOR ALL TO authenticated
USING (true)
WITH CHECK (NOT public.partner_is_geblokkeerd(auth.uid()));

CREATE POLICY "Geblokkeerde partner mag niet schrijven"
ON public.opdrachten AS RESTRICTIVE FOR ALL TO authenticated
USING (true)
WITH CHECK (NOT public.partner_is_geblokkeerd(auth.uid()));

CREATE POLICY "Geblokkeerde partner mag niet schrijven"
ON public.installaties AS RESTRICTIVE FOR ALL TO authenticated
USING (true)
WITH CHECK (NOT public.partner_is_geblokkeerd(auth.uid()));

CREATE POLICY "Geblokkeerde partner mag niet schrijven"
ON public.facturen AS RESTRICTIVE FOR ALL TO authenticated
USING (true)
WITH CHECK (NOT public.partner_is_geblokkeerd(auth.uid()));