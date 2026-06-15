
CREATE OR REPLACE FUNCTION public.generate_financieel_documentnummer(
  _partner_id uuid,
  _type public.financieel_document_type,
  _subtype text DEFAULT 'regulier'::text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _prefix text;
  _year text := to_char(now(), 'YYYY');
  _max int;
  _next int;
  _candidate text;
  _attempt int := 0;
BEGIN
  IF _type = 'verkoopfactuur' AND _subtype = 'voorschot' THEN
    _prefix := 'VS';
  ELSE
    CASE _type
      WHEN 'verkoopfactuur' THEN _prefix := 'VF';
      WHEN 'creditnota' THEN _prefix := 'CN';
      WHEN 'inkoopfactuur' THEN _prefix := 'IF';
      WHEN 'inkooporder' THEN _prefix := 'IO';
      WHEN 'pakbon' THEN _prefix := 'PB';
      ELSE _prefix := upper(left(_type::text, 2));
    END CASE;
  END IF;

  -- Serialiseer parallelle aanvragen voor dezelfde partner/prefix/jaar.
  PERFORM pg_advisory_xact_lock(
    hashtextextended(_partner_id::text || ':' || _prefix || ':' || _year, 0)
  );

  LOOP
    SELECT COALESCE(MAX(
      NULLIF(regexp_replace(documentnummer, '^' || _prefix || '-' || _year || '-', ''), '')::int
    ), 0)
      INTO _max
    FROM public.financiele_documenten
    WHERE partner_id = _partner_id
      AND documentnummer ~ ('^' || _prefix || '-' || _year || '-[0-9]+$');

    _next := _max + 1 + _attempt;
    _candidate := _prefix || '-' || _year || '-' || lpad(_next::text, 4, '0');

    -- Defensief: als om wat voor reden ook al gebruikt, probeer het volgende nummer.
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.financiele_documenten
       WHERE partner_id = _partner_id AND documentnummer = _candidate
    );

    _attempt := _attempt + 1;
    IF _attempt > 50 THEN
      RAISE EXCEPTION 'Kon geen vrij documentnummer bepalen voor % %', _prefix, _year;
    END IF;
  END LOOP;

  RETURN _candidate;
END;
$function$;

-- Behoud van de 2-argument overload zodat oude aanroepen blijven werken.
CREATE OR REPLACE FUNCTION public.generate_financieel_documentnummer(
  _partner_id uuid,
  _type public.financieel_document_type
)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT public.generate_financieel_documentnummer(_partner_id, _type, 'regulier');
$function$;
