-- 1. Extra kolommen op producten
ALTER TABLE public.producten
  ADD COLUMN IF NOT EXISTS min_voorraad integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS kostprijs numeric(12,2);

-- 2. Voorraad mutaties
CREATE TABLE IF NOT EXISTS public.voorraad_mutaties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.producten(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('inkomend','uitgaand','reservering','vrijgave','correctie')),
  aantal numeric(12,2) NOT NULL,
  referentie_type text,
  referentie_id uuid,
  reden text,
  actor_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voorraad_mutaties_product ON public.voorraad_mutaties(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voorraad_mutaties_partner ON public.voorraad_mutaties(partner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voorraad_mutaties_ref ON public.voorraad_mutaties(referentie_type, referentie_id);

ALTER TABLE public.voorraad_mutaties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "voorraad_mutaties partner select"
  ON public.voorraad_mutaties FOR SELECT
  USING (
    public.is_superadmin(auth.uid())
    OR partner_id = public.get_user_partner_id(auth.uid())
  );

CREATE POLICY "voorraad_mutaties partner insert"
  ON public.voorraad_mutaties FOR INSERT
  WITH CHECK (
    public.is_superadmin(auth.uid())
    OR partner_id = public.get_user_partner_id(auth.uid())
  );

CREATE POLICY "voorraad_mutaties partner update"
  ON public.voorraad_mutaties FOR UPDATE
  USING (
    public.is_superadmin(auth.uid())
    OR (partner_id = public.get_user_partner_id(auth.uid())
        AND public.is_admin_tier(auth.uid()))
  );

CREATE POLICY "voorraad_mutaties partner delete"
  ON public.voorraad_mutaties FOR DELETE
  USING (
    public.is_superadmin(auth.uid())
    OR (partner_id = public.get_user_partner_id(auth.uid())
        AND public.is_partner_admin_or_higher(auth.uid()))
  );

-- 3. Voorraad reserveringen
CREATE TABLE IF NOT EXISTS public.voorraad_reserveringen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.producten(id) ON DELETE CASCADE,
  opdracht_id uuid,
  regel_id text,
  aantal numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'actief' CHECK (status IN ('actief','geleverd','vrijgegeven')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reserveringen_product ON public.voorraad_reserveringen(product_id) WHERE status = 'actief';
CREATE INDEX IF NOT EXISTS idx_reserveringen_opdracht ON public.voorraad_reserveringen(opdracht_id);

ALTER TABLE public.voorraad_reserveringen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "voorraad_reserveringen partner all"
  ON public.voorraad_reserveringen FOR ALL
  USING (
    public.is_superadmin(auth.uid())
    OR partner_id = public.get_user_partner_id(auth.uid())
  )
  WITH CHECK (
    public.is_superadmin(auth.uid())
    OR partner_id = public.get_user_partner_id(auth.uid())
  );

CREATE TRIGGER trg_reserveringen_updated_at
  BEFORE UPDATE ON public.voorraad_reserveringen
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Helper-functies
CREATE OR REPLACE FUNCTION public.get_voorraad_stand(_product_id uuid)
RETURNS numeric
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(
    CASE
      WHEN type IN ('inkomend','vrijgave','correctie') THEN aantal
      WHEN type IN ('uitgaand','reservering') THEN -aantal
      ELSE 0
    END
  ), 0)
  FROM public.voorraad_mutaties
  WHERE product_id = _product_id;
$$;

CREATE OR REPLACE FUNCTION public.get_gereserveerd(_product_id uuid)
RETURNS numeric
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(aantal), 0)
  FROM public.voorraad_reserveringen
  WHERE product_id = _product_id AND status = 'actief';
$$;