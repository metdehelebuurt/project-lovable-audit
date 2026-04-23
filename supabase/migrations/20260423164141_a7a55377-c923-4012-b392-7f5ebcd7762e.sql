-- Backoffice eigenaar voor installaties
ALTER TABLE public.installaties
  ADD COLUMN IF NOT EXISTS backoffice_eigenaar_id uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- Default vullen vanuit created_by voor bestaande rijen
UPDATE public.installaties
SET backoffice_eigenaar_id = created_by
WHERE backoffice_eigenaar_id IS NULL AND created_by IS NOT NULL;

-- Trigger om bij nieuwe installaties auto te vullen
CREATE OR REPLACE FUNCTION public.set_installatie_backoffice_eigenaar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.backoffice_eigenaar_id IS NULL THEN
    NEW.backoffice_eigenaar_id := COALESCE(NEW.created_by, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_installatie_backoffice_eigenaar ON public.installaties;
CREATE TRIGGER trg_set_installatie_backoffice_eigenaar
  BEFORE INSERT ON public.installaties
  FOR EACH ROW
  EXECUTE FUNCTION public.set_installatie_backoffice_eigenaar();

CREATE INDEX IF NOT EXISTS idx_installaties_backoffice_eigenaar 
  ON public.installaties(backoffice_eigenaar_id);