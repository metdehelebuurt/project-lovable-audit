
-- Helper: normalize company name for matching
CREATE OR REPLACE FUNCTION public.normaliseer_bedrijfsnaam(_naam text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT nullif(
    regexp_replace(
      regexp_replace(
        lower(coalesce(_naam, '')),
        '\s+(b\.?v\.?|v\.?o\.?f\.?|n\.?v\.?|c\.?v\.?|holding|group|nederland)\b',
        '',
        'gi'
      ),
      '[^a-z0-9]',
      '',
      'g'
    ),
    ''
  );
$$;

-- Main: klantstatus for a single affiliate lead
CREATE OR REPLACE FUNCTION public.affiliate_lead_klantstatus(_lead_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead RECORD;
  v_partner RECORD;
  v_abo RECORD;
  v_plan RECORD;
  v_status text;
  v_match_reden text;
  v_lead_domein text;
  v_lead_naam_norm text;
  v_uid uuid := auth.uid();
  v_huidige jsonb;
  v_upsell_addons jsonb;
  v_upsell_plannen jsonb;
BEGIN
  SELECT * INTO v_lead FROM affiliate_leads WHERE id = _lead_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status','geen_match');
  END IF;

  -- Access control: eigenaar, sales admin/superadmin, of aangewezen
  IF NOT (
    v_lead.eigenaar_id = v_uid
    OR v_lead.aangemaakt_door = v_uid
    OR has_role(v_uid, 'superadmin'::app_role)
    OR has_role(v_uid, 'partner_admin'::app_role)
  ) THEN
    RETURN jsonb_build_object('status','geen_toegang');
  END IF;

  -- 1) Harde match via gewonnen_partner_id
  IF v_lead.gewonnen_partner_id IS NOT NULL THEN
    SELECT * INTO v_partner FROM partners WHERE id = v_lead.gewonnen_partner_id;
    IF FOUND THEN
      v_match_reden := 'gewonnen_lead';
    END IF;
  END IF;

  -- 2) E-maildomein match
  IF v_partner IS NULL AND v_lead.email IS NOT NULL AND position('@' in v_lead.email) > 0 THEN
    v_lead_domein := lower(split_part(v_lead.email, '@', 2));
    IF v_lead_domein NOT IN ('gmail.com','hotmail.com','outlook.com','live.nl','yahoo.com','icloud.com','me.com','msn.com','ziggo.nl','kpnmail.nl','xs4all.nl','planet.nl','home.nl') THEN
      SELECT p.* INTO v_partner
      FROM partners p
      WHERE p.email IS NOT NULL
        AND lower(split_part(p.email, '@', 2)) = v_lead_domein
      LIMIT 1;
      IF FOUND THEN
        v_match_reden := 'domein';
      END IF;
    END IF;
  END IF;

  -- 3) Bedrijfsnaam match
  IF v_partner IS NULL AND v_lead.bedrijfsnaam IS NOT NULL THEN
    v_lead_naam_norm := normaliseer_bedrijfsnaam(v_lead.bedrijfsnaam);
    IF v_lead_naam_norm IS NOT NULL AND length(v_lead_naam_norm) >= 3 THEN
      SELECT p.* INTO v_partner
      FROM partners p
      WHERE normaliseer_bedrijfsnaam(p.naam) = v_lead_naam_norm
      LIMIT 1;
      IF FOUND THEN
        v_match_reden := 'bedrijfsnaam';
      END IF;
    END IF;
  END IF;

  IF v_partner IS NULL THEN
    RETURN jsonb_build_object('status','geen_match');
  END IF;

  -- Abonnement ophalen (meest recente)
  SELECT * INTO v_abo
  FROM abonnementen
  WHERE partner_id = v_partner.id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_abo IS NULL THEN
    v_status := 'geen_abonnement';
  ELSIF v_abo.status IN ('opgezegd','geannuleerd','cancelled') THEN
    v_status := 'opgezegd';
  ELSIF v_abo.verloop_datum IS NOT NULL AND v_abo.verloop_datum < current_date THEN
    v_status := 'verlopen';
  ELSIF v_abo.plan = 'trial' OR v_abo.status = 'trial' THEN
    v_status := 'trial';
  ELSE
    v_status := 'betalend';
  END IF;

  -- Plan info
  IF v_abo.plan_id IS NOT NULL THEN
    SELECT id, slug, naam, maand_prijs, volgorde INTO v_plan FROM abonnement_plannen WHERE id = v_abo.plan_id;
  END IF;

  -- Huidige add-ons
  SELECT COALESCE(jsonb_agg(jsonb_build_object('slug', a.slug, 'naam', a.naam)), '[]'::jsonb)
    INTO v_huidige
  FROM abonnement_addon_aankopen aa
  JOIN abonnement_addons a ON a.id = aa.addon_id
  WHERE aa.partner_id = v_partner.id AND aa.status = 'actief';

  -- Upsell add-ons (die partner niet heeft)
  IF v_status IN ('trial','betalend') THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'slug', a.slug, 'naam', a.naam, 'maand_prijs', a.maand_prijs, 'beschrijving', a.beschrijving
      ) ORDER BY a.naam), '[]'::jsonb)
      INTO v_upsell_addons
    FROM abonnement_addons a
    WHERE a.actief = true
      AND NOT EXISTS (
        SELECT 1 FROM abonnement_addon_aankopen aa
        WHERE aa.partner_id = v_partner.id
          AND aa.addon_id = a.id
          AND aa.status = 'actief'
      );

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'slug', p.slug, 'naam', p.naam, 'maand_prijs', p.maand_prijs
      ) ORDER BY p.volgorde), '[]'::jsonb)
      INTO v_upsell_plannen
    FROM abonnement_plannen p
    WHERE p.actief = true
      AND (v_plan.volgorde IS NULL OR p.volgorde > v_plan.volgorde);
  ELSE
    v_upsell_addons := '[]'::jsonb;
    v_upsell_plannen := '[]'::jsonb;
  END IF;

  RETURN jsonb_build_object(
    'status', v_status,
    'match_reden', v_match_reden,
    'partner_id', v_partner.id,
    'partner_naam', v_partner.naam,
    'partner_plaats', v_partner.plaats,
    'plan_naam', COALESCE(v_plan.naam, v_abo.plan),
    'plan_slug', v_plan.slug,
    'maand_bedrag', COALESCE(v_abo.maand_bedrag, v_plan.maand_prijs),
    'trial_einddatum', v_partner.trial_einddatum,
    'opzeg_datum', v_abo.opzeg_datum,
    'huidige_addons', v_huidige,
    'upsell_addons', v_upsell_addons,
    'upsell_plannen', v_upsell_plannen
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.affiliate_lead_klantstatus(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.normaliseer_bedrijfsnaam(text) TO authenticated;

-- Bulk voor pipeline
CREATE OR REPLACE FUNCTION public.affiliate_lead_klantstatus_bulk(_lead_ids uuid[])
RETURNS TABLE(lead_id uuid, status text, partner_id uuid, partner_naam text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_json jsonb;
BEGIN
  FOREACH v_id IN ARRAY _lead_ids LOOP
    v_json := affiliate_lead_klantstatus(v_id);
    IF v_json ->> 'status' NOT IN ('geen_match','geen_toegang') THEN
      lead_id := v_id;
      status := v_json ->> 'status';
      partner_id := (v_json ->> 'partner_id')::uuid;
      partner_naam := v_json ->> 'partner_naam';
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.affiliate_lead_klantstatus_bulk(uuid[]) TO authenticated;
