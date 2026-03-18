
-- Add template and sharing columns to offertes
ALTER TABLE public.offertes
  ADD COLUMN IF NOT EXISTS template_config jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS share_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS share_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_ip text;

-- Create index on share_token for fast lookups
CREATE INDEX IF NOT EXISTS idx_offertes_share_token ON public.offertes(share_token) WHERE share_token IS NOT NULL;

-- Allow anonymous users to read offertes by share_token (for public offerte view)
CREATE POLICY "Publiek leest offerte via share_token"
  ON public.offertes
  FOR SELECT
  TO anon
  USING (share_token IS NOT NULL AND share_token = share_token);
