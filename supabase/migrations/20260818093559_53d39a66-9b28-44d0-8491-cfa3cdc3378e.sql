CREATE OR REPLACE FUNCTION public.notify_nieuw_email_bericht()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NEW.richting IS DISTINCT FROM 'inkomend' THEN
    RETURN NEW;
  END IF;
  IF COALESCE(NEW.is_gelezen, false) THEN
    RETURN NEW;
  END IF;

  v_user_id := NEW.user_id;
  IF v_user_id IS NULL AND NEW.email_account_id IS NOT NULL THEN
    SELECT ea.user_id INTO v_user_id
    FROM public.email_accounts ea
    WHERE ea.id = NEW.email_account_id;
  END IF;
  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notificaties (user_id, type, titel, bericht, entity_type, entity_id, gelezen)
  VALUES (
    v_user_id,
    'email_nieuw',
    'Nieuw e-mailbericht',
    left(coalesce(NEW.van, '') || ': ' || coalesce(NEW.onderwerp, '(geen onderwerp)'), 160),
    'email_berichten',
    NEW.id,
    false
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_nieuw_email_bericht ON public.email_berichten;
CREATE TRIGGER trg_notify_nieuw_email_bericht
AFTER INSERT ON public.email_berichten
FOR EACH ROW EXECUTE FUNCTION public.notify_nieuw_email_bericht();