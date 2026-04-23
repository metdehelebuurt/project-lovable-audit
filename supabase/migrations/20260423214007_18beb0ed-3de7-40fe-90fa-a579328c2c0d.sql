ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS berichten_zichtbaarheid text NOT NULL DEFAULT 'alle';

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_berichten_zichtbaarheid_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_berichten_zichtbaarheid_check
  CHECK (berichten_zichtbaarheid IN ('alle','toegewezen','geen'));

UPDATE public.users 
  SET berichten_zichtbaarheid = 'toegewezen' 
  WHERE rol IN ('backoffice','installateur')
    AND berichten_zichtbaarheid = 'alle';