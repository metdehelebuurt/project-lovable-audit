
ALTER TABLE public.opleverrapporten DROP CONSTRAINT opleverrapporten_status_check;
ALTER TABLE public.opleverrapporten ADD CONSTRAINT opleverrapporten_status_check CHECK (status = ANY (ARRAY['concept'::text, 'wacht_op_klant'::text, 'ondertekend'::text, 'afgekeurd'::text, 'vervallen'::text]));

ALTER TABLE public.opleverrapporten
  ADD COLUMN IF NOT EXISTS vervallen boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS vervallen_reden_categorie text,
  ADD COLUMN IF NOT EXISTS vervallen_reden text,
  ADD COLUMN IF NOT EXISTS vervallen_op timestamptz,
  ADD COLUMN IF NOT EXISTS vervallen_door uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vervangen_door_id uuid REFERENCES public.opleverrapporten(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vervangt_id uuid REFERENCES public.opleverrapporten(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_opleverrapporten_vervangen_door ON public.opleverrapporten(vervangen_door_id);
CREATE INDEX IF NOT EXISTS idx_opleverrapporten_vervangt ON public.opleverrapporten(vervangt_id);
