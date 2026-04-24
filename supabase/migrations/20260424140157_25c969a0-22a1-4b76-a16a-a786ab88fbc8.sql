
-- 1) Voeg kolom toe om inkoopfactuur aan inkooporder te koppelen
ALTER TABLE public.financiele_documenten
  ADD COLUMN IF NOT EXISTS inkooporder_id uuid;

CREATE INDEX IF NOT EXISTS idx_financiele_documenten_inkooporder_id
  ON public.financiele_documenten(inkooporder_id)
  WHERE inkooporder_id IS NOT NULL;

-- 2) 3-way match auto-bereken functie
CREATE OR REPLACE FUNCTION public.bereken_inkoop_match(_inkoopfactuur_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_factuur record;
  v_order record;
  v_totaal_besteld numeric := 0;
  v_totaal_ontvangen_regel numeric := 0;
  v_ontvangst_id uuid;
  v_status text;
  v_verschil numeric;
  v_match_id uuid;
  v_tolerantie numeric := 0.01;
BEGIN
  SELECT id, partner_id, inkooporder_id, totaal_bedrag
    INTO v_factuur
  FROM public.financiele_documenten
  WHERE id = _inkoopfactuur_id
    AND type = 'inkoopfactuur';

  IF v_factuur.id IS NULL OR v_factuur.inkooporder_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT id, partner_id, totaal_bedrag, regels
    INTO v_order
  FROM public.financiele_documenten
  WHERE id = v_factuur.inkooporder_id
    AND type = 'inkooporder';

  IF v_order.id IS NULL THEN
    RETURN NULL;
  END IF;

  v_totaal_besteld := COALESCE(v_order.totaal_bedrag, 0);

  SELECT COALESCE(SUM(
    GREATEST(0, COALESCE((reg->>'ontvangen_aantal')::numeric, 0))
    * COALESCE(NULLIF(reg->>'prijs','')::numeric, 0)
  ), 0), MAX(io.id)
    INTO v_totaal_ontvangen_regel, v_ontvangst_id
  FROM public.inkoop_ontvangsten io,
       jsonb_array_elements(io.regels) reg
  WHERE io.inkooporder_id = v_factuur.inkooporder_id;

  v_verschil := COALESCE(v_factuur.totaal_bedrag, 0) - v_totaal_besteld;

  IF abs(v_verschil) <= v_tolerantie
     AND abs(COALESCE(v_factuur.totaal_bedrag,0) - v_totaal_ontvangen_regel) <= GREATEST(v_tolerantie, v_totaal_ontvangen_regel * 0.05) THEN
    v_status := 'akkoord';
  ELSIF v_totaal_ontvangen_regel = 0 THEN
    v_status := 'open';
  ELSE
    v_status := 'discrepantie';
  END IF;

  SELECT id INTO v_match_id
  FROM public.inkoop_factuur_match
  WHERE inkoopfactuur_id = v_factuur.id
  LIMIT 1;

  IF v_match_id IS NULL THEN
    INSERT INTO public.inkoop_factuur_match (
      partner_id, inkoopfactuur_id, inkooporder_id, ontvangst_id,
      status, totaal_besteld, totaal_ontvangen, totaal_gefactureerd, verschil_bedrag
    ) VALUES (
      v_factuur.partner_id, v_factuur.id, v_factuur.inkooporder_id, v_ontvangst_id,
      v_status, v_totaal_besteld, v_totaal_ontvangen_regel,
      COALESCE(v_factuur.totaal_bedrag, 0), v_verschil
    ) RETURNING id INTO v_match_id;
  ELSE
    UPDATE public.inkoop_factuur_match
       SET inkooporder_id = v_factuur.inkooporder_id,
           ontvangst_id = v_ontvangst_id,
           status = CASE WHEN status = 'goedgekeurd_handmatig' THEN status ELSE v_status END,
           totaal_besteld = v_totaal_besteld,
           totaal_ontvangen = v_totaal_ontvangen_regel,
           totaal_gefactureerd = COALESCE(v_factuur.totaal_bedrag, 0),
           verschil_bedrag = v_verschil,
           updated_at = now()
     WHERE id = v_match_id;
  END IF;

  RETURN v_match_id;
END;
$$;

-- 3) Trigger op inkoopfactuur
CREATE OR REPLACE FUNCTION public.trg_match_inkoopfactuur()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.type = 'inkoopfactuur' AND NEW.inkooporder_id IS NOT NULL THEN
    PERFORM public.bereken_inkoop_match(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_match_inkoopfactuur_aiu ON public.financiele_documenten;
CREATE TRIGGER trg_match_inkoopfactuur_aiu
AFTER INSERT OR UPDATE OF inkooporder_id, totaal_bedrag, regels ON public.financiele_documenten
FOR EACH ROW
WHEN (NEW.type = 'inkoopfactuur')
EXECUTE FUNCTION public.trg_match_inkoopfactuur();

-- 4) Trigger op ontvangsten
CREATE OR REPLACE FUNCTION public.trg_match_recalc_op_ontvangst()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_factuur_id uuid;
BEGIN
  FOR v_factuur_id IN
    SELECT id FROM public.financiele_documenten
    WHERE type = 'inkoopfactuur' AND inkooporder_id = NEW.inkooporder_id
  LOOP
    PERFORM public.bereken_inkoop_match(v_factuur_id);
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_match_recalc_op_ontvangst_aiu ON public.inkoop_ontvangsten;
CREATE TRIGGER trg_match_recalc_op_ontvangst_aiu
AFTER INSERT OR UPDATE ON public.inkoop_ontvangsten
FOR EACH ROW
EXECUTE FUNCTION public.trg_match_recalc_op_ontvangst();
