CREATE TABLE public.serienummer_toewijzing_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id uuid NOT NULL,
  serienummer_id uuid NOT NULL,
  serienummer text NOT NULL,
  product_id uuid NOT NULL,
  opdracht_id uuid,
  actie text NOT NULL CHECK (actie IN ('toegewezen','teruggezet','handmatig_toegevoegd')),
  oude_status text,
  nieuwe_status text,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sn_log_partner_created ON public.serienummer_toewijzing_log(partner_id, created_at DESC);
CREATE INDEX idx_sn_log_opdracht ON public.serienummer_toewijzing_log(opdracht_id);
CREATE INDEX idx_sn_log_serienummer ON public.serienummer_toewijzing_log(serienummer_id);

GRANT SELECT, INSERT ON public.serienummer_toewijzing_log TO authenticated;
GRANT ALL ON public.serienummer_toewijzing_log TO service_role;

ALTER TABLE public.serienummer_toewijzing_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner medewerkers zien eigen SN-log"
ON public.serienummer_toewijzing_log
FOR SELECT
TO authenticated
USING (
  partner_id IN (SELECT u.partner_id FROM public.users u WHERE u.id = auth.uid())
  OR public.is_superadmin(auth.uid())
);

CREATE POLICY "Partner medewerkers loggen eigen SN-acties"
ON public.serienummer_toewijzing_log
FOR INSERT
TO authenticated
WITH CHECK (
  partner_id IN (SELECT u.partner_id FROM public.users u WHERE u.id = auth.uid())
);