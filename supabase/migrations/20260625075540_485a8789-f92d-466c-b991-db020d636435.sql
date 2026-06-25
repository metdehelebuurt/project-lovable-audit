ALTER TYPE public.affiliate_lead_status ADD VALUE IF NOT EXISTS 'mail_gestuurd' AFTER 'gebeld_geen_gehoor';
ALTER TYPE public.affiliate_lead_status ADD VALUE IF NOT EXISTS 'demo_gepland' AFTER 'gesprek_gepland';
ALTER TYPE public.affiliate_lead_status ADD VALUE IF NOT EXISTS 'trial_gestart' AFTER 'voorstel_verstuurd';