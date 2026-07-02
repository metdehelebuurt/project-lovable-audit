-- Fix: affiliate pipeline was empty because in_pipeline defaulted to false and existing owned leads were never flagged.
ALTER TABLE public.affiliate_leads ALTER COLUMN in_pipeline SET DEFAULT true;
UPDATE public.affiliate_leads
   SET in_pipeline = true
 WHERE eigenaar_id IS NOT NULL
   AND in_pipeline = false;