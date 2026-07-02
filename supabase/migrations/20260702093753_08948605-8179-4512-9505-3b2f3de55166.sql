
CREATE OR REPLACE FUNCTION public.notify_lead_eigenaar_contactmoment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_eigenaar uuid;
  v_bedrijf text;
  v_auteur text;
  v_titel text;
  v_bericht text;
  v_type_label text;
BEGIN
  SELECT eigenaar_id, bedrijfsnaam INTO v_eigenaar, v_bedrijf
  FROM public.affiliate_leads WHERE id = NEW.lead_id;

  IF v_eigenaar IS NULL THEN RETURN NEW; END IF;
  IF v_eigenaar = NEW.affiliate_id THEN RETURN NEW; END IF;

  SELECT COALESCE(volledige_naam, email, 'Iemand') INTO v_auteur
  FROM public.users WHERE id = NEW.affiliate_id;

  v_type_label := CASE NEW.type::text
    WHEN 'notitie' THEN 'notitie'
    WHEN 'bel_uit' THEN 'belcontact'
    WHEN 'bel_in' THEN 'belcontact'
    WHEN 'email_uit' THEN 'e-mail'
    WHEN 'email_in' THEN 'e-mail'
    WHEN 'afspraak' THEN 'afspraak'
    ELSE 'contactmoment'
  END;

  v_titel := 'Nieuwe ' || v_type_label || ' op ' || COALESCE(v_bedrijf, 'lead');
  v_bericht := COALESCE(v_auteur, 'Iemand') || ' heeft een ' || v_type_label ||
               COALESCE(' toegevoegd: ' || left(NEW.notitie, 140), ' toegevoegd');

  INSERT INTO public.notificaties (user_id, type, titel, bericht, entity_type, entity_id, gelezen)
  VALUES (v_eigenaar, 'lead_contactmoment', v_titel, v_bericht, 'affiliate_leads', NEW.lead_id, false);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_lead_eigenaar_contactmoment ON public.affiliate_lead_contactmomenten;
CREATE TRIGGER trg_notify_lead_eigenaar_contactmoment
AFTER INSERT ON public.affiliate_lead_contactmomenten
FOR EACH ROW EXECUTE FUNCTION public.notify_lead_eigenaar_contactmoment();
