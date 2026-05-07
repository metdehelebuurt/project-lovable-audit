ALTER VIEW public.web_widgets_public SET (security_invoker = off);
ALTER VIEW public.partner_branding SET (security_invoker = off);
GRANT SELECT ON public.web_widgets_public TO anon, authenticated;
GRANT SELECT ON public.partner_branding TO anon, authenticated;