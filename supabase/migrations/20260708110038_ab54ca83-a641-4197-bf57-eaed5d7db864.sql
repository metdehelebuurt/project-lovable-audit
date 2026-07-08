-- Backfill contactpersonen
INSERT INTO public.affiliate_lead_contactpersonen (lead_id, naam, email, telefoon_mobiel, is_hoofdcontact, created_by)
SELECT l.id,
       COALESCE(NULLIF(l.contactpersoon, ''), split_part(COALESCE(l.email,''),'@',1), 'Onbekend'),
       NULLIF(l.email,''),
       NULLIF(l.telefoon,''),
       true,
       l.created_by
FROM public.affiliate_leads l
LEFT JOIN public.affiliate_lead_contactpersonen c ON c.lead_id = l.id
WHERE c.id IS NULL
  AND (l.contactpersoon IS NOT NULL OR l.email IS NOT NULL OR l.telefoon IS NOT NULL);

CREATE OR REPLACE FUNCTION public.admin_bulk_import_sales_leads(
  _rows jsonb,
  _bestemming text,
  _affiliate_id uuid DEFAULT NULL,
  _fase sales_fase DEFAULT NULL,
  _bestandsnaam text DEFAULT 'csv-upload',
  _kolom_mapping jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_batch uuid := gen_random_uuid();
  v_row jsonb;
  v_email text;
  v_tel text;
  v_contact text;
  v_aangemaakt int := 0;
  v_geskipped int := 0;
  v_fouten jsonb := '[]'::jsonb;
  v_eigenaar uuid;
  v_totaal int := COALESCE(jsonb_array_length(_rows), 0);
  v_new_lead_id uuid;
BEGIN
  IF NOT public.is_superadmin(v_uid) THEN
    RAISE EXCEPTION 'alleen platformbeheerder';
  END IF;
  IF _bestemming NOT IN ('platform','pool','affiliate') THEN
    RAISE EXCEPTION 'ongeldige bestemming';
  END IF;
  IF _bestemming = 'affiliate' AND _affiliate_id IS NULL THEN
    RAISE EXCEPTION 'affiliate_id vereist bij bestemming affiliate';
  END IF;

  v_eigenaar := CASE
    WHEN _bestemming = 'platform' THEN v_uid
    WHEN _bestemming = 'pool' THEN NULL
    ELSE _affiliate_id
  END;

  FOR v_row IN SELECT * FROM jsonb_array_elements(_rows) LOOP
    BEGIN
      v_email := NULLIF(lower(trim(v_row->>'email')), '');
      v_tel := NULLIF(trim(v_row->>'telefoon'), '');
      v_contact := NULLIF(trim(v_row->>'contactpersoon'), '');

      IF COALESCE(v_row->>'bedrijfsnaam','') = '' AND v_contact IS NULL THEN
        v_geskipped := v_geskipped + 1;
        v_fouten := v_fouten || jsonb_build_object('rij', v_row, 'reden', 'bedrijfsnaam of contactpersoon vereist');
        CONTINUE;
      END IF;

      IF v_email IS NOT NULL
         AND v_contact IS NULL
         AND EXISTS (
           SELECT 1 FROM public.affiliate_leads
           WHERE lower(email) = v_email
             AND lower(COALESCE(bedrijfsnaam,'')) = lower(COALESCE(v_row->>'bedrijfsnaam',''))
         ) THEN
        v_geskipped := v_geskipped + 1;
        CONTINUE;
      END IF;

      INSERT INTO public.affiliate_leads (
        bedrijfsnaam, contactpersoon, email, telefoon, branche, regio, website,
        geschatte_waarde, notities, tags,
        eigenaar_id, created_by, bron, sales_fase, import_batch_id,
        toegewezen_door_admin_id, doorgezet_op, claimed_at, status
      ) VALUES (
        COALESCE(NULLIF(v_row->>'bedrijfsnaam',''), v_contact),
        v_contact,
        v_email,
        v_tel,
        NULLIF(v_row->>'branche',''),
        NULLIF(v_row->>'regio',''),
        NULLIF(v_row->>'website',''),
        NULLIF(v_row->>'geschatte_waarde','')::numeric,
        NULLIF(v_row->>'notities',''),
        COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(v_row->'tags','[]'::jsonb))), '{}'::text[]),
        v_eigenaar,
        v_uid,
        'sales_admin'::affiliate_lead_bron,
        _fase,
        v_batch,
        CASE WHEN _bestemming = 'affiliate' THEN v_uid ELSE NULL END,
        CASE WHEN _bestemming = 'affiliate' THEN now() ELSE NULL END,
        CASE WHEN _bestemming = 'affiliate' THEN now() ELSE NULL END,
        'nieuw'::affiliate_lead_status
      ) RETURNING id INTO v_new_lead_id;

      IF v_contact IS NOT NULL OR v_email IS NOT NULL OR v_tel IS NOT NULL THEN
        INSERT INTO public.affiliate_lead_contactpersonen
          (lead_id, naam, email, telefoon_mobiel, is_hoofdcontact, created_by)
        VALUES (
          v_new_lead_id,
          COALESCE(v_contact, split_part(COALESCE(v_email,''),'@',1), 'Onbekend'),
          v_email,
          v_tel,
          true,
          v_uid
        );
      END IF;

      v_aangemaakt := v_aangemaakt + 1;
    EXCEPTION WHEN OTHERS THEN
      v_geskipped := v_geskipped + 1;
      v_fouten := v_fouten || jsonb_build_object('rij', v_row, 'reden', SQLERRM);
    END;
  END LOOP;

  BEGIN
    INSERT INTO public.affiliate_lead_imports
      (id, bestandsnaam, totaal_rijen, geimporteerd, afgekeurd, kolom_mapping, waarschuwingen, created_by)
    VALUES
      (v_batch, _bestandsnaam, v_totaal, v_aangemaakt, v_geskipped, _kolom_mapping, v_fouten, v_uid);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN jsonb_build_object(
    'batch_id', v_batch,
    'aangemaakt', v_aangemaakt,
    'geskipped', v_geskipped,
    'fouten', v_fouten
  );
END;
$function$;