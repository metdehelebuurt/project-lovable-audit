
ALTER TABLE public.financiele_documenten
ADD COLUMN installatie_id uuid REFERENCES public.installaties(id) ON DELETE SET NULL;

CREATE INDEX idx_financiele_documenten_installatie ON public.financiele_documenten(installatie_id) WHERE installatie_id IS NOT NULL;
