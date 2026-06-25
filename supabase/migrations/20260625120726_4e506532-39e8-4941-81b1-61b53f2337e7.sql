
-- 1) Nieuwe kolommen op affiliate_leads
ALTER TABLE public.affiliate_leads
  ADD COLUMN IF NOT EXISTS kvk_nummer text,
  ADD COLUMN IF NOT EXISTS btw_nummer text,
  ADD COLUMN IF NOT EXISTS aantal_medewerkers integer,
  ADD COLUMN IF NOT EXISTS jaaromzet numeric,
  ADD COLUMN IF NOT EXISTS oprichtingsjaar integer,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS huidige_leverancier text,
  ADD COLUMN IF NOT EXISTS concurrenten text,
  ADD COLUMN IF NOT EXISTS beslissingscriteria text;

-- 2) Helper: mag user lead bekijken/bewerken?
CREATE OR REPLACE FUNCTION public.affiliate_lead_is_editable(_lead_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.affiliate_leads l
    WHERE l.id = _lead_id
      AND (
        public.is_superadmin(_user_id)
        OR public.is_sales_admin(_user_id)
        OR l.eigenaar_id = _user_id
        OR l.eigenaar_id IS NULL
      )
  );
$$;

-- 3) Nieuwe tabel
CREATE TABLE IF NOT EXISTS public.affiliate_lead_contactpersonen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.affiliate_leads(id) ON DELETE CASCADE,
  naam text NOT NULL,
  functie text,
  email text,
  telefoon_mobiel text,
  telefoon_kantoor text,
  linkedin_url text,
  is_hoofdcontact boolean NOT NULL DEFAULT false,
  notitie text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alc_lead ON public.affiliate_lead_contactpersonen(lead_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_lead_contactpersonen TO authenticated;
GRANT ALL ON public.affiliate_lead_contactpersonen TO service_role;

ALTER TABLE public.affiliate_lead_contactpersonen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lezen contactpersonen via lead-toegang"
  ON public.affiliate_lead_contactpersonen FOR SELECT TO authenticated
  USING (public.affiliate_lead_is_editable(lead_id, auth.uid()));

CREATE POLICY "wijzigen contactpersonen via lead-toegang"
  ON public.affiliate_lead_contactpersonen FOR INSERT TO authenticated
  WITH CHECK (public.affiliate_lead_is_editable(lead_id, auth.uid()));

CREATE POLICY "updaten contactpersonen via lead-toegang"
  ON public.affiliate_lead_contactpersonen FOR UPDATE TO authenticated
  USING (public.affiliate_lead_is_editable(lead_id, auth.uid()))
  WITH CHECK (public.affiliate_lead_is_editable(lead_id, auth.uid()));

CREATE POLICY "verwijderen contactpersonen via lead-toegang"
  ON public.affiliate_lead_contactpersonen FOR DELETE TO authenticated
  USING (public.affiliate_lead_is_editable(lead_id, auth.uid()));

-- 4) Updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_alc_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_alc_updated_at ON public.affiliate_lead_contactpersonen;
CREATE TRIGGER trg_alc_updated_at
  BEFORE UPDATE ON public.affiliate_lead_contactpersonen
  FOR EACH ROW EXECUTE FUNCTION public.tg_alc_updated_at();

-- 5) Max één hoofdcontact per lead
CREATE OR REPLACE FUNCTION public.tg_alc_enforce_single_hoofd()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_hoofdcontact THEN
    UPDATE public.affiliate_lead_contactpersonen
       SET is_hoofdcontact = false
     WHERE lead_id = NEW.lead_id
       AND id <> NEW.id
       AND is_hoofdcontact = true;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_alc_single_hoofd ON public.affiliate_lead_contactpersonen;
CREATE TRIGGER trg_alc_single_hoofd
  AFTER INSERT OR UPDATE OF is_hoofdcontact ON public.affiliate_lead_contactpersonen
  FOR EACH ROW EXECUTE FUNCTION public.tg_alc_enforce_single_hoofd();

-- 6) Bestaande hoofdcontactpersonen overzetten
INSERT INTO public.affiliate_lead_contactpersonen (lead_id, naam, email, telefoon_mobiel, is_hoofdcontact, created_by)
SELECT id, contactpersoon, email, telefoon, true, created_by
FROM public.affiliate_leads
WHERE contactpersoon IS NOT NULL AND btrim(contactpersoon) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.affiliate_lead_contactpersonen c
    WHERE c.lead_id = public.affiliate_leads.id
  );

-- 7) Historie-trigger voor affiliate_leads
CREATE OR REPLACE FUNCTION public.log_affiliate_lead_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_entity_change('affiliate_lead', NEW.id, NULL, 'aangemaakt', NULL, NULL, NEW.bedrijfsnaam,
      jsonb_build_object('status', NEW.status, 'eigenaar_id', NEW.eigenaar_id));
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.log_entity_change('affiliate_lead', NEW.id, NULL, 'status_gewijzigd', 'status', OLD.status::text, NEW.status::text);
  END IF;
  IF NEW.eigenaar_id IS DISTINCT FROM OLD.eigenaar_id THEN
    PERFORM public.log_entity_change('affiliate_lead', NEW.id, NULL, 'eigenaar_gewijzigd', 'eigenaar_id', OLD.eigenaar_id::text, NEW.eigenaar_id::text);
  END IF;
  IF NEW.sales_fase IS DISTINCT FROM OLD.sales_fase THEN
    PERFORM public.log_entity_change('affiliate_lead', NEW.id, NULL, 'fase_gewijzigd', 'sales_fase', OLD.sales_fase::text, NEW.sales_fase::text);
  END IF;
  IF NEW.temperatuur IS DISTINCT FROM OLD.temperatuur THEN
    PERFORM public.log_entity_change('affiliate_lead', NEW.id, NULL, 'temperatuur_gewijzigd', 'temperatuur', OLD.temperatuur::text, NEW.temperatuur::text);
  END IF;
  IF NEW.geschatte_waarde IS DISTINCT FROM OLD.geschatte_waarde THEN
    PERFORM public.log_entity_change('affiliate_lead', NEW.id, NULL, 'waarde_gewijzigd', 'geschatte_waarde', OLD.geschatte_waarde::text, NEW.geschatte_waarde::text);
  END IF;
  IF NEW.kvk_nummer IS DISTINCT FROM OLD.kvk_nummer THEN
    PERFORM public.log_entity_change('affiliate_lead', NEW.id, NULL, 'kvk_gewijzigd', 'kvk_nummer', OLD.kvk_nummer, NEW.kvk_nummer);
  END IF;
  IF NEW.btw_nummer IS DISTINCT FROM OLD.btw_nummer THEN
    PERFORM public.log_entity_change('affiliate_lead', NEW.id, NULL, 'btw_gewijzigd', 'btw_nummer', OLD.btw_nummer, NEW.btw_nummer);
  END IF;
  IF NEW.adres IS DISTINCT FROM OLD.adres OR NEW.postcode IS DISTINCT FROM OLD.postcode OR NEW.plaats IS DISTINCT FROM OLD.plaats THEN
    PERFORM public.log_entity_change('affiliate_lead', NEW.id, NULL, 'adres_gewijzigd', 'adres',
      concat_ws(' ', OLD.adres, OLD.postcode, OLD.plaats),
      concat_ws(' ', NEW.adres, NEW.postcode, NEW.plaats));
  END IF;
  IF NEW.website IS DISTINCT FROM OLD.website THEN
    PERFORM public.log_entity_change('affiliate_lead', NEW.id, NULL, 'website_gewijzigd', 'website', OLD.website, NEW.website);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_log_affiliate_lead_changes ON public.affiliate_leads;
CREATE TRIGGER trg_log_affiliate_lead_changes
  AFTER INSERT OR UPDATE ON public.affiliate_leads
  FOR EACH ROW EXECUTE FUNCTION public.log_affiliate_lead_changes();

-- 8) RPC voor eigenaar-overdracht
CREATE OR REPLACE FUNCTION public.admin_overdracht_affiliate_lead(
  _lead_id uuid,
  _nieuwe_eigenaar_id uuid,
  _notitie text DEFAULT NULL
) RETURNS public.affiliate_leads
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.affiliate_leads;
BEGIN
  IF NOT (public.is_sales_admin(v_uid) OR public.is_superadmin(v_uid)) THEN
    RAISE EXCEPTION 'Alleen platformbeheerder of sales-manager mag leads overdragen';
  END IF;

  UPDATE public.affiliate_leads
     SET eigenaar_id = _nieuwe_eigenaar_id,
         claimed_at = CASE WHEN _nieuwe_eigenaar_id IS NOT NULL THEN now() ELSE NULL END,
         toegewezen_door_admin_id = v_uid,
         doorgezet_op = now(),
         updated_at = now()
   WHERE id = _lead_id
   RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Lead niet gevonden';
  END IF;

  IF _notitie IS NOT NULL AND length(btrim(_notitie)) > 0 THEN
    INSERT INTO public.affiliate_lead_contactmomenten (lead_id, affiliate_id, type, notitie, created_by)
    VALUES (_lead_id, COALESCE(_nieuwe_eigenaar_id, v_uid), 'notitie', _notitie, v_uid);
  END IF;

  RETURN v_row;
END $$;
