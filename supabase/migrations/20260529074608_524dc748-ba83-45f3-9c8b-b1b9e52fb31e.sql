
-- Tabel 1: gekoppelde Google-accounts per gebruiker
CREATE TABLE public.google_calendar_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  partner_id uuid NOT NULL,
  google_email text NOT NULL,
  calendar_id text NOT NULL DEFAULT 'primary',
  calendar_summary text,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expiry timestamptz NOT NULL,
  scope text,
  sync_token text,
  channel_id text,
  resource_id text,
  channel_expiry timestamptz,
  sync_schouwen boolean NOT NULL DEFAULT true,
  sync_installaties boolean NOT NULL DEFAULT true,
  sync_afspraken boolean NOT NULL DEFAULT true,
  sync_taken boolean NOT NULL DEFAULT true,
  sync_handmatig boolean NOT NULL DEFAULT true,
  actief boolean NOT NULL DEFAULT true,
  laatst_gesynchroniseerd_op timestamptz,
  laatste_fout text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_calendar_accounts TO authenticated;
GRANT ALL ON public.google_calendar_accounts TO service_role;

ALTER TABLE public.google_calendar_accounts ENABLE ROW LEVEL SECURITY;

-- Gebruiker mag enkel metadata van eigen koppeling zien (tokens worden client-side niet getoond,
-- maar RLS-laag wel; UI selecteert alleen niet-gevoelige velden)
CREATE POLICY "User sees own google_calendar_account"
  ON public.google_calendar_accounts FOR SELECT
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "User updates own google_calendar_account"
  ON public.google_calendar_accounts FOR UPDATE
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "User deletes own google_calendar_account"
  ON public.google_calendar_accounts FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- INSERT alleen via edge function (service role). Geen INSERT-policy voor authenticated.

CREATE TRIGGER set_updated_at_google_calendar_accounts
  BEFORE UPDATE ON public.google_calendar_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_gca_partner ON public.google_calendar_accounts(partner_id);
CREATE INDEX idx_gca_channel_expiry ON public.google_calendar_accounts(channel_expiry) WHERE actief = true;

-- Tabel 2: mapping platform-item <-> Google event
CREATE TABLE public.google_calendar_event_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  partner_id uuid NOT NULL,
  entiteit_type text NOT NULL CHECK (entiteit_type IN ('schouw','installatie','afspraak','taak')),
  entiteit_id uuid NOT NULL,
  google_event_id text NOT NULL,
  google_etag text,
  laatste_hash text,
  laatste_sync_op timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, entiteit_type, entiteit_id)
);

GRANT SELECT ON public.google_calendar_event_mapping TO authenticated;
GRANT ALL ON public.google_calendar_event_mapping TO service_role;

ALTER TABLE public.google_calendar_event_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User sees own event mapping"
  ON public.google_calendar_event_mapping FOR SELECT
  TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER set_updated_at_gce_mapping
  BEFORE UPDATE ON public.google_calendar_event_mapping
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_gcem_user ON public.google_calendar_event_mapping(user_id);
CREATE INDEX idx_gcem_entiteit ON public.google_calendar_event_mapping(entiteit_type, entiteit_id);
CREATE INDEX idx_gcem_partner ON public.google_calendar_event_mapping(partner_id);
