-- Tabel voor PDF-versiehistorie van opleverrapporten
CREATE TABLE public.opleverrapport_pdf_versies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rapport_id uuid NOT NULL REFERENCES public.opleverrapporten(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  versie int NOT NULL,
  pdf_path text NOT NULL,
  pdf_hash text NOT NULL,
  bestandsgrootte int,
  gegenereerd_door uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reden text,
  status_op_moment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rapport_id, versie)
);

CREATE INDEX idx_oplever_pdf_versies_rapport ON public.opleverrapport_pdf_versies (rapport_id, versie DESC);
CREATE INDEX idx_oplever_pdf_versies_partner ON public.opleverrapport_pdf_versies (partner_id);

ALTER TABLE public.opleverrapport_pdf_versies ENABLE ROW LEVEL SECURITY;

-- Lezen: partner-leden van het eigen partner_id of superadmin
CREATE POLICY "Partner kan eigen pdf-versies bekijken"
ON public.opleverrapport_pdf_versies
FOR SELECT
TO authenticated
USING (
  partner_id = public.get_user_partner_id(auth.uid())
  OR public.is_superadmin(auth.uid())
);

-- Aanmaken: partner-leden van het eigen partner_id of superadmin
CREATE POLICY "Partner kan eigen pdf-versies aanmaken"
ON public.opleverrapport_pdf_versies
FOR INSERT
TO authenticated
WITH CHECK (
  partner_id = public.get_user_partner_id(auth.uid())
  OR public.is_superadmin(auth.uid())
);

-- Verwijderen: alleen superadmin (cascade vanaf rapport regelt de rest)
CREATE POLICY "Superadmin kan pdf-versies verwijderen"
ON public.opleverrapport_pdf_versies
FOR DELETE
TO authenticated
USING (public.is_superadmin(auth.uid()));

-- RPC voor atomic versie-insert
CREATE OR REPLACE FUNCTION public.insert_oplever_pdf_versie(
  _rapport_id uuid,
  _partner_id uuid,
  _pdf_path text,
  _pdf_hash text,
  _bestandsgrootte int,
  _gegenereerd_door uuid,
  _reden text,
  _status_op_moment text
)
RETURNS TABLE (id uuid, versie int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _next int;
  _new_id uuid;
BEGIN
  SELECT COALESCE(MAX(v.versie), 0) + 1
    INTO _next
  FROM public.opleverrapport_pdf_versies v
  WHERE v.rapport_id = _rapport_id;

  INSERT INTO public.opleverrapport_pdf_versies (
    rapport_id, partner_id, versie, pdf_path, pdf_hash,
    bestandsgrootte, gegenereerd_door, reden, status_op_moment
  )
  VALUES (
    _rapport_id, _partner_id, _next, _pdf_path, _pdf_hash,
    _bestandsgrootte, _gegenereerd_door, _reden, _status_op_moment
  )
  RETURNING opleverrapport_pdf_versies.id INTO _new_id;

  RETURN QUERY SELECT _new_id, _next;
END;
$$;