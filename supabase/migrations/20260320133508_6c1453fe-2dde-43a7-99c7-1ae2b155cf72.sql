ALTER TABLE public.partners 
ADD COLUMN betalingsvoorwaarden_config jsonb 
DEFAULT '[{"label":"30 dagen netto","standaard":true},{"label":"14 dagen netto","standaard":false},{"label":"50% vooruit, 50% na installatie","standaard":false},{"label":"Bij oplevering","standaard":false}]'::jsonb;