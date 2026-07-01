CREATE OR REPLACE FUNCTION public.boek_voorraad_uit_ontvangst()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r jsonb;
  v_product_id uuid;
  v_aantal numeric;
  v_besteld numeric;
  v_totaal_ontvangen numeric;
  v_totaal_besteld numeric;
  v_discrepantie boolean := false;
  v_regels jsonb := '[]'::jsonb;
  v_omschrijving text;
BEGIN
  IF NEW.voorraad_geboekt = true THEN
    RETURN NEW;
  END IF;

  FOR r IN SELECT * FROM jsonb_array_elements(COALESCE(NEW.regels, '[]'::jsonb))
  LOOP
    v_product_id := NULL;
    v_omschrijving := NULLIF(trim(COALESCE(r->>'omschrijving', '')), '');

    BEGIN
      v_product_id := NULLIF(r->>'product_id', '')::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
      v_product_id := NULL;
    END;

    IF v_product_id IS NULL AND v_omschrijving IS NOT NULL THEN
      SELECT NULLIF(order_regel->>'product_id', '')::uuid
        INTO v_product_id
      FROM public.financiele_documenten fd,
           jsonb_array_elements(fd.regels) order_regel
      WHERE fd.id = NEW.inkooporder_id
        AND NULLIF(order_regel->>'product_id', '') IS NOT NULL
        AND lower(trim(order_regel->>'omschrijving')) = lower(v_omschrijving)
      LIMIT 1;
    END IF;

    IF v_product_id IS NULL AND v_omschrijving IS NOT NULL THEN
      SELECT p.id
        INTO v_product_id
      FROM public.producten p
      WHERE (p.partner_id = NEW.partner_id OR p.partner_id IS NULL)
        AND (
          lower(p.naam) = lower(v_omschrijving)
          OR lower(v_omschrijving) LIKE '%' || lower(p.naam) || '%'
          OR (p.artikelnummer IS NOT NULL AND lower(v_omschrijving) LIKE '%' || lower(p.artikelnummer) || '%')
          OR (p.ean_code IS NOT NULL AND lower(v_omschrijving) LIKE '%' || lower(p.ean_code) || '%')
          OR (p.product_code IS NOT NULL AND lower(v_omschrijving) LIKE '%' || lower(p.product_code) || '%')
        )
      ORDER BY
        CASE WHEN p.partner_id = NEW.partner_id THEN 0 ELSE 1 END,
        length(p.naam) DESC
      LIMIT 1;
    END IF;

    v_aantal := COALESCE((r->>'ontvangen_aantal')::numeric, 0);
    v_besteld := COALESCE((r->>'besteld_aantal')::numeric, 0);

    IF v_product_id IS NOT NULL THEN
      r := jsonb_set(r, '{product_id}', to_jsonb(v_product_id::text), true);
    END IF;

    IF v_product_id IS NOT NULL AND v_aantal > 0 THEN
      INSERT INTO public.voorraad_mutaties (
        partner_id, product_id, type, aantal, referentie_type, referentie_id, reden, actor_id
      ) VALUES (
        NEW.partner_id, v_product_id, 'inkomend', v_aantal,
        'inkoop_ontvangst', NEW.id,
        'Ontvangst inkooporder ' || NEW.inkooporder_id::text,
        NEW.ontvangen_door
      );
    END IF;

    IF v_aantal <> v_besteld THEN
      v_discrepantie := true;
    END IF;

    v_regels := v_regels || jsonb_build_array(r);
  END LOOP;

  NEW.regels := v_regels;
  NEW.voorraad_geboekt := true;
  NEW.discrepantie := v_discrepantie;

  SELECT COALESCE(SUM((reg->>'aantal')::numeric), 0)
    INTO v_totaal_besteld
  FROM public.financiele_documenten fd,
       jsonb_array_elements(fd.regels) reg
  WHERE fd.id = NEW.inkooporder_id;

  SELECT COALESCE(SUM((reg->>'ontvangen_aantal')::numeric), 0)
    INTO v_totaal_ontvangen
  FROM (
    SELECT regels
    FROM public.inkoop_ontvangsten
    WHERE inkooporder_id = NEW.inkooporder_id
    UNION ALL
    SELECT NEW.regels
  ) ontvangsten,
       jsonb_array_elements(ontvangsten.regels) reg;

  IF v_totaal_ontvangen >= v_totaal_besteld AND v_totaal_besteld > 0 THEN
    UPDATE public.financiele_documenten
       SET status = 'volledig_ontvangen'
     WHERE id = NEW.inkooporder_id
       AND status::text NOT IN ('volledig_ontvangen','betaald');
  ELSIF v_totaal_ontvangen > 0 THEN
    UPDATE public.financiele_documenten
       SET status = 'deels_ontvangen'
     WHERE id = NEW.inkooporder_id
       AND status::text NOT IN ('volledig_ontvangen','betaald','deels_ontvangen');
  END IF;

  RETURN NEW;
END;
$$;