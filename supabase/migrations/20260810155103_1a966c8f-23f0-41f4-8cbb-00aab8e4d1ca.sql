
CREATE OR REPLACE FUNCTION public.sales_lijst_affiliates_beheer()
RETURNS TABLE(
  id uuid, voornaam text, achternaam text, email text, telefoon text,
  rol public.app_role, status public.user_status, affiliate_tier public.affiliate_tier,
  partner_id uuid, partner_naam text, is_extra_rol boolean, created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT u.id, u.voornaam, u.achternaam, u.email, u.telefoon,
         u.rol, u.status, u.affiliate_tier, u.partner_id, p.naam,
         (u.rol <> 'affiliate'::public.app_role) AS is_extra_rol,
         u.created_at
  FROM public.users u
  LEFT JOIN public.partners p ON p.id = u.partner_id
  WHERE public.user_has_role(u.id, 'affiliate'::public.app_role)
    AND public.is_sales_admin(auth.uid())
  ORDER BY u.created_at DESC
$$;

CREATE OR REPLACE FUNCTION public.sales_zet_affiliate_status(_user_id uuid, _actief boolean)
RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_sales_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Geen rechten';
  END IF;
  IF NOT public.user_has_role(_user_id, 'affiliate'::public.app_role) THEN
    RAISE EXCEPTION 'Gebruiker is geen affiliate';
  END IF;
  IF public.is_superadmin(_user_id) THEN
    RAISE EXCEPTION 'Platformbeheerder kan niet worden gedeactiveerd';
  END IF;

  UPDATE public.users
  SET status = CASE WHEN _actief THEN 'actief'::public.user_status ELSE 'inactief'::public.user_status END
  WHERE id = _user_id;

  UPDATE public.affiliate_links SET actief = _actief WHERE user_id = _user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sales_zet_affiliate_tier(_user_id uuid, _tier public.affiliate_tier)
RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_sales_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Geen rechten';
  END IF;
  IF NOT public.user_has_role(_user_id, 'affiliate'::public.app_role) THEN
    RAISE EXCEPTION 'Gebruiker is geen affiliate';
  END IF;
  UPDATE public.users SET affiliate_tier = _tier WHERE id = _user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.sales_lijst_affiliates_beheer() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.sales_zet_affiliate_status(uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.sales_zet_affiliate_tier(uuid, public.affiliate_tier) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sales_lijst_affiliates_beheer() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sales_zet_affiliate_status(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sales_zet_affiliate_tier(uuid, public.affiliate_tier) TO authenticated;
