-- Fix security definer view by setting it to security invoker
ALTER VIEW public.partner_branding SET (security_invoker = on);