
-- Create enum for widget types
CREATE TYPE public.widget_type AS ENUM (
  'contactformulier',
  'calculator_zonnepanelen',
  'calculator_warmtepomp',
  'calculator_isolatie',
  'calculator_laadpaal'
);

-- Create web_widgets table
CREATE TABLE public.web_widgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  type widget_type NOT NULL,
  naam text NOT NULL DEFAULT '',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  actief boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.web_widgets ENABLE ROW LEVEL SECURITY;

-- Partner users see own widgets
CREATE POLICY "Partner users zien eigen widgets"
ON public.web_widgets FOR SELECT TO authenticated
USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['partner_admin'::app_role, 'partner_staff'::app_role, 'adviseur'::app_role]))
  AND partner_id = get_user_partner_id(auth.uid())
);

-- Superadmin sees all
CREATE POLICY "Superadmin ziet alle widgets"
ON public.web_widgets FOR SELECT TO authenticated
USING (is_superadmin(auth.uid()));

-- Partner admin can create
CREATE POLICY "Partner admin kan widgets aanmaken"
ON public.web_widgets FOR INSERT TO authenticated
WITH CHECK (
  is_superadmin(auth.uid())
  OR (get_user_role(auth.uid()) = 'partner_admin'::app_role AND partner_id = get_user_partner_id(auth.uid()))
);

-- Partner admin can update
CREATE POLICY "Partner admin kan widgets bijwerken"
ON public.web_widgets FOR UPDATE TO authenticated
USING (
  is_superadmin(auth.uid())
  OR (get_user_role(auth.uid()) = 'partner_admin'::app_role AND partner_id = get_user_partner_id(auth.uid()))
);

-- Partner admin can delete
CREATE POLICY "Partner admin kan widgets verwijderen"
ON public.web_widgets FOR DELETE TO authenticated
USING (
  is_superadmin(auth.uid())
  OR (get_user_role(auth.uid()) = 'partner_admin'::app_role AND partner_id = get_user_partner_id(auth.uid()))
);

-- Public: anon can read active widgets (for embed pages)
CREATE POLICY "Publiek leest actieve widgets"
ON public.web_widgets FOR SELECT TO anon
USING (actief = true);

-- Public: anon can read partner branding when they have active widgets
CREATE POLICY "Publiek leest partner branding voor widgets"
ON public.partners FOR SELECT TO anon
USING (EXISTS (
  SELECT 1 FROM public.web_widgets
  WHERE web_widgets.partner_id = partners.id
  AND web_widgets.actief = true
));

-- Add updated_at trigger
CREATE TRIGGER update_web_widgets_updated_at
  BEFORE UPDATE ON public.web_widgets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
