
-- 1. laatst_bekeken_op op affiliate_leads
ALTER TABLE public.affiliate_leads
  ADD COLUMN IF NOT EXISTS laatst_bekeken_op timestamptz;

-- 2. Signalen-functie per lead voor de ingelogde affiliate
CREATE OR REPLACE FUNCTION public.affiliate_lead_signals(_user_id uuid)
RETURNS TABLE (
  lead_id uuid,
  ongelezen_mails integer,
  ongelezen_opmerkingen integer,
  openstaande_taken integer,
  aankomende_terugbel integer,
  laatste_signaal timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH mine AS (
    SELECT id, laatst_bekeken_op FROM public.affiliate_leads WHERE eigenaar_id = _user_id
  ),
  mails AS (
    SELECT eb.affiliate_lead_id AS lead_id,
           count(*)::int AS n,
           max(eb.datum) AS laatste
    FROM public.email_berichten eb
    JOIN mine m ON m.id = eb.affiliate_lead_id
    WHERE eb.richting = 'in'
      AND (eb.datum > coalesce(m.laatst_bekeken_op, 'epoch'::timestamptz))
    GROUP BY eb.affiliate_lead_id
  ),
  opmerkingen AS (
    SELECT al.id AS lead_id,
           count(*)::int AS n,
           max(ob.created_at) AS laatste
    FROM public.offerte_berichten ob
    JOIN public.offertes o ON o.id = ob.offerte_id
    JOIN public.affiliate_leads al ON al.id = _user_id -- placeholder; joined via klant below
    WHERE false
    GROUP BY al.id
  ),
  taken AS (
    SELECT ot.lead_id, count(*)::int AS n, max(ot.due_op) AS laatste
    FROM public.affiliate_opvolg_taken ot
    JOIN mine m ON m.id = ot.lead_id
    WHERE ot.voltooid_op IS NULL
    GROUP BY ot.lead_id
  ),
  terugbel AS (
    SELECT t.lead_id, count(*)::int AS n, min(t.geplande_op) AS laatste
    FROM public.affiliate_terugbel_afspraken t
    JOIN mine m ON m.id = t.lead_id
    WHERE t.afgehandeld_op IS NULL
      AND t.geplande_op BETWEEN now() - interval '1 hour' AND now() + interval '24 hours'
    GROUP BY t.lead_id
  )
  SELECT
    m.id AS lead_id,
    coalesce(mails.n, 0)        AS ongelezen_mails,
    0                            AS ongelezen_opmerkingen,
    coalesce(taken.n, 0)         AS openstaande_taken,
    coalesce(terugbel.n, 0)      AS aankomende_terugbel,
    GREATEST(
      coalesce(mails.laatste, 'epoch'::timestamptz),
      coalesce(taken.laatste, 'epoch'::timestamptz),
      coalesce(terugbel.laatste, 'epoch'::timestamptz)
    ) AS laatste_signaal
  FROM mine m
  LEFT JOIN mails ON mails.lead_id = m.id
  LEFT JOIN taken ON taken.lead_id = m.id
  LEFT JOIN terugbel ON terugbel.lead_id = m.id
  WHERE coalesce(mails.n, 0) + coalesce(taken.n, 0) + coalesce(terugbel.n, 0) > 0;
$$;

GRANT EXECUTE ON FUNCTION public.affiliate_lead_signals(uuid) TO authenticated;

-- 3. RPC om een lead als "bekeken" te markeren
CREATE OR REPLACE FUNCTION public.affiliate_lead_markeer_bekeken(_lead_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.affiliate_leads
     SET laatst_bekeken_op = now()
   WHERE id = _lead_id
     AND eigenaar_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.affiliate_lead_markeer_bekeken(uuid) TO authenticated;

-- 4. Trigger: inbound e-mail op affiliate-lead → notificatie voor eigenaar
CREATE OR REPLACE FUNCTION public.trg_notif_affiliate_email_in()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_eigenaar uuid;
  v_bedrijf text;
BEGIN
  IF NEW.richting <> 'in' OR NEW.affiliate_lead_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT eigenaar_id, bedrijfsnaam INTO v_eigenaar, v_bedrijf
    FROM public.affiliate_leads WHERE id = NEW.affiliate_lead_id;
  IF v_eigenaar IS NULL THEN RETURN NEW; END IF;
  INSERT INTO public.notificaties(user_id, type, titel, bericht, entity_type, entity_id)
  VALUES (
    v_eigenaar,
    'affiliate_mail_in',
    'Nieuwe e-mail van ' || coalesce(v_bedrijf, 'lead'),
    left(coalesce(NEW.onderwerp, NEW.body_text, ''), 200),
    'affiliate_leads',
    NEW.affiliate_lead_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notif_affiliate_email_in ON public.email_berichten;
CREATE TRIGGER notif_affiliate_email_in
AFTER INSERT ON public.email_berichten
FOR EACH ROW EXECUTE FUNCTION public.trg_notif_affiliate_email_in();

-- 5. Trigger: nieuwe terugbelafspraak → notificatie voor affiliate
CREATE OR REPLACE FUNCTION public.trg_notif_terugbel_nieuw()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bedrijf text;
BEGIN
  IF NEW.affiliate_id IS NULL THEN RETURN NEW; END IF;
  SELECT bedrijfsnaam INTO v_bedrijf FROM public.affiliate_leads WHERE id = NEW.lead_id;
  INSERT INTO public.notificaties(user_id, type, titel, bericht, entity_type, entity_id)
  VALUES (
    NEW.affiliate_id,
    'affiliate_terugbel',
    'Terugbelafspraak gepland' || coalesce(' — ' || v_bedrijf, ''),
    to_char(NEW.geplande_op AT TIME ZONE 'Europe/Amsterdam', 'DD-MM-YYYY HH24:MI') ||
      coalesce(' • ' || NEW.notitie, ''),
    'affiliate_leads',
    NEW.lead_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notif_terugbel_nieuw ON public.affiliate_terugbel_afspraken;
CREATE TRIGGER notif_terugbel_nieuw
AFTER INSERT ON public.affiliate_terugbel_afspraken
FOR EACH ROW EXECUTE FUNCTION public.trg_notif_terugbel_nieuw();

-- 6. Trigger: lead toegewezen aan andere eigenaar → notificatie voor nieuwe eigenaar
CREATE OR REPLACE FUNCTION public.trg_notif_affiliate_lead_assigned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.eigenaar_id IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.eigenaar_id IS NOT DISTINCT FROM NEW.eigenaar_id THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.notificaties(user_id, type, titel, bericht, entity_type, entity_id)
  VALUES (
    NEW.eigenaar_id,
    'affiliate_lead_toegewezen',
    'Nieuwe lead toegewezen',
    coalesce(NEW.bedrijfsnaam, 'Onbekend bedrijf') ||
      coalesce(' • ' || NEW.plaats, ''),
    'affiliate_leads',
    NEW.id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notif_affiliate_lead_assigned ON public.affiliate_leads;
CREATE TRIGGER notif_affiliate_lead_assigned
AFTER INSERT OR UPDATE OF eigenaar_id ON public.affiliate_leads
FOR EACH ROW EXECUTE FUNCTION public.trg_notif_affiliate_lead_assigned();
