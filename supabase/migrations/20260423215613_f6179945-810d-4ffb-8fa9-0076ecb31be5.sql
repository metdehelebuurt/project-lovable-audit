ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS dashboard_view text NOT NULL DEFAULT 'klassiek',
  ADD COLUMN IF NOT EXISTS dashboard_apps_layout jsonb NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_dashboard_view_chk'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_dashboard_view_chk
      CHECK (dashboard_view IN ('klassiek','apps'));
  END IF;
END $$;