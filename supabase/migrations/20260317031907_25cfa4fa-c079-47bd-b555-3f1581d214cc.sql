-- Drop the overly permissive anon policy that exposes SMTP credentials
DROP POLICY IF EXISTS "Publiek leest partner branding voor widgets" ON public.partners;

-- Create a secure view exposing only branding columns for widget rendering
CREATE OR REPLACE VIEW public.partner_branding AS
SELECT 
  p.id,
  p.naam,
  p.logo_url,
  p.primaire_kleur,
  p.secundaire_kleur,
  p.bedrijfsslogan,
  p.telefoonnummer,
  p.email,
  p.website,
  p.adres,
  p.postcode,
  p.plaats,
  p.kvk,
  p.btw
FROM public.partners p
WHERE EXISTS (
  SELECT 1 FROM public.web_widgets w 
  WHERE w.partner_id = p.id AND w.actief = true
);

-- Grant anon access to the view only
GRANT SELECT ON public.partner_branding TO anon;
GRANT SELECT ON public.partner_branding TO authenticated;