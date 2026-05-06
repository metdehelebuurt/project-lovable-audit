-- FK constraints toevoegen
ALTER TABLE public.keuringen
  ADD CONSTRAINT keuringen_klant_id_fkey
    FOREIGN KEY (klant_id) REFERENCES public.klanten(id) ON DELETE SET NULL,
  ADD CONSTRAINT keuringen_installatie_id_fkey
    FOREIGN KEY (installatie_id) REFERENCES public.installaties(id) ON DELETE SET NULL,
  ADD CONSTRAINT keuringen_partner_id_fkey
    FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE,
  ADD CONSTRAINT keuringen_next_keuring_id_fkey
    FOREIGN KEY (next_keuring_id) REFERENCES public.keuringen(id) ON DELETE SET NULL;

-- Indexen voor performance
CREATE INDEX IF NOT EXISTS idx_keuringen_partner ON public.keuringen(partner_id);
CREATE INDEX IF NOT EXISTS idx_keuringen_klant ON public.keuringen(klant_id);
CREATE INDEX IF NOT EXISTS idx_keuringen_installatie ON public.keuringen(installatie_id);
CREATE INDEX IF NOT EXISTS idx_keuringen_status_datum ON public.keuringen(status, geplande_datum);

-- Forceer PostgREST schema reload
NOTIFY pgrst, 'reload schema';