-- Maak user-FK kolommen nullable zodat ON DELETE SET NULL werkt bij user-verwijdering.
-- Historie blijft intact; verwijderde gebruiker laat NULL achter op adviseur/owner velden.

ALTER TABLE public.schouwen ALTER COLUMN adviseur_id DROP NOT NULL;
ALTER TABLE public.offertes ALTER COLUMN adviseur_id DROP NOT NULL;
ALTER TABLE public.leads ALTER COLUMN owner_user_id DROP NOT NULL;
ALTER TABLE public.afspraken ALTER COLUMN adviseur_id DROP NOT NULL;