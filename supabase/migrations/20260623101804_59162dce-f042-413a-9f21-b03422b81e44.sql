
CREATE TABLE public.agenda_delegaties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gever_user_id uuid NOT NULL,
  ontvanger_user_id uuid NOT NULL,
  partner_id uuid NOT NULL,
  scope text NOT NULL CHECK (scope IN ('view', 'plan')),
  actief boolean NOT NULL DEFAULT true,
  notitie text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agenda_delegaties_uniek UNIQUE (gever_user_id, ontvanger_user_id),
  CONSTRAINT agenda_delegaties_niet_zichzelf CHECK (gever_user_id <> ontvanger_user_id)
);

CREATE INDEX idx_agenda_delegaties_gever ON public.agenda_delegaties(gever_user_id) WHERE actief = true;
CREATE INDEX idx_agenda_delegaties_ontvanger ON public.agenda_delegaties(ontvanger_user_id) WHERE actief = true;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_delegaties TO authenticated;
GRANT ALL ON public.agenda_delegaties TO service_role;

ALTER TABLE public.agenda_delegaties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agenda_delegaties zien als gever of ontvanger"
ON public.agenda_delegaties FOR SELECT TO authenticated
USING (gever_user_id = auth.uid() OR ontvanger_user_id = auth.uid());

CREATE POLICY "agenda_delegaties aanmaken door gever binnen partner"
ON public.agenda_delegaties FOR INSERT TO authenticated
WITH CHECK (
  gever_user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.users u_gever
    JOIN public.users u_ontvanger ON u_ontvanger.partner_id = u_gever.partner_id
    WHERE u_gever.id = auth.uid()
      AND u_ontvanger.id = ontvanger_user_id
      AND u_gever.partner_id = agenda_delegaties.partner_id
  )
);

CREATE POLICY "agenda_delegaties wijzigen door gever"
ON public.agenda_delegaties FOR UPDATE TO authenticated
USING (gever_user_id = auth.uid())
WITH CHECK (gever_user_id = auth.uid());

CREATE POLICY "agenda_delegaties verwijderen door gever"
ON public.agenda_delegaties FOR DELETE TO authenticated
USING (gever_user_id = auth.uid());

CREATE TRIGGER set_updated_at_agenda_delegaties
BEFORE UPDATE ON public.agenda_delegaties
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.kan_agenda_bekijken(_viewer uuid, _target uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _viewer = _target OR EXISTS (
    SELECT 1 FROM public.agenda_delegaties
    WHERE gever_user_id = _target
      AND ontvanger_user_id = _viewer
      AND actief = true
      AND scope IN ('view', 'plan')
  );
$$;

CREATE OR REPLACE FUNCTION public.kan_agenda_plannen(_viewer uuid, _target uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _viewer = _target OR EXISTS (
    SELECT 1 FROM public.agenda_delegaties
    WHERE gever_user_id = _target
      AND ontvanger_user_id = _viewer
      AND actief = true
      AND scope = 'plan'
    );
$$;

GRANT EXECUTE ON FUNCTION public.kan_agenda_bekijken(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.kan_agenda_plannen(uuid, uuid) TO authenticated, service_role;
