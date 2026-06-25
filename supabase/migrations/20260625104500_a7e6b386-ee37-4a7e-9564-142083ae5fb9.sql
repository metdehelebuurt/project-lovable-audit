-- Backfill: gebruikers met actieve affiliate_links maar zonder affiliate-rol krijgen
-- de additieve affiliate-rol via user_roles (hybride state). Zo verschijnen ze
-- in lijst_affiliates_voor_sales_admin() en in Bas' planner-picker.
INSERT INTO public.user_roles (user_id, rol)
SELECT DISTINCT al.user_id, 'affiliate'::public.app_role
FROM public.affiliate_links al
JOIN public.users u ON u.id = al.user_id
WHERE al.actief = true
  AND u.status = 'actief'
  AND u.rol <> 'affiliate'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = al.user_id AND ur.rol = 'affiliate'
  )
ON CONFLICT (user_id, rol) DO NOTHING;