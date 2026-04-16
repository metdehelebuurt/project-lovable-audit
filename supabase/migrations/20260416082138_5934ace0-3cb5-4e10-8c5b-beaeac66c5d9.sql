
-- Fix security definer views - set to INVOKER instead
ALTER VIEW public.web_widgets_public SET (security_invoker = on);
ALTER VIEW public.partner_branding SET (security_invoker = on);
