
ALTER TABLE public.producten
  ADD COLUMN IF NOT EXISTS is_assemblage boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS heeft_serienummer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS prijs_strategie text NOT NULL DEFAULT 'vast',
  ADD COLUMN IF NOT EXISTS marge_opslag_percentage numeric NOT NULL DEFAULT 0;

UPDATE public.producten
SET heeft_serienummer = true
WHERE heeft_serienummer = false
  AND categorie::text IN ('batterij','omvormer','monitoring','laadpaal','warmtepomp');

CREATE TABLE IF NOT EXISTS public.product_componenten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  assemblage_id uuid NOT NULL REFERENCES public.producten(id) ON DELETE CASCADE,
  component_id uuid NOT NULL REFERENCES public.producten(id) ON DELETE RESTRICT,
  aantal numeric NOT NULL DEFAULT 1 CHECK (aantal > 0),
  verplicht boolean NOT NULL DEFAULT true,
  volgorde integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_componenten_geen_zelfreferentie CHECK (assemblage_id <> component_id)
);
CREATE INDEX IF NOT EXISTS idx_product_componenten_assemblage ON public.product_componenten(assemblage_id);
CREATE INDEX IF NOT EXISTS idx_product_componenten_partner ON public.product_componenten(partner_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_componenten TO authenticated;
GRANT ALL ON public.product_componenten TO service_role;
ALTER TABLE public.product_componenten ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pc_select" ON public.product_componenten FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()) OR partner_id = public.get_user_partner_id(auth.uid()));
CREATE POLICY "pc_insert" ON public.product_componenten FOR INSERT TO authenticated
  WITH CHECK (public.is_superadmin(auth.uid()) OR partner_id = public.get_user_partner_id(auth.uid()));
CREATE POLICY "pc_update" ON public.product_componenten FOR UPDATE TO authenticated
  USING (public.is_superadmin(auth.uid()) OR partner_id = public.get_user_partner_id(auth.uid()));
CREATE POLICY "pc_delete" ON public.product_componenten FOR DELETE TO authenticated
  USING (public.is_superadmin(auth.uid()) OR partner_id = public.get_user_partner_id(auth.uid()));

CREATE TRIGGER trg_product_componenten_updated
  BEFORE UPDATE ON public.product_componenten
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.product_kostprijs_historie (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.producten(id) ON DELETE CASCADE,
  oude_kostprijs numeric,
  nieuwe_kostprijs numeric NOT NULL,
  gewijzigd_door uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_kostprijs_historie_product ON public.product_kostprijs_historie(product_id);

GRANT SELECT, INSERT ON public.product_kostprijs_historie TO authenticated;
GRANT ALL ON public.product_kostprijs_historie TO service_role;
ALTER TABLE public.product_kostprijs_historie ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kph_select" ON public.product_kostprijs_historie FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()) OR partner_id = public.get_user_partner_id(auth.uid()));
CREATE POLICY "kph_insert" ON public.product_kostprijs_historie FOR INSERT TO authenticated
  WITH CHECK (public.is_superadmin(auth.uid()) OR partner_id = public.get_user_partner_id(auth.uid()));

CREATE OR REPLACE FUNCTION public.log_product_kostprijs_wijziging()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.kostprijs IS DISTINCT FROM OLD.kostprijs THEN
    INSERT INTO public.product_kostprijs_historie
      (partner_id, product_id, oude_kostprijs, nieuwe_kostprijs, gewijzigd_door)
    VALUES (NEW.partner_id, NEW.id, OLD.kostprijs, NEW.kostprijs, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_kostprijs_wijziging ON public.producten;
CREATE TRIGGER trg_log_kostprijs_wijziging
  AFTER UPDATE OF kostprijs ON public.producten
  FOR EACH ROW EXECUTE FUNCTION public.log_product_kostprijs_wijziging();
