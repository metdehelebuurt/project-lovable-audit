
-- Add calculator_thuisbatterij to widget_type enum
ALTER TYPE public.widget_type ADD VALUE IF NOT EXISTS 'calculator_thuisbatterij';

-- Add notificatie_email column to web_widgets
ALTER TABLE public.web_widgets ADD COLUMN IF NOT EXISTS notificatie_email text;
