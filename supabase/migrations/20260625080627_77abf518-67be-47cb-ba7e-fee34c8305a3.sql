-- 1. Enums
DO $$ BEGIN
  CREATE TYPE public.affiliate_verloren_categorie AS ENUM (
    'geen_interesse','geen_budget','concurrent','timing','geen_contact','anders'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.affiliate_lost_review_bucket AS ENUM (
    'te_beoordelen','terugbellen','wacht_3_maanden','wacht_6_maanden','echt_verloren'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Kolommen
ALTER TABLE public.affiliate_leads
  ADD COLUMN IF NOT EXISTS verloren_categorie public.affiliate_verloren_categorie,
  ADD COLUMN IF NOT EXISTS verloren_op timestamptz,
  ADD COLUMN IF NOT EXISTS review_bucket public.affiliate_lost_review_bucket,
  ADD COLUMN IF NOT EXISTS review_door_id uuid,
  ADD COLUMN IF NOT EXISTS review_op timestamptz,
  ADD COLUMN IF NOT EXISTS review_notitie text,
  ADD COLUMN IF NOT EXISTS terug_in_pipeline_op date;

-- 3. Trigger: status -> verloren
CREATE OR REPLACE FUNCTION public.affiliate_lead_mark_lost()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'verloren' AND (OLD.status IS DISTINCT FROM 'verloren') THEN
    IF NEW.verloren_op IS NULL THEN
      NEW.verloren_op := now();
    END IF;
    IF NEW.review_bucket IS NULL THEN
      NEW.review_bucket := 'te_beoordelen';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_affiliate_lead_mark_lost ON public.affiliate_leads;
CREATE TRIGGER trg_affiliate_lead_mark_lost
BEFORE UPDATE OF status ON public.affiliate_leads
FOR EACH ROW
EXECUTE FUNCTION public.affiliate_lead_mark_lost();

-- 4. Security definer: mag deze user de lost-review zien/aanpassen?
CREATE OR REPLACE FUNCTION public.is_lost_review_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = _user_id
      AND (rol = 'superadmin' OR lower(email) = 'bas@mijnhuis.nu')
  );
$$;

-- 5. RLS-policy zodat reviewers verloren leads kunnen lezen + updaten
DROP POLICY IF EXISTS "Lost review admins zien verloren leads" ON public.affiliate_leads;
CREATE POLICY "Lost review admins zien verloren leads"
ON public.affiliate_leads
FOR SELECT
TO authenticated
USING (public.is_lost_review_admin(auth.uid()) AND status = 'verloren');

DROP POLICY IF EXISTS "Lost review admins werken verloren leads bij" ON public.affiliate_leads;
CREATE POLICY "Lost review admins werken verloren leads bij"
ON public.affiliate_leads
FOR UPDATE
TO authenticated
USING (public.is_lost_review_admin(auth.uid()) AND status = 'verloren')
WITH CHECK (public.is_lost_review_admin(auth.uid()));

-- 6. Index voor snelle review-query
CREATE INDEX IF NOT EXISTS idx_affiliate_leads_verloren_review
  ON public.affiliate_leads (review_bucket, verloren_op DESC)
  WHERE status = 'verloren';