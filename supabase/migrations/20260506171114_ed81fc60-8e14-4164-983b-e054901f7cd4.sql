-- 1. Producten: website-velden
ALTER TABLE public.producten
  ADD COLUMN IF NOT EXISTS toon_op_website boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS website_slug text,
  ADD COLUMN IF NOT EXISTS website_pitch text,
  ADD COLUMN IF NOT EXISTS website_omschrijving text,
  ADD COLUMN IF NOT EXISTS website_usps jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS website_faq jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS website_ai_gegenereerd boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_producten_partner_slug
  ON public.producten (partner_id, website_slug)
  WHERE website_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_producten_toon_op_website
  ON public.producten (partner_id, toon_op_website)
  WHERE toon_op_website = true;

-- 2. Enum waarde 'productcatalogus' toevoegen aan web_widgets.type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'web_widget_type' AND e.enumlabel = 'productcatalogus'
  ) THEN
    ALTER TYPE public.web_widget_type ADD VALUE 'productcatalogus';
  END IF;
EXCEPTION WHEN undefined_object THEN
  -- Type bestaat niet, dan is het waarschijnlijk een tekst kolom — geen actie nodig
  NULL;
END $$;

-- 3. Partner merken
CREATE TABLE IF NOT EXISTS public.partner_merken (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  merk text NOT NULL,
  slug text NOT NULL,
  logo_url text,
  intro_html text,
  toon_op_website boolean NOT NULL DEFAULT true,
  volgorde int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_id, merk),
  UNIQUE (partner_id, slug)
);

ALTER TABLE public.partner_merken ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner ziet eigen merken"
  ON public.partner_merken FOR SELECT
  USING (partner_id = public.get_user_partner_id(auth.uid()) OR public.is_superadmin(auth.uid()));

CREATE POLICY "Partner admin beheert eigen merken"
  ON public.partner_merken FOR ALL
  USING (
    (partner_id = public.get_user_partner_id(auth.uid()) AND public.is_admin_tier(auth.uid()))
    OR public.is_superadmin(auth.uid())
  )
  WITH CHECK (
    (partner_id = public.get_user_partner_id(auth.uid()) AND public.is_admin_tier(auth.uid()))
    OR public.is_superadmin(auth.uid())
  );

CREATE TRIGGER partner_merken_updated_at
  BEFORE UPDATE ON public.partner_merken
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Partner API tokens (gehasht)
CREATE TABLE IF NOT EXISTS public.partner_api_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  token_hash text NOT NULL UNIQUE,
  token_prefix text NOT NULL, -- eerste 8 karakters voor weergave
  label text NOT NULL DEFAULT 'API token',
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  revoked_at timestamptz,
  revoked_by uuid
);

CREATE INDEX IF NOT EXISTS idx_partner_api_tokens_partner ON public.partner_api_tokens (partner_id) WHERE revoked_at IS NULL;

ALTER TABLE public.partner_api_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner admin ziet eigen tokens"
  ON public.partner_api_tokens FOR SELECT
  USING (
    (partner_id = public.get_user_partner_id(auth.uid()) AND public.is_admin_tier(auth.uid()))
    OR public.is_superadmin(auth.uid())
  );

-- Insert/update/delete alleen via Edge Function (service role) — geen client policies

-- 5. Rate limiting log
CREATE TABLE IF NOT EXISTS public.partner_api_rate_log (
  partner_id uuid NOT NULL,
  minute_bucket timestamptz NOT NULL,
  count int NOT NULL DEFAULT 0,
  PRIMARY KEY (partner_id, minute_bucket)
);

ALTER TABLE public.partner_api_rate_log ENABLE ROW LEVEL SECURITY;
-- Geen client policies — alleen Edge Function

-- 6. Webshop lead bron koppeling
CREATE TABLE IF NOT EXISTS public.webshop_lead_bron (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  partner_id uuid NOT NULL,
  product_id uuid,
  product_naam text,
  widget_id uuid,
  bron text NOT NULL DEFAULT 'webshop', -- 'webshop' (embed) | 'api' (REST)
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webshop_lead_bron_partner ON public.webshop_lead_bron (partner_id);
CREATE INDEX IF NOT EXISTS idx_webshop_lead_bron_product ON public.webshop_lead_bron (product_id);

ALTER TABLE public.webshop_lead_bron ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner ziet eigen webshop bron"
  ON public.webshop_lead_bron FOR SELECT
  USING (partner_id = public.get_user_partner_id(auth.uid()) OR public.is_superadmin(auth.uid()));

-- Insert alleen via Edge Function