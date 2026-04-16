
-- Fix web_widgets: create a view that excludes notificatie_email for anon access
CREATE OR REPLACE VIEW public.web_widgets_public AS
SELECT id, partner_id, type, actief, config, naam, created_at, updated_at
FROM public.web_widgets
WHERE actief = true;
