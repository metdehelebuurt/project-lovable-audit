
-- 1. EXPOSED_SENSITIVE_DATA: web_widgets notificatie_email
DROP POLICY IF EXISTS "Publiek leest actieve widgets" ON public.web_widgets;

DROP VIEW IF EXISTS public.web_widgets_public;

CREATE VIEW public.web_widgets_public
WITH (security_invoker = true)
AS
SELECT id, partner_id, type, naam, config, actief, created_at
FROM public.web_widgets
WHERE actief = true;

GRANT SELECT ON public.web_widgets_public TO anon, authenticated;

-- Base table policy: still allow anon to read active widgets BUT app code must use the view.
-- We keep the policy because the view (security_invoker) executes the query as the caller.
-- However, anon clients can still SELECT notificatie_email directly. To prevent that, we
-- restrict the base table policy to NOT include sensitive use cases by leaving ONLY
-- authenticated partner reads (already covered) and removing public access entirely.
-- Public consumers MUST switch to the web_widgets_public view.
-- (No new public policy on base table — anon access only via view.)

-- 2. PRIVILEGE_ESCALATION
DROP POLICY IF EXISTS "Partner admin kan partner users bijwerken" ON public.users;
CREATE POLICY "Partner admin kan partner users bijwerken"
ON public.users
FOR UPDATE
USING (
  get_user_role(auth.uid()) = 'partner_admin'::app_role
  AND partner_id = get_user_partner_id(auth.uid())
)
WITH CHECK (
  get_user_role(auth.uid()) = 'partner_admin'::app_role
  AND partner_id = get_user_partner_id(auth.uid())
  AND rol = (SELECT u2.rol FROM public.users u2 WHERE u2.id = users.id)
);

DROP POLICY IF EXISTS "Users kunnen eigen profiel bijwerken" ON public.users;
CREATE POLICY "Users kunnen eigen profiel bijwerken"
ON public.users
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND rol = (SELECT u2.rol FROM public.users u2 WHERE u2.id = auth.uid())
  AND partner_id IS NOT DISTINCT FROM (SELECT u2.partner_id FROM public.users u2 WHERE u2.id = auth.uid())
);

-- 3. MISSING_RLS_PROTECTION: product-images storage
DROP POLICY IF EXISTS "Authenticated users can insert product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;

CREATE POLICY "Partner users can insert own product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (
    is_superadmin(auth.uid())
    OR (
      get_user_role(auth.uid()) IN ('partner_admin'::app_role, 'partner_staff'::app_role, 'adviseur'::app_role)
      AND (storage.foldername(name))[1] = get_user_partner_id(auth.uid())::text
    )
  )
);

CREATE POLICY "Partner users can update own product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (
    is_superadmin(auth.uid())
    OR (
      get_user_role(auth.uid()) IN ('partner_admin'::app_role, 'partner_staff'::app_role, 'adviseur'::app_role)
      AND (storage.foldername(name))[1] = get_user_partner_id(auth.uid())::text
    )
  )
)
WITH CHECK (
  bucket_id = 'product-images'
  AND (
    is_superadmin(auth.uid())
    OR (
      get_user_role(auth.uid()) IN ('partner_admin'::app_role, 'partner_staff'::app_role, 'adviseur'::app_role)
      AND (storage.foldername(name))[1] = get_user_partner_id(auth.uid())::text
    )
  )
);

-- 4. SUPA_function_search_path_mutable
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
