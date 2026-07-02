
-- Auto-recompute assemblage kostprijs & verkoopprijs based on components
CREATE OR REPLACE FUNCTION public.recompute_assemblage_prijzen(p_assemblage_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_som numeric;
  v_strategie text;
  v_opslag numeric;
BEGIN
  SELECT prijs_strategie, COALESCE(marge_opslag_percentage, 0)
    INTO v_strategie, v_opslag
  FROM public.producten WHERE id = p_assemblage_id AND is_assemblage = true;

  IF NOT FOUND THEN RETURN; END IF;

  SELECT COALESCE(SUM(pc.aantal * COALESCE(comp.kostprijs, 0)), 0)
    INTO v_som
  FROM public.product_componenten pc
  JOIN public.producten comp ON comp.id = pc.component_id
  WHERE pc.assemblage_id = p_assemblage_id;

  IF v_strategie = 'som_componenten' THEN
    UPDATE public.producten
      SET kostprijs = v_som,
          prijs_excl_btw = ROUND(v_som * (1 + v_opslag / 100.0), 2)
      WHERE id = p_assemblage_id;
  ELSE
    -- vaste verkoopprijs: alleen kostprijs bijwerken
    UPDATE public.producten
      SET kostprijs = v_som
      WHERE id = p_assemblage_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_recompute_assemblage_from_componenten()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_assemblage_prijzen(OLD.assemblage_id);
    RETURN OLD;
  ELSE
    PERFORM public.recompute_assemblage_prijzen(NEW.assemblage_id);
    IF TG_OP = 'UPDATE' AND OLD.assemblage_id <> NEW.assemblage_id THEN
      PERFORM public.recompute_assemblage_prijzen(OLD.assemblage_id);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_pc_recompute ON public.product_componenten;
CREATE TRIGGER trg_pc_recompute
  AFTER INSERT OR UPDATE OR DELETE ON public.product_componenten
  FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_assemblage_from_componenten();

-- Als kostprijs van een component wijzigt: hertel alle assemblages waarin het zit
CREATE OR REPLACE FUNCTION public.trg_recompute_assemblages_from_component_kostprijs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r record;
BEGIN
  IF NEW.kostprijs IS DISTINCT FROM OLD.kostprijs THEN
    FOR r IN
      SELECT DISTINCT assemblage_id FROM public.product_componenten WHERE component_id = NEW.id
    LOOP
      PERFORM public.recompute_assemblage_prijzen(r.assemblage_id);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prod_kostprijs_recompute_assemblages ON public.producten;
CREATE TRIGGER trg_prod_kostprijs_recompute_assemblages
  AFTER UPDATE OF kostprijs ON public.producten
  FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_assemblages_from_component_kostprijs();

-- Backfill bestaande assemblages
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.producten WHERE is_assemblage = true LOOP
    PERFORM public.recompute_assemblage_prijzen(r.id);
  END LOOP;
END $$;
