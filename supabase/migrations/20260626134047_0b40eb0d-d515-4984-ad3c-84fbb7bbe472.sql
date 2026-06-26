
-- 1) Fix mutable search_path on trigger functions
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE OR REPLACE FUNCTION public.tg_alc_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

CREATE OR REPLACE FUNCTION public.touch_email_routing_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- 2) email_accounts: drop broad partner-level policies, keep strict owner/admin policies; add strict INSERT
DROP POLICY IF EXISTS "Email accounts: select own" ON public.email_accounts;
DROP POLICY IF EXISTS "Email accounts: update own" ON public.email_accounts;
DROP POLICY IF EXISTS "Email accounts: delete own" ON public.email_accounts;
DROP POLICY IF EXISTS "Email accounts: insert own" ON public.email_accounts;

CREATE POLICY "Email account owner/admin can insert"
ON public.email_accounts FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR (partner_id = get_user_partner_id(auth.uid()) AND get_user_role(auth.uid()) = 'partner_admin'::app_role)
  OR is_superadmin(auth.uid())
);

-- 3) google_calendar_accounts: add strict INSERT policy
CREATE POLICY "User inserts own google_calendar_account"
ON public.google_calendar_accounts FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- 4) kortingscodes: remove public anon read of all active codes
DROP POLICY IF EXISTS "Publiek leest actieve kortingscodes" ON public.kortingscodes;

-- 5) partners: revoke encrypted SMTP/IMAP password columns from data-API roles
REVOKE SELECT (smtp_pass_encrypted, imap_pass_encrypted) ON public.partners FROM authenticated;
REVOKE SELECT (smtp_pass_encrypted, imap_pass_encrypted) ON public.partners FROM anon;
GRANT SELECT (smtp_pass_encrypted, imap_pass_encrypted) ON public.partners TO service_role;

-- 6) producten: restrict global product reads to admin/staff/installateur/adviseur roles only;
--    revoke commercial pricing columns from anon
DROP POLICY IF EXISTS "Iedereen kan producten lezen" ON public.producten;

CREATE POLICY "Producten leesbaar voor partner of admin rollen"
ON public.producten FOR SELECT TO authenticated
USING (
  is_superadmin(auth.uid())
  OR (partner_id = get_user_partner_id(auth.uid()))
  OR (
    partner_id IS NULL
    AND get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','installateur','adviseur','backoffice']::app_role[])
  )
);

REVOKE SELECT (kostprijs, max_korting_euro, max_korting_percentage) ON public.producten FROM anon;

-- 7) users: revoke sensitive tokens from data-API roles, add owner-only RPC for ical_token
REVOKE SELECT (ical_token, uitnodiging_token) ON public.users FROM authenticated;
REVOKE SELECT (ical_token, uitnodiging_token) ON public.users FROM anon;
GRANT SELECT (ical_token, uitnodiging_token) ON public.users TO service_role;

CREATE OR REPLACE FUNCTION public.get_my_ical_token()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ical_token FROM public.users WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_my_ical_token() FROM public;
GRANT EXECUTE ON FUNCTION public.get_my_ical_token() TO authenticated;
