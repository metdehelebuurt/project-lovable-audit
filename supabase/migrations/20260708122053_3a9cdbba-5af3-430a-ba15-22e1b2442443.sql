UPDATE public.affiliate_leads
SET sales_fase = NULL,
    in_pipeline = false,
    eigenaar_id = NULL,
    fase_slug = 'nieuw',
    toegewezen_door_admin_id = NULL,
    doorgezet_op = NULL,
    updated_at = now()
WHERE eigenaar_id = 'ac38519f-d493-4ca0-a7ad-8cf27db3918d'
  AND sales_fase = 'koud'
  AND status = 'nieuw';