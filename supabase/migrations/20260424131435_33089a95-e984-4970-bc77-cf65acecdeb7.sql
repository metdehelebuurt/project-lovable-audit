
DROP VIEW IF EXISTS public.v_user_email_account;

-- Vervangende functie die expliciet alleen het account van de aanroepende user retourneert.
-- SECURITY INVOKER (default) zodat RLS van email_accounts geldt.
CREATE OR REPLACE FUNCTION public.get_my_email_account()
RETURNS TABLE(id uuid, user_id uuid, partner_id uuid, provider text, email_adres text, actief boolean)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT id, user_id, partner_id, provider, email_adres, actief
    FROM public.email_accounts
   WHERE user_id = auth.uid()
     AND actief = true
   LIMIT 1;
$$;
