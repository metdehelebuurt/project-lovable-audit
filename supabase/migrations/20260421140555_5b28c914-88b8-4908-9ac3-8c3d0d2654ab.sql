-- 1. Functie voor unieke abonnement-factuurnummers (AB-YYYY-0001, jaarlijks oplopend, globaal uniek)
CREATE OR REPLACE FUNCTION public.generate_abonnement_factuurnummer()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _year text;
  _count integer;
BEGIN
  _year := to_char(now(), 'YYYY');
  SELECT COUNT(*) + 1 INTO _count
  FROM public.facturen
  WHERE factuurnummer LIKE 'AB-' || _year || '-%';
  RETURN 'AB-' || _year || '-' || lpad(_count::text, 4, '0');
END;
$function$;

-- 2. Synchroniseer bestaande plannen met actuele module-keys + features
-- Starter
UPDATE public.abonnement_plannen
SET modules = '["leads","klanten","berichten","schouwen","offertes","planning","producten","documenten"]'::jsonb,
    features = '["basis_rapportage","email_templates","webtools_embeds","energieadvies_wizard","gmail_oauth"]'::jsonb,
    updated_at = now()
WHERE slug = 'starter';

-- Professional
UPDATE public.abonnement_plannen
SET modules = '["leads","klanten","berichten","schouwen","offertes","opdrachten","installaties","helpdesk","planning","producten","tools","energieadvies","documenten","analytics","financieel_verkoop","financieel_openstaand"]'::jsonb,
    features = '["basis_rapportage","email_templates","geavanceerde_rapportage","webtools_embeds","energieadvies_wizard","thuisbatterij_selector","document_beheer","klantportaal","realtime_chat","gmail_oauth","microsoft_oauth","google_maps","ai_offerte_intro","ai_datasheet_parser","ai_lead_signals"]'::jsonb,
    updated_at = now()
WHERE slug = 'professional';

-- Enterprise
UPDATE public.abonnement_plannen
SET modules = '["leads","klanten","berichten","schouwen","offertes","opdrachten","installaties","helpdesk","planning","producten","tools","energieadvies","documenten","analytics","financieel_verkoop","financieel_inkoop","financieel_pakbonnen","financieel_btw","financieel_openstaand","leveranciers"]'::jsonb,
    features = '["basis_rapportage","email_templates","geavanceerde_rapportage","webtools_embeds","energieadvies_wizard","thuisbatterij_selector","document_beheer","klantportaal","realtime_chat","gmail_oauth","microsoft_oauth","google_maps","solar_api","ai_offerte_intro","ai_datasheet_parser","ai_foutcode_analyzer","ai_helpdesk_troubleshooter","ai_lead_signals","ai_product_import","ai_feedback_categorize","white_label","eigen_domein","witlabel_emails","api_toegang","btw_aangifte_export","demo_data_reset"]'::jsonb,
    updated_at = now()
WHERE slug = 'enterprise';