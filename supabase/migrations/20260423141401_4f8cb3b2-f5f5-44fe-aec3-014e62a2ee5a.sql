-- Wijzig FK's naar public.users van NO ACTION naar SET NULL
-- Zodat een gebruiker verwijderd kan worden zonder de gerelateerde records te raken (historie blijft behouden)

-- affiliate_commissies.affiliate_id
ALTER TABLE public.affiliate_commissies DROP CONSTRAINT IF EXISTS affiliate_commissies_affiliate_id_fkey;
ALTER TABLE public.affiliate_commissies
  ADD CONSTRAINT affiliate_commissies_affiliate_id_fkey
  FOREIGN KEY (affiliate_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- afspraken.adviseur_id
ALTER TABLE public.afspraken DROP CONSTRAINT IF EXISTS afspraken_adviseur_id_fkey;
ALTER TABLE public.afspraken
  ADD CONSTRAINT afspraken_adviseur_id_fkey
  FOREIGN KEY (adviseur_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- consumenten.user_id
ALTER TABLE public.consumenten DROP CONSTRAINT IF EXISTS consumenten_user_id_fkey;
ALTER TABLE public.consumenten
  ADD CONSTRAINT consumenten_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- documenten.geupload_door_id
ALTER TABLE public.documenten DROP CONSTRAINT IF EXISTS documenten_geupload_door_id_fkey;
ALTER TABLE public.documenten
  ADD CONSTRAINT documenten_geupload_door_id_fkey
  FOREIGN KEY (geupload_door_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- documenten.consument_id
ALTER TABLE public.documenten DROP CONSTRAINT IF EXISTS documenten_consument_id_fkey;
ALTER TABLE public.documenten
  ADD CONSTRAINT documenten_consument_id_fkey
  FOREIGN KEY (consument_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- installatie_historie.actor_id
ALTER TABLE public.installatie_historie DROP CONSTRAINT IF EXISTS installatie_historie_actor_id_fkey;
ALTER TABLE public.installatie_historie
  ADD CONSTRAINT installatie_historie_actor_id_fkey
  FOREIGN KEY (actor_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- installatie_notities.auteur_id
ALTER TABLE public.installatie_notities DROP CONSTRAINT IF EXISTS installatie_notities_auteur_id_fkey;
ALTER TABLE public.installatie_notities
  ADD CONSTRAINT installatie_notities_auteur_id_fkey
  FOREIGN KEY (auteur_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- installaties.installateur_id
ALTER TABLE public.installaties DROP CONSTRAINT IF EXISTS installaties_installateur_id_fkey;
ALTER TABLE public.installaties
  ADD CONSTRAINT installaties_installateur_id_fkey
  FOREIGN KEY (installateur_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- installaties.created_by
ALTER TABLE public.installaties DROP CONSTRAINT IF EXISTS installaties_created_by_fkey;
ALTER TABLE public.installaties
  ADD CONSTRAINT installaties_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- installaties.consument_id
ALTER TABLE public.installaties DROP CONSTRAINT IF EXISTS installaties_consument_id_fkey;
ALTER TABLE public.installaties
  ADD CONSTRAINT installaties_consument_id_fkey
  FOREIGN KEY (consument_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- lead_contactmomenten.user_id
ALTER TABLE public.lead_contactmomenten DROP CONSTRAINT IF EXISTS lead_contactmomenten_user_id_fkey;
ALTER TABLE public.lead_contactmomenten
  ADD CONSTRAINT lead_contactmomenten_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- leads.toegewezen_aan
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_toegewezen_aan_fkey;
ALTER TABLE public.leads
  ADD CONSTRAINT leads_toegewezen_aan_fkey
  FOREIGN KEY (toegewezen_aan) REFERENCES public.users(id) ON DELETE SET NULL;

-- offertes.adviseur_id
ALTER TABLE public.offertes DROP CONSTRAINT IF EXISTS offertes_adviseur_id_fkey;
ALTER TABLE public.offertes
  ADD CONSTRAINT offertes_adviseur_id_fkey
  FOREIGN KEY (adviseur_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- opdrachten.toegewezen_monteur_id
ALTER TABLE public.opdrachten DROP CONSTRAINT IF EXISTS opdrachten_toegewezen_monteur_id_fkey;
ALTER TABLE public.opdrachten
  ADD CONSTRAINT opdrachten_toegewezen_monteur_id_fkey
  FOREIGN KEY (toegewezen_monteur_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- opleverrapporten.created_by
ALTER TABLE public.opleverrapporten DROP CONSTRAINT IF EXISTS opleverrapporten_created_by_fkey;
ALTER TABLE public.opleverrapporten
  ADD CONSTRAINT opleverrapporten_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- schouwen.installateur_id
ALTER TABLE public.schouwen DROP CONSTRAINT IF EXISTS schouwen_installateur_id_fkey;
ALTER TABLE public.schouwen
  ADD CONSTRAINT schouwen_installateur_id_fkey
  FOREIGN KEY (installateur_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- schouwen.adviseur_id
ALTER TABLE public.schouwen DROP CONSTRAINT IF EXISTS schouwen_adviseur_id_fkey;
ALTER TABLE public.schouwen
  ADD CONSTRAINT schouwen_adviseur_id_fkey
  FOREIGN KEY (adviseur_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- tickets.consument_id
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_consument_id_fkey;
ALTER TABLE public.tickets
  ADD CONSTRAINT tickets_consument_id_fkey
  FOREIGN KEY (consument_id) REFERENCES public.users(id) ON DELETE SET NULL;