
-- =========================================
-- HELPDESK MODULE — FASE 1 FUNDAMENT
-- =========================================

-- ENUMS
CREATE TYPE public.helpdesk_ticket_status AS ENUM (
  'nieuw', 'open', 'wacht_op_klant', 'wacht_op_intern', 'in_behandeling', 'opgelost', 'gesloten', 'geescaleerd'
);

CREATE TYPE public.helpdesk_ticket_prioriteit AS ENUM (
  'laag', 'normaal', 'hoog', 'urgent'
);

CREATE TYPE public.helpdesk_ticket_type AS ENUM (
  'vraag', 'klacht', 'storing', 'service_bezoek', 'overig'
);

CREATE TYPE public.helpdesk_ticket_kanaal AS ENUM (
  'telefoon', 'email', 'webformulier', 'intern', 'monteur', 'overig'
);

CREATE TYPE public.helpdesk_bron_locatie AS ENUM (
  'direct', 'order', 'installatie', 'factuur', 'klant'
);

CREATE TYPE public.helpdesk_taak_status AS ENUM (
  'open', 'in_behandeling', 'klaar', 'geannuleerd'
);

CREATE TYPE public.helpdesk_artikel_status AS ENUM (
  'concept', 'gepubliceerd', 'gearchiveerd'
);

-- =========================================
-- TICKETS
-- =========================================
CREATE TABLE public.helpdesk_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL,
  ticketnummer TEXT NOT NULL,
  titel TEXT NOT NULL,
  omschrijving TEXT,
  status public.helpdesk_ticket_status NOT NULL DEFAULT 'nieuw',
  prioriteit public.helpdesk_ticket_prioriteit NOT NULL DEFAULT 'normaal',
  type public.helpdesk_ticket_type NOT NULL DEFAULT 'vraag',
  kanaal public.helpdesk_ticket_kanaal NOT NULL DEFAULT 'telefoon',
  bron_locatie public.helpdesk_bron_locatie NOT NULL DEFAULT 'direct',

  klant_id UUID,
  lead_id UUID,
  opdracht_id UUID,
  installatie_id UUID,
  factuur_id UUID,

  -- product context
  product_categorie TEXT,
  product_merk TEXT,
  product_type TEXT,
  product_installatiejaar INTEGER,
  foutcode TEXT,

  toegewezen_aan UUID,
  gemaakt_door UUID NOT NULL,

  sla_deadline TIMESTAMPTZ,
  is_geescaleerd BOOLEAN NOT NULL DEFAULT false,
  escalatie_reden TEXT,

  oplossing TEXT,
  opgelost_op TIMESTAMPTZ,
  gesloten_op TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (partner_id, ticketnummer)
);

CREATE INDEX idx_helpdesk_tickets_partner ON public.helpdesk_tickets(partner_id);
CREATE INDEX idx_helpdesk_tickets_status ON public.helpdesk_tickets(status);
CREATE INDEX idx_helpdesk_tickets_prio ON public.helpdesk_tickets(prioriteit);
CREATE INDEX idx_helpdesk_tickets_toegewezen ON public.helpdesk_tickets(toegewezen_aan);
CREATE INDEX idx_helpdesk_tickets_klant ON public.helpdesk_tickets(klant_id);

ALTER TABLE public.helpdesk_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin beheert alle tickets"
  ON public.helpdesk_tickets FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Partner backoffice ziet eigen tickets"
  ON public.helpdesk_tickets FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('partner_admin','partner_staff','adviseur')
    AND partner_id = public.get_user_partner_id(auth.uid())
  );

CREATE POLICY "Installateur ziet eigen tickets"
  ON public.helpdesk_tickets FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'installateur'
    AND partner_id = public.get_user_partner_id(auth.uid())
    AND (toegewezen_aan = auth.uid() OR gemaakt_door = auth.uid())
  );

CREATE POLICY "Tickets aanmaken"
  ON public.helpdesk_tickets FOR INSERT TO authenticated
  WITH CHECK (
    public.is_superadmin(auth.uid())
    OR (
      public.get_user_role(auth.uid()) IN ('partner_admin','partner_staff','adviseur','installateur')
      AND partner_id = public.get_user_partner_id(auth.uid())
      AND gemaakt_door = auth.uid()
    )
  );

CREATE POLICY "Tickets bijwerken"
  ON public.helpdesk_tickets FOR UPDATE TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (
      public.get_user_role(auth.uid()) IN ('partner_admin','partner_staff','adviseur')
      AND partner_id = public.get_user_partner_id(auth.uid())
    )
    OR (
      public.get_user_role(auth.uid()) = 'installateur'
      AND partner_id = public.get_user_partner_id(auth.uid())
      AND (toegewezen_aan = auth.uid() OR gemaakt_door = auth.uid())
    )
  );

CREATE POLICY "Tickets verwijderen"
  ON public.helpdesk_tickets FOR DELETE TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (
      public.get_user_role(auth.uid()) = 'partner_admin'
      AND partner_id = public.get_user_partner_id(auth.uid())
    )
  );

CREATE TRIGGER trg_helpdesk_tickets_updated
  BEFORE UPDATE ON public.helpdesk_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- TICKETNUMMER GENERATOR
-- =========================================
CREATE OR REPLACE FUNCTION public.generate_helpdesk_ticketnummer(_partner_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _year TEXT;
  _count INTEGER;
BEGIN
  _year := to_char(now(), 'YYYY');
  SELECT COUNT(*) + 1 INTO _count
  FROM public.helpdesk_tickets
  WHERE partner_id = _partner_id
    AND extract(year from created_at) = extract(year from now());
  RETURN 'TKT-' || _year || '-' || lpad(_count::text, 4, '0');
END;
$$;

-- =========================================
-- BERICHTEN
-- =========================================
CREATE TABLE public.helpdesk_ticket_berichten (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL,
  auteur_id UUID NOT NULL,
  richting TEXT NOT NULL DEFAULT 'intern', -- 'intern' | 'klant_in' | 'klant_uit'
  inhoud TEXT NOT NULL,
  bijlagen JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_helpdesk_berichten_ticket ON public.helpdesk_ticket_berichten(ticket_id);
ALTER TABLE public.helpdesk_ticket_berichten ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Berichten zichtbaar binnen partner"
  ON public.helpdesk_ticket_berichten FOR SELECT TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR partner_id = public.get_user_partner_id(auth.uid())
  );

CREATE POLICY "Berichten aanmaken binnen partner"
  ON public.helpdesk_ticket_berichten FOR INSERT TO authenticated
  WITH CHECK (
    auteur_id = auth.uid()
    AND partner_id = public.get_user_partner_id(auth.uid())
  );

CREATE POLICY "Berichten verwijderen door auteur of admin"
  ON public.helpdesk_ticket_berichten FOR DELETE TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (auteur_id = auth.uid())
    OR (public.get_user_role(auth.uid()) = 'partner_admin' AND partner_id = public.get_user_partner_id(auth.uid()))
  );

-- =========================================
-- BIJLAGEN
-- =========================================
CREATE TABLE public.helpdesk_ticket_bijlagen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL,
  bestandsnaam TEXT NOT NULL,
  bestand_url TEXT NOT NULL,
  mime_type TEXT,
  bestand_grootte INTEGER,
  beschrijving TEXT,
  geupload_door_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_helpdesk_bijlagen_ticket ON public.helpdesk_ticket_bijlagen(ticket_id);
ALTER TABLE public.helpdesk_ticket_bijlagen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bijlagen zichtbaar binnen partner"
  ON public.helpdesk_ticket_bijlagen FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()) OR partner_id = public.get_user_partner_id(auth.uid()));

CREATE POLICY "Bijlagen aanmaken binnen partner"
  ON public.helpdesk_ticket_bijlagen FOR INSERT TO authenticated
  WITH CHECK (geupload_door_id = auth.uid() AND partner_id = public.get_user_partner_id(auth.uid()));

CREATE POLICY "Bijlagen verwijderen door uploader of admin"
  ON public.helpdesk_ticket_bijlagen FOR DELETE TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR geupload_door_id = auth.uid()
    OR (public.get_user_role(auth.uid()) = 'partner_admin' AND partner_id = public.get_user_partner_id(auth.uid()))
  );

-- =========================================
-- TAKEN
-- =========================================
CREATE TABLE public.helpdesk_ticket_taken (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL,
  titel TEXT NOT NULL,
  omschrijving TEXT,
  status public.helpdesk_taak_status NOT NULL DEFAULT 'open',
  prioriteit public.helpdesk_ticket_prioriteit NOT NULL DEFAULT 'normaal',
  toegewezen_aan UUID,
  deadline TIMESTAMPTZ,
  gemaakt_door UUID NOT NULL,
  voltooid_op TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_helpdesk_taken_ticket ON public.helpdesk_ticket_taken(ticket_id);
CREATE INDEX idx_helpdesk_taken_toegewezen ON public.helpdesk_ticket_taken(toegewezen_aan);
ALTER TABLE public.helpdesk_ticket_taken ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Taken zichtbaar binnen partner"
  ON public.helpdesk_ticket_taken FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()) OR partner_id = public.get_user_partner_id(auth.uid()));

CREATE POLICY "Taken aanmaken binnen partner"
  ON public.helpdesk_ticket_taken FOR INSERT TO authenticated
  WITH CHECK (gemaakt_door = auth.uid() AND partner_id = public.get_user_partner_id(auth.uid()));

CREATE POLICY "Taken bijwerken binnen partner"
  ON public.helpdesk_ticket_taken FOR UPDATE TO authenticated
  USING (public.is_superadmin(auth.uid()) OR partner_id = public.get_user_partner_id(auth.uid()));

CREATE POLICY "Taken verwijderen door admin of maker"
  ON public.helpdesk_ticket_taken FOR DELETE TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR gemaakt_door = auth.uid()
    OR (public.get_user_role(auth.uid()) = 'partner_admin' AND partner_id = public.get_user_partner_id(auth.uid()))
  );

CREATE TRIGGER trg_helpdesk_taken_updated
  BEFORE UPDATE ON public.helpdesk_ticket_taken
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- HISTORIE (audit log)
-- =========================================
CREATE TABLE public.helpdesk_ticket_historie (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL,
  user_id UUID,
  actie TEXT NOT NULL,
  veld TEXT,
  oude_waarde TEXT,
  nieuwe_waarde TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_helpdesk_historie_ticket ON public.helpdesk_ticket_historie(ticket_id);
ALTER TABLE public.helpdesk_ticket_historie ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Historie zichtbaar binnen partner"
  ON public.helpdesk_ticket_historie FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()) OR partner_id = public.get_user_partner_id(auth.uid()));

CREATE POLICY "Historie aanmaken binnen partner"
  ON public.helpdesk_ticket_historie FOR INSERT TO authenticated
  WITH CHECK (partner_id = public.get_user_partner_id(auth.uid()) OR public.is_superadmin(auth.uid()));

-- =========================================
-- AI SESSIES
-- =========================================
CREATE TABLE public.helpdesk_ticket_ai_sessies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'foutcode' | 'troubleshooter' | 'bijlage_analyse'
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB NOT NULL DEFAULT '{}'::jsonb,
  gerelateerde_tickets JSONB DEFAULT '[]'::jsonb,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_helpdesk_ai_ticket ON public.helpdesk_ticket_ai_sessies(ticket_id);
ALTER TABLE public.helpdesk_ticket_ai_sessies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AI sessies zichtbaar binnen partner"
  ON public.helpdesk_ticket_ai_sessies FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()) OR partner_id = public.get_user_partner_id(auth.uid()));

CREATE POLICY "AI sessies aanmaken binnen partner"
  ON public.helpdesk_ticket_ai_sessies FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND partner_id = public.get_user_partner_id(auth.uid()));

-- =========================================
-- SERVICE BEZOEKEN
-- =========================================
CREATE TABLE public.helpdesk_service_bezoeken (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL,
  afspraak_id UUID,
  monteur_id UUID,
  type TEXT NOT NULL DEFAULT 'service_bezoek', -- 'service_bezoek' | 'storing'
  geplande_datum DATE,
  geplande_tijd TIME,
  aankomst_tijd TIMESTAMPTZ,
  vertrek_tijd TIMESTAMPTZ,
  werkzaamheden TEXT,
  oplossing TEXT,
  handtekening_url TEXT,
  klant_naam_handtekening TEXT,
  status TEXT NOT NULL DEFAULT 'gepland', -- gepland|onderweg|bezig|klaar|geannuleerd
  notities TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_helpdesk_service_ticket ON public.helpdesk_service_bezoeken(ticket_id);
CREATE INDEX idx_helpdesk_service_monteur ON public.helpdesk_service_bezoeken(monteur_id);
ALTER TABLE public.helpdesk_service_bezoeken ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service bezoeken zichtbaar binnen partner"
  ON public.helpdesk_service_bezoeken FOR SELECT TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (
      partner_id = public.get_user_partner_id(auth.uid())
      AND (
        public.get_user_role(auth.uid()) IN ('partner_admin','partner_staff','adviseur')
        OR monteur_id = auth.uid()
      )
    )
  );

CREATE POLICY "Service bezoeken aanmaken"
  ON public.helpdesk_service_bezoeken FOR INSERT TO authenticated
  WITH CHECK (
    public.is_superadmin(auth.uid())
    OR (
      partner_id = public.get_user_partner_id(auth.uid())
      AND public.get_user_role(auth.uid()) IN ('partner_admin','partner_staff','adviseur')
    )
  );

CREATE POLICY "Service bezoeken bijwerken"
  ON public.helpdesk_service_bezoeken FOR UPDATE TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (
      partner_id = public.get_user_partner_id(auth.uid())
      AND (
        public.get_user_role(auth.uid()) IN ('partner_admin','partner_staff')
        OR monteur_id = auth.uid()
      )
    )
  );

CREATE POLICY "Service bezoeken verwijderen"
  ON public.helpdesk_service_bezoeken FOR DELETE TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (public.get_user_role(auth.uid()) = 'partner_admin' AND partner_id = public.get_user_partner_id(auth.uid()))
  );

CREATE TRIGGER trg_helpdesk_service_updated
  BEFORE UPDATE ON public.helpdesk_service_bezoeken
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- KENNISBANK
-- =========================================
CREATE TABLE public.helpdesk_kennis_artikelen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL,
  titel TEXT NOT NULL,
  samenvatting TEXT,
  probleem TEXT,
  oplossing TEXT,
  product_categorie TEXT,
  product_merk TEXT,
  product_type TEXT,
  foutcode TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  status public.helpdesk_artikel_status NOT NULL DEFAULT 'concept',
  bron_ticket_id UUID REFERENCES public.helpdesk_tickets(id) ON DELETE SET NULL,
  ai_gegenereerd BOOLEAN NOT NULL DEFAULT false,
  gemaakt_door UUID,
  goedgekeurd_door UUID,
  goedgekeurd_op TIMESTAMPTZ,
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_helpdesk_kennis_partner ON public.helpdesk_kennis_artikelen(partner_id);
CREATE INDEX idx_helpdesk_kennis_status ON public.helpdesk_kennis_artikelen(status);
CREATE INDEX idx_helpdesk_kennis_categorie ON public.helpdesk_kennis_artikelen(product_categorie);
ALTER TABLE public.helpdesk_kennis_artikelen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gepubliceerde KB binnen partner"
  ON public.helpdesk_kennis_artikelen FOR SELECT TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (
      partner_id = public.get_user_partner_id(auth.uid())
      AND (
        status = 'gepubliceerd'
        OR gemaakt_door = auth.uid()
        OR public.get_user_role(auth.uid()) = 'partner_admin'
      )
    )
  );

CREATE POLICY "KB aanmaken binnen partner"
  ON public.helpdesk_kennis_artikelen FOR INSERT TO authenticated
  WITH CHECK (
    public.is_superadmin(auth.uid())
    OR (
      partner_id = public.get_user_partner_id(auth.uid())
      AND public.get_user_role(auth.uid()) IN ('partner_admin','partner_staff','adviseur','installateur')
    )
  );

CREATE POLICY "KB bijwerken (partner_admin of auteur)"
  ON public.helpdesk_kennis_artikelen FOR UPDATE TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (
      partner_id = public.get_user_partner_id(auth.uid())
      AND (public.get_user_role(auth.uid()) = 'partner_admin' OR gemaakt_door = auth.uid())
    )
  );

CREATE POLICY "KB verwijderen door partner_admin"
  ON public.helpdesk_kennis_artikelen FOR DELETE TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (public.get_user_role(auth.uid()) = 'partner_admin' AND partner_id = public.get_user_partner_id(auth.uid()))
  );

CREATE TRIGGER trg_helpdesk_kennis_updated
  BEFORE UPDATE ON public.helpdesk_kennis_artikelen
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- KENNIS MEDIA
-- =========================================
CREATE TABLE public.helpdesk_kennis_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artikel_id UUID NOT NULL REFERENCES public.helpdesk_kennis_artikelen(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL,
  bestandsnaam TEXT NOT NULL,
  bestand_url TEXT NOT NULL,
  mime_type TEXT,
  beschrijving TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_helpdesk_kennis_media_artikel ON public.helpdesk_kennis_media(artikel_id);
ALTER TABLE public.helpdesk_kennis_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "KB media zichtbaar binnen partner"
  ON public.helpdesk_kennis_media FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()) OR partner_id = public.get_user_partner_id(auth.uid()));

CREATE POLICY "KB media aanmaken binnen partner"
  ON public.helpdesk_kennis_media FOR INSERT TO authenticated
  WITH CHECK (
    public.is_superadmin(auth.uid())
    OR (
      partner_id = public.get_user_partner_id(auth.uid())
      AND public.get_user_role(auth.uid()) IN ('partner_admin','partner_staff','adviseur','installateur')
    )
  );

CREATE POLICY "KB media verwijderen door partner_admin"
  ON public.helpdesk_kennis_media FOR DELETE TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (public.get_user_role(auth.uid()) = 'partner_admin' AND partner_id = public.get_user_partner_id(auth.uid()))
  );

-- =========================================
-- NOTIFICATIE CONFIG
-- =========================================
CREATE TABLE public.helpdesk_notificatie_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL UNIQUE,
  email_bij_nieuw_ticket BOOLEAN NOT NULL DEFAULT true,
  email_bij_toewijzing BOOLEAN NOT NULL DEFAULT true,
  email_bij_klant_reactie BOOLEAN NOT NULL DEFAULT true,
  email_bij_escalatie BOOLEAN NOT NULL DEFAULT true,
  email_bij_storing BOOLEAN NOT NULL DEFAULT true,
  email_bij_oplossing BOOLEAN NOT NULL DEFAULT false,
  ontvangers JSONB DEFAULT '[]'::jsonb, -- array van emailadressen
  sla_uren_urgent INTEGER NOT NULL DEFAULT 4,
  sla_uren_hoog INTEGER NOT NULL DEFAULT 24,
  sla_uren_normaal INTEGER NOT NULL DEFAULT 72,
  sla_uren_laag INTEGER NOT NULL DEFAULT 168,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.helpdesk_notificatie_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notificatie config lezen binnen partner"
  ON public.helpdesk_notificatie_config FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()) OR partner_id = public.get_user_partner_id(auth.uid()));

CREATE POLICY "Notificatie config beheren door partner_admin"
  ON public.helpdesk_notificatie_config FOR ALL TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (public.get_user_role(auth.uid()) = 'partner_admin' AND partner_id = public.get_user_partner_id(auth.uid()))
  )
  WITH CHECK (
    public.is_superadmin(auth.uid())
    OR (public.get_user_role(auth.uid()) = 'partner_admin' AND partner_id = public.get_user_partner_id(auth.uid()))
  );

CREATE TRIGGER trg_helpdesk_notif_config_updated
  BEFORE UPDATE ON public.helpdesk_notificatie_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- DRAFTS (autosave)
-- =========================================
CREATE TABLE public.helpdesk_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  partner_id UUID NOT NULL,
  context_key TEXT NOT NULL, -- bv 'ticket:new' of 'ticket:<uuid>:bericht'
  inhoud JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, context_key)
);
CREATE INDEX idx_helpdesk_drafts_user ON public.helpdesk_drafts(user_id);
ALTER TABLE public.helpdesk_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Eigen drafts zichtbaar"
  ON public.helpdesk_drafts FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Eigen drafts beheren"
  ON public.helpdesk_drafts FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND partner_id = public.get_user_partner_id(auth.uid()));

CREATE TRIGGER trg_helpdesk_drafts_updated
  BEFORE UPDATE ON public.helpdesk_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- STORAGE BUCKET helpdesk-media (privaat)
-- =========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('helpdesk-media', 'helpdesk-media', false)
ON CONFLICT (id) DO NOTHING;

-- Toegang per partner (folder = partner_id)
CREATE POLICY "Helpdesk media lezen binnen partner"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'helpdesk-media'
  AND (
    public.is_superadmin(auth.uid())
    OR (storage.foldername(name))[1] = public.get_user_partner_id(auth.uid())::text
  )
);

CREATE POLICY "Helpdesk media uploaden binnen partner"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'helpdesk-media'
  AND (storage.foldername(name))[1] = public.get_user_partner_id(auth.uid())::text
);

CREATE POLICY "Helpdesk media verwijderen binnen partner"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'helpdesk-media'
  AND (
    public.is_superadmin(auth.uid())
    OR (storage.foldername(name))[1] = public.get_user_partner_id(auth.uid())::text
  )
);

CREATE POLICY "Helpdesk media bijwerken binnen partner"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'helpdesk-media'
  AND (storage.foldername(name))[1] = public.get_user_partner_id(auth.uid())::text
);
