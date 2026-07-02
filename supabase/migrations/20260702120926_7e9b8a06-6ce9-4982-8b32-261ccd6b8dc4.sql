ALTER TABLE public.affiliate_terugbel_afspraken
  ADD COLUMN IF NOT EXISTS reminder_24u_actief boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS reminder_1u_actief boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS reminder_24u_gepland_op timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_1u_gepland_op timestamptz;

-- Vul geplande momenten voor bestaande rijen op basis van geplande_op
UPDATE public.affiliate_terugbel_afspraken
   SET reminder_24u_gepland_op = COALESCE(reminder_24u_gepland_op, geplande_op - interval '24 hours'),
       reminder_1u_gepland_op  = COALESCE(reminder_1u_gepland_op,  geplande_op - interval '1 hour')
 WHERE reminder_24u_gepland_op IS NULL OR reminder_1u_gepland_op IS NULL;