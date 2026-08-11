
CREATE OR REPLACE FUNCTION public.sales_lijst_affiliate_afwezigheid(_van date, _tot date)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  naam text,
  email text,
  partner_naam text,
  van date,
  tot date,
  reden text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id, a.user_id,
         btrim(coalesce(u.voornaam,'') || ' ' || coalesce(u.achternaam,'')) AS naam,
         u.email,
         p.naam AS partner_naam,
         a.van, a.tot, a.reden
  FROM public.gebruiker_afwezigheid a
  JOIN public.users u ON u.id = a.user_id
  LEFT JOIN public.partners p ON p.id = u.partner_id
  WHERE public.is_sales_admin(auth.uid())
    AND (u.rol = 'affiliate'::public.app_role
         OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.rol = 'affiliate'::public.app_role))
    AND a.tot >= _van
    AND a.van <= _tot
  ORDER BY a.van;
$$;

CREATE OR REPLACE FUNCTION public.sales_zet_afwezigheid(
  _user_id uuid,
  _van date,
  _tot date,
  _reden text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _partner_id uuid;
  _nieuw_id uuid;
BEGIN
  IF NOT public.is_sales_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Geen rechten om afwezigheid te beheren';
  END IF;
  IF _tot < _van THEN
    RAISE EXCEPTION 'Einddatum ligt voor de startdatum';
  END IF;

  SELECT partner_id INTO _partner_id FROM public.users WHERE id = _user_id;
  IF _partner_id IS NULL THEN
    RAISE EXCEPTION 'Gebruiker heeft geen organisatie';
  END IF;

  INSERT INTO public.gebruiker_afwezigheid (user_id, partner_id, van, tot, reden)
  VALUES (_user_id, _partner_id, _van, _tot, nullif(btrim(coalesce(_reden,'')), ''))
  RETURNING id INTO _nieuw_id;

  RETURN _nieuw_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sales_verwijder_afwezigheid(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_sales_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Geen rechten om afwezigheid te beheren';
  END IF;
  DELETE FROM public.gebruiker_afwezigheid WHERE id = _id;
END;
$$;

REVOKE ALL ON FUNCTION public.sales_lijst_affiliate_afwezigheid(date, date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.sales_zet_afwezigheid(uuid, date, date, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.sales_verwijder_afwezigheid(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.sales_lijst_affiliate_afwezigheid(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sales_zet_afwezigheid(uuid, date, date, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sales_verwijder_afwezigheid(uuid) TO authenticated;
