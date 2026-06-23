
-- Enum sales_fase
DO $$ BEGIN
  CREATE TYPE public.sales_fase AS ENUM ('koud','benaderd','warm','gekwalificeerd','doorgezet','gewonnen','verloren');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Nieuwe bron-waarde
ALTER TYPE public.affiliate_lead_bron ADD VALUE IF NOT EXISTS 'sales_admin';

-- Kolommen op affiliate_leads
ALTER TABLE public.affiliate_leads
  ADD COLUMN IF NOT EXISTS sales_fase public.sales_fase,
  ADD COLUMN IF NOT EXISTS toegewezen_door_admin_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS doorgezet_op timestamptz,
  ADD COLUMN IF NOT EXISTS import_batch_id uuid,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS idx_affiliate_leads_sales_fase ON public.affiliate_leads(sales_fase) WHERE sales_fase IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_affiliate_leads_import_batch ON public.affiliate_leads(import_batch_id) WHERE import_batch_id IS NOT NULL;

-- Superadmin RLS-policy (volledige toegang)
DROP POLICY IF EXISTS "superadmin volledige toegang affiliate_leads" ON public.affiliate_leads;
CREATE POLICY "superadmin volledige toegang affiliate_leads"
  ON public.affiliate_leads
  FOR ALL
  TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

-- RPC: doorzetten naar affiliate (direct of pool)
CREATE OR REPLACE FUNCTION public.admin_doorzetten_naar_affiliate(
  _lead_id uuid,
  _affiliate_id uuid,
  _notitie text DEFAULT NULL
) RETURNS public.affiliate_leads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.affiliate_leads;
BEGIN
  IF NOT public.is_superadmin(v_uid) THEN
    RAISE EXCEPTION 'alleen platformbeheerder mag leads doorzetten';
  END IF;

  UPDATE public.affiliate_leads
     SET eigenaar_id = _affiliate_id,
         claimed_at = CASE WHEN _affiliate_id IS NOT NULL THEN now() ELSE NULL END,
         sales_fase = 'doorgezet',
         doorgezet_op = now(),
         toegewezen_door_admin_id = v_uid,
         status = COALESCE(status, 'nieuw'::affiliate_lead_status),
         updated_at = now()
   WHERE id = _lead_id
   RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'lead niet gevonden';
  END IF;

  IF _notitie IS NOT NULL AND length(trim(_notitie)) > 0 THEN
    INSERT INTO public.affiliate_lead_contactmomenten (lead_id, user_id, type, notitie)
    VALUES (_lead_id, v_uid, 'notitie', _notitie);
  END IF;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_doorzetten_naar_affiliate(uuid, uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_doorzetten_naar_affiliate(uuid, uuid, text) TO authenticated;

-- RPC: bulk-import sales leads (CSV)
CREATE OR REPLACE FUNCTION public.admin_bulk_import_sales_leads(
  _rows jsonb,
  _bestemming text,           -- 'platform' | 'pool' | 'affiliate'
  _affiliate_id uuid DEFAULT NULL,
  _fase public.sales_fase DEFAULT 'koud'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_batch uuid := gen_random_uuid();
  v_row jsonb;
  v_email text;
  v_tel text;
  v_aangemaakt int := 0;
  v_geskipped int := 0;
  v_fouten jsonb := '[]'::jsonb;
  v_eigenaar uuid;
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

  INSERT INTO public.affiliate_lead_imports (id, user_id, bron, aantal_rijen, aantal_verwerkt, status)
  VALUES (v_batch, v_uid, 'csv', jsonb_array_length(_rows), 0, 'bezig')
  ON CONFLICT DO NOTHING;

  FOR v_row IN SELECT * FROM jsonb_array_elements(_rows) LOOP
    BEGIN
      v_email := NULLIF(lower(trim(v_row->>'email')), '');
      v_tel := NULLIF(trim(v_row->>'telefoon'), '');

      IF COALESCE(v_row->>'bedrijfsnaam','') = '' AND COALESCE(v_row->>'contactpersoon','') = '' THEN
        v_geskipped := v_geskipped + 1;
        v_fouten := v_fouten || jsonb_build_object('rij', v_row, 'reden', 'bedrijfsnaam of contactpersoon vereist');
        CONTINUE;
      END IF;

      IF v_email IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.affiliate_leads WHERE lower(email) = v_email
      ) THEN
        v_geskipped := v_geskipped + 1;
        CONTINUE;
      END IF;

      INSERT INTO public.affiliate_leads (
        bedrijfsnaam, contactpersoon, email, telefoon, branche, regio, website,
        geschatte_waarde, notities, tags,
        eigenaar_id, created_by, bron, sales_fase, import_batch_id,
        toegewezen_door_admin_id, doorgezet_op, claimed_at,
        status
      ) VALUES (
        COALESCE(NULLIF(v_row->>'bedrijfsnaam',''), v_row->>'contactpersoon'),
        v_row->>'contactpersoon',
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
      );
      v_aangemaakt := v_aangemaakt + 1;
    EXCEPTION WHEN OTHERS THEN
      v_geskipped := v_geskipped + 1;
      v_fouten := v_fouten || jsonb_build_object('rij', v_row, 'reden', SQLERRM);
    END;
  END LOOP;

  UPDATE public.affiliate_lead_imports
     SET aantal_verwerkt = v_aangemaakt,
         status = 'voltooid',
         fouten = v_fouten
   WHERE id = v_batch;

  RETURN jsonb_build_object(
    'batch_id', v_batch,
    'aangemaakt', v_aangemaakt,
    'geskipped', v_geskipped,
    'fouten', v_fouten
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_bulk_import_sales_leads(jsonb, text, uuid, public.sales_fase) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_bulk_import_sales_leads(jsonb, text, uuid, public.sales_fase) TO authenticated;
