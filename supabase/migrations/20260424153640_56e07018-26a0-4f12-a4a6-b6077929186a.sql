-- Centrale system error logs tabel
CREATE TABLE IF NOT EXISTS public.system_error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  bron text NOT NULL CHECK (bron IN ('frontend','edge_function','database','client_unhandled','client_promise')),
  niveau text NOT NULL DEFAULT 'error' CHECK (niveau IN ('error','warning','info','fatal')),
  bericht text NOT NULL,
  stacktrace text,
  context jsonb DEFAULT '{}'::jsonb,
  edge_function_naam text,
  route text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  partner_id uuid,
  user_email text,
  user_rol text,
  status_code int,
  request_id text,
  user_agent text,
  ip inet
);

CREATE INDEX IF NOT EXISTS idx_system_error_logs_created_at ON public.system_error_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_error_logs_bron ON public.system_error_logs (bron, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_error_logs_user_id ON public.system_error_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_error_logs_user_email ON public.system_error_logs (user_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_error_logs_edge_fn ON public.system_error_logs (edge_function_naam, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_error_logs_partner ON public.system_error_logs (partner_id, created_at DESC);

ALTER TABLE public.system_error_logs ENABLE ROW LEVEL SECURITY;

-- Superadmin ziet alles
CREATE POLICY "Superadmins kunnen alle error logs zien"
  ON public.system_error_logs FOR SELECT
  TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- Ingelogde users mogen voor zichzelf loggen (frontend errors)
CREATE POLICY "Ingelogde users mogen errors voor zichzelf loggen"
  ON public.system_error_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Service role (edge functions) bypassed RLS automatisch.

-- Alleen superadmin kan oude logs opruimen
CREATE POLICY "Superadmins kunnen logs opruimen"
  ON public.system_error_logs FOR DELETE
  TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- Helper: opruimen logs ouder dan _dagen
CREATE OR REPLACE FUNCTION public.purge_system_error_logs(_dagen int DEFAULT 90)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count int;
BEGIN
  IF NOT public.is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'Geen rechten';
  END IF;
  DELETE FROM public.system_error_logs WHERE created_at < now() - (_dagen || ' days')::interval;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;