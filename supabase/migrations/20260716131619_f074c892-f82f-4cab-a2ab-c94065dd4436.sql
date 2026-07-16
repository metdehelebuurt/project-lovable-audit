
-- 1. Product-rol enum
DO $$ BEGIN
  CREATE TYPE public.product_rol AS ENUM (
    'batterij_module','omvormer','backup_box','ev_lader',
    'zonnepaneel','optimizer','montage_materiaal','installatiedienst','accessoire','overig'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Nieuwe kolommen op producten
ALTER TABLE public.producten
  ADD COLUMN IF NOT EXISTS product_rol public.product_rol,
  ADD COLUMN IF NOT EXISTS is_installatiedienst boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS configureerbaar_type text,
  ADD COLUMN IF NOT EXISTS template_attributen jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Backfill: bestaande assemblages krijgen 'custom' zodat oud gedrag bewaard blijft
UPDATE public.producten
SET configureerbaar_type = 'custom'
WHERE is_assemblage = true AND configureerbaar_type IS NULL;

-- Backfill product_rol op basis van bestaande categorie
UPDATE public.producten SET product_rol = 'zonnepaneel'::public.product_rol
  WHERE product_rol IS NULL AND categorie = 'zonnepanelen';
UPDATE public.producten SET product_rol = 'batterij_module'::public.product_rol
  WHERE product_rol IS NULL AND categorie = 'thuisbatterij';
UPDATE public.producten SET product_rol = 'omvormer'::public.product_rol
  WHERE product_rol IS NULL AND categorie = 'omvormer';
UPDATE public.producten SET product_rol = 'ev_lader'::public.product_rol
  WHERE product_rol IS NULL AND categorie = 'laadpaal';
UPDATE public.producten SET product_rol = 'montage_materiaal'::public.product_rol
  WHERE product_rol IS NULL AND categorie = 'installatiemateriaal';
UPDATE public.producten SET product_rol = 'accessoire'::public.product_rol
  WHERE product_rol IS NULL AND categorie = 'accessoires';

CREATE INDEX IF NOT EXISTS idx_producten_product_rol ON public.producten(product_rol);
CREATE INDEX IF NOT EXISTS idx_producten_configureerbaar_type ON public.producten(configureerbaar_type)
  WHERE is_assemblage = true;

-- 3. Nieuwe tabel: assemblage-slots
CREATE TABLE IF NOT EXISTS public.product_assemblage_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  assemblage_id uuid NOT NULL REFERENCES public.producten(id) ON DELETE CASCADE,
  sleutel text NOT NULL,
  label text NOT NULL,
  slot_type text NOT NULL DEFAULT 'single_select'
    CHECK (slot_type IN ('single_select','multi_select','quantity_step')),
  product_rol_filter public.product_rol,
  categorie_filter public.product_categorie,
  spec_filter jsonb NOT NULL DEFAULT '{}'::jsonb,
  min_aantal integer NOT NULL DEFAULT 1,
  max_aantal integer NOT NULL DEFAULT 1,
  default_aantal integer NOT NULL DEFAULT 1,
  verplicht boolean NOT NULL DEFAULT true,
  volgorde integer NOT NULL DEFAULT 0,
  helptekst text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assemblage_id, sleutel)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_assemblage_slots TO authenticated;
GRANT SELECT ON public.product_assemblage_slots TO anon; -- publieke website-configurator (readonly)
GRANT ALL ON public.product_assemblage_slots TO service_role;

ALTER TABLE public.product_assemblage_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pas_select" ON public.product_assemblage_slots
  FOR SELECT TO authenticated
  USING (is_superadmin(auth.uid()) OR partner_id = get_user_partner_id(auth.uid()));

CREATE POLICY "pas_select_public" ON public.product_assemblage_slots
  FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.producten p
    WHERE p.id = product_assemblage_slots.assemblage_id
      AND p.toon_op_website = true
      AND p.status = 'actief'
  ));

CREATE POLICY "pas_insert" ON public.product_assemblage_slots
  FOR INSERT TO authenticated
  WITH CHECK (is_superadmin(auth.uid()) OR partner_id = get_user_partner_id(auth.uid()));

CREATE POLICY "pas_update" ON public.product_assemblage_slots
  FOR UPDATE TO authenticated
  USING (is_superadmin(auth.uid()) OR partner_id = get_user_partner_id(auth.uid()));

CREATE POLICY "pas_delete" ON public.product_assemblage_slots
  FOR DELETE TO authenticated
  USING (is_superadmin(auth.uid()) OR partner_id = get_user_partner_id(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_pas_assemblage ON public.product_assemblage_slots(assemblage_id, volgorde);
CREATE INDEX IF NOT EXISTS idx_pas_partner ON public.product_assemblage_slots(partner_id);

CREATE TRIGGER trg_pas_updated
  BEFORE UPDATE ON public.product_assemblage_slots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
