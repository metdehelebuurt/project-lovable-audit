ALTER TABLE public.factuur_historie
  DROP CONSTRAINT IF EXISTS factuur_historie_financieel_document_id_fkey;

CREATE INDEX IF NOT EXISTS idx_factuur_historie_financieel_document_id
  ON public.factuur_historie (financieel_document_id);