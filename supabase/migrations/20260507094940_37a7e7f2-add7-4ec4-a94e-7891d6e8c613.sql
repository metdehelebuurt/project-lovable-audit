
CREATE OR REPLACE FUNCTION public.ensure_partner_merk_visible()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_slug text;
BEGIN
  IF NEW.toon_op_website IS NOT TRUE OR NEW.merk IS NULL OR btrim(NEW.merk) = '' THEN
    RETURN NEW;
  END IF;

  v_slug := regexp_replace(
             regexp_replace(lower(NEW.merk), '[^a-z0-9]+', '-', 'g'),
             '(^-+|-+$)', '', 'g'
           );
  IF v_slug = '' THEN v_slug := 'merk'; END IF;

  -- Bestaat het merk al voor deze partner? Activeer het dan; anders insert nieuw.
  IF EXISTS (SELECT 1 FROM public.partner_merken
              WHERE partner_id = NEW.partner_id AND lower(merk) = lower(NEW.merk)) THEN
    UPDATE public.partner_merken
       SET toon_op_website = true
     WHERE partner_id = NEW.partner_id
       AND lower(merk) = lower(NEW.merk)
       AND toon_op_website = false;
  ELSE
    BEGIN
      INSERT INTO public.partner_merken (partner_id, merk, slug, toon_op_website)
      VALUES (NEW.partner_id, NEW.merk, v_slug, true);
    EXCEPTION WHEN unique_violation THEN
      -- slug-conflict: probeer met suffix
      INSERT INTO public.partner_merken (partner_id, merk, slug, toon_op_website)
      VALUES (NEW.partner_id, NEW.merk, v_slug || '-' || substring(gen_random_uuid()::text, 1, 6), true);
    END;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_partner_merk_visible ON public.producten;
CREATE TRIGGER trg_ensure_partner_merk_visible
AFTER INSERT OR UPDATE OF toon_op_website, merk ON public.producten
FOR EACH ROW
WHEN (NEW.toon_op_website = true)
EXECUTE FUNCTION public.ensure_partner_merk_visible();
