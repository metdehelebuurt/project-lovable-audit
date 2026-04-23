
-- ============================================
-- 1. UNIVERSELE HISTORIE
-- ============================================
CREATE TABLE IF NOT EXISTS public.entiteit_historie (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid,
  entiteit_type text NOT NULL,
  entiteit_id uuid NOT NULL,
  actor_id uuid,
  actor_naam text,
  actor_rol text,
  actie text NOT NULL,
  veld text,
  oude_waarde text,
  nieuwe_waarde text,
  details jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entiteit_historie_entity ON public.entiteit_historie(entiteit_type, entiteit_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entiteit_historie_partner ON public.entiteit_historie(partner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entiteit_historie_actor ON public.entiteit_historie(actor_id);

ALTER TABLE public.entiteit_historie ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner ziet eigen entiteit historie"
ON public.entiteit_historie FOR SELECT TO authenticated
USING (
  is_superadmin(auth.uid())
  OR (partner_id = get_user_partner_id(auth.uid())
      AND get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice','adviseur','installateur']::app_role[]))
);

CREATE POLICY "Systeem schrijft entiteit historie"
ON public.entiteit_historie FOR INSERT TO authenticated
WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.current_actor_meta(_user_id uuid)
RETURNS TABLE(naam text, rol text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    COALESCE(NULLIF(TRIM(CONCAT(voornaam,' ',achternaam)),''), email, 'Systeem') AS naam,
    rol::text
  FROM public.users WHERE id = _user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.log_entity_change(
  _entiteit_type text, _entiteit_id uuid, _partner_id uuid,
  _actie text, _veld text DEFAULT NULL,
  _oude text DEFAULT NULL, _nieuwe text DEFAULT NULL,
  _details jsonb DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_naam text;
  v_rol text;
BEGIN
  SELECT naam, rol INTO v_naam, v_rol FROM public.current_actor_meta(v_uid);
  INSERT INTO public.entiteit_historie
    (partner_id, entiteit_type, entiteit_id, actor_id, actor_naam, actor_rol, actie, veld, oude_waarde, nieuwe_waarde, details)
  VALUES
    (_partner_id, _entiteit_type, _entiteit_id, v_uid, v_naam, v_rol, _actie, _veld, _oude, _nieuwe, _details);
END;
$$;

-- ============================================
-- 2. TRIGGERS PER ENTITEIT
-- ============================================
CREATE OR REPLACE FUNCTION public.log_lead_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_entity_change('lead', NEW.id, NEW.partner_id, 'aangemaakt', NULL, NULL, NULL,
      jsonb_build_object('naam', CONCAT(NEW.voornaam,' ',NEW.achternaam), 'status', NEW.lead_status));
    RETURN NEW;
  END IF;
  IF NEW.lead_status IS DISTINCT FROM OLD.lead_status THEN
    PERFORM public.log_entity_change('lead', NEW.id, NEW.partner_id, 'status_gewijzigd', 'lead_status', OLD.lead_status::text, NEW.lead_status::text);
  END IF;
  IF NEW.owner_user_id IS DISTINCT FROM OLD.owner_user_id THEN
    PERFORM public.log_entity_change('lead', NEW.id, NEW.partner_id, 'eigenaar_gewijzigd', 'owner_user_id', OLD.owner_user_id::text, NEW.owner_user_id::text);
  END IF;
  IF NEW.toegewezen_aan IS DISTINCT FROM OLD.toegewezen_aan THEN
    PERFORM public.log_entity_change('lead', NEW.id, NEW.partner_id, 'toegewezen', 'toegewezen_aan', OLD.toegewezen_aan::text, NEW.toegewezen_aan::text);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_lead_changes ON public.leads;
CREATE TRIGGER trg_log_lead_changes AFTER INSERT OR UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.log_lead_changes();

CREATE OR REPLACE FUNCTION public.log_offerte_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_entity_change('offerte', NEW.id, NEW.partner_id, 'aangemaakt', NULL, NULL, NEW.offertenummer,
      jsonb_build_object('totaal', NEW.totaal_bedrag));
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.log_entity_change('offerte', NEW.id, NEW.partner_id, 'status_gewijzigd', 'status', OLD.status::text, NEW.status::text);
  END IF;
  IF NEW.totaal_bedrag IS DISTINCT FROM OLD.totaal_bedrag THEN
    PERFORM public.log_entity_change('offerte', NEW.id, NEW.partner_id, 'bedrag_gewijzigd', 'totaal_bedrag', OLD.totaal_bedrag::text, NEW.totaal_bedrag::text);
  END IF;
  IF NEW.adviseur_id IS DISTINCT FROM OLD.adviseur_id THEN
    PERFORM public.log_entity_change('offerte', NEW.id, NEW.partner_id, 'adviseur_gewijzigd', 'adviseur_id', OLD.adviseur_id::text, NEW.adviseur_id::text);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_offerte_changes ON public.offertes;
CREATE TRIGGER trg_log_offerte_changes AFTER INSERT OR UPDATE ON public.offertes
FOR EACH ROW EXECUTE FUNCTION public.log_offerte_changes();

CREATE OR REPLACE FUNCTION public.log_schouw_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_entity_change('schouw', NEW.id, NEW.partner_id, 'aangemaakt', NULL, NULL, NEW.schouw_nummer, NULL);
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.log_entity_change('schouw', NEW.id, NEW.partner_id, 'status_gewijzigd', 'status', OLD.status::text, NEW.status::text);
  END IF;
  IF NEW.geplande_datum IS DISTINCT FROM OLD.geplande_datum THEN
    PERFORM public.log_entity_change('schouw', NEW.id, NEW.partner_id, 'datum_gewijzigd', 'geplande_datum', OLD.geplande_datum::text, NEW.geplande_datum::text);
  END IF;
  IF NEW.adviseur_id IS DISTINCT FROM OLD.adviseur_id THEN
    PERFORM public.log_entity_change('schouw', NEW.id, NEW.partner_id, 'adviseur_gewijzigd', 'adviseur_id', OLD.adviseur_id::text, NEW.adviseur_id::text);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_schouw_changes ON public.schouwen;
CREATE TRIGGER trg_log_schouw_changes AFTER INSERT OR UPDATE ON public.schouwen
FOR EACH ROW EXECUTE FUNCTION public.log_schouw_changes();

CREATE OR REPLACE FUNCTION public.log_opdracht_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_entity_change('opdracht', NEW.id, NEW.partner_id, 'aangemaakt', NULL, NULL, NULL,
      jsonb_build_object('klant', NEW.klant_naam, 'totaal', NEW.totaal_bedrag));
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.log_entity_change('opdracht', NEW.id, NEW.partner_id, 'status_gewijzigd', 'status', OLD.status::text, NEW.status::text);
  END IF;
  IF NEW.toegewezen_monteur_id IS DISTINCT FROM OLD.toegewezen_monteur_id THEN
    PERFORM public.log_entity_change('opdracht', NEW.id, NEW.partner_id, 'monteur_gewijzigd', 'toegewezen_monteur_id', OLD.toegewezen_monteur_id::text, NEW.toegewezen_monteur_id::text);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_opdracht_changes ON public.opdrachten;
CREATE TRIGGER trg_log_opdracht_changes AFTER INSERT OR UPDATE ON public.opdrachten
FOR EACH ROW EXECUTE FUNCTION public.log_opdracht_changes();

CREATE OR REPLACE FUNCTION public.log_klant_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_entity_change('klant', NEW.id, NEW.partner_id, 'aangemaakt', NULL, NULL, CONCAT(NEW.voornaam,' ',NEW.achternaam), NULL);
    RETURN NEW;
  END IF;
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    PERFORM public.log_entity_change('klant', NEW.id, NEW.partner_id, 'email_gewijzigd', 'email', OLD.email, NEW.email);
  END IF;
  IF NEW.telefoon IS DISTINCT FROM OLD.telefoon THEN
    PERFORM public.log_entity_change('klant', NEW.id, NEW.partner_id, 'telefoon_gewijzigd', 'telefoon', OLD.telefoon, NEW.telefoon);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_klant_changes ON public.klanten;
CREATE TRIGGER trg_log_klant_changes AFTER INSERT OR UPDATE ON public.klanten
FOR EACH ROW EXECUTE FUNCTION public.log_klant_changes();

CREATE OR REPLACE FUNCTION public.log_taak_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_entity_change('taak', NEW.id, NEW.partner_id, 'aangemaakt', NULL, NULL, NEW.titel, NULL);
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.log_entity_change('taak', NEW.id, NEW.partner_id, 'status_gewijzigd', 'status', OLD.status::text, NEW.status::text);
  END IF;
  IF NEW.toegewezen_aan IS DISTINCT FROM OLD.toegewezen_aan THEN
    PERFORM public.log_entity_change('taak', NEW.id, NEW.partner_id, 'toegewezen', 'toegewezen_aan', OLD.toegewezen_aan::text, NEW.toegewezen_aan::text);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_taak_changes ON public.helpdesk_ticket_taken;
CREATE TRIGGER trg_log_taak_changes AFTER INSERT OR UPDATE ON public.helpdesk_ticket_taken
FOR EACH ROW EXECUTE FUNCTION public.log_taak_changes();

-- ============================================
-- 3. TAKEN UITBREIDEN
-- ============================================
ALTER TABLE public.helpdesk_ticket_taken
  ALTER COLUMN ticket_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS inplannen_in_agenda boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS geplande_datum date,
  ADD COLUMN IF NOT EXISTS geplande_starttijd time,
  ADD COLUMN IF NOT EXISTS geplande_eindtijd time,
  ADD COLUMN IF NOT EXISTS geschatte_duur_minuten integer,
  ADD COLUMN IF NOT EXISTS agenda_user_id uuid,
  ADD COLUMN IF NOT EXISTS herinnering_dag_voor boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_taken_agenda ON public.helpdesk_ticket_taken(geplande_datum, agenda_user_id) WHERE inplannen_in_agenda = true;

-- ============================================
-- 4. INSTALLATIE WERKVOORBEREIDING
-- ============================================
CREATE TABLE IF NOT EXISTS public.installatie_checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  item_key text NOT NULL,
  label text NOT NULL,
  beschrijving text,
  vereist_voor_status text NOT NULL DEFAULT 'bevestigd',
  blokkerend boolean NOT NULL DEFAULT false,
  volgorde int NOT NULL DEFAULT 100,
  actief boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_chk_templates_partner ON public.installatie_checklist_templates(partner_id);

ALTER TABLE public.installatie_checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner leest checklist templates"
ON public.installatie_checklist_templates FOR SELECT TO authenticated
USING (is_superadmin(auth.uid()) OR partner_id = get_user_partner_id(auth.uid()));

CREATE POLICY "Backoffice beheert checklist templates"
ON public.installatie_checklist_templates FOR ALL TO authenticated
USING (
  is_superadmin(auth.uid())
  OR (partner_id = get_user_partner_id(auth.uid())
      AND get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','backoffice']::app_role[]))
)
WITH CHECK (
  is_superadmin(auth.uid())
  OR (partner_id = get_user_partner_id(auth.uid())
      AND get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','backoffice']::app_role[]))
);

CREATE TRIGGER trg_chk_templates_upd BEFORE UPDATE ON public.installatie_checklist_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.installatie_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  installatie_id uuid NOT NULL REFERENCES public.installaties(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL,
  item_key text NOT NULL,
  label text NOT NULL,
  blokkerend boolean NOT NULL DEFAULT false,
  voltooid_op timestamptz,
  voltooid_door uuid,
  notitie text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (installatie_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_chk_items_install ON public.installatie_checklist_items(installatie_id);

ALTER TABLE public.installatie_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner ziet checklist items"
ON public.installatie_checklist_items FOR SELECT TO authenticated
USING (is_superadmin(auth.uid()) OR partner_id = get_user_partner_id(auth.uid()));

CREATE POLICY "Backoffice beheert checklist items"
ON public.installatie_checklist_items FOR ALL TO authenticated
USING (
  is_superadmin(auth.uid())
  OR (partner_id = get_user_partner_id(auth.uid())
      AND get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice']::app_role[]))
)
WITH CHECK (
  is_superadmin(auth.uid())
  OR (partner_id = get_user_partner_id(auth.uid())
      AND get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice']::app_role[]))
);

CREATE TRIGGER trg_chk_items_upd BEFORE UPDATE ON public.installatie_checklist_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.validate_installatie_status_overgang()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_open text;
  v_role app_role;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  IF NEW.status::text NOT IN ('bevestigd','in_uitvoering') THEN RETURN NEW; END IF;
  v_role := get_user_role(auth.uid());
  IF v_role IN ('superadmin','partner_admin') THEN RETURN NEW; END IF;
  SELECT string_agg(label, ', ') INTO v_open
  FROM public.installatie_checklist_items
  WHERE installatie_id = NEW.id AND blokkerend = true AND voltooid_op IS NULL;
  IF v_open IS NOT NULL AND length(v_open) > 0 THEN
    RAISE EXCEPTION 'Kan status niet wijzigen: openstaande verplichte werkvoorbereiding (%)', v_open;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_install_status ON public.installaties;
CREATE TRIGGER trg_validate_install_status BEFORE UPDATE OF status ON public.installaties
FOR EACH ROW EXECUTE FUNCTION public.validate_installatie_status_overgang();

-- ============================================
-- 5. BACKFILL
-- ============================================
INSERT INTO public.entiteit_historie (partner_id, entiteit_type, entiteit_id, actor_id, actor_naam, actor_rol, actie, veld, oude_waarde, nieuwe_waarde, created_at)
SELECT h.partner_id, 'installatie', h.installatie_id, h.actor_id,
  COALESCE(NULLIF(TRIM(CONCAT(u.voornaam,' ',u.achternaam)),''), u.email, '—'),
  u.rol::text, h.actie, h.veld, h.oude_waarde, h.nieuwe_waarde, h.created_at
FROM public.installatie_historie h
LEFT JOIN public.users u ON u.id = h.actor_id;

INSERT INTO public.entiteit_historie (partner_id, entiteit_type, entiteit_id, actor_id, actor_naam, actor_rol, actie, veld, oude_waarde, nieuwe_waarde, details, created_at)
SELECT h.partner_id, 'ticket', h.ticket_id, h.user_id,
  COALESCE(NULLIF(TRIM(CONCAT(u.voornaam,' ',u.achternaam)),''), u.email, '—'),
  u.rol::text, h.actie, h.veld, h.oude_waarde, h.nieuwe_waarde, h.details, h.created_at
FROM public.helpdesk_ticket_historie h
LEFT JOIN public.users u ON u.id = h.user_id;

INSERT INTO public.entiteit_historie (partner_id, entiteit_type, entiteit_id, actor_id, actor_naam, actor_rol, actie, veld, oude_waarde, nieuwe_waarde, details, created_at)
SELECT h.partner_id, 'factuur', h.financieel_document_id, h.actor_id,
  COALESCE(NULLIF(TRIM(CONCAT(u.voornaam,' ',u.achternaam)),''), u.email, '—'),
  u.rol::text, h.actie, h.veld, h.oude_waarde, h.nieuwe_waarde, h.metadata, h.created_at
FROM public.factuur_historie h
LEFT JOIN public.users u ON u.id = h.actor_id;
