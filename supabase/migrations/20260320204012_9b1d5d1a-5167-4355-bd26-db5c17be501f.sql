
-- Offerte berichten tabel voor klant-partner communicatie
CREATE TABLE public.offerte_berichten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offerte_id uuid NOT NULL REFERENCES public.offertes(id) ON DELETE CASCADE,
  share_token text NOT NULL,
  afzender_type text NOT NULL,
  afzender_naam text NOT NULL,
  bericht text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_offerte_berichten_afzender_type()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.afzender_type NOT IN ('partner', 'klant') THEN
    RAISE EXCEPTION 'afzender_type must be partner or klant';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_offerte_berichten_afzender
  BEFORE INSERT OR UPDATE ON public.offerte_berichten
  FOR EACH ROW EXECUTE FUNCTION public.validate_offerte_berichten_afzender_type();

ALTER TABLE public.offerte_berichten ENABLE ROW LEVEL SECURITY;

-- Partner users can read messages for their offertes
CREATE POLICY "Partner users lezen offerte berichten"
ON public.offerte_berichten FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.offertes o
    WHERE o.id = offerte_berichten.offerte_id
    AND o.partner_id = get_user_partner_id(auth.uid())
  )
  OR is_superadmin(auth.uid())
);

-- Partner users can write messages
CREATE POLICY "Partner users schrijven offerte berichten"
ON public.offerte_berichten FOR INSERT TO authenticated
WITH CHECK (
  afzender_type = 'partner'
  AND (
    EXISTS (
      SELECT 1 FROM public.offertes o
      WHERE o.id = offerte_berichten.offerte_id
      AND o.partner_id = get_user_partner_id(auth.uid())
    )
    OR is_superadmin(auth.uid())
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.offerte_berichten;
