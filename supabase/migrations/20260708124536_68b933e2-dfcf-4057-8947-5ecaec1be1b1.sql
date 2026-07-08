UPDATE public.affiliate_leads al
SET sales_fase = NULL,
    in_pipeline = false,
    eigenaar_id = NULL,
    fase_slug = 'nieuw',
    toegewezen_door_admin_id = NULL,
    doorgezet_op = NULL,
    updated_at = now()
WHERE al.eigenaar_id = 'ac38519f-d493-4ca0-a7ad-8cf27db3918d'
  AND al.fase_slug = 'nieuw'
  AND NOT EXISTS (
    SELECT 1 FROM public.affiliate_lead_contactmomenten cm WHERE cm.lead_id = al.id
  );