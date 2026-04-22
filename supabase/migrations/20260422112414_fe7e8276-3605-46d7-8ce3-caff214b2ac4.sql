
-- ============================================
-- NEN 1010 Opleverrapport module
-- ============================================

-- 1. Opleverrapporten hoofdtabel
CREATE TABLE public.opleverrapporten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  installatie_id uuid REFERENCES public.installaties(id) ON DELETE SET NULL,
  klant_id uuid REFERENCES public.klanten(id) ON DELETE SET NULL,
  installateur_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES public.users(id),

  rapportnummer text NOT NULL,
  template_versie text NOT NULL DEFAULT 'NEN1010-2020+A1-2024-v1.0',
  status text NOT NULL DEFAULT 'concept' CHECK (status IN ('concept','wacht_op_klant','ondertekend','afgekeurd')),

  scope_omschrijving text,
  opleverdatum date,

  batterij_spec jsonb NOT NULL DEFAULT '{}'::jsonb,
  omvormer_spec jsonb NOT NULL DEFAULT '{}'::jsonb,
  opstelling jsonb NOT NULL DEFAULT '{}'::jsonb,
  visuele_inspectie jsonb NOT NULL DEFAULT '[]'::jsonb,
  metingen jsonb NOT NULL DEFAULT '[]'::jsonb,
  meetapparatuur jsonb NOT NULL DEFAULT '{}'::jsonb,
  groepenverdeling jsonb NOT NULL DEFAULT '[]'::jsonb,
  documenten jsonb NOT NULL DEFAULT '[]'::jsonb,
  bevindingen jsonb NOT NULL DEFAULT '{"verdict":null,"deficiencies":[],"recommendations":[]}'::jsonb,
  conformiteitstekst text,

  installateur_handtekening jsonb,
  klant_handtekening jsonb,

  klant_token text UNIQUE,
  klant_token_expires_at timestamptz,

  pdf_url text,
  pdf_hash text,
  gefinaliseerd_op timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (partner_id, rapportnummer)
);

CREATE INDEX idx_opleverrapporten_partner ON public.opleverrapporten(partner_id);
CREATE INDEX idx_opleverrapporten_klant ON public.opleverrapporten(klant_id);
CREATE INDEX idx_opleverrapporten_installatie ON public.opleverrapporten(installatie_id);
CREATE INDEX idx_opleverrapporten_installateur ON public.opleverrapporten(installateur_id);
CREATE INDEX idx_opleverrapporten_status ON public.opleverrapporten(status);

ALTER TABLE public.opleverrapporten ENABLE ROW LEVEL SECURITY;

-- Lezen: superadmin alles, partner-leden eigen partner, consument eigen rapport
CREATE POLICY "opleverrapporten_select_partner" ON public.opleverrapporten
FOR SELECT USING (
  public.is_superadmin(auth.uid())
  OR partner_id = public.get_user_partner_id(auth.uid())
  OR (klant_id IN (
    SELECT k.id FROM public.klanten k
    JOIN public.consumenten c ON lower(c.email) = lower(k.email)
    WHERE c.user_id = auth.uid()
  ))
);

-- Aanmaken: partnerleden binnen eigen partner
CREATE POLICY "opleverrapporten_insert_partner" ON public.opleverrapporten
FOR INSERT WITH CHECK (
  public.is_superadmin(auth.uid())
  OR (
    partner_id = public.get_user_partner_id(auth.uid())
    AND public.get_user_role(auth.uid()) IN ('partner_admin','partner_staff','backoffice','adviseur','installateur')
  )
);

-- Bewerken: alleen zolang nog niet ondertekend
CREATE POLICY "opleverrapporten_update_partner" ON public.opleverrapporten
FOR UPDATE USING (
  public.is_superadmin(auth.uid())
  OR (
    partner_id = public.get_user_partner_id(auth.uid())
    AND public.get_user_role(auth.uid()) IN ('partner_admin','partner_staff','backoffice','adviseur','installateur')
    AND status IN ('concept','wacht_op_klant')
  )
);

-- Verwijderen: alleen partner_admin / superadmin, alleen concept
CREATE POLICY "opleverrapporten_delete_partner" ON public.opleverrapporten
FOR DELETE USING (
  public.is_superadmin(auth.uid())
  OR (
    partner_id = public.get_user_partner_id(auth.uid())
    AND public.get_user_role(auth.uid()) = 'partner_admin'
    AND status = 'concept'
  )
);

-- updated_at trigger
CREATE TRIGGER trg_opleverrapporten_updated
BEFORE UPDATE ON public.opleverrapporten
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Audit log
CREATE TABLE public.opleverrapport_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rapport_id uuid NOT NULL REFERENCES public.opleverrapporten(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL,
  actor_id uuid,
  actie text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_opleverrapport_audit_rapport ON public.opleverrapport_audit(rapport_id);
CREATE INDEX idx_opleverrapport_audit_partner ON public.opleverrapport_audit(partner_id);

ALTER TABLE public.opleverrapport_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "opleverrapport_audit_select_partner" ON public.opleverrapport_audit
FOR SELECT USING (
  public.is_superadmin(auth.uid())
  OR partner_id = public.get_user_partner_id(auth.uid())
);

-- Schrijven uitsluitend via service role / SECURITY DEFINER (geen INSERT policy = blocked voor anon/authenticated)
-- Maar wel toestaan voor eigenaar van rapport zodat client autosave-events kan loggen
CREATE POLICY "opleverrapport_audit_insert_partner" ON public.opleverrapport_audit
FOR INSERT WITH CHECK (
  public.is_superadmin(auth.uid())
  OR partner_id = public.get_user_partner_id(auth.uid())
);

-- 3. Installateur voorkeuren
CREATE TABLE public.installateur_voorkeuren (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  meetapparatuur jsonb NOT NULL DEFAULT '{}'::jsonb,
  kvk_nummer text,
  erkenningsnummer text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.installateur_voorkeuren ENABLE ROW LEVEL SECURITY;

CREATE POLICY "installateur_voorkeuren_select_self" ON public.installateur_voorkeuren
FOR SELECT USING (
  user_id = auth.uid()
  OR public.is_superadmin(auth.uid())
  OR (
    public.get_user_role(auth.uid()) = 'partner_admin'
    AND user_id IN (SELECT id FROM public.users WHERE partner_id = public.get_user_partner_id(auth.uid()))
  )
);

CREATE POLICY "installateur_voorkeuren_upsert_self" ON public.installateur_voorkeuren
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "installateur_voorkeuren_update_self" ON public.installateur_voorkeuren
FOR UPDATE USING (user_id = auth.uid());

CREATE TRIGGER trg_installateur_voorkeuren_updated
BEFORE UPDATE ON public.installateur_voorkeuren
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Nummerreeks bootstrap helper - hergebruikt generate_documentnummer_v2
-- Geen extra functie nodig; client roept generate_documentnummer_v2(_partner_id, 'oplevering') aan.

-- 5. Storage bucket voor opleverrapport media
INSERT INTO storage.buckets (id, name, public)
VALUES ('oplever-media', 'oplever-media', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: per partner toegang via prefix {partner_id}/...
CREATE POLICY "oplever_media_select_partner"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'oplever-media'
  AND (
    public.is_superadmin(auth.uid())
    OR (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = public.get_user_partner_id(auth.uid())::text)
  )
);

CREATE POLICY "oplever_media_insert_partner"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'oplever-media'
  AND auth.uid() IS NOT NULL
  AND (
    public.is_superadmin(auth.uid())
    OR (storage.foldername(name))[1] = public.get_user_partner_id(auth.uid())::text
  )
);

CREATE POLICY "oplever_media_update_partner"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'oplever-media'
  AND (
    public.is_superadmin(auth.uid())
    OR (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = public.get_user_partner_id(auth.uid())::text)
  )
);

CREATE POLICY "oplever_media_delete_partner"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'oplever-media'
  AND (
    public.is_superadmin(auth.uid())
    OR (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = public.get_user_partner_id(auth.uid())::text)
  )
);
