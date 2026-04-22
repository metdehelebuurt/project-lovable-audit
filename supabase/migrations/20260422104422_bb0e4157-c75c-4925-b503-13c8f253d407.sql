-- Fix FK so deleting a financieel_document cascades historie rows.
-- This also resolves the FK violation when log_factuur_changes() inserts a 'verwijderd' row in the same statement as the DELETE.
ALTER TABLE public.factuur_historie
  DROP CONSTRAINT IF EXISTS factuur_historie_financieel_document_id_fkey;

ALTER TABLE public.factuur_historie
  ADD CONSTRAINT factuur_historie_financieel_document_id_fkey
  FOREIGN KEY (financieel_document_id)
  REFERENCES public.financiele_documenten(id)
  ON DELETE CASCADE;