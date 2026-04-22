alter table public.producten
  add column if not exists installatie_handleiding_url text,
  add column if not exists installatie_handleiding_naam text,
  add column if not exists gebruiker_handleiding_url text,
  add column if not exists gebruiker_handleiding_naam text;