import { MODULES, type ModuleDefinition } from "./modules";

export interface PlanFeature {
  key: string;
  label: string;
  groep: string;
  beschrijving?: string;
}

/**
 * Centrale registry van alle plan-features die per abonnement aan/uit gezet kunnen worden.
 * Modules komen uit `src/lib/modules.ts` (MODULES). Features zijn extra capabilities
 * bovenop de module-toegang, te checken via `useSubscriptionLimits().hasFeature(key)`.
 */
export const ALL_PLAN_FEATURES: PlanFeature[] = [
  // Rapportage & basis
  { key: "basis_rapportage", label: "Basis rapportage", groep: "Rapportage" },
  { key: "geavanceerde_rapportage", label: "Geavanceerde rapportage", groep: "Rapportage" },
  { key: "email_templates", label: "E-mail templates", groep: "Rapportage" },
  { key: "document_beheer", label: "Documentbeheer", groep: "Rapportage" },

  // Geavanceerde modules
  { key: "klantportaal", label: "Klantportaal", groep: "Geavanceerd" },
  { key: "realtime_chat", label: "Realtime chat", groep: "Geavanceerd" },
  { key: "multi_handtekening", label: "Multi-handtekening", groep: "Geavanceerd" },
  { key: "video_uploads_schouw", label: "Video-uploads bij schouw", groep: "Geavanceerd" },

  // Tools
  { key: "webtools_embeds", label: "Webtools embeds", groep: "Tools" },
  { key: "energieadvies_wizard", label: "Energieadvies wizard", groep: "Tools" },
  { key: "thuisbatterij_selector", label: "Thuisbatterij selector", groep: "Tools" },

  // Financieel
  { key: "btw_aangifte_export", label: "BTW-aangifte export", groep: "Financieel" },

  // AI
  { key: "ai_offerte_intro", label: "AI offerte-intro", groep: "AI" },
  { key: "ai_datasheet_parser", label: "AI datasheet parser", groep: "AI" },
  { key: "ai_foutcode_analyzer", label: "AI foutcode-analyzer", groep: "AI" },
  { key: "ai_helpdesk_troubleshooter", label: "AI helpdesk troubleshooter", groep: "AI" },
  { key: "ai_lead_signals", label: "AI lead-signalen", groep: "AI" },
  { key: "ai_product_import", label: "AI productimport", groep: "AI" },
  { key: "ai_feedback_categorize", label: "AI feedback-categorisatie", groep: "AI" },

  // Integraties
  { key: "gmail_oauth", label: "Gmail OAuth", groep: "Integraties" },
  { key: "microsoft_oauth", label: "Microsoft OAuth", groep: "Integraties" },
  { key: "solar_api", label: "Solar API", groep: "Integraties" },
  { key: "google_maps", label: "Google Maps", groep: "Integraties" },

  // White-label
  { key: "white_label", label: "White-label branding", groep: "White-label" },
  { key: "eigen_domein", label: "Eigen domein", groep: "White-label" },
  { key: "witlabel_emails", label: "White-label e-mails", groep: "White-label" },
  { key: "api_toegang", label: "API-toegang", groep: "White-label" },

  // Beheer
  { key: "demo_data_reset", label: "Demo-data reset", groep: "Beheer" },
];

export const FEATURES_BY_GROEP: Record<string, PlanFeature[]> = ALL_PLAN_FEATURES.reduce(
  (acc, f) => {
    acc[f.groep] = acc[f.groep] ?? [];
    acc[f.groep].push(f);
    return acc;
  },
  {} as Record<string, PlanFeature[]>
);

export const FEATURE_BY_KEY: Record<string, PlanFeature> = Object.fromEntries(
  ALL_PLAN_FEATURES.map((f) => [f.key, f])
);

/** Modules gegroepeerd voor checkbox-grids in de PlanConfigurator. */
export const MODULES_BY_GROEP: Record<string, ModuleDefinition[]> = MODULES
  .filter((m) => m.configurable)
  .reduce((acc, m) => {
    acc[m.groep] = acc[m.groep] ?? [];
    acc[m.groep].push(m);
    return acc;
  }, {} as Record<string, ModuleDefinition[]>);
