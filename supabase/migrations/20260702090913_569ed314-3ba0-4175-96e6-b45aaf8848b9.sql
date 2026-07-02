CREATE OR REPLACE FUNCTION public.get_affiliate_lead_notities(_lead_id uuid)
RETURNS TABLE(
  id uuid,
  lead_id uuid,
  affiliate_id uuid,
  notitie text,
  created_at timestamptz,
  auteur_naam text,
  is_eigen boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cm.id,
    cm.lead_id,
    cm.affiliate_id,
    cm.notitie,
    cm.created_at,
    coalesce(
      nullif(trim(concat_ws(' ', u.voornaam, u.achternaam)), ''),
      u.email,
      'Onbekend'
    ) AS auteur_naam,
    (cm.affiliate_id = auth.uid()) AS is_eigen
  FROM public.affiliate_lead_contactmomenten cm
  LEFT JOIN public.users u ON u.id = cm.affiliate_id
  WHERE cm.lead_id = _lead_id
    AND cm.type = 'notitie'
    AND (
      is_superadmin(auth.uid())
      OR is_sales_admin(auth.uid())
      OR cm.affiliate_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.affiliate_leads l
        WHERE l.id = cm.lead_id AND l.eigenaar_id = auth.uid()
      )
    )
  ORDER BY cm.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_affiliate_lead_notities(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.affiliate_lead_ongelezen(_lead_id uuid)
RETURNS TABLE(
  nieuwe_notities integer,
  nieuwe_contactmomenten integer,
  nieuwe_mails integer,
  laatst_bekeken_op timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH lead AS (
    SELECT id, laatst_bekeken_op
    FROM public.affiliate_leads
    WHERE id = _lead_id
      AND (
        eigenaar_id = auth.uid()
        OR is_superadmin(auth.uid())
        OR is_sales_admin(auth.uid())
      )
  ),
  ref AS (
    SELECT coalesce((SELECT laatst_bekeken_op FROM lead), 'epoch'::timestamptz) AS since
  )
  SELECT
    (SELECT count(*)::int FROM public.affiliate_lead_contactmomenten cm, ref, lead l
       WHERE cm.lead_id = l.id AND cm.type = 'notitie'
         AND cm.affiliate_id <> auth.uid()
         AND cm.created_at > ref.since) AS nieuwe_notities,
    (SELECT count(*)::int FROM public.affiliate_lead_contactmomenten cm, ref, lead l
       WHERE cm.lead_id = l.id AND cm.type <> 'notitie'
         AND cm.affiliate_id <> auth.uid()
         AND cm.created_at > ref.since) AS nieuwe_contactmomenten,
    (SELECT count(*)::int FROM public.email_berichten eb, ref, lead l
       WHERE eb.affiliate_lead_id = l.id
         AND eb.richting = 'in'
         AND eb.datum > ref.since) AS nieuwe_mails,
    (SELECT laatst_bekeken_op FROM lead) AS laatst_bekeken_op;
$$;

GRANT EXECUTE ON FUNCTION public.affiliate_lead_ongelezen(uuid) TO authenticated;