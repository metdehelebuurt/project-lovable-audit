ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sales_manager';

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS land text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS stad text;