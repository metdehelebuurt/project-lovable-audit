
-- 1. Status enum uitbreiden
ALTER TYPE installatie_status ADD VALUE IF NOT EXISTS 'concept' BEFORE 'gepland';
ALTER TYPE installatie_status ADD VALUE IF NOT EXISTS 'bevestigd' AFTER 'gepland';
ALTER TYPE installatie_status ADD VALUE IF NOT EXISTS 'onderweg' AFTER 'bevestigd';
ALTER TYPE installatie_status ADD VALUE IF NOT EXISTS 'gereed' AFTER 'in_uitvoering';

-- 2. Kolommen toevoegen aan installaties
ALTER TABLE public.installaties
  ADD COLUMN IF NOT EXISTS installatienummer text,
  ADD COLUMN IF NOT EXISTS opdracht_id uuid REFERENCES public.opdrachten(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS klant_id uuid REFERENCES public.klanten(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS klant_email text,
  ADD COLUMN IF NOT EXISTS klant_telefoon text,
  ADD COLUMN IF NOT EXISTS klant_adres text,
  ADD COLUMN IF NOT EXISTS klant_postcode text,
  ADD COLUMN IF NOT EXISTS klant_plaats text,
  ADD COLUMN IF NOT EXISTS start_tijd time,
  ADD COLUMN IF NOT EXISTS eind_tijd time,
  ADD COLUMN IF NOT EXISTS werkadres text,
  ADD COLUMN IF NOT EXISTS werkomschrijving text,
  ADD COLUMN IF NOT EXISTS producten jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS bevestiging_verzonden_op timestamptz,
  ADD COLUMN IF NOT EXISTS monteur_geaccepteerd_op timestamptz,
  ADD COLUMN IF NOT EXISTS werkelijke_starttijd timestamptz,
  ADD COLUMN IF NOT EXISTS werkelijke_eindtijd timestamptz,
  ADD COLUMN IF NOT EXISTS gereedmelding_op timestamptz,
  ADD COLUMN IF NOT EXISTS gereedmelding_notitie text,
  ADD COLUMN IF NOT EXISTS oplevering_id uuid REFERENCES public.opleverrapporten(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_installaties_partner_nummer
  ON public.installaties (partner_id, installatienummer)
  WHERE installatienummer IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_installaties_klant ON public.installaties(klant_id);
CREATE INDEX IF NOT EXISTS idx_installaties_opdracht ON public.installaties(opdracht_id);
CREATE INDEX IF NOT EXISTS idx_installaties_oplevering ON public.installaties(oplevering_id);

-- 3. Notities tabel
CREATE TABLE IF NOT EXISTS public.installatie_notities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  installatie_id uuid NOT NULL REFERENCES public.installaties(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  auteur_id uuid REFERENCES public.users(id),
  inhoud text NOT NULL,
  intern boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inst_notities_installatie ON public.installatie_notities(installatie_id);

ALTER TABLE public.installatie_notities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inst_notities_select_partner" ON public.installatie_notities
  FOR SELECT TO authenticated
  USING (
    is_superadmin(auth.uid())
    OR partner_id = get_user_partner_id(auth.uid())
  );

CREATE POLICY "inst_notities_insert" ON public.installatie_notities
  FOR INSERT TO authenticated
  WITH CHECK (
    is_superadmin(auth.uid())
    OR (
      partner_id = get_user_partner_id(auth.uid())
      AND auteur_id = auth.uid()
    )
  );

CREATE POLICY "inst_notities_update_eigen" ON public.installatie_notities
  FOR UPDATE TO authenticated
  USING (
    is_superadmin(auth.uid())
    OR (partner_id = get_user_partner_id(auth.uid()) AND auteur_id = auth.uid())
    OR (is_admin_tier(auth.uid()) AND partner_id = get_user_partner_id(auth.uid()))
  );

CREATE POLICY "inst_notities_delete" ON public.installatie_notities
  FOR DELETE TO authenticated
  USING (
    is_superadmin(auth.uid())
    OR (partner_id = get_user_partner_id(auth.uid()) AND auteur_id = auth.uid())
    OR (is_admin_tier(auth.uid()) AND partner_id = get_user_partner_id(auth.uid()))
  );

-- 4. Historie tabel
CREATE TABLE IF NOT EXISTS public.installatie_historie (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  installatie_id uuid NOT NULL REFERENCES public.installaties(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.users(id),
  actie text NOT NULL,
  veld text,
  oude_waarde text,
  nieuwe_waarde text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inst_historie_installatie ON public.installatie_historie(installatie_id);

ALTER TABLE public.installatie_historie ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inst_historie_select" ON public.installatie_historie
  FOR SELECT TO authenticated
  USING (
    is_superadmin(auth.uid())
    OR partner_id = get_user_partner_id(auth.uid())
  );

-- 5. Trigger om wijzigingen te loggen
CREATE OR REPLACE FUNCTION public.log_installatie_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.installatie_historie (installatie_id, partner_id, actor_id, actie, nieuwe_waarde)
    VALUES (NEW.id, NEW.partner_id, COALESCE(v_actor, NEW.created_by), 'aangemaakt', NEW.installatienummer);
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.installatie_historie (installatie_id, partner_id, actor_id, actie, veld, oude_waarde, nieuwe_waarde)
    VALUES (NEW.id, NEW.partner_id, v_actor, 'status_gewijzigd', 'status', OLD.status::text, NEW.status::text);
  END IF;

  IF NEW.installateur_id IS DISTINCT FROM OLD.installateur_id THEN
    INSERT INTO public.installatie_historie (installatie_id, partner_id, actor_id, actie, veld, oude_waarde, nieuwe_waarde)
    VALUES (NEW.id, NEW.partner_id, v_actor, 'monteur_gewijzigd', 'installateur_id', OLD.installateur_id::text, NEW.installateur_id::text);
  END IF;

  IF NEW.geplande_startdatum IS DISTINCT FROM OLD.geplande_startdatum THEN
    INSERT INTO public.installatie_historie (installatie_id, partner_id, actor_id, actie, veld, oude_waarde, nieuwe_waarde)
    VALUES (NEW.id, NEW.partner_id, v_actor, 'datum_gewijzigd', 'geplande_startdatum', OLD.geplande_startdatum::text, NEW.geplande_startdatum::text);
  END IF;

  IF NEW.gereedmelding_op IS DISTINCT FROM OLD.gereedmelding_op AND NEW.gereedmelding_op IS NOT NULL THEN
    INSERT INTO public.installatie_historie (installatie_id, partner_id, actor_id, actie)
    VALUES (NEW.id, NEW.partner_id, v_actor, 'gereed_gemeld');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_installaties_log_changes ON public.installaties;
CREATE TRIGGER trg_installaties_log_changes
  AFTER INSERT OR UPDATE ON public.installaties
  FOR EACH ROW EXECUTE FUNCTION public.log_installatie_changes();
