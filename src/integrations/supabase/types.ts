export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      abonnement_addon_aankopen: {
        Row: {
          aantal: number
          abonnement_id: string | null
          addon_id: string
          created_at: string
          eind_datum: string | null
          id: string
          interval: string
          maand_bedrag: number
          mollie_payment_id: string | null
          mollie_subscription_id: string | null
          partner_id: string
          start_datum: string
          status: string
        }
        Insert: {
          aantal?: number
          abonnement_id?: string | null
          addon_id: string
          created_at?: string
          eind_datum?: string | null
          id?: string
          interval?: string
          maand_bedrag?: number
          mollie_payment_id?: string | null
          mollie_subscription_id?: string | null
          partner_id: string
          start_datum?: string
          status?: string
        }
        Update: {
          aantal?: number
          abonnement_id?: string | null
          addon_id?: string
          created_at?: string
          eind_datum?: string | null
          id?: string
          interval?: string
          maand_bedrag?: number
          mollie_payment_id?: string | null
          mollie_subscription_id?: string | null
          partner_id?: string
          start_datum?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "abonnement_addon_aankopen_abonnement_id_fkey"
            columns: ["abonnement_id"]
            isOneToOne: false
            referencedRelation: "abonnementen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abonnement_addon_aankopen_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "abonnement_addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abonnement_addon_aankopen_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abonnement_addon_aankopen_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      abonnement_addons: {
        Row: {
          actief: boolean
          beschrijving: string | null
          created_at: string
          id: string
          jaar_prijs: number
          maand_prijs: number
          naam: string
          slug: string
          type: string
          updated_at: string
        }
        Insert: {
          actief?: boolean
          beschrijving?: string | null
          created_at?: string
          id?: string
          jaar_prijs?: number
          maand_prijs?: number
          naam: string
          slug: string
          type?: string
          updated_at?: string
        }
        Update: {
          actief?: boolean
          beschrijving?: string | null
          created_at?: string
          id?: string
          jaar_prijs?: number
          maand_prijs?: number
          naam?: string
          slug?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      abonnement_notificaties_config: {
        Row: {
          dagen_voor_verloop: number[]
          email_bij_factuur: boolean
          email_bij_opzegging: boolean
          email_bij_verloop: boolean
          id: string
          updated_at: string
        }
        Insert: {
          dagen_voor_verloop?: number[]
          email_bij_factuur?: boolean
          email_bij_opzegging?: boolean
          email_bij_verloop?: boolean
          id?: string
          updated_at?: string
        }
        Update: {
          dagen_voor_verloop?: number[]
          email_bij_factuur?: boolean
          email_bij_opzegging?: boolean
          email_bij_verloop?: boolean
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      abonnement_plannen: {
        Row: {
          actief: boolean
          beschrijving: string | null
          created_at: string
          features: Json
          id: string
          jaar_prijs: number
          maand_prijs: number
          max_adviseurs: number | null
          max_gebruikers: number | null
          max_installateurs: number | null
          max_leads: number | null
          max_offertes: number | null
          modules: Json
          naam: string
          slug: string
          updated_at: string
          volgorde: number
          voorwaarden: string | null
        }
        Insert: {
          actief?: boolean
          beschrijving?: string | null
          created_at?: string
          features?: Json
          id?: string
          jaar_prijs?: number
          maand_prijs?: number
          max_adviseurs?: number | null
          max_gebruikers?: number | null
          max_installateurs?: number | null
          max_leads?: number | null
          max_offertes?: number | null
          modules?: Json
          naam: string
          slug: string
          updated_at?: string
          volgorde?: number
          voorwaarden?: string | null
        }
        Update: {
          actief?: boolean
          beschrijving?: string | null
          created_at?: string
          features?: Json
          id?: string
          jaar_prijs?: number
          maand_prijs?: number
          max_adviseurs?: number | null
          max_gebruikers?: number | null
          max_installateurs?: number | null
          max_leads?: number | null
          max_offertes?: number | null
          modules?: Json
          naam?: string
          slug?: string
          updated_at?: string
          volgorde?: number
          voorwaarden?: string | null
        }
        Relationships: []
      }
      abonnement_wijzigingen: {
        Row: {
          abonnement_id: string | null
          created_at: string
          details: Json | null
          id: string
          naar_plan_id: string | null
          partner_id: string
          type: string
          user_id: string | null
          van_plan_id: string | null
        }
        Insert: {
          abonnement_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          naar_plan_id?: string | null
          partner_id: string
          type: string
          user_id?: string | null
          van_plan_id?: string | null
        }
        Update: {
          abonnement_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          naar_plan_id?: string | null
          partner_id?: string
          type?: string
          user_id?: string | null
          van_plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "abonnement_wijzigingen_abonnement_id_fkey"
            columns: ["abonnement_id"]
            isOneToOne: false
            referencedRelation: "abonnementen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abonnement_wijzigingen_naar_plan_id_fkey"
            columns: ["naar_plan_id"]
            isOneToOne: false
            referencedRelation: "abonnement_plannen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abonnement_wijzigingen_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abonnement_wijzigingen_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abonnement_wijzigingen_van_plan_id_fkey"
            columns: ["van_plan_id"]
            isOneToOne: false
            referencedRelation: "abonnement_plannen"
            referencedColumns: ["id"]
          },
        ]
      }
      abonnementen: {
        Row: {
          affiliate_referral_id: string | null
          created_at: string
          gratis_maanden: number
          id: string
          interval: string
          korting_actief_tot: string | null
          korting_percentage: number | null
          korting_reden: string | null
          korting_vast_bedrag: number | null
          kortingscode_id: string | null
          maand_bedrag: number
          mandaat_vereist_voor: string | null
          mollie_status: string | null
          mollie_subscription_id: string | null
          notities: string | null
          opzeg_datum: string | null
          opzegtermijn_dagen: number
          partner_id: string
          plan: string
          plan_id: string | null
          start_datum: string
          status: string
          updated_at: string
          verloop_datum: string | null
          volgende_factuur_datum: string | null
        }
        Insert: {
          affiliate_referral_id?: string | null
          created_at?: string
          gratis_maanden?: number
          id?: string
          interval?: string
          korting_actief_tot?: string | null
          korting_percentage?: number | null
          korting_reden?: string | null
          korting_vast_bedrag?: number | null
          kortingscode_id?: string | null
          maand_bedrag?: number
          mandaat_vereist_voor?: string | null
          mollie_status?: string | null
          mollie_subscription_id?: string | null
          notities?: string | null
          opzeg_datum?: string | null
          opzegtermijn_dagen?: number
          partner_id: string
          plan?: string
          plan_id?: string | null
          start_datum?: string
          status?: string
          updated_at?: string
          verloop_datum?: string | null
          volgende_factuur_datum?: string | null
        }
        Update: {
          affiliate_referral_id?: string | null
          created_at?: string
          gratis_maanden?: number
          id?: string
          interval?: string
          korting_actief_tot?: string | null
          korting_percentage?: number | null
          korting_reden?: string | null
          korting_vast_bedrag?: number | null
          kortingscode_id?: string | null
          maand_bedrag?: number
          mandaat_vereist_voor?: string | null
          mollie_status?: string | null
          mollie_subscription_id?: string | null
          notities?: string | null
          opzeg_datum?: string | null
          opzegtermijn_dagen?: number
          partner_id?: string
          plan?: string
          plan_id?: string | null
          start_datum?: string
          status?: string
          updated_at?: string
          verloop_datum?: string | null
          volgende_factuur_datum?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "abonnementen_affiliate_referral_id_fkey"
            columns: ["affiliate_referral_id"]
            isOneToOne: false
            referencedRelation: "affiliate_referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abonnementen_kortingscode_id_fkey"
            columns: ["kortingscode_id"]
            isOneToOne: false
            referencedRelation: "kortingscodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abonnementen_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abonnementen_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abonnementen_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "abonnement_plannen"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_commissies: {
        Row: {
          abonnement_id: string | null
          affiliate_id: string
          bedrag: number
          created_at: string
          factuur_id: string | null
          id: string
          partner_id: string | null
          percentage: number
          status: string
          type: string
        }
        Insert: {
          abonnement_id?: string | null
          affiliate_id: string
          bedrag?: number
          created_at?: string
          factuur_id?: string | null
          id?: string
          partner_id?: string | null
          percentage?: number
          status?: string
          type?: string
        }
        Update: {
          abonnement_id?: string | null
          affiliate_id?: string
          bedrag?: number
          created_at?: string
          factuur_id?: string | null
          id?: string
          partner_id?: string | null
          percentage?: number
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissies_abonnement_id_fkey"
            columns: ["abonnement_id"]
            isOneToOne: false
            referencedRelation: "abonnementen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissies_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissies_factuur_id_fkey"
            columns: ["factuur_id"]
            isOneToOne: false
            referencedRelation: "facturen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissies_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissies_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_email_templates: {
        Row: {
          actie_default: string | null
          actief: boolean
          afzender_naam: string | null
          body_html: string
          created_at: string
          id: string
          onderwerp: string
          partner_id: string | null
          template_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actie_default?: string | null
          actief?: boolean
          afzender_naam?: string | null
          body_html: string
          created_at?: string
          id?: string
          onderwerp: string
          partner_id?: string | null
          template_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actie_default?: string | null
          actief?: boolean
          afzender_naam?: string | null
          body_html?: string
          created_at?: string
          id?: string
          onderwerp?: string
          partner_id?: string | null
          template_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_email_templates_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_email_templates_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_instellingen: {
        Row: {
          auto_rotatie_actief: boolean
          cookie_dagen: number
          id: string
          max_commissie_percentage: number
          max_korting_percentage: number
          max_korting_vast_bedrag: number
          min_abonnement_maanden: number
          standaard_commissie_percentage: number
          tier_commissies: Json
          updated_at: string
        }
        Insert: {
          auto_rotatie_actief?: boolean
          cookie_dagen?: number
          id?: string
          max_commissie_percentage?: number
          max_korting_percentage?: number
          max_korting_vast_bedrag?: number
          min_abonnement_maanden?: number
          standaard_commissie_percentage?: number
          tier_commissies?: Json
          updated_at?: string
        }
        Update: {
          auto_rotatie_actief?: boolean
          cookie_dagen?: number
          id?: string
          max_commissie_percentage?: number
          max_korting_percentage?: number
          max_korting_vast_bedrag?: number
          min_abonnement_maanden?: number
          standaard_commissie_percentage?: number
          tier_commissies?: Json
          updated_at?: string
        }
        Relationships: []
      }
      affiliate_lead_contactmomenten: {
        Row: {
          affiliate_id: string
          created_at: string
          duur_seconden: number | null
          id: string
          lead_id: string
          notitie: string | null
          type: Database["public"]["Enums"]["affiliate_contact_type"]
          uitkomst: string | null
          volgende_actie_datum: string | null
        }
        Insert: {
          affiliate_id: string
          created_at?: string
          duur_seconden?: number | null
          id?: string
          lead_id: string
          notitie?: string | null
          type?: Database["public"]["Enums"]["affiliate_contact_type"]
          uitkomst?: string | null
          volgende_actie_datum?: string | null
        }
        Update: {
          affiliate_id?: string
          created_at?: string
          duur_seconden?: number | null
          id?: string
          lead_id?: string
          notitie?: string | null
          type?: Database["public"]["Enums"]["affiliate_contact_type"]
          uitkomst?: string | null
          volgende_actie_datum?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_lead_contactmomenten_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_lead_contactmomenten_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "affiliate_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_lead_contactpersonen: {
        Row: {
          created_at: string
          created_by: string | null
          email: string | null
          functie: string | null
          id: string
          is_hoofdcontact: boolean
          lead_id: string
          linkedin_url: string | null
          naam: string
          notitie: string | null
          telefoon_kantoor: string | null
          telefoon_mobiel: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          functie?: string | null
          id?: string
          is_hoofdcontact?: boolean
          lead_id: string
          linkedin_url?: string | null
          naam: string
          notitie?: string | null
          telefoon_kantoor?: string | null
          telefoon_mobiel?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          functie?: string | null
          id?: string
          is_hoofdcontact?: boolean
          lead_id?: string
          linkedin_url?: string | null
          naam?: string
          notitie?: string | null
          telefoon_kantoor?: string | null
          telefoon_mobiel?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_lead_contactpersonen_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "affiliate_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_lead_imports: {
        Row: {
          afgekeurd: number
          bestandsnaam: string
          created_at: string
          created_by: string | null
          geimporteerd: number
          id: string
          kolom_mapping: Json | null
          totaal_rijen: number
          waarschuwingen: Json | null
        }
        Insert: {
          afgekeurd?: number
          bestandsnaam: string
          created_at?: string
          created_by?: string | null
          geimporteerd?: number
          id?: string
          kolom_mapping?: Json | null
          totaal_rijen?: number
          waarschuwingen?: Json | null
        }
        Update: {
          afgekeurd?: number
          bestandsnaam?: string
          created_at?: string
          created_by?: string | null
          geimporteerd?: number
          id?: string
          kolom_mapping?: Json | null
          totaal_rijen?: number
          waarschuwingen?: Json | null
        }
        Relationships: []
      }
      affiliate_leads: {
        Row: {
          aantal_medewerkers: number | null
          adres: string | null
          ai_bedrijf_kansen: Json | null
          ai_bedrijf_samenvatting: string | null
          ai_bedrijf_samenvatting_op: string | null
          ai_score: number | null
          ai_score_reden: string | null
          ai_volgende_actie: string | null
          ai_volgende_actie_op: string | null
          bedrijfsnaam: string
          beslissingscriteria: string | null
          branche: string | null
          bron: Database["public"]["Enums"]["affiliate_lead_bron"]
          bron_id: string | null
          btw_nummer: string | null
          claimed_at: string | null
          concurrenten: string | null
          contactpersoon: string | null
          created_at: string
          created_by: string | null
          doorgezet_op: string | null
          eigenaar_id: string | null
          email: string | null
          facebook_url: string | null
          fase_slug: string
          geschatte_waarde: number | null
          gewonnen_partner_id: string | null
          huidige_leverancier: string | null
          id: string
          import_batch_id: string | null
          in_pipeline: boolean
          instagram_url: string | null
          jaaromzet: number | null
          kvk_nummer: string | null
          laatst_bekeken_op: string | null
          laatst_gescoord_op: string | null
          lead_score_basis: number | null
          lead_score_basis_details: Json | null
          linkedin_url: string | null
          notities: string | null
          oprichtingsjaar: number | null
          plaats: string | null
          postcode: string | null
          regio: string | null
          review_bucket:
            | Database["public"]["Enums"]["affiliate_lost_review_bucket"]
            | null
          review_door_id: string | null
          review_notitie: string | null
          review_op: string | null
          risico_bijgewerkt_op: string | null
          risico_next_step: string | null
          risico_reden: string | null
          risico_score: string | null
          sales_fase: Database["public"]["Enums"]["sales_fase"] | null
          stale_gemeld_op: string | null
          status: Database["public"]["Enums"]["affiliate_lead_status"]
          tags: string[]
          telefoon: string | null
          temperatuur: Database["public"]["Enums"]["lead_temperatuur"]
          terug_in_pipeline_op: string | null
          toegewezen_door_admin_id: string | null
          updated_at: string
          verloren_categorie:
            | Database["public"]["Enums"]["affiliate_verloren_categorie"]
            | null
          verloren_op: string | null
          verloren_reden: string | null
          volgende_actie_datum: string | null
          volgende_actie_op: string | null
          website: string | null
          winning_play_bijgewerkt_op: string | null
          winning_play_hoogtepunten: Json | null
          winning_play_samenvatting: string | null
        }
        Insert: {
          aantal_medewerkers?: number | null
          adres?: string | null
          ai_bedrijf_kansen?: Json | null
          ai_bedrijf_samenvatting?: string | null
          ai_bedrijf_samenvatting_op?: string | null
          ai_score?: number | null
          ai_score_reden?: string | null
          ai_volgende_actie?: string | null
          ai_volgende_actie_op?: string | null
          bedrijfsnaam: string
          beslissingscriteria?: string | null
          branche?: string | null
          bron?: Database["public"]["Enums"]["affiliate_lead_bron"]
          bron_id?: string | null
          btw_nummer?: string | null
          claimed_at?: string | null
          concurrenten?: string | null
          contactpersoon?: string | null
          created_at?: string
          created_by?: string | null
          doorgezet_op?: string | null
          eigenaar_id?: string | null
          email?: string | null
          facebook_url?: string | null
          fase_slug?: string
          geschatte_waarde?: number | null
          gewonnen_partner_id?: string | null
          huidige_leverancier?: string | null
          id?: string
          import_batch_id?: string | null
          in_pipeline?: boolean
          instagram_url?: string | null
          jaaromzet?: number | null
          kvk_nummer?: string | null
          laatst_bekeken_op?: string | null
          laatst_gescoord_op?: string | null
          lead_score_basis?: number | null
          lead_score_basis_details?: Json | null
          linkedin_url?: string | null
          notities?: string | null
          oprichtingsjaar?: number | null
          plaats?: string | null
          postcode?: string | null
          regio?: string | null
          review_bucket?:
            | Database["public"]["Enums"]["affiliate_lost_review_bucket"]
            | null
          review_door_id?: string | null
          review_notitie?: string | null
          review_op?: string | null
          risico_bijgewerkt_op?: string | null
          risico_next_step?: string | null
          risico_reden?: string | null
          risico_score?: string | null
          sales_fase?: Database["public"]["Enums"]["sales_fase"] | null
          stale_gemeld_op?: string | null
          status?: Database["public"]["Enums"]["affiliate_lead_status"]
          tags?: string[]
          telefoon?: string | null
          temperatuur?: Database["public"]["Enums"]["lead_temperatuur"]
          terug_in_pipeline_op?: string | null
          toegewezen_door_admin_id?: string | null
          updated_at?: string
          verloren_categorie?:
            | Database["public"]["Enums"]["affiliate_verloren_categorie"]
            | null
          verloren_op?: string | null
          verloren_reden?: string | null
          volgende_actie_datum?: string | null
          volgende_actie_op?: string | null
          website?: string | null
          winning_play_bijgewerkt_op?: string | null
          winning_play_hoogtepunten?: Json | null
          winning_play_samenvatting?: string | null
        }
        Update: {
          aantal_medewerkers?: number | null
          adres?: string | null
          ai_bedrijf_kansen?: Json | null
          ai_bedrijf_samenvatting?: string | null
          ai_bedrijf_samenvatting_op?: string | null
          ai_score?: number | null
          ai_score_reden?: string | null
          ai_volgende_actie?: string | null
          ai_volgende_actie_op?: string | null
          bedrijfsnaam?: string
          beslissingscriteria?: string | null
          branche?: string | null
          bron?: Database["public"]["Enums"]["affiliate_lead_bron"]
          bron_id?: string | null
          btw_nummer?: string | null
          claimed_at?: string | null
          concurrenten?: string | null
          contactpersoon?: string | null
          created_at?: string
          created_by?: string | null
          doorgezet_op?: string | null
          eigenaar_id?: string | null
          email?: string | null
          facebook_url?: string | null
          fase_slug?: string
          geschatte_waarde?: number | null
          gewonnen_partner_id?: string | null
          huidige_leverancier?: string | null
          id?: string
          import_batch_id?: string | null
          in_pipeline?: boolean
          instagram_url?: string | null
          jaaromzet?: number | null
          kvk_nummer?: string | null
          laatst_bekeken_op?: string | null
          laatst_gescoord_op?: string | null
          lead_score_basis?: number | null
          lead_score_basis_details?: Json | null
          linkedin_url?: string | null
          notities?: string | null
          oprichtingsjaar?: number | null
          plaats?: string | null
          postcode?: string | null
          regio?: string | null
          review_bucket?:
            | Database["public"]["Enums"]["affiliate_lost_review_bucket"]
            | null
          review_door_id?: string | null
          review_notitie?: string | null
          review_op?: string | null
          risico_bijgewerkt_op?: string | null
          risico_next_step?: string | null
          risico_reden?: string | null
          risico_score?: string | null
          sales_fase?: Database["public"]["Enums"]["sales_fase"] | null
          stale_gemeld_op?: string | null
          status?: Database["public"]["Enums"]["affiliate_lead_status"]
          tags?: string[]
          telefoon?: string | null
          temperatuur?: Database["public"]["Enums"]["lead_temperatuur"]
          terug_in_pipeline_op?: string | null
          toegewezen_door_admin_id?: string | null
          updated_at?: string
          verloren_categorie?:
            | Database["public"]["Enums"]["affiliate_verloren_categorie"]
            | null
          verloren_op?: string | null
          verloren_reden?: string | null
          volgende_actie_datum?: string | null
          volgende_actie_op?: string | null
          website?: string | null
          winning_play_bijgewerkt_op?: string | null
          winning_play_hoogtepunten?: Json | null
          winning_play_samenvatting?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_leads_bron_id_fkey"
            columns: ["bron_id"]
            isOneToOne: false
            referencedRelation: "lead_bronnen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_leads_eigenaar_id_fkey"
            columns: ["eigenaar_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_leads_gewonnen_partner_id_fkey"
            columns: ["gewonnen_partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_leads_gewonnen_partner_id_fkey"
            columns: ["gewonnen_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_links: {
        Row: {
          actief: boolean
          clicks: number
          code: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          actief?: boolean
          clicks?: number
          code: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          actief?: boolean
          clicks?: number
          code?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_notificatie_voorkeuren: {
        Row: {
          browser: boolean
          categorie: string
          created_at: string
          email: boolean
          id: string
          in_app: boolean
          stiltijd_tot: string | null
          stiltijd_van: string | null
          temperaturen: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          browser?: boolean
          categorie: string
          created_at?: string
          email?: boolean
          id?: string
          in_app?: boolean
          stiltijd_tot?: string | null
          stiltijd_van?: string | null
          temperaturen?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          browser?: boolean
          categorie?: string
          created_at?: string
          email?: boolean
          id?: string
          in_app?: boolean
          stiltijd_tot?: string | null
          stiltijd_van?: string | null
          temperaturen?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      affiliate_onboarding_taken: {
        Row: {
          affiliate_id: string
          created_at: string
          id: string
          label: string
          taak_key: string
          updated_at: string
          volgorde: number
          voltooid_op: string | null
        }
        Insert: {
          affiliate_id: string
          created_at?: string
          id?: string
          label: string
          taak_key: string
          updated_at?: string
          volgorde?: number
          voltooid_op?: string | null
        }
        Update: {
          affiliate_id?: string
          created_at?: string
          id?: string
          label?: string
          taak_key?: string
          updated_at?: string
          volgorde?: number
          voltooid_op?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_onboarding_taken_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_opvolg_log: {
        Row: {
          actie: string
          affiliate_id: string
          bron: string
          created_at: string
          details: Json
          id: string
          lead_id: string
          taak_id: string | null
          titel: string
        }
        Insert: {
          actie: string
          affiliate_id: string
          bron?: string
          created_at?: string
          details?: Json
          id?: string
          lead_id: string
          taak_id?: string | null
          titel: string
        }
        Update: {
          actie?: string
          affiliate_id?: string
          bron?: string
          created_at?: string
          details?: Json
          id?: string
          lead_id?: string
          taak_id?: string | null
          titel?: string
        }
        Relationships: []
      }
      affiliate_opvolg_regels: {
        Row: {
          aantal_herinneringen: number
          actief: boolean
          affiliate_id: string
          ai_herbereken_na_uren: number
          created_at: string
          escalatie_na_uren: number
          escalatie_toegestaan: boolean
          herinnering_termijnen_uren: number[]
          id: string
          lead_type: string
          notitie: string | null
          updated_at: string
        }
        Insert: {
          aantal_herinneringen?: number
          actief?: boolean
          affiliate_id: string
          ai_herbereken_na_uren?: number
          created_at?: string
          escalatie_na_uren?: number
          escalatie_toegestaan?: boolean
          herinnering_termijnen_uren?: number[]
          id?: string
          lead_type: string
          notitie?: string | null
          updated_at?: string
        }
        Update: {
          aantal_herinneringen?: number
          actief?: boolean
          affiliate_id?: string
          ai_herbereken_na_uren?: number
          created_at?: string
          escalatie_na_uren?: number
          escalatie_toegestaan?: boolean
          herinnering_termijnen_uren?: number[]
          id?: string
          lead_type?: string
          notitie?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      affiliate_opvolg_taken: {
        Row: {
          affiliate_id: string
          bron: string
          created_at: string
          due_op: string
          escalatie_verstuurd_op: string | null
          herinnering_verstuurd_op: string | null
          id: string
          lead_id: string | null
          notitie: string | null
          prioriteit: string
          titel: string
          type: string
          updated_at: string
          voltooid_op: string | null
        }
        Insert: {
          affiliate_id: string
          bron?: string
          created_at?: string
          due_op: string
          escalatie_verstuurd_op?: string | null
          herinnering_verstuurd_op?: string | null
          id?: string
          lead_id?: string | null
          notitie?: string | null
          prioriteit?: string
          titel: string
          type?: string
          updated_at?: string
          voltooid_op?: string | null
        }
        Update: {
          affiliate_id?: string
          bron?: string
          created_at?: string
          due_op?: string
          escalatie_verstuurd_op?: string | null
          herinnering_verstuurd_op?: string | null
          id?: string
          lead_id?: string | null
          notitie?: string | null
          prioriteit?: string
          titel?: string
          type?: string
          updated_at?: string
          voltooid_op?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_opvolg_taken_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_opvolg_taken_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "affiliate_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_pipeline_config: {
        Row: {
          created_at: string
          id: string
          is_systeem: boolean
          kleur: string
          label: string
          partner_id: string
          status_key: string
          updated_at: string
          volgorde: number
          zichtbaar: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          is_systeem?: boolean
          kleur?: string
          label: string
          partner_id: string
          status_key: string
          updated_at?: string
          volgorde?: number
          zichtbaar?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          is_systeem?: boolean
          kleur?: string
          label?: string
          partner_id?: string
          status_key?: string
          updated_at?: string
          volgorde?: number
          zichtbaar?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_pipeline_config_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_pipeline_config_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_referrals: {
        Row: {
          affiliate_id: string
          affiliate_link_id: string | null
          commissie_percentage: number
          commissie_verdiend: number
          created_at: string
          id: string
          kortingscode_id: string | null
          partner_id: string | null
          status: string
          trial_check_uitgevoerd_op: string | null
          trial_laatste_herinnering_op: string | null
        }
        Insert: {
          affiliate_id: string
          affiliate_link_id?: string | null
          commissie_percentage?: number
          commissie_verdiend?: number
          created_at?: string
          id?: string
          kortingscode_id?: string | null
          partner_id?: string | null
          status?: string
          trial_check_uitgevoerd_op?: string | null
          trial_laatste_herinnering_op?: string | null
        }
        Update: {
          affiliate_id?: string
          affiliate_link_id?: string | null
          commissie_percentage?: number
          commissie_verdiend?: number
          created_at?: string
          id?: string
          kortingscode_id?: string | null
          partner_id?: string | null
          status?: string
          trial_check_uitgevoerd_op?: string | null
          trial_laatste_herinnering_op?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_referrals_affiliate_link_id_fkey"
            columns: ["affiliate_link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_referrals_kortingscode_id_fkey"
            columns: ["kortingscode_id"]
            isOneToOne: false
            referencedRelation: "kortingscodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_referrals_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_referrals_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_targets: {
        Row: {
          affiliate_id: string
          created_at: string
          id: string
          jaar: number
          maand: number
          target_klanten: number
          target_omzet: number
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          created_at?: string
          id?: string
          jaar: number
          maand: number
          target_klanten?: number
          target_omzet?: number
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          created_at?: string
          id?: string
          jaar?: number
          maand?: number
          target_klanten?: number
          target_omzet?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_targets_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_terugbel_afspraken: {
        Row: {
          affiliate_id: string
          afgehandeld_op: string | null
          collega_user_id: string | null
          created_at: string
          geplande_op: string
          id: string
          lead_id: string
          noshow: boolean
          noshow_gemeld_op: string | null
          notitie: string | null
          reminder_1u_actief: boolean
          reminder_1u_gepland_op: string | null
          reminder_1u_op: string | null
          reminder_24u_actief: boolean
          reminder_24u_gepland_op: string | null
          reminder_24u_op: string | null
          type: string
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          afgehandeld_op?: string | null
          collega_user_id?: string | null
          created_at?: string
          geplande_op: string
          id?: string
          lead_id: string
          noshow?: boolean
          noshow_gemeld_op?: string | null
          notitie?: string | null
          reminder_1u_actief?: boolean
          reminder_1u_gepland_op?: string | null
          reminder_1u_op?: string | null
          reminder_24u_actief?: boolean
          reminder_24u_gepland_op?: string | null
          reminder_24u_op?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          afgehandeld_op?: string | null
          collega_user_id?: string | null
          created_at?: string
          geplande_op?: string
          id?: string
          lead_id?: string
          noshow?: boolean
          noshow_gemeld_op?: string | null
          notitie?: string | null
          reminder_1u_actief?: boolean
          reminder_1u_gepland_op?: string | null
          reminder_1u_op?: string | null
          reminder_24u_actief?: boolean
          reminder_24u_gepland_op?: string | null
          reminder_24u_op?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_terugbel_afspraken_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_terugbel_afspraken_collega_user_id_fkey"
            columns: ["collega_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_terugbel_afspraken_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "affiliate_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      afspraken: {
        Row: {
          adviseur_id: string | null
          created_at: string
          datum: string
          eind_tijd: string | null
          id: string
          klant_id: string | null
          lead_id: string | null
          locatie: string | null
          notities: string | null
          partner_id: string
          start_tijd: string | null
          status: string
          titel: string
          type: string
          updated_at: string
        }
        Insert: {
          adviseur_id?: string | null
          created_at?: string
          datum: string
          eind_tijd?: string | null
          id?: string
          klant_id?: string | null
          lead_id?: string | null
          locatie?: string | null
          notities?: string | null
          partner_id: string
          start_tijd?: string | null
          status?: string
          titel: string
          type?: string
          updated_at?: string
        }
        Update: {
          adviseur_id?: string | null
          created_at?: string
          datum?: string
          eind_tijd?: string | null
          id?: string
          klant_id?: string | null
          lead_id?: string | null
          locatie?: string | null
          notities?: string | null
          partner_id?: string
          start_tijd?: string | null
          status?: string
          titel?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "afspraken_adviseur_id_fkey"
            columns: ["adviseur_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "afspraken_klant_id_fkey"
            columns: ["klant_id"]
            isOneToOne: false
            referencedRelation: "klanten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "afspraken_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "afspraken_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "afspraken_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_delegaties: {
        Row: {
          actief: boolean
          created_at: string
          gever_user_id: string
          id: string
          notitie: string | null
          ontvanger_user_id: string
          partner_id: string
          scope: string
          updated_at: string
        }
        Insert: {
          actief?: boolean
          created_at?: string
          gever_user_id: string
          id?: string
          notitie?: string | null
          ontvanger_user_id: string
          partner_id: string
          scope: string
          updated_at?: string
        }
        Update: {
          actief?: boolean
          created_at?: string
          gever_user_id?: string
          id?: string
          notitie?: string | null
          ontvanger_user_id?: string
          partner_id?: string
          scope?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_template_feedback: {
        Row: {
          created_at: string
          feedback: string
          generatie_id: string | null
          id: string
          sentiment: string | null
          user_id: string
          verwerkt_in_profiel: boolean
        }
        Insert: {
          created_at?: string
          feedback: string
          generatie_id?: string | null
          id?: string
          sentiment?: string | null
          user_id: string
          verwerkt_in_profiel?: boolean
        }
        Update: {
          created_at?: string
          feedback?: string
          generatie_id?: string | null
          id?: string
          sentiment?: string | null
          user_id?: string
          verwerkt_in_profiel?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ai_template_feedback_generatie_id_fkey"
            columns: ["generatie_id"]
            isOneToOne: false
            referencedRelation: "ai_template_generaties"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_template_generaties: {
        Row: {
          bron: string
          created_at: string
          finale_body: string | null
          finale_onderwerp: string | null
          id: string
          input_body: string | null
          input_onderwerp: string | null
          instellingen: Json
          mode: string
          output_body: string | null
          output_onderwerp: string | null
          output_uitleg: string | null
          status: string
          template_key: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bron: string
          created_at?: string
          finale_body?: string | null
          finale_onderwerp?: string | null
          id?: string
          input_body?: string | null
          input_onderwerp?: string | null
          instellingen?: Json
          mode?: string
          output_body?: string | null
          output_onderwerp?: string | null
          output_uitleg?: string | null
          status?: string
          template_key?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bron?: string
          created_at?: string
          finale_body?: string | null
          finale_onderwerp?: string | null
          id?: string
          input_body?: string | null
          input_onderwerp?: string | null
          instellingen?: Json
          mode?: string
          output_body?: string | null
          output_onderwerp?: string | null
          output_uitleg?: string | null
          status?: string
          template_key?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_template_schrijfstijl: {
        Row: {
          created_at: string
          generaties_sinds_consolidatie: number
          laatst_geconsolideerd_at: string | null
          profiel_samenvatting: string | null
          updated_at: string
          user_id: string
          voorkeuren: Json
        }
        Insert: {
          created_at?: string
          generaties_sinds_consolidatie?: number
          laatst_geconsolideerd_at?: string | null
          profiel_samenvatting?: string | null
          updated_at?: string
          user_id: string
          voorkeuren?: Json
        }
        Update: {
          created_at?: string
          generaties_sinds_consolidatie?: number
          laatst_geconsolideerd_at?: string | null
          profiel_samenvatting?: string | null
          updated_at?: string
          user_id?: string
          voorkeuren?: Json
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          actie: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip: unknown
          nieuwe_waarde: Json | null
          oude_waarde: Json | null
          partner_id: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          actie: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip?: unknown
          nieuwe_waarde?: Json | null
          oude_waarde?: Json | null
          partner_id?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          actie?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip?: unknown
          nieuwe_waarde?: Json | null
          oude_waarde?: Json | null
          partner_id?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      consumenten: {
        Row: {
          achternaam: string | null
          adres: string | null
          created_at: string
          email: string | null
          id: string
          partner_id: string
          plaats: string | null
          postcode: string | null
          telefoon: string | null
          updated_at: string
          user_id: string | null
          voornaam: string | null
        }
        Insert: {
          achternaam?: string | null
          adres?: string | null
          created_at?: string
          email?: string | null
          id?: string
          partner_id: string
          plaats?: string | null
          postcode?: string | null
          telefoon?: string | null
          updated_at?: string
          user_id?: string | null
          voornaam?: string | null
        }
        Update: {
          achternaam?: string | null
          adres?: string | null
          created_at?: string
          email?: string | null
          id?: string
          partner_id?: string
          plaats?: string | null
          postcode?: string | null
          telefoon?: string | null
          updated_at?: string
          user_id?: string | null
          voornaam?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consumenten_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumenten_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumenten_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contactpersonen: {
        Row: {
          achternaam: string | null
          created_at: string
          created_by: string | null
          email: string | null
          functie: string | null
          id: string
          is_hoofdcontact: boolean
          klant_id: string | null
          lead_id: string | null
          mobiel: string | null
          notitie: string | null
          partner_id: string
          telefoon: string | null
          updated_at: string
          voornaam: string
        }
        Insert: {
          achternaam?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          functie?: string | null
          id?: string
          is_hoofdcontact?: boolean
          klant_id?: string | null
          lead_id?: string | null
          mobiel?: string | null
          notitie?: string | null
          partner_id: string
          telefoon?: string | null
          updated_at?: string
          voornaam: string
        }
        Update: {
          achternaam?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          functie?: string | null
          id?: string
          is_hoofdcontact?: boolean
          klant_id?: string | null
          lead_id?: string | null
          mobiel?: string | null
          notitie?: string | null
          partner_id?: string
          telefoon?: string | null
          updated_at?: string
          voornaam?: string
        }
        Relationships: [
          {
            foreignKeyName: "contactpersonen_klant_id_fkey"
            columns: ["klant_id"]
            isOneToOne: false
            referencedRelation: "klanten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contactpersonen_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      daklayouts: {
        Row: {
          aantal_panelen: number
          adres: string | null
          created_at: string
          dakvlakken: Json
          gebruiker_id: string | null
          id: string
          lat: number | null
          lead_id: string | null
          lng: number | null
          naam: string
          notities: string | null
          paneel_breedte_mm: number | null
          paneel_lengte_mm: number | null
          paneel_wp: number | null
          panelen: Json
          partner_id: string
          plaats: string | null
          postcode: string | null
          product_id: string | null
          schouw_id: string | null
          snapshot_url: string | null
          totaal_wp: number
          updated_at: string
        }
        Insert: {
          aantal_panelen?: number
          adres?: string | null
          created_at?: string
          dakvlakken?: Json
          gebruiker_id?: string | null
          id?: string
          lat?: number | null
          lead_id?: string | null
          lng?: number | null
          naam?: string
          notities?: string | null
          paneel_breedte_mm?: number | null
          paneel_lengte_mm?: number | null
          paneel_wp?: number | null
          panelen?: Json
          partner_id: string
          plaats?: string | null
          postcode?: string | null
          product_id?: string | null
          schouw_id?: string | null
          snapshot_url?: string | null
          totaal_wp?: number
          updated_at?: string
        }
        Update: {
          aantal_panelen?: number
          adres?: string | null
          created_at?: string
          dakvlakken?: Json
          gebruiker_id?: string | null
          id?: string
          lat?: number | null
          lead_id?: string | null
          lng?: number | null
          naam?: string
          notities?: string | null
          paneel_breedte_mm?: number | null
          paneel_lengte_mm?: number | null
          paneel_wp?: number | null
          panelen?: Json
          partner_id?: string
          plaats?: string | null
          postcode?: string | null
          product_id?: string | null
          schouw_id?: string | null
          snapshot_url?: string | null
          totaal_wp?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daklayouts_gebruiker_id_fkey"
            columns: ["gebruiker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daklayouts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daklayouts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daklayouts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daklayouts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "producten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daklayouts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "producten_publiek"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daklayouts_schouw_id_fkey"
            columns: ["schouw_id"]
            isOneToOne: false
            referencedRelation: "schouwen"
            referencedColumns: ["id"]
          },
        ]
      }
      documenten: {
        Row: {
          beschrijving: string | null
          bestand_grootte: number | null
          bestand_url: string
          consument_id: string | null
          created_at: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["document_entity_type"]
          geupload_door_id: string
          id: string
          mime_type: string | null
          naam: string
          partner_id: string
          tags: Json | null
          type: Database["public"]["Enums"]["document_type"]
          updated_at: string
          volgorde: number
        }
        Insert: {
          beschrijving?: string | null
          bestand_grootte?: number | null
          bestand_url: string
          consument_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["document_entity_type"]
          geupload_door_id: string
          id?: string
          mime_type?: string | null
          naam: string
          partner_id: string
          tags?: Json | null
          type?: Database["public"]["Enums"]["document_type"]
          updated_at?: string
          volgorde?: number
        }
        Update: {
          beschrijving?: string | null
          bestand_grootte?: number | null
          bestand_url?: string
          consument_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["document_entity_type"]
          geupload_door_id?: string
          id?: string
          mime_type?: string | null
          naam?: string
          partner_id?: string
          tags?: Json | null
          type?: Database["public"]["Enums"]["document_type"]
          updated_at?: string
          volgorde?: number
        }
        Relationships: [
          {
            foreignKeyName: "documenten_consument_id_fkey"
            columns: ["consument_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documenten_geupload_door_id_fkey"
            columns: ["geupload_door_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documenten_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documenten_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      email_accounts: {
        Row: {
          access_token: string | null
          actief: boolean
          app_password_encrypted: string | null
          auth_method: string
          created_at: string
          email_adres: string
          id: string
          imap_host: string | null
          imap_last_uid: number | null
          imap_port: number | null
          is_default_voor_partner: boolean | null
          last_send_error: string | null
          last_send_error_at: string | null
          last_send_method: string | null
          last_sync_at: string | null
          last_sync_error: string | null
          last_sync_error_at: string | null
          needs_reauth: boolean
          partner_id: string | null
          provider: string
          refresh_token: string | null
          scopes: string[] | null
          smtp_host: string | null
          smtp_port: number | null
          sync_cursor: string | null
          token_expiry: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          actief?: boolean
          app_password_encrypted?: string | null
          auth_method?: string
          created_at?: string
          email_adres: string
          id?: string
          imap_host?: string | null
          imap_last_uid?: number | null
          imap_port?: number | null
          is_default_voor_partner?: boolean | null
          last_send_error?: string | null
          last_send_error_at?: string | null
          last_send_method?: string | null
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_error_at?: string | null
          needs_reauth?: boolean
          partner_id?: string | null
          provider: string
          refresh_token?: string | null
          scopes?: string[] | null
          smtp_host?: string | null
          smtp_port?: number | null
          sync_cursor?: string | null
          token_expiry?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          actief?: boolean
          app_password_encrypted?: string | null
          auth_method?: string
          created_at?: string
          email_adres?: string
          id?: string
          imap_host?: string | null
          imap_last_uid?: number | null
          imap_port?: number | null
          is_default_voor_partner?: boolean | null
          last_send_error?: string | null
          last_send_error_at?: string | null
          last_send_method?: string | null
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_error_at?: string | null
          needs_reauth?: boolean
          partner_id?: string | null
          provider?: string
          refresh_token?: string | null
          scopes?: string[] | null
          smtp_host?: string | null
          smtp_port?: number | null
          sync_cursor?: string | null
          token_expiry?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_accounts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_accounts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      email_berichten: {
        Row: {
          aan: string
          affiliate_lead_id: string | null
          bijlagen: Json | null
          body_html: string | null
          body_text: string | null
          bron_method: string | null
          created_at: string
          datum: string
          document_type: string | null
          email_account_id: string
          id: string
          is_gelezen: boolean
          klant_id: string | null
          labels: string[] | null
          lead_id: string | null
          offerte_id: string | null
          onderwerp: string
          partner_id: string | null
          provider_message_id: string | null
          richting: string
          thread_id: string | null
          user_id: string | null
          van: string
          via_account_id: string | null
        }
        Insert: {
          aan: string
          affiliate_lead_id?: string | null
          bijlagen?: Json | null
          body_html?: string | null
          body_text?: string | null
          bron_method?: string | null
          created_at?: string
          datum?: string
          document_type?: string | null
          email_account_id: string
          id?: string
          is_gelezen?: boolean
          klant_id?: string | null
          labels?: string[] | null
          lead_id?: string | null
          offerte_id?: string | null
          onderwerp?: string
          partner_id?: string | null
          provider_message_id?: string | null
          richting: string
          thread_id?: string | null
          user_id?: string | null
          van: string
          via_account_id?: string | null
        }
        Update: {
          aan?: string
          affiliate_lead_id?: string | null
          bijlagen?: Json | null
          body_html?: string | null
          body_text?: string | null
          bron_method?: string | null
          created_at?: string
          datum?: string
          document_type?: string | null
          email_account_id?: string
          id?: string
          is_gelezen?: boolean
          klant_id?: string | null
          labels?: string[] | null
          lead_id?: string | null
          offerte_id?: string | null
          onderwerp?: string
          partner_id?: string | null
          provider_message_id?: string | null
          richting?: string
          thread_id?: string | null
          user_id?: string | null
          van?: string
          via_account_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_berichten_affiliate_lead_id_fkey"
            columns: ["affiliate_lead_id"]
            isOneToOne: false
            referencedRelation: "affiliate_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_berichten_email_account_id_fkey"
            columns: ["email_account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_berichten_klant_id_fkey"
            columns: ["klant_id"]
            isOneToOne: false
            referencedRelation: "klanten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_berichten_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_berichten_offerte_id_fkey"
            columns: ["offerte_id"]
            isOneToOne: false
            referencedRelation: "offertes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_berichten_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_berichten_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_berichten_via_account_id_fkey"
            columns: ["via_account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      email_log: {
        Row: {
          created_at: string
          error_message: string | null
          html_body: string | null
          id: string
          imap_saved: boolean | null
          offerte_id: string | null
          onderwerp: string
          ontvanger_email: string
          partner_id: string
          status: string
          type: string
          verzonden_door_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          html_body?: string | null
          id?: string
          imap_saved?: boolean | null
          offerte_id?: string | null
          onderwerp: string
          ontvanger_email: string
          partner_id: string
          status?: string
          type?: string
          verzonden_door_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          html_body?: string | null
          id?: string
          imap_saved?: boolean | null
          offerte_id?: string | null
          onderwerp?: string
          ontvanger_email?: string
          partner_id?: string
          status?: string
          type?: string
          verzonden_door_id?: string | null
        }
        Relationships: []
      }
      email_oauth_attempts: {
        Row: {
          alias_error: string | null
          alias_request: string | null
          alias_status: string | null
          created_at: string
          email_adres_resultaat: string | null
          error_code: string | null
          error_message: string | null
          id: string
          partner_id: string | null
          provider: string
          status: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          alias_error?: string | null
          alias_request?: string | null
          alias_status?: string | null
          created_at?: string
          email_adres_resultaat?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          partner_id?: string | null
          provider: string
          status?: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          alias_error?: string | null
          alias_request?: string | null
          alias_status?: string | null
          created_at?: string
          email_adres_resultaat?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          partner_id?: string | null
          provider?: string
          status?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_routing_config: {
        Row: {
          bron: string
          document_type: string
          email_account_id: string | null
          partner_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          bron?: string
          document_type: string
          email_account_id?: string | null
          partner_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          bron?: string
          document_type?: string
          email_account_id?: string | null
          partner_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_routing_config_email_account_id_fkey"
            columns: ["email_account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_routing_config_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_routing_config_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          bijlage_default: boolean
          created_at: string
          html_body: string
          id: string
          naam: string
          onderwerp: string
          partner_id: string
          sleutel: string | null
          standaard: boolean | null
          type: string
          updated_at: string
        }
        Insert: {
          bijlage_default?: boolean
          created_at?: string
          html_body: string
          id?: string
          naam: string
          onderwerp: string
          partner_id: string
          sleutel?: string | null
          standaard?: boolean | null
          type?: string
          updated_at?: string
        }
        Update: {
          bijlage_default?: boolean
          created_at?: string
          html_body?: string
          id?: string
          naam?: string
          onderwerp?: string
          partner_id?: string
          sleutel?: string | null
          standaard?: boolean | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      entiteit_historie: {
        Row: {
          actie: string
          actor_id: string | null
          actor_naam: string | null
          actor_rol: string | null
          created_at: string
          details: Json | null
          entiteit_id: string
          entiteit_type: string
          id: string
          ip: unknown
          nieuwe_waarde: string | null
          oude_waarde: string | null
          partner_id: string | null
          user_agent: string | null
          veld: string | null
        }
        Insert: {
          actie: string
          actor_id?: string | null
          actor_naam?: string | null
          actor_rol?: string | null
          created_at?: string
          details?: Json | null
          entiteit_id: string
          entiteit_type: string
          id?: string
          ip?: unknown
          nieuwe_waarde?: string | null
          oude_waarde?: string | null
          partner_id?: string | null
          user_agent?: string | null
          veld?: string | null
        }
        Update: {
          actie?: string
          actor_id?: string | null
          actor_naam?: string | null
          actor_rol?: string | null
          created_at?: string
          details?: Json | null
          entiteit_id?: string
          entiteit_type?: string
          id?: string
          ip?: unknown
          nieuwe_waarde?: string | null
          oude_waarde?: string | null
          partner_id?: string | null
          user_agent?: string | null
          veld?: string | null
        }
        Relationships: []
      }
      facturen: {
        Row: {
          abonnement_id: string | null
          bedrag_excl_btw: number
          betaald_op: string | null
          betaald_via: string | null
          btw_bedrag: number
          created_at: string
          factuurnummer: string
          id: string
          korting_bedrag: number
          mollie_checkout_url: string | null
          mollie_payment_id: string | null
          mollie_payment_status: string | null
          notities: string | null
          partner_id: string
          pdf_url: string | null
          periode_eind: string
          periode_start: string
          status: string
          totaal_bedrag: number
        }
        Insert: {
          abonnement_id?: string | null
          bedrag_excl_btw?: number
          betaald_op?: string | null
          betaald_via?: string | null
          btw_bedrag?: number
          created_at?: string
          factuurnummer: string
          id?: string
          korting_bedrag?: number
          mollie_checkout_url?: string | null
          mollie_payment_id?: string | null
          mollie_payment_status?: string | null
          notities?: string | null
          partner_id: string
          pdf_url?: string | null
          periode_eind: string
          periode_start: string
          status?: string
          totaal_bedrag?: number
        }
        Update: {
          abonnement_id?: string | null
          bedrag_excl_btw?: number
          betaald_op?: string | null
          betaald_via?: string | null
          btw_bedrag?: number
          created_at?: string
          factuurnummer?: string
          id?: string
          korting_bedrag?: number
          mollie_checkout_url?: string | null
          mollie_payment_id?: string | null
          mollie_payment_status?: string | null
          notities?: string | null
          partner_id?: string
          pdf_url?: string | null
          periode_eind?: string
          periode_start?: string
          status?: string
          totaal_bedrag?: number
        }
        Relationships: [
          {
            foreignKeyName: "facturen_abonnement_id_fkey"
            columns: ["abonnement_id"]
            isOneToOne: false
            referencedRelation: "abonnementen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturen_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturen_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      factuur_historie: {
        Row: {
          actie: string
          actor_id: string | null
          created_at: string
          financieel_document_id: string
          id: string
          metadata: Json | null
          nieuwe_waarde: string | null
          notitie: string | null
          oude_waarde: string | null
          partner_id: string
          veld: string | null
        }
        Insert: {
          actie: string
          actor_id?: string | null
          created_at?: string
          financieel_document_id: string
          id?: string
          metadata?: Json | null
          nieuwe_waarde?: string | null
          notitie?: string | null
          oude_waarde?: string | null
          partner_id: string
          veld?: string | null
        }
        Update: {
          actie?: string
          actor_id?: string | null
          created_at?: string
          financieel_document_id?: string
          id?: string
          metadata?: Json | null
          nieuwe_waarde?: string | null
          notitie?: string | null
          oude_waarde?: string | null
          partner_id?: string
          veld?: string | null
        }
        Relationships: []
      }
      feedback_notificatie_voorkeuren: {
        Row: {
          created_at: string
          email_bug: boolean
          email_functieverzoek: boolean
          inapp_bug: boolean
          inapp_functieverzoek: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_bug?: boolean
          email_functieverzoek?: boolean
          inapp_bug?: boolean
          inapp_functieverzoek?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_bug?: boolean
          email_functieverzoek?: boolean
          inapp_bug?: boolean
          inapp_functieverzoek?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feedback_reacties: {
        Row: {
          bericht: string
          created_at: string
          feedback_id: string
          id: string
          intern: boolean
          soort: string
          user_id: string
        }
        Insert: {
          bericht: string
          created_at?: string
          feedback_id: string
          id?: string
          intern?: boolean
          soort?: string
          user_id: string
        }
        Update: {
          bericht?: string
          created_at?: string
          feedback_id?: string
          id?: string
          intern?: boolean
          soort?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_reacties_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback_verzoeken"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_reacties_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_stemmen: {
        Row: {
          created_at: string
          feedback_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_stemmen_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback_verzoeken"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_stemmen_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_verzoeken: {
        Row: {
          admin_reactie: string | null
          ai_interview: Json | null
          ai_samenvatting: string | null
          ai_tags: Json | null
          beschrijving: string
          bevestiging_op: string | null
          bevestiging_opmerking: string | null
          bevestiging_status: string | null
          bijlagen: Json | null
          categorie: string | null
          created_at: string
          csat_score: number | null
          gearchiveerd: boolean
          id: string
          partner_id: string | null
          prioriteit: string | null
          status: string | null
          stemmen: number | null
          titel: string
          type: string
          updated_at: string
          user_id: string
          verwacht_klaar_op: string | null
          verwerkt_in_versie: string | null
        }
        Insert: {
          admin_reactie?: string | null
          ai_interview?: Json | null
          ai_samenvatting?: string | null
          ai_tags?: Json | null
          beschrijving: string
          bevestiging_op?: string | null
          bevestiging_opmerking?: string | null
          bevestiging_status?: string | null
          bijlagen?: Json | null
          categorie?: string | null
          created_at?: string
          csat_score?: number | null
          gearchiveerd?: boolean
          id?: string
          partner_id?: string | null
          prioriteit?: string | null
          status?: string | null
          stemmen?: number | null
          titel: string
          type?: string
          updated_at?: string
          user_id: string
          verwacht_klaar_op?: string | null
          verwerkt_in_versie?: string | null
        }
        Update: {
          admin_reactie?: string | null
          ai_interview?: Json | null
          ai_samenvatting?: string | null
          ai_tags?: Json | null
          beschrijving?: string
          bevestiging_op?: string | null
          bevestiging_opmerking?: string | null
          bevestiging_status?: string | null
          bijlagen?: Json | null
          categorie?: string | null
          created_at?: string
          csat_score?: number | null
          gearchiveerd?: boolean
          id?: string
          partner_id?: string | null
          prioriteit?: string | null
          status?: string | null
          stemmen?: number | null
          titel?: string
          type?: string
          updated_at?: string
          user_id?: string
          verwacht_klaar_op?: string | null
          verwerkt_in_versie?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_verzoeken_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_verzoeken_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_verzoeken_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      financiele_documenten: {
        Row: {
          betaald_op: string | null
          betaald_via: string | null
          betalingstermijn_dagen: number
          bevestigde_leverdatum: string | null
          btw_bedrag: number
          created_at: string
          created_by: string
          documentnummer: string
          eenmalige_relatie: Json | null
          email_bericht_id: string | null
          factuur_subtype: string
          factuurdatum: string
          gewenste_leverdatum: string | null
          goedgekeurd_door_id: string | null
          goedgekeurd_op: string | null
          id: string
          inkooporder_id: string | null
          installatie_id: string | null
          interne_notities: string | null
          klant_id: string | null
          korting_totaal: number
          leverancier_id: string | null
          leverancier_referentie: string | null
          leveringsadres: Json | null
          notities: string | null
          offerte_id: string | null
          opdracht_id: string | null
          partner_id: string
          pdf_url: string | null
          regels: Json
          status: Database["public"]["Enums"]["financieel_document_status"]
          subtotaal: number
          termijn_percentage: number | null
          termijn_totaal: number | null
          termijn_volgnummer: number | null
          totaal_bedrag: number
          type: Database["public"]["Enums"]["financieel_document_type"]
          updated_at: string
          vervaldatum: string | null
          verzonden_door_id: string | null
          verzonden_op: string | null
          verzonden_via: string | null
          voorschot_van_facturen: string[] | null
        }
        Insert: {
          betaald_op?: string | null
          betaald_via?: string | null
          betalingstermijn_dagen?: number
          bevestigde_leverdatum?: string | null
          btw_bedrag?: number
          created_at?: string
          created_by: string
          documentnummer: string
          eenmalige_relatie?: Json | null
          email_bericht_id?: string | null
          factuur_subtype?: string
          factuurdatum?: string
          gewenste_leverdatum?: string | null
          goedgekeurd_door_id?: string | null
          goedgekeurd_op?: string | null
          id?: string
          inkooporder_id?: string | null
          installatie_id?: string | null
          interne_notities?: string | null
          klant_id?: string | null
          korting_totaal?: number
          leverancier_id?: string | null
          leverancier_referentie?: string | null
          leveringsadres?: Json | null
          notities?: string | null
          offerte_id?: string | null
          opdracht_id?: string | null
          partner_id: string
          pdf_url?: string | null
          regels?: Json
          status?: Database["public"]["Enums"]["financieel_document_status"]
          subtotaal?: number
          termijn_percentage?: number | null
          termijn_totaal?: number | null
          termijn_volgnummer?: number | null
          totaal_bedrag?: number
          type: Database["public"]["Enums"]["financieel_document_type"]
          updated_at?: string
          vervaldatum?: string | null
          verzonden_door_id?: string | null
          verzonden_op?: string | null
          verzonden_via?: string | null
          voorschot_van_facturen?: string[] | null
        }
        Update: {
          betaald_op?: string | null
          betaald_via?: string | null
          betalingstermijn_dagen?: number
          bevestigde_leverdatum?: string | null
          btw_bedrag?: number
          created_at?: string
          created_by?: string
          documentnummer?: string
          eenmalige_relatie?: Json | null
          email_bericht_id?: string | null
          factuur_subtype?: string
          factuurdatum?: string
          gewenste_leverdatum?: string | null
          goedgekeurd_door_id?: string | null
          goedgekeurd_op?: string | null
          id?: string
          inkooporder_id?: string | null
          installatie_id?: string | null
          interne_notities?: string | null
          klant_id?: string | null
          korting_totaal?: number
          leverancier_id?: string | null
          leverancier_referentie?: string | null
          leveringsadres?: Json | null
          notities?: string | null
          offerte_id?: string | null
          opdracht_id?: string | null
          partner_id?: string
          pdf_url?: string | null
          regels?: Json
          status?: Database["public"]["Enums"]["financieel_document_status"]
          subtotaal?: number
          termijn_percentage?: number | null
          termijn_totaal?: number | null
          termijn_volgnummer?: number | null
          totaal_bedrag?: number
          type?: Database["public"]["Enums"]["financieel_document_type"]
          updated_at?: string
          vervaldatum?: string | null
          verzonden_door_id?: string | null
          verzonden_op?: string | null
          verzonden_via?: string | null
          voorschot_van_facturen?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "financiele_documenten_installatie_id_fkey"
            columns: ["installatie_id"]
            isOneToOne: false
            referencedRelation: "installaties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financiele_documenten_klant_id_fkey"
            columns: ["klant_id"]
            isOneToOne: false
            referencedRelation: "klanten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financiele_documenten_leverancier_id_fkey"
            columns: ["leverancier_id"]
            isOneToOne: false
            referencedRelation: "leveranciers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financiele_documenten_offerte_id_fkey"
            columns: ["offerte_id"]
            isOneToOne: false
            referencedRelation: "offertes"
            referencedColumns: ["id"]
          },
        ]
      }
      gebruiker_afwezigheid: {
        Row: {
          created_at: string
          id: string
          partner_id: string
          reden: string | null
          tot: string
          user_id: string
          van: string
          vervanger_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          partner_id: string
          reden?: string | null
          tot: string
          user_id: string
          van: string
          vervanger_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          partner_id?: string
          reden?: string | null
          tot?: string
          user_id?: string
          van?: string
          vervanger_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gebruiker_afwezigheid_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gebruiker_afwezigheid_vervanger_id_fkey"
            columns: ["vervanger_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gebruiker_permissies: {
        Row: {
          partner_id: string | null
          permissies: Json
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          partner_id?: string | null
          permissies?: Json
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          partner_id?: string | null
          permissies?: Json
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gebruiker_permissies_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gebruiker_permissies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      google_calendar_accounts: {
        Row: {
          access_token: string
          actief: boolean
          calendar_id: string
          calendar_summary: string | null
          channel_expiry: string | null
          channel_id: string | null
          created_at: string
          google_email: string
          id: string
          laatst_gesynchroniseerd_op: string | null
          laatste_fout: string | null
          partner_id: string
          refresh_token: string
          resource_id: string | null
          scope: string | null
          sync_afspraken: boolean
          sync_handmatig: boolean
          sync_installaties: boolean
          sync_schouwen: boolean
          sync_taken: boolean
          sync_token: string | null
          token_expiry: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          actief?: boolean
          calendar_id?: string
          calendar_summary?: string | null
          channel_expiry?: string | null
          channel_id?: string | null
          created_at?: string
          google_email: string
          id?: string
          laatst_gesynchroniseerd_op?: string | null
          laatste_fout?: string | null
          partner_id: string
          refresh_token: string
          resource_id?: string | null
          scope?: string | null
          sync_afspraken?: boolean
          sync_handmatig?: boolean
          sync_installaties?: boolean
          sync_schouwen?: boolean
          sync_taken?: boolean
          sync_token?: string | null
          token_expiry: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          actief?: boolean
          calendar_id?: string
          calendar_summary?: string | null
          channel_expiry?: string | null
          channel_id?: string | null
          created_at?: string
          google_email?: string
          id?: string
          laatst_gesynchroniseerd_op?: string | null
          laatste_fout?: string | null
          partner_id?: string
          refresh_token?: string
          resource_id?: string | null
          scope?: string | null
          sync_afspraken?: boolean
          sync_handmatig?: boolean
          sync_installaties?: boolean
          sync_schouwen?: boolean
          sync_taken?: boolean
          sync_token?: string | null
          token_expiry?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      google_calendar_event_mapping: {
        Row: {
          created_at: string
          entiteit_id: string
          entiteit_type: string
          google_etag: string | null
          google_event_id: string
          id: string
          laatste_hash: string | null
          laatste_sync_op: string
          partner_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entiteit_id: string
          entiteit_type: string
          google_etag?: string | null
          google_event_id: string
          id?: string
          laatste_hash?: string | null
          laatste_sync_op?: string
          partner_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entiteit_id?: string
          entiteit_type?: string
          google_etag?: string | null
          google_event_id?: string
          id?: string
          laatste_hash?: string | null
          laatste_sync_op?: string
          partner_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      helpdesk_csat: {
        Row: {
          created_at: string
          id: string
          ingevuld_door: string | null
          opmerking: string | null
          partner_id: string
          score: number
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingevuld_door?: string | null
          opmerking?: string | null
          partner_id: string
          score: number
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ingevuld_door?: string | null
          opmerking?: string | null
          partner_id?: string
          score?: number
          ticket_id?: string
        }
        Relationships: []
      }
      helpdesk_drafts: {
        Row: {
          context_key: string
          created_at: string
          id: string
          inhoud: Json
          partner_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          context_key: string
          created_at?: string
          id?: string
          inhoud?: Json
          partner_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          context_key?: string
          created_at?: string
          id?: string
          inhoud?: Json
          partner_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      helpdesk_email_sjablonen: {
        Row: {
          created_at: string
          id: string
          inhoud: string
          naam: string
          onderwerp: string
          partner_id: string
          updated_at: string
          variabelen: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          inhoud: string
          naam: string
          onderwerp: string
          partner_id: string
          updated_at?: string
          variabelen?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          inhoud?: string
          naam?: string
          onderwerp?: string
          partner_id?: string
          updated_at?: string
          variabelen?: Json | null
        }
        Relationships: []
      }
      helpdesk_kennis_artikelen: {
        Row: {
          ai_gegenereerd: boolean
          bron_ticket_id: string | null
          created_at: string
          foutcode: string | null
          gemaakt_door: string | null
          goedgekeurd_door: string | null
          goedgekeurd_op: string | null
          id: string
          oplossing: string | null
          partner_id: string
          probleem: string | null
          product_categorie: string | null
          product_merk: string | null
          product_type: string | null
          samenvatting: string | null
          status: Database["public"]["Enums"]["helpdesk_artikel_status"]
          tags: Json | null
          titel: string
          updated_at: string
          views: number
        }
        Insert: {
          ai_gegenereerd?: boolean
          bron_ticket_id?: string | null
          created_at?: string
          foutcode?: string | null
          gemaakt_door?: string | null
          goedgekeurd_door?: string | null
          goedgekeurd_op?: string | null
          id?: string
          oplossing?: string | null
          partner_id: string
          probleem?: string | null
          product_categorie?: string | null
          product_merk?: string | null
          product_type?: string | null
          samenvatting?: string | null
          status?: Database["public"]["Enums"]["helpdesk_artikel_status"]
          tags?: Json | null
          titel: string
          updated_at?: string
          views?: number
        }
        Update: {
          ai_gegenereerd?: boolean
          bron_ticket_id?: string | null
          created_at?: string
          foutcode?: string | null
          gemaakt_door?: string | null
          goedgekeurd_door?: string | null
          goedgekeurd_op?: string | null
          id?: string
          oplossing?: string | null
          partner_id?: string
          probleem?: string | null
          product_categorie?: string | null
          product_merk?: string | null
          product_type?: string | null
          samenvatting?: string | null
          status?: Database["public"]["Enums"]["helpdesk_artikel_status"]
          tags?: Json | null
          titel?: string
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "helpdesk_kennis_artikelen_bron_ticket_id_fkey"
            columns: ["bron_ticket_id"]
            isOneToOne: false
            referencedRelation: "helpdesk_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      helpdesk_kennis_media: {
        Row: {
          artikel_id: string
          beschrijving: string | null
          bestand_url: string
          bestandsnaam: string
          created_at: string
          id: string
          mime_type: string | null
          partner_id: string
        }
        Insert: {
          artikel_id: string
          beschrijving?: string | null
          bestand_url: string
          bestandsnaam: string
          created_at?: string
          id?: string
          mime_type?: string | null
          partner_id: string
        }
        Update: {
          artikel_id?: string
          beschrijving?: string | null
          bestand_url?: string
          bestandsnaam?: string
          created_at?: string
          id?: string
          mime_type?: string | null
          partner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "helpdesk_kennis_media_artikel_id_fkey"
            columns: ["artikel_id"]
            isOneToOne: false
            referencedRelation: "helpdesk_kennis_artikelen"
            referencedColumns: ["id"]
          },
        ]
      }
      helpdesk_notificatie_config: {
        Row: {
          created_at: string
          email_bij_escalatie: boolean
          email_bij_klant_reactie: boolean
          email_bij_nieuw_ticket: boolean
          email_bij_oplossing: boolean
          email_bij_storing: boolean
          email_bij_toewijzing: boolean
          id: string
          ontvangers: Json | null
          partner_id: string
          sla_uren_hoog: number
          sla_uren_laag: number
          sla_uren_normaal: number
          sla_uren_urgent: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          email_bij_escalatie?: boolean
          email_bij_klant_reactie?: boolean
          email_bij_nieuw_ticket?: boolean
          email_bij_oplossing?: boolean
          email_bij_storing?: boolean
          email_bij_toewijzing?: boolean
          id?: string
          ontvangers?: Json | null
          partner_id: string
          sla_uren_hoog?: number
          sla_uren_laag?: number
          sla_uren_normaal?: number
          sla_uren_urgent?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          email_bij_escalatie?: boolean
          email_bij_klant_reactie?: boolean
          email_bij_nieuw_ticket?: boolean
          email_bij_oplossing?: boolean
          email_bij_storing?: boolean
          email_bij_toewijzing?: boolean
          id?: string
          ontvangers?: Json | null
          partner_id?: string
          sla_uren_hoog?: number
          sla_uren_laag?: number
          sla_uren_normaal?: number
          sla_uren_urgent?: number
          updated_at?: string
        }
        Relationships: []
      }
      helpdesk_service_bezoeken: {
        Row: {
          aankomst_tijd: string | null
          afspraak_id: string | null
          created_at: string
          geplande_datum: string | null
          geplande_tijd: string | null
          geschatte_duur_minuten: number | null
          handtekening_url: string | null
          id: string
          klant_naam_handtekening: string | null
          monteur_id: string | null
          notities: string | null
          oplossing: string | null
          partner_id: string
          status: string
          ticket_id: string
          type: string
          updated_at: string
          vertrek_tijd: string | null
          werkzaamheden: string | null
        }
        Insert: {
          aankomst_tijd?: string | null
          afspraak_id?: string | null
          created_at?: string
          geplande_datum?: string | null
          geplande_tijd?: string | null
          geschatte_duur_minuten?: number | null
          handtekening_url?: string | null
          id?: string
          klant_naam_handtekening?: string | null
          monteur_id?: string | null
          notities?: string | null
          oplossing?: string | null
          partner_id: string
          status?: string
          ticket_id: string
          type?: string
          updated_at?: string
          vertrek_tijd?: string | null
          werkzaamheden?: string | null
        }
        Update: {
          aankomst_tijd?: string | null
          afspraak_id?: string | null
          created_at?: string
          geplande_datum?: string | null
          geplande_tijd?: string | null
          geschatte_duur_minuten?: number | null
          handtekening_url?: string | null
          id?: string
          klant_naam_handtekening?: string | null
          monteur_id?: string | null
          notities?: string | null
          oplossing?: string | null
          partner_id?: string
          status?: string
          ticket_id?: string
          type?: string
          updated_at?: string
          vertrek_tijd?: string | null
          werkzaamheden?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "helpdesk_service_bezoeken_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "helpdesk_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      helpdesk_ticket_ai_sessies: {
        Row: {
          created_at: string
          gerelateerde_tickets: Json | null
          id: string
          input: Json
          model: string | null
          output: Json
          partner_id: string
          ticket_id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gerelateerde_tickets?: Json | null
          id?: string
          input?: Json
          model?: string | null
          output?: Json
          partner_id: string
          ticket_id: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          gerelateerde_tickets?: Json | null
          id?: string
          input?: Json
          model?: string | null
          output?: Json
          partner_id?: string
          ticket_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "helpdesk_ticket_ai_sessies_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "helpdesk_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      helpdesk_ticket_berichten: {
        Row: {
          auteur_id: string
          bijlagen: Json | null
          created_at: string
          extern_email: string | null
          extern_naam: string | null
          extern_organisatie: string | null
          extern_telefoon: string | null
          id: string
          inhoud: string
          kanaal_type: string
          partner_id: string
          richting: string
          ticket_id: string
        }
        Insert: {
          auteur_id: string
          bijlagen?: Json | null
          created_at?: string
          extern_email?: string | null
          extern_naam?: string | null
          extern_organisatie?: string | null
          extern_telefoon?: string | null
          id?: string
          inhoud: string
          kanaal_type?: string
          partner_id: string
          richting?: string
          ticket_id: string
        }
        Update: {
          auteur_id?: string
          bijlagen?: Json | null
          created_at?: string
          extern_email?: string | null
          extern_naam?: string | null
          extern_organisatie?: string | null
          extern_telefoon?: string | null
          id?: string
          inhoud?: string
          kanaal_type?: string
          partner_id?: string
          richting?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "helpdesk_ticket_berichten_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "helpdesk_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      helpdesk_ticket_bijlagen: {
        Row: {
          beschrijving: string | null
          bestand_grootte: number | null
          bestand_url: string
          bestandsnaam: string
          created_at: string
          geupload_door_id: string
          id: string
          mime_type: string | null
          partner_id: string
          ticket_id: string
        }
        Insert: {
          beschrijving?: string | null
          bestand_grootte?: number | null
          bestand_url: string
          bestandsnaam: string
          created_at?: string
          geupload_door_id: string
          id?: string
          mime_type?: string | null
          partner_id: string
          ticket_id: string
        }
        Update: {
          beschrijving?: string | null
          bestand_grootte?: number | null
          bestand_url?: string
          bestandsnaam?: string
          created_at?: string
          geupload_door_id?: string
          id?: string
          mime_type?: string | null
          partner_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "helpdesk_ticket_bijlagen_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "helpdesk_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      helpdesk_ticket_historie: {
        Row: {
          actie: string
          created_at: string
          details: Json | null
          id: string
          nieuwe_waarde: string | null
          oude_waarde: string | null
          partner_id: string
          ticket_id: string
          user_id: string | null
          veld: string | null
        }
        Insert: {
          actie: string
          created_at?: string
          details?: Json | null
          id?: string
          nieuwe_waarde?: string | null
          oude_waarde?: string | null
          partner_id: string
          ticket_id: string
          user_id?: string | null
          veld?: string | null
        }
        Update: {
          actie?: string
          created_at?: string
          details?: Json | null
          id?: string
          nieuwe_waarde?: string | null
          oude_waarde?: string | null
          partner_id?: string
          ticket_id?: string
          user_id?: string | null
          veld?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "helpdesk_ticket_historie_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "helpdesk_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      helpdesk_ticket_taken: {
        Row: {
          agenda_user_id: string | null
          created_at: string
          deadline: string | null
          gemaakt_door: string
          geplande_datum: string | null
          geplande_eindtijd: string | null
          geplande_starttijd: string | null
          geschatte_duur_minuten: number | null
          herinnering_dag_voor: boolean
          id: string
          inplannen_in_agenda: boolean
          omschrijving: string | null
          partner_id: string
          prioriteit: Database["public"]["Enums"]["helpdesk_ticket_prioriteit"]
          status: Database["public"]["Enums"]["helpdesk_taak_status"]
          ticket_id: string | null
          titel: string
          toegewezen_aan: string | null
          updated_at: string
          voltooid_op: string | null
        }
        Insert: {
          agenda_user_id?: string | null
          created_at?: string
          deadline?: string | null
          gemaakt_door: string
          geplande_datum?: string | null
          geplande_eindtijd?: string | null
          geplande_starttijd?: string | null
          geschatte_duur_minuten?: number | null
          herinnering_dag_voor?: boolean
          id?: string
          inplannen_in_agenda?: boolean
          omschrijving?: string | null
          partner_id: string
          prioriteit?: Database["public"]["Enums"]["helpdesk_ticket_prioriteit"]
          status?: Database["public"]["Enums"]["helpdesk_taak_status"]
          ticket_id?: string | null
          titel: string
          toegewezen_aan?: string | null
          updated_at?: string
          voltooid_op?: string | null
        }
        Update: {
          agenda_user_id?: string | null
          created_at?: string
          deadline?: string | null
          gemaakt_door?: string
          geplande_datum?: string | null
          geplande_eindtijd?: string | null
          geplande_starttijd?: string | null
          geschatte_duur_minuten?: number | null
          herinnering_dag_voor?: boolean
          id?: string
          inplannen_in_agenda?: boolean
          omschrijving?: string | null
          partner_id?: string
          prioriteit?: Database["public"]["Enums"]["helpdesk_ticket_prioriteit"]
          status?: Database["public"]["Enums"]["helpdesk_taak_status"]
          ticket_id?: string | null
          titel?: string
          toegewezen_aan?: string | null
          updated_at?: string
          voltooid_op?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "helpdesk_ticket_taken_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "helpdesk_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      helpdesk_tickets: {
        Row: {
          bron_locatie: Database["public"]["Enums"]["helpdesk_bron_locatie"]
          created_at: string
          escalatie_reden: string | null
          factuur_id: string | null
          foutcode: string | null
          gemaakt_door: string
          geschatte_duur_minuten: number | null
          gesloten_op: string | null
          id: string
          installatie_id: string | null
          is_geescaleerd: boolean
          kanaal: Database["public"]["Enums"]["helpdesk_ticket_kanaal"]
          klant_id: string | null
          lead_id: string | null
          omschrijving: string | null
          opdracht_id: string | null
          opgelost_op: string | null
          oplossing: string | null
          partner_id: string
          prioriteit: Database["public"]["Enums"]["helpdesk_ticket_prioriteit"]
          product_categorie: string | null
          product_installatiejaar: number | null
          product_merk: string | null
          product_type: string | null
          sla_deadline: string | null
          status: Database["public"]["Enums"]["helpdesk_ticket_status"]
          ticketnummer: string
          titel: string
          toegewezen_aan: string | null
          type: Database["public"]["Enums"]["helpdesk_ticket_type"]
          updated_at: string
        }
        Insert: {
          bron_locatie?: Database["public"]["Enums"]["helpdesk_bron_locatie"]
          created_at?: string
          escalatie_reden?: string | null
          factuur_id?: string | null
          foutcode?: string | null
          gemaakt_door: string
          geschatte_duur_minuten?: number | null
          gesloten_op?: string | null
          id?: string
          installatie_id?: string | null
          is_geescaleerd?: boolean
          kanaal?: Database["public"]["Enums"]["helpdesk_ticket_kanaal"]
          klant_id?: string | null
          lead_id?: string | null
          omschrijving?: string | null
          opdracht_id?: string | null
          opgelost_op?: string | null
          oplossing?: string | null
          partner_id: string
          prioriteit?: Database["public"]["Enums"]["helpdesk_ticket_prioriteit"]
          product_categorie?: string | null
          product_installatiejaar?: number | null
          product_merk?: string | null
          product_type?: string | null
          sla_deadline?: string | null
          status?: Database["public"]["Enums"]["helpdesk_ticket_status"]
          ticketnummer: string
          titel: string
          toegewezen_aan?: string | null
          type?: Database["public"]["Enums"]["helpdesk_ticket_type"]
          updated_at?: string
        }
        Update: {
          bron_locatie?: Database["public"]["Enums"]["helpdesk_bron_locatie"]
          created_at?: string
          escalatie_reden?: string | null
          factuur_id?: string | null
          foutcode?: string | null
          gemaakt_door?: string
          geschatte_duur_minuten?: number | null
          gesloten_op?: string | null
          id?: string
          installatie_id?: string | null
          is_geescaleerd?: boolean
          kanaal?: Database["public"]["Enums"]["helpdesk_ticket_kanaal"]
          klant_id?: string | null
          lead_id?: string | null
          omschrijving?: string | null
          opdracht_id?: string | null
          opgelost_op?: string | null
          oplossing?: string | null
          partner_id?: string
          prioriteit?: Database["public"]["Enums"]["helpdesk_ticket_prioriteit"]
          product_categorie?: string | null
          product_installatiejaar?: number | null
          product_merk?: string | null
          product_type?: string | null
          sla_deadline?: string | null
          status?: Database["public"]["Enums"]["helpdesk_ticket_status"]
          ticketnummer?: string
          titel?: string
          toegewezen_aan?: string | null
          type?: Database["public"]["Enums"]["helpdesk_ticket_type"]
          updated_at?: string
        }
        Relationships: []
      }
      inkoop_factuur_match: {
        Row: {
          created_at: string
          goedgekeurd_door_id: string | null
          goedgekeurd_op: string | null
          id: string
          inkoopfactuur_id: string
          inkooporder_id: string | null
          notitie: string | null
          ontvangst_id: string | null
          partner_id: string
          status: string
          totaal_besteld: number
          totaal_gefactureerd: number
          totaal_ontvangen: number
          updated_at: string
          verschil_bedrag: number
        }
        Insert: {
          created_at?: string
          goedgekeurd_door_id?: string | null
          goedgekeurd_op?: string | null
          id?: string
          inkoopfactuur_id: string
          inkooporder_id?: string | null
          notitie?: string | null
          ontvangst_id?: string | null
          partner_id: string
          status?: string
          totaal_besteld?: number
          totaal_gefactureerd?: number
          totaal_ontvangen?: number
          updated_at?: string
          verschil_bedrag?: number
        }
        Update: {
          created_at?: string
          goedgekeurd_door_id?: string | null
          goedgekeurd_op?: string | null
          id?: string
          inkoopfactuur_id?: string
          inkooporder_id?: string | null
          notitie?: string | null
          ontvangst_id?: string | null
          partner_id?: string
          status?: string
          totaal_besteld?: number
          totaal_gefactureerd?: number
          totaal_ontvangen?: number
          updated_at?: string
          verschil_bedrag?: number
        }
        Relationships: []
      }
      inkoop_instellingen: {
        Row: {
          auto_voorstellen: boolean
          created_at: string
          goedkeuring_drempel_bedrag: number
          goedkeuring_modus: string
          leveringsadres: Json | null
          partner_id: string
          standaard_betalingstermijn_dagen: number
          standaard_email_template: string | null
          updated_at: string
          vereist_leverancier_bevestiging: boolean
          verzend_modus: string
        }
        Insert: {
          auto_voorstellen?: boolean
          created_at?: string
          goedkeuring_drempel_bedrag?: number
          goedkeuring_modus?: string
          leveringsadres?: Json | null
          partner_id: string
          standaard_betalingstermijn_dagen?: number
          standaard_email_template?: string | null
          updated_at?: string
          vereist_leverancier_bevestiging?: boolean
          verzend_modus?: string
        }
        Update: {
          auto_voorstellen?: boolean
          created_at?: string
          goedkeuring_drempel_bedrag?: number
          goedkeuring_modus?: string
          leveringsadres?: Json | null
          partner_id?: string
          standaard_betalingstermijn_dagen?: number
          standaard_email_template?: string | null
          updated_at?: string
          vereist_leverancier_bevestiging?: boolean
          verzend_modus?: string
        }
        Relationships: []
      }
      inkoop_ontvangsten: {
        Row: {
          aflever_locatie: string | null
          chauffeur_naam: string | null
          created_at: string
          discrepantie: boolean
          document_ids: Json
          fotos: Json | null
          id: string
          inkooporder_id: string
          ontvangen_door: string | null
          ontvangst_document_url: string | null
          ontvangstdatum: string
          opmerking: string | null
          pakbon_nummer: string | null
          partner_id: string
          regels: Json
          sn_per_regel: Json
          staat_zending: string | null
          tracking_nummer: string | null
          updated_at: string
          vervoerder: string | null
          voorraad_geboekt: boolean
        }
        Insert: {
          aflever_locatie?: string | null
          chauffeur_naam?: string | null
          created_at?: string
          discrepantie?: boolean
          document_ids?: Json
          fotos?: Json | null
          id?: string
          inkooporder_id: string
          ontvangen_door?: string | null
          ontvangst_document_url?: string | null
          ontvangstdatum?: string
          opmerking?: string | null
          pakbon_nummer?: string | null
          partner_id: string
          regels?: Json
          sn_per_regel?: Json
          staat_zending?: string | null
          tracking_nummer?: string | null
          updated_at?: string
          vervoerder?: string | null
          voorraad_geboekt?: boolean
        }
        Update: {
          aflever_locatie?: string | null
          chauffeur_naam?: string | null
          created_at?: string
          discrepantie?: boolean
          document_ids?: Json
          fotos?: Json | null
          id?: string
          inkooporder_id?: string
          ontvangen_door?: string | null
          ontvangst_document_url?: string | null
          ontvangstdatum?: string
          opmerking?: string | null
          pakbon_nummer?: string | null
          partner_id?: string
          regels?: Json
          sn_per_regel?: Json
          staat_zending?: string | null
          tracking_nummer?: string | null
          updated_at?: string
          vervoerder?: string | null
          voorraad_geboekt?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "inkoop_ontvangsten_inkooporder_id_fkey"
            columns: ["inkooporder_id"]
            isOneToOne: false
            referencedRelation: "financiele_documenten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inkoop_ontvangsten_ontvangen_door_fkey"
            columns: ["ontvangen_door"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inkoop_ontvangsten_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inkoop_ontvangsten_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      inkoop_voorstellen: {
        Row: {
          aantal: number
          created_at: string
          id: string
          inkooporder_id: string | null
          inkoopprijs: number | null
          leverancier_id: string | null
          levertijd_dagen: number | null
          notitie: string | null
          opdracht_id: string | null
          partner_id: string
          product_id: string
          reden: string
          status: string
          updated_at: string
          verwerkt_door_id: string | null
          verwerkt_op: string | null
        }
        Insert: {
          aantal?: number
          created_at?: string
          id?: string
          inkooporder_id?: string | null
          inkoopprijs?: number | null
          leverancier_id?: string | null
          levertijd_dagen?: number | null
          notitie?: string | null
          opdracht_id?: string | null
          partner_id: string
          product_id: string
          reden: string
          status?: string
          updated_at?: string
          verwerkt_door_id?: string | null
          verwerkt_op?: string | null
        }
        Update: {
          aantal?: number
          created_at?: string
          id?: string
          inkooporder_id?: string | null
          inkoopprijs?: number | null
          leverancier_id?: string | null
          levertijd_dagen?: number | null
          notitie?: string | null
          opdracht_id?: string | null
          partner_id?: string
          product_id?: string
          reden?: string
          status?: string
          updated_at?: string
          verwerkt_door_id?: string | null
          verwerkt_op?: string | null
        }
        Relationships: []
      }
      installateur_voorkeuren: {
        Row: {
          erkenningsnummer: string | null
          kvk_nummer: string | null
          meetapparatuur: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          erkenningsnummer?: string | null
          kvk_nummer?: string | null
          meetapparatuur?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          erkenningsnummer?: string | null
          kvk_nummer?: string | null
          meetapparatuur?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "installateur_voorkeuren_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      installatie_checklist_items: {
        Row: {
          blokkerend: boolean
          created_at: string
          id: string
          installatie_id: string
          item_key: string
          label: string
          notitie: string | null
          partner_id: string
          updated_at: string
          voltooid_door: string | null
          voltooid_op: string | null
        }
        Insert: {
          blokkerend?: boolean
          created_at?: string
          id?: string
          installatie_id: string
          item_key: string
          label: string
          notitie?: string | null
          partner_id: string
          updated_at?: string
          voltooid_door?: string | null
          voltooid_op?: string | null
        }
        Update: {
          blokkerend?: boolean
          created_at?: string
          id?: string
          installatie_id?: string
          item_key?: string
          label?: string
          notitie?: string | null
          partner_id?: string
          updated_at?: string
          voltooid_door?: string | null
          voltooid_op?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installatie_checklist_items_installatie_id_fkey"
            columns: ["installatie_id"]
            isOneToOne: false
            referencedRelation: "installaties"
            referencedColumns: ["id"]
          },
        ]
      }
      installatie_checklist_templates: {
        Row: {
          actief: boolean
          beschrijving: string | null
          blokkerend: boolean
          created_at: string
          id: string
          item_key: string
          label: string
          partner_id: string
          updated_at: string
          vereist_voor_status: string
          volgorde: number
        }
        Insert: {
          actief?: boolean
          beschrijving?: string | null
          blokkerend?: boolean
          created_at?: string
          id?: string
          item_key: string
          label: string
          partner_id: string
          updated_at?: string
          vereist_voor_status?: string
          volgorde?: number
        }
        Update: {
          actief?: boolean
          beschrijving?: string | null
          blokkerend?: boolean
          created_at?: string
          id?: string
          item_key?: string
          label?: string
          partner_id?: string
          updated_at?: string
          vereist_voor_status?: string
          volgorde?: number
        }
        Relationships: []
      }
      installatie_gereedheid_overrides: {
        Row: {
          created_at: string
          id: string
          installatie_id: string
          item_key: string
          notitie: string | null
          partner_id: string
          updated_at: string
          voltooid_door: string | null
          voltooid_op: string
        }
        Insert: {
          created_at?: string
          id?: string
          installatie_id: string
          item_key: string
          notitie?: string | null
          partner_id: string
          updated_at?: string
          voltooid_door?: string | null
          voltooid_op?: string
        }
        Update: {
          created_at?: string
          id?: string
          installatie_id?: string
          item_key?: string
          notitie?: string | null
          partner_id?: string
          updated_at?: string
          voltooid_door?: string | null
          voltooid_op?: string
        }
        Relationships: [
          {
            foreignKeyName: "installatie_gereedheid_overrides_installatie_id_fkey"
            columns: ["installatie_id"]
            isOneToOne: false
            referencedRelation: "installaties"
            referencedColumns: ["id"]
          },
        ]
      }
      installatie_historie: {
        Row: {
          actie: string
          actor_id: string | null
          created_at: string
          id: string
          installatie_id: string
          nieuwe_waarde: string | null
          oude_waarde: string | null
          partner_id: string
          veld: string | null
        }
        Insert: {
          actie: string
          actor_id?: string | null
          created_at?: string
          id?: string
          installatie_id: string
          nieuwe_waarde?: string | null
          oude_waarde?: string | null
          partner_id: string
          veld?: string | null
        }
        Update: {
          actie?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          installatie_id?: string
          nieuwe_waarde?: string | null
          oude_waarde?: string | null
          partner_id?: string
          veld?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installatie_historie_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installatie_historie_installatie_id_fkey"
            columns: ["installatie_id"]
            isOneToOne: false
            referencedRelation: "installaties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installatie_historie_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installatie_historie_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      installatie_notities: {
        Row: {
          auteur_id: string | null
          created_at: string
          id: string
          inhoud: string
          installatie_id: string
          intern: boolean
          partner_id: string
        }
        Insert: {
          auteur_id?: string | null
          created_at?: string
          id?: string
          inhoud: string
          installatie_id: string
          intern?: boolean
          partner_id: string
        }
        Update: {
          auteur_id?: string | null
          created_at?: string
          id?: string
          inhoud?: string
          installatie_id?: string
          intern?: boolean
          partner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "installatie_notities_auteur_id_fkey"
            columns: ["auteur_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installatie_notities_installatie_id_fkey"
            columns: ["installatie_id"]
            isOneToOne: false
            referencedRelation: "installaties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installatie_notities_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installatie_notities_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      installaties: {
        Row: {
          backoffice_eigenaar_id: string | null
          bevestiging_verzonden_op: string | null
          consument_id: string | null
          consument_naam: string | null
          created_at: string
          created_by: string | null
          eind_tijd: string | null
          geplande_einddatum: string | null
          geplande_startdatum: string | null
          gereedmelding_notitie: string | null
          gereedmelding_op: string | null
          id: string
          installateur_id: string | null
          installatienummer: string | null
          klant_adres: string | null
          klant_email: string | null
          klant_id: string | null
          klant_plaats: string | null
          klant_postcode: string | null
          klant_telefoon: string | null
          lead_id: string | null
          monteur_geaccepteerd_op: string | null
          notities: string | null
          offerte_id: string | null
          opdracht_id: string | null
          oplevering_id: string | null
          partner_id: string
          producten: Json
          schouw_id: string | null
          start_tijd: string | null
          status: Database["public"]["Enums"]["installatie_status"]
          updated_at: string
          werkadres: string | null
          werkelijke_eindtijd: string | null
          werkelijke_starttijd: string | null
          werkomschrijving: string | null
        }
        Insert: {
          backoffice_eigenaar_id?: string | null
          bevestiging_verzonden_op?: string | null
          consument_id?: string | null
          consument_naam?: string | null
          created_at?: string
          created_by?: string | null
          eind_tijd?: string | null
          geplande_einddatum?: string | null
          geplande_startdatum?: string | null
          gereedmelding_notitie?: string | null
          gereedmelding_op?: string | null
          id?: string
          installateur_id?: string | null
          installatienummer?: string | null
          klant_adres?: string | null
          klant_email?: string | null
          klant_id?: string | null
          klant_plaats?: string | null
          klant_postcode?: string | null
          klant_telefoon?: string | null
          lead_id?: string | null
          monteur_geaccepteerd_op?: string | null
          notities?: string | null
          offerte_id?: string | null
          opdracht_id?: string | null
          oplevering_id?: string | null
          partner_id: string
          producten?: Json
          schouw_id?: string | null
          start_tijd?: string | null
          status?: Database["public"]["Enums"]["installatie_status"]
          updated_at?: string
          werkadres?: string | null
          werkelijke_eindtijd?: string | null
          werkelijke_starttijd?: string | null
          werkomschrijving?: string | null
        }
        Update: {
          backoffice_eigenaar_id?: string | null
          bevestiging_verzonden_op?: string | null
          consument_id?: string | null
          consument_naam?: string | null
          created_at?: string
          created_by?: string | null
          eind_tijd?: string | null
          geplande_einddatum?: string | null
          geplande_startdatum?: string | null
          gereedmelding_notitie?: string | null
          gereedmelding_op?: string | null
          id?: string
          installateur_id?: string | null
          installatienummer?: string | null
          klant_adres?: string | null
          klant_email?: string | null
          klant_id?: string | null
          klant_plaats?: string | null
          klant_postcode?: string | null
          klant_telefoon?: string | null
          lead_id?: string | null
          monteur_geaccepteerd_op?: string | null
          notities?: string | null
          offerte_id?: string | null
          opdracht_id?: string | null
          oplevering_id?: string | null
          partner_id?: string
          producten?: Json
          schouw_id?: string | null
          start_tijd?: string | null
          status?: Database["public"]["Enums"]["installatie_status"]
          updated_at?: string
          werkadres?: string | null
          werkelijke_eindtijd?: string | null
          werkelijke_starttijd?: string | null
          werkomschrijving?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installaties_backoffice_eigenaar_id_fkey"
            columns: ["backoffice_eigenaar_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installaties_consument_id_fkey"
            columns: ["consument_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installaties_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installaties_installateur_id_fkey"
            columns: ["installateur_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installaties_klant_id_fkey"
            columns: ["klant_id"]
            isOneToOne: false
            referencedRelation: "klanten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installaties_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installaties_offerte_id_fkey"
            columns: ["offerte_id"]
            isOneToOne: false
            referencedRelation: "offertes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installaties_opdracht_id_fkey"
            columns: ["opdracht_id"]
            isOneToOne: false
            referencedRelation: "opdrachten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installaties_oplevering_id_fkey"
            columns: ["oplevering_id"]
            isOneToOne: false
            referencedRelation: "opleverrapporten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installaties_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installaties_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installaties_schouw_id_fkey"
            columns: ["schouw_id"]
            isOneToOne: false
            referencedRelation: "schouwen"
            referencedColumns: ["id"]
          },
        ]
      }
      keuring_checklist_items: {
        Row: {
          antwoord: string | null
          beoordeeld_op: string | null
          blokkerend: boolean
          categorie: string
          created_at: string
          foto_pad: string | null
          id: string
          keuring_id: string
          label: string
          meetwaarde: string | null
          norm_referentie: string | null
          opmerking: string | null
          partner_id: string
          volgorde: number
        }
        Insert: {
          antwoord?: string | null
          beoordeeld_op?: string | null
          blokkerend?: boolean
          categorie: string
          created_at?: string
          foto_pad?: string | null
          id?: string
          keuring_id: string
          label: string
          meetwaarde?: string | null
          norm_referentie?: string | null
          opmerking?: string | null
          partner_id: string
          volgorde?: number
        }
        Update: {
          antwoord?: string | null
          beoordeeld_op?: string | null
          blokkerend?: boolean
          categorie?: string
          created_at?: string
          foto_pad?: string | null
          id?: string
          keuring_id?: string
          label?: string
          meetwaarde?: string | null
          norm_referentie?: string | null
          opmerking?: string | null
          partner_id?: string
          volgorde?: number
        }
        Relationships: [
          {
            foreignKeyName: "keuring_checklist_items_keuring_id_fkey"
            columns: ["keuring_id"]
            isOneToOne: false
            referencedRelation: "keuringen"
            referencedColumns: ["id"]
          },
        ]
      }
      keuring_intervallen: {
        Row: {
          auto_volgende: boolean
          created_at: string
          herinner_dagen_vooraf: number
          id: string
          interval_maanden: number
          partner_id: string
          type: Database["public"]["Enums"]["keuring_type"]
          updated_at: string
        }
        Insert: {
          auto_volgende?: boolean
          created_at?: string
          herinner_dagen_vooraf?: number
          id?: string
          interval_maanden?: number
          partner_id: string
          type: Database["public"]["Enums"]["keuring_type"]
          updated_at?: string
        }
        Update: {
          auto_volgende?: boolean
          created_at?: string
          herinner_dagen_vooraf?: number
          id?: string
          interval_maanden?: number
          partner_id?: string
          type?: Database["public"]["Enums"]["keuring_type"]
          updated_at?: string
        }
        Relationships: []
      }
      keuring_pdf_versies: {
        Row: {
          bestandsgrootte: number | null
          created_at: string
          gegenereerd_door: string | null
          id: string
          keuring_id: string
          partner_id: string
          pdf_hash: string | null
          pdf_path: string
          reden: string | null
          status_op_moment: string | null
          versie: number
        }
        Insert: {
          bestandsgrootte?: number | null
          created_at?: string
          gegenereerd_door?: string | null
          id?: string
          keuring_id: string
          partner_id: string
          pdf_hash?: string | null
          pdf_path: string
          reden?: string | null
          status_op_moment?: string | null
          versie: number
        }
        Update: {
          bestandsgrootte?: number | null
          created_at?: string
          gegenereerd_door?: string | null
          id?: string
          keuring_id?: string
          partner_id?: string
          pdf_hash?: string | null
          pdf_path?: string
          reden?: string | null
          status_op_moment?: string | null
          versie?: number
        }
        Relationships: [
          {
            foreignKeyName: "keuring_pdf_versies_keuring_id_fkey"
            columns: ["keuring_id"]
            isOneToOne: false
            referencedRelation: "keuringen"
            referencedColumns: ["id"]
          },
        ]
      }
      keuring_templates: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          naam: string
          partner_id: string
          structuur: Json
          type: Database["public"]["Enums"]["keuring_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          naam: string
          partner_id: string
          structuur?: Json
          type: Database["public"]["Enums"]["keuring_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          naam?: string
          partner_id?: string
          structuur?: Json
          type?: Database["public"]["Enums"]["keuring_type"]
          updated_at?: string
        }
        Relationships: []
      }
      keuringen: {
        Row: {
          aanbevelingen: string | null
          conclusie: string | null
          created_at: string
          created_by: string | null
          geplande_datum: string
          handtekening_klant: string | null
          handtekening_klant_naam: string | null
          handtekening_monteur: string | null
          herinnering_verstuurd_op: string | null
          id: string
          installatie_id: string | null
          keuringnummer: string | null
          klant_id: string | null
          locatie_adres: string | null
          locatie_plaats: string | null
          locatie_postcode: string | null
          next_keuring_id: string | null
          normenkader: string[]
          object_omschrijving: string | null
          partner_id: string
          pdf_gegenereerd_op: string | null
          pdf_hash: string | null
          pdf_url: string | null
          resultaat: Database["public"]["Enums"]["keuring_resultaat"] | null
          score_percentage: number | null
          status: Database["public"]["Enums"]["keuring_status"]
          type: Database["public"]["Enums"]["keuring_type"]
          uitgevoerd_door_certificering: string | null
          uitgevoerd_door_id: string | null
          uitgevoerd_door_naam: string | null
          uitgevoerd_op: string | null
          updated_at: string
          volgende_keuring_datum: string | null
        }
        Insert: {
          aanbevelingen?: string | null
          conclusie?: string | null
          created_at?: string
          created_by?: string | null
          geplande_datum: string
          handtekening_klant?: string | null
          handtekening_klant_naam?: string | null
          handtekening_monteur?: string | null
          herinnering_verstuurd_op?: string | null
          id?: string
          installatie_id?: string | null
          keuringnummer?: string | null
          klant_id?: string | null
          locatie_adres?: string | null
          locatie_plaats?: string | null
          locatie_postcode?: string | null
          next_keuring_id?: string | null
          normenkader?: string[]
          object_omschrijving?: string | null
          partner_id: string
          pdf_gegenereerd_op?: string | null
          pdf_hash?: string | null
          pdf_url?: string | null
          resultaat?: Database["public"]["Enums"]["keuring_resultaat"] | null
          score_percentage?: number | null
          status?: Database["public"]["Enums"]["keuring_status"]
          type: Database["public"]["Enums"]["keuring_type"]
          uitgevoerd_door_certificering?: string | null
          uitgevoerd_door_id?: string | null
          uitgevoerd_door_naam?: string | null
          uitgevoerd_op?: string | null
          updated_at?: string
          volgende_keuring_datum?: string | null
        }
        Update: {
          aanbevelingen?: string | null
          conclusie?: string | null
          created_at?: string
          created_by?: string | null
          geplande_datum?: string
          handtekening_klant?: string | null
          handtekening_klant_naam?: string | null
          handtekening_monteur?: string | null
          herinnering_verstuurd_op?: string | null
          id?: string
          installatie_id?: string | null
          keuringnummer?: string | null
          klant_id?: string | null
          locatie_adres?: string | null
          locatie_plaats?: string | null
          locatie_postcode?: string | null
          next_keuring_id?: string | null
          normenkader?: string[]
          object_omschrijving?: string | null
          partner_id?: string
          pdf_gegenereerd_op?: string | null
          pdf_hash?: string | null
          pdf_url?: string | null
          resultaat?: Database["public"]["Enums"]["keuring_resultaat"] | null
          score_percentage?: number | null
          status?: Database["public"]["Enums"]["keuring_status"]
          type?: Database["public"]["Enums"]["keuring_type"]
          uitgevoerd_door_certificering?: string | null
          uitgevoerd_door_id?: string | null
          uitgevoerd_door_naam?: string | null
          uitgevoerd_op?: string | null
          updated_at?: string
          volgende_keuring_datum?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "keuringen_installatie_id_fkey"
            columns: ["installatie_id"]
            isOneToOne: false
            referencedRelation: "installaties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keuringen_klant_id_fkey"
            columns: ["klant_id"]
            isOneToOne: false
            referencedRelation: "klanten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keuringen_next_keuring_id_fkey"
            columns: ["next_keuring_id"]
            isOneToOne: false
            referencedRelation: "keuringen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keuringen_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keuringen_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      klant_notities: {
        Row: {
          created_at: string
          id: string
          inhoud: string
          intern: boolean
          klant_id: string
          partner_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inhoud: string
          intern?: boolean
          klant_id: string
          partner_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inhoud?: string
          intern?: boolean
          klant_id?: string
          partner_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "klant_notities_klant_id_fkey"
            columns: ["klant_id"]
            isOneToOne: false
            referencedRelation: "klanten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "klant_notities_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "klant_notities_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "klant_notities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      klanten: {
        Row: {
          achternaam: string
          adres: string | null
          bedrijfsnaam: string | null
          created_at: string
          email: string | null
          extra_emails: string[]
          id: string
          lead_id: string | null
          notities: string | null
          offerte_id: string | null
          partner_id: string
          plaats: string | null
          postcode: string | null
          telefoon: string | null
          updated_at: string
          voornaam: string
        }
        Insert: {
          achternaam: string
          adres?: string | null
          bedrijfsnaam?: string | null
          created_at?: string
          email?: string | null
          extra_emails?: string[]
          id?: string
          lead_id?: string | null
          notities?: string | null
          offerte_id?: string | null
          partner_id: string
          plaats?: string | null
          postcode?: string | null
          telefoon?: string | null
          updated_at?: string
          voornaam: string
        }
        Update: {
          achternaam?: string
          adres?: string | null
          bedrijfsnaam?: string | null
          created_at?: string
          email?: string | null
          extra_emails?: string[]
          id?: string
          lead_id?: string | null
          notities?: string | null
          offerte_id?: string | null
          partner_id?: string
          plaats?: string | null
          postcode?: string | null
          telefoon?: string | null
          updated_at?: string
          voornaam?: string
        }
        Relationships: [
          {
            foreignKeyName: "klanten_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "klanten_offerte_id_fkey"
            columns: ["offerte_id"]
            isOneToOne: false
            referencedRelation: "offertes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "klanten_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "klanten_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      kortingscodes: {
        Row: {
          aantal_gebruikt: number
          actief: boolean
          affiliate_id: string | null
          code: string
          created_at: string
          geldig_tot: string | null
          id: string
          korting_type: string
          korting_waarde: number
          max_gebruik: number | null
        }
        Insert: {
          aantal_gebruikt?: number
          actief?: boolean
          affiliate_id?: string | null
          code: string
          created_at?: string
          geldig_tot?: string | null
          id?: string
          korting_type: string
          korting_waarde: number
          max_gebruik?: number | null
        }
        Update: {
          aantal_gebruikt?: number
          actief?: boolean
          affiliate_id?: string | null
          code?: string
          created_at?: string
          geldig_tot?: string | null
          id?: string
          korting_type?: string
          korting_waarde?: number
          max_gebruik?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kortingscodes_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_bronnen: {
        Row: {
          actief: boolean
          categorie: string
          created_at: string
          default_temperatuur:
            | Database["public"]["Enums"]["lead_temperatuur"]
            | null
          eigenaar_id: string | null
          id: string
          kleur: string
          label: string
          score_gewicht: number
          slug: string
          updated_at: string
          volgorde: number
        }
        Insert: {
          actief?: boolean
          categorie?: string
          created_at?: string
          default_temperatuur?:
            | Database["public"]["Enums"]["lead_temperatuur"]
            | null
          eigenaar_id?: string | null
          id?: string
          kleur?: string
          label: string
          score_gewicht?: number
          slug: string
          updated_at?: string
          volgorde?: number
        }
        Update: {
          actief?: boolean
          categorie?: string
          created_at?: string
          default_temperatuur?:
            | Database["public"]["Enums"]["lead_temperatuur"]
            | null
          eigenaar_id?: string | null
          id?: string
          kleur?: string
          label?: string
          score_gewicht?: number
          slug?: string
          updated_at?: string
          volgorde?: number
        }
        Relationships: []
      }
      lead_contactmomenten: {
        Row: {
          created_at: string | null
          gebeurd_op: string
          id: string
          klant_id: string | null
          lead_id: string | null
          notitie: string | null
          partner_id: string
          resultaat: string | null
          richting: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          gebeurd_op?: string
          id?: string
          klant_id?: string | null
          lead_id?: string | null
          notitie?: string | null
          partner_id: string
          resultaat?: string | null
          richting?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          gebeurd_op?: string
          id?: string
          klant_id?: string | null
          lead_id?: string | null
          notitie?: string | null
          partner_id?: string
          resultaat?: string | null
          richting?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_contactmomenten_klant_id_fkey"
            columns: ["klant_id"]
            isOneToOne: false
            referencedRelation: "klanten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_contactmomenten_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_contactmomenten_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_contactmomenten_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_contactmomenten_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_duplicaat_negeerlijst: {
        Row: {
          created_at: string
          genegeerd_door: string | null
          id: string
          lead_a_id: string
          lead_b_id: string
          partner_id: string
          reden: string | null
        }
        Insert: {
          created_at?: string
          genegeerd_door?: string | null
          id?: string
          lead_a_id: string
          lead_b_id: string
          partner_id: string
          reden?: string | null
        }
        Update: {
          created_at?: string
          genegeerd_door?: string | null
          id?: string
          lead_a_id?: string
          lead_b_id?: string
          partner_id?: string
          reden?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_duplicaat_negeerlijst_genegeerd_door_fkey"
            columns: ["genegeerd_door"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_duplicaat_negeerlijst_lead_a_id_fkey"
            columns: ["lead_a_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_duplicaat_negeerlijst_lead_b_id_fkey"
            columns: ["lead_b_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_duplicaat_negeerlijst_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_duplicaat_negeerlijst_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_duplicaat_negeerlijst_affiliate: {
        Row: {
          created_at: string
          eigenaar_id: string
          genegeerd_door: string
          id: string
          lead_a_id: string
          lead_b_id: string
          reden: string | null
        }
        Insert: {
          created_at?: string
          eigenaar_id: string
          genegeerd_door: string
          id?: string
          lead_a_id: string
          lead_b_id: string
          reden?: string | null
        }
        Update: {
          created_at?: string
          eigenaar_id?: string
          genegeerd_door?: string
          id?: string
          lead_a_id?: string
          lead_b_id?: string
          reden?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_duplicaat_negeerlijst_affiliate_lead_a_id_fkey"
            columns: ["lead_a_id"]
            isOneToOne: false
            referencedRelation: "affiliate_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_duplicaat_negeerlijst_affiliate_lead_b_id_fkey"
            columns: ["lead_b_id"]
            isOneToOne: false
            referencedRelation: "affiliate_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_eigenschappen: {
        Row: {
          aantal_panelen: number | null
          batterij_interesse: boolean | null
          bouwjaar: number | null
          created_at: string | null
          dakrichting: string | null
          daktype: string | null
          extra_json: Json | null
          gewenst_energielabel: string | null
          huidig_verbruik_kwh: number | null
          huidige_energielabel: string | null
          id: string
          isolatie_interesse: boolean | null
          laadpaal_interesse: boolean | null
          lead_id: string
          partner_id: string
          updated_at: string | null
          warmtepomp_interesse: boolean | null
          woningtype: string | null
        }
        Insert: {
          aantal_panelen?: number | null
          batterij_interesse?: boolean | null
          bouwjaar?: number | null
          created_at?: string | null
          dakrichting?: string | null
          daktype?: string | null
          extra_json?: Json | null
          gewenst_energielabel?: string | null
          huidig_verbruik_kwh?: number | null
          huidige_energielabel?: string | null
          id?: string
          isolatie_interesse?: boolean | null
          laadpaal_interesse?: boolean | null
          lead_id: string
          partner_id: string
          updated_at?: string | null
          warmtepomp_interesse?: boolean | null
          woningtype?: string | null
        }
        Update: {
          aantal_panelen?: number | null
          batterij_interesse?: boolean | null
          bouwjaar?: number | null
          created_at?: string | null
          dakrichting?: string | null
          daktype?: string | null
          extra_json?: Json | null
          gewenst_energielabel?: string | null
          huidig_verbruik_kwh?: number | null
          huidige_energielabel?: string | null
          id?: string
          isolatie_interesse?: boolean | null
          laadpaal_interesse?: boolean | null
          lead_id?: string
          partner_id?: string
          updated_at?: string | null
          warmtepomp_interesse?: boolean | null
          woningtype?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_eigenschappen_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_eigenschappen_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_eigenschappen_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notities: {
        Row: {
          created_at: string
          id: string
          inhoud: string
          intern: boolean
          lead_id: string
          partner_id: string
          titel: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inhoud: string
          intern?: boolean
          lead_id: string
          partner_id: string
          titel?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inhoud?: string
          intern?: boolean
          lead_id?: string
          partner_id?: string
          titel?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_notities_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_notities_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_notities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          achternaam: string
          adres: string | null
          bedrijfsnaam: string | null
          bron: string | null
          created_at: string
          email: string
          id: string
          lead_status: Database["public"]["Enums"]["lead_status"]
          notities: string | null
          owner_user_id: string | null
          partner_id: string
          plaats: string | null
          postcode: string | null
          telefoon: string | null
          toegewezen_aan: string | null
          updated_at: string
          voornaam: string
        }
        Insert: {
          achternaam: string
          adres?: string | null
          bedrijfsnaam?: string | null
          bron?: string | null
          created_at?: string
          email: string
          id?: string
          lead_status?: Database["public"]["Enums"]["lead_status"]
          notities?: string | null
          owner_user_id?: string | null
          partner_id: string
          plaats?: string | null
          postcode?: string | null
          telefoon?: string | null
          toegewezen_aan?: string | null
          updated_at?: string
          voornaam: string
        }
        Update: {
          achternaam?: string
          adres?: string | null
          bedrijfsnaam?: string | null
          bron?: string | null
          created_at?: string
          email?: string
          id?: string
          lead_status?: Database["public"]["Enums"]["lead_status"]
          notities?: string | null
          owner_user_id?: string | null
          partner_id?: string
          plaats?: string | null
          postcode?: string | null
          telefoon?: string | null
          toegewezen_aan?: string | null
          updated_at?: string
          voornaam?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_toegewezen_aan_fkey"
            columns: ["toegewezen_aan"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leverancier_artikelen: {
        Row: {
          created_at: string
          id: string
          inkoopprijs: number
          laatst_gewijzigd: string
          leverancier_artikelnummer: string | null
          leverancier_id: string
          levertijd_dagen: number | null
          min_bestelhoeveelheid: number
          notities: string | null
          partner_id: string
          product_id: string
          updated_at: string
          voorkeur: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          inkoopprijs?: number
          laatst_gewijzigd?: string
          leverancier_artikelnummer?: string | null
          leverancier_id: string
          levertijd_dagen?: number | null
          min_bestelhoeveelheid?: number
          notities?: string | null
          partner_id: string
          product_id: string
          updated_at?: string
          voorkeur?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          inkoopprijs?: number
          laatst_gewijzigd?: string
          leverancier_artikelnummer?: string | null
          leverancier_id?: string
          levertijd_dagen?: number | null
          min_bestelhoeveelheid?: number
          notities?: string | null
          partner_id?: string
          product_id?: string
          updated_at?: string
          voorkeur?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "leverancier_artikelen_leverancier_id_fkey"
            columns: ["leverancier_id"]
            isOneToOne: false
            referencedRelation: "leveranciers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leverancier_artikelen_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leverancier_artikelen_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leverancier_artikelen_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "producten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leverancier_artikelen_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "producten_publiek"
            referencedColumns: ["id"]
          },
        ]
      }
      leveranciers: {
        Row: {
          adres: string | null
          btw_nummer: string | null
          contactpersoon: string | null
          created_at: string
          email: string | null
          iban: string | null
          id: string
          kvk_nummer: string | null
          naam: string
          notities: string | null
          partner_id: string
          plaats: string | null
          postcode: string | null
          telefoon: string | null
          updated_at: string
        }
        Insert: {
          adres?: string | null
          btw_nummer?: string | null
          contactpersoon?: string | null
          created_at?: string
          email?: string | null
          iban?: string | null
          id?: string
          kvk_nummer?: string | null
          naam: string
          notities?: string | null
          partner_id: string
          plaats?: string | null
          postcode?: string | null
          telefoon?: string | null
          updated_at?: string
        }
        Update: {
          adres?: string | null
          btw_nummer?: string | null
          contactpersoon?: string | null
          created_at?: string
          email?: string | null
          iban?: string | null
          id?: string
          kvk_nummer?: string | null
          naam?: string
          notities?: string | null
          partner_id?: string
          plaats?: string | null
          postcode?: string | null
          telefoon?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      mfa_vereisten: {
        Row: {
          id: string
          partner_id: string
          rol: Database["public"]["Enums"]["app_role"]
          updated_at: string
          verplicht: boolean
        }
        Insert: {
          id?: string
          partner_id: string
          rol: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          verplicht?: boolean
        }
        Update: {
          id?: string
          partner_id?: string
          rol?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          verplicht?: boolean
        }
        Relationships: []
      }
      module_rol_toegang: {
        Row: {
          id: string
          module_key: string
          partner_id: string
          rol: Database["public"]["Enums"]["app_role"]
          toegestaan: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          module_key: string
          partner_id: string
          rol: Database["public"]["Enums"]["app_role"]
          toegestaan?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          module_key?: string
          partner_id?: string
          rol?: Database["public"]["Enums"]["app_role"]
          toegestaan?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "module_rol_toegang_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_rol_toegang_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_rol_toegang_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      module_user_override: {
        Row: {
          id: string
          module_key: string
          partner_id: string
          reden: string | null
          toegestaan: boolean
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          id?: string
          module_key: string
          partner_id: string
          reden?: string | null
          toegestaan: boolean
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          id?: string
          module_key?: string
          partner_id?: string
          reden?: string | null
          toegestaan?: boolean
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_user_override_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_user_override_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_user_override_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_user_override_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mollie_webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          mollie_customer_id: string | null
          mollie_mandate_id: string | null
          mollie_payment_id: string | null
          mollie_subscription_id: string | null
          payload: Json
          processed: boolean
          processed_at: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          mollie_customer_id?: string | null
          mollie_mandate_id?: string | null
          mollie_payment_id?: string | null
          mollie_subscription_id?: string | null
          payload?: Json
          processed?: boolean
          processed_at?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          mollie_customer_id?: string | null
          mollie_mandate_id?: string | null
          mollie_payment_id?: string | null
          mollie_subscription_id?: string | null
          payload?: Json
          processed?: boolean
          processed_at?: string | null
        }
        Relationships: []
      }
      notificatie_voorkeuren: {
        Row: {
          created_at: string
          email: boolean
          id: string
          in_app: boolean
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: boolean
          id?: string
          in_app?: boolean
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: boolean
          id?: string
          in_app?: boolean
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificatie_voorkeuren_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaties: {
        Row: {
          bericht: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          gelezen: boolean
          id: string
          titel: string
          type: string
          user_id: string
        }
        Insert: {
          bericht: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          gelezen?: boolean
          id?: string
          titel: string
          type: string
          user_id: string
        }
        Update: {
          bericht?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          gelezen?: boolean
          id?: string
          titel?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificaties_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      nummerreeks_config: {
        Row: {
          created_at: string
          huidig_jaar: number
          id: string
          jaarformaat: string
          padding: number
          partner_id: string
          prefix: string
          reset_per_jaar: boolean
          subtype: string
          type: string
          updated_at: string
          volgende_nummer: number
        }
        Insert: {
          created_at?: string
          huidig_jaar?: number
          id?: string
          jaarformaat?: string
          padding?: number
          partner_id: string
          prefix?: string
          reset_per_jaar?: boolean
          subtype?: string
          type: string
          updated_at?: string
          volgende_nummer?: number
        }
        Update: {
          created_at?: string
          huidig_jaar?: number
          id?: string
          jaarformaat?: string
          padding?: number
          partner_id?: string
          prefix?: string
          reset_per_jaar?: boolean
          subtype?: string
          type?: string
          updated_at?: string
          volgende_nummer?: number
        }
        Relationships: [
          {
            foreignKeyName: "nummerreeks_config_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nummerreeks_config_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      offerte_auto_herinnering_config: {
        Row: {
          actief: boolean
          alleen_werkdagen: boolean
          created_at: string
          dagen_na_verloop: number[]
          dagen_voor_verloop: number[]
          email_template_id: string | null
          id: string
          partner_id: string
          updated_at: string
        }
        Insert: {
          actief?: boolean
          alleen_werkdagen?: boolean
          created_at?: string
          dagen_na_verloop?: number[]
          dagen_voor_verloop?: number[]
          email_template_id?: string | null
          id?: string
          partner_id: string
          updated_at?: string
        }
        Update: {
          actief?: boolean
          alleen_werkdagen?: boolean
          created_at?: string
          dagen_na_verloop?: number[]
          dagen_voor_verloop?: number[]
          email_template_id?: string | null
          id?: string
          partner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offerte_auto_herinnering_config_email_template_id_fkey"
            columns: ["email_template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offerte_auto_herinnering_config_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offerte_auto_herinnering_config_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      offerte_auto_herinnering_log: {
        Row: {
          created_at: string
          dag_offset: number
          fase: string
          fout: string | null
          id: string
          offerte_id: string
          ontvanger_email: string | null
          partner_id: string
          verzonden_op: string
        }
        Insert: {
          created_at?: string
          dag_offset: number
          fase: string
          fout?: string | null
          id?: string
          offerte_id: string
          ontvanger_email?: string | null
          partner_id: string
          verzonden_op?: string
        }
        Update: {
          created_at?: string
          dag_offset?: number
          fase?: string
          fout?: string | null
          id?: string
          offerte_id?: string
          ontvanger_email?: string | null
          partner_id?: string
          verzonden_op?: string
        }
        Relationships: [
          {
            foreignKeyName: "offerte_auto_herinnering_log_offerte_id_fkey"
            columns: ["offerte_id"]
            isOneToOne: false
            referencedRelation: "offertes"
            referencedColumns: ["id"]
          },
        ]
      }
      offerte_berichten: {
        Row: {
          afzender_naam: string
          afzender_type: string
          bericht: string
          created_at: string
          id: string
          offerte_id: string
          share_token: string
        }
        Insert: {
          afzender_naam: string
          afzender_type: string
          bericht: string
          created_at?: string
          id?: string
          offerte_id: string
          share_token: string
        }
        Update: {
          afzender_naam?: string
          afzender_type?: string
          bericht?: string
          created_at?: string
          id?: string
          offerte_id?: string
          share_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "offerte_berichten_offerte_id_fkey"
            columns: ["offerte_id"]
            isOneToOne: false
            referencedRelation: "offertes"
            referencedColumns: ["id"]
          },
        ]
      }
      offerte_herinneringen: {
        Row: {
          created_at: string
          herinnering_datum: string
          id: string
          notitie: string | null
          offerte_id: string
          partner_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          herinnering_datum: string
          id?: string
          notitie?: string | null
          offerte_id: string
          partner_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          herinnering_datum?: string
          id?: string
          notitie?: string | null
          offerte_id?: string
          partner_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offerte_herinneringen_offerte_id_fkey"
            columns: ["offerte_id"]
            isOneToOne: false
            referencedRelation: "offertes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offerte_herinneringen_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offerte_herinneringen_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offerte_herinneringen_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      offerte_termijnschema: {
        Row: {
          created_at: string
          factuur_id: string | null
          id: string
          offerte_id: string
          omschrijving: string
          partner_id: string
          percentage: number
          status: string
          trigger_status: string | null
          updated_at: string
          volgnummer: number
        }
        Insert: {
          created_at?: string
          factuur_id?: string | null
          id?: string
          offerte_id: string
          omschrijving: string
          partner_id: string
          percentage: number
          status?: string
          trigger_status?: string | null
          updated_at?: string
          volgnummer: number
        }
        Update: {
          created_at?: string
          factuur_id?: string | null
          id?: string
          offerte_id?: string
          omschrijving?: string
          partner_id?: string
          percentage?: number
          status?: string
          trigger_status?: string | null
          updated_at?: string
          volgnummer?: number
        }
        Relationships: [
          {
            foreignKeyName: "offerte_termijnschema_factuur_id_fkey"
            columns: ["factuur_id"]
            isOneToOne: false
            referencedRelation: "financiele_documenten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offerte_termijnschema_offerte_id_fkey"
            columns: ["offerte_id"]
            isOneToOne: false
            referencedRelation: "offertes"
            referencedColumns: ["id"]
          },
        ]
      }
      offertes: {
        Row: {
          accepted_at: string | null
          accepted_ip: string | null
          adviseur_id: string | null
          afwijzing_categorie: string | null
          afwijzing_reden: string | null
          annulering_reden: string | null
          betalingsvoorwaarden: string | null
          btw_bedrag: number
          created_at: string
          feedback_berichten: Json | null
          garantie_voorwaarden: string | null
          gefactureerd_bedrag: number
          gefactureerd_op: string | null
          geldig_tot: string
          id: string
          include_energieadvies: boolean | null
          include_schouw: boolean | null
          installatie_termijn: string | null
          introductie_tekst: string | null
          klant_adres: string | null
          klant_email: string
          klant_naam: string
          klant_plaats: string | null
          klant_postcode: string | null
          klant_telefoon: string | null
          lead_id: string | null
          notities: string | null
          offertenummer: string
          partner_handtekening_data: string | null
          partner_handtekening_op: string | null
          partner_id: string | null
          regels: Json
          schouw_id: string | null
          share_expires_at: string | null
          share_token: string | null
          status: Database["public"]["Enums"]["offerte_status"]
          subtotaal: number
          template_config: Json | null
          totaal_bedrag: number
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_ip?: string | null
          adviseur_id?: string | null
          afwijzing_categorie?: string | null
          afwijzing_reden?: string | null
          annulering_reden?: string | null
          betalingsvoorwaarden?: string | null
          btw_bedrag?: number
          created_at?: string
          feedback_berichten?: Json | null
          garantie_voorwaarden?: string | null
          gefactureerd_bedrag?: number
          gefactureerd_op?: string | null
          geldig_tot?: string
          id?: string
          include_energieadvies?: boolean | null
          include_schouw?: boolean | null
          installatie_termijn?: string | null
          introductie_tekst?: string | null
          klant_adres?: string | null
          klant_email: string
          klant_naam: string
          klant_plaats?: string | null
          klant_postcode?: string | null
          klant_telefoon?: string | null
          lead_id?: string | null
          notities?: string | null
          offertenummer: string
          partner_handtekening_data?: string | null
          partner_handtekening_op?: string | null
          partner_id?: string | null
          regels?: Json
          schouw_id?: string | null
          share_expires_at?: string | null
          share_token?: string | null
          status?: Database["public"]["Enums"]["offerte_status"]
          subtotaal?: number
          template_config?: Json | null
          totaal_bedrag?: number
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_ip?: string | null
          adviseur_id?: string | null
          afwijzing_categorie?: string | null
          afwijzing_reden?: string | null
          annulering_reden?: string | null
          betalingsvoorwaarden?: string | null
          btw_bedrag?: number
          created_at?: string
          feedback_berichten?: Json | null
          garantie_voorwaarden?: string | null
          gefactureerd_bedrag?: number
          gefactureerd_op?: string | null
          geldig_tot?: string
          id?: string
          include_energieadvies?: boolean | null
          include_schouw?: boolean | null
          installatie_termijn?: string | null
          introductie_tekst?: string | null
          klant_adres?: string | null
          klant_email?: string
          klant_naam?: string
          klant_plaats?: string | null
          klant_postcode?: string | null
          klant_telefoon?: string | null
          lead_id?: string | null
          notities?: string | null
          offertenummer?: string
          partner_handtekening_data?: string | null
          partner_handtekening_op?: string | null
          partner_id?: string | null
          regels?: Json
          schouw_id?: string | null
          share_expires_at?: string | null
          share_token?: string | null
          status?: Database["public"]["Enums"]["offerte_status"]
          subtotaal?: number
          template_config?: Json | null
          totaal_bedrag?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offertes_adviseur_id_fkey"
            columns: ["adviseur_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offertes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offertes_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offertes_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offertes_schouw_id_fkey"
            columns: ["schouw_id"]
            isOneToOne: false
            referencedRelation: "schouwen"
            referencedColumns: ["id"]
          },
        ]
      }
      opdracht_zendingen: {
        Row: {
          afleverdatum: string | null
          created_at: string
          created_by: string | null
          foto_aflevering_url: string | null
          id: string
          notitie: string | null
          ontvangen_door: string | null
          opdracht_id: string
          partner_id: string
          status: string
          tracking_url: string | null
          trackingnummer: string | null
          updated_at: string
          vervoerder: string
          verwachte_leverdatum: string | null
          verzenddatum: string | null
        }
        Insert: {
          afleverdatum?: string | null
          created_at?: string
          created_by?: string | null
          foto_aflevering_url?: string | null
          id?: string
          notitie?: string | null
          ontvangen_door?: string | null
          opdracht_id: string
          partner_id: string
          status?: string
          tracking_url?: string | null
          trackingnummer?: string | null
          updated_at?: string
          vervoerder?: string
          verwachte_leverdatum?: string | null
          verzenddatum?: string | null
        }
        Update: {
          afleverdatum?: string | null
          created_at?: string
          created_by?: string | null
          foto_aflevering_url?: string | null
          id?: string
          notitie?: string | null
          ontvangen_door?: string | null
          opdracht_id?: string
          partner_id?: string
          status?: string
          tracking_url?: string | null
          trackingnummer?: string | null
          updated_at?: string
          vervoerder?: string
          verwachte_leverdatum?: string | null
          verzenddatum?: string | null
        }
        Relationships: []
      }
      opdrachten: {
        Row: {
          annulering_reden: string | null
          bevestiging_verzonden_op: string | null
          created_at: string
          id: string
          installatie_id: string | null
          klant_adres: string | null
          klant_email: string | null
          klant_naam: string
          klant_plaats: string | null
          klant_postcode: string | null
          klant_telefoon: string | null
          lead_id: string | null
          notities: string | null
          offerte_id: string | null
          partner_id: string
          regels: Json
          schouw_id: string | null
          status: Database["public"]["Enums"]["opdracht_status"]
          toegewezen_monteur_id: string | null
          totaal_bedrag: number
          updated_at: string
        }
        Insert: {
          annulering_reden?: string | null
          bevestiging_verzonden_op?: string | null
          created_at?: string
          id?: string
          installatie_id?: string | null
          klant_adres?: string | null
          klant_email?: string | null
          klant_naam: string
          klant_plaats?: string | null
          klant_postcode?: string | null
          klant_telefoon?: string | null
          lead_id?: string | null
          notities?: string | null
          offerte_id?: string | null
          partner_id: string
          regels?: Json
          schouw_id?: string | null
          status?: Database["public"]["Enums"]["opdracht_status"]
          toegewezen_monteur_id?: string | null
          totaal_bedrag?: number
          updated_at?: string
        }
        Update: {
          annulering_reden?: string | null
          bevestiging_verzonden_op?: string | null
          created_at?: string
          id?: string
          installatie_id?: string | null
          klant_adres?: string | null
          klant_email?: string | null
          klant_naam?: string
          klant_plaats?: string | null
          klant_postcode?: string | null
          klant_telefoon?: string | null
          lead_id?: string | null
          notities?: string | null
          offerte_id?: string | null
          partner_id?: string
          regels?: Json
          schouw_id?: string | null
          status?: Database["public"]["Enums"]["opdracht_status"]
          toegewezen_monteur_id?: string | null
          totaal_bedrag?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opdrachten_installatie_id_fkey"
            columns: ["installatie_id"]
            isOneToOne: false
            referencedRelation: "installaties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opdrachten_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opdrachten_offerte_id_fkey"
            columns: ["offerte_id"]
            isOneToOne: false
            referencedRelation: "offertes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opdrachten_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opdrachten_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opdrachten_schouw_id_fkey"
            columns: ["schouw_id"]
            isOneToOne: false
            referencedRelation: "schouwen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opdrachten_toegewezen_monteur_id_fkey"
            columns: ["toegewezen_monteur_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      opleverrapport_audit: {
        Row: {
          actie: string
          actor_id: string | null
          created_at: string
          details: Json
          id: string
          ip: string | null
          partner_id: string
          rapport_id: string
        }
        Insert: {
          actie: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          ip?: string | null
          partner_id: string
          rapport_id: string
        }
        Update: {
          actie?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          ip?: string | null
          partner_id?: string
          rapport_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opleverrapport_audit_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "opleverrapporten"
            referencedColumns: ["id"]
          },
        ]
      }
      opleverrapport_pdf_versies: {
        Row: {
          bestandsgrootte: number | null
          created_at: string
          gegenereerd_door: string | null
          id: string
          partner_id: string
          pdf_hash: string
          pdf_path: string
          rapport_id: string
          reden: string | null
          status_op_moment: string | null
          versie: number
        }
        Insert: {
          bestandsgrootte?: number | null
          created_at?: string
          gegenereerd_door?: string | null
          id?: string
          partner_id: string
          pdf_hash: string
          pdf_path: string
          rapport_id: string
          reden?: string | null
          status_op_moment?: string | null
          versie: number
        }
        Update: {
          bestandsgrootte?: number | null
          created_at?: string
          gegenereerd_door?: string | null
          id?: string
          partner_id?: string
          pdf_hash?: string
          pdf_path?: string
          rapport_id?: string
          reden?: string | null
          status_op_moment?: string | null
          versie?: number
        }
        Relationships: [
          {
            foreignKeyName: "opleverrapport_pdf_versies_gegenereerd_door_fkey"
            columns: ["gegenereerd_door"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opleverrapport_pdf_versies_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opleverrapport_pdf_versies_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opleverrapport_pdf_versies_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "opleverrapporten"
            referencedColumns: ["id"]
          },
        ]
      }
      opleverrapporten: {
        Row: {
          backup_box_spec: Json
          batterij_spec: Json
          bevindingen: Json
          conformiteitstekst: string | null
          created_at: string
          created_by: string
          documenten: Json
          duplicaat_reden: string | null
          duplicaat_van_id: string | null
          extra_velden: Json
          gefinaliseerd_op: string | null
          groepenverdeling: Json
          id: string
          installateur_handtekening: Json | null
          installateur_id: string | null
          installatie_id: string | null
          klant_handtekening: Json | null
          klant_id: string | null
          klant_token: string | null
          klant_token_expires_at: string | null
          klant_view_token: string | null
          klant_view_token_expires_at: string | null
          meetapparatuur: Json
          metingen: Json
          omvormer_spec: Json
          opdracht_id: string | null
          opleverdatum: string | null
          opstelling: Json
          partner_id: string
          pdf_hash: string | null
          pdf_url: string | null
          rapportnummer: string
          scope_omschrijving: string | null
          status: string
          template_versie: string
          updated_at: string
          vervallen: boolean
          vervallen_door: string | null
          vervallen_op: string | null
          vervallen_reden: string | null
          vervallen_reden_categorie: string | null
          vervangen_door_id: string | null
          vervangt_id: string | null
          visuele_inspectie: Json
        }
        Insert: {
          backup_box_spec?: Json
          batterij_spec?: Json
          bevindingen?: Json
          conformiteitstekst?: string | null
          created_at?: string
          created_by: string
          documenten?: Json
          duplicaat_reden?: string | null
          duplicaat_van_id?: string | null
          extra_velden?: Json
          gefinaliseerd_op?: string | null
          groepenverdeling?: Json
          id?: string
          installateur_handtekening?: Json | null
          installateur_id?: string | null
          installatie_id?: string | null
          klant_handtekening?: Json | null
          klant_id?: string | null
          klant_token?: string | null
          klant_token_expires_at?: string | null
          klant_view_token?: string | null
          klant_view_token_expires_at?: string | null
          meetapparatuur?: Json
          metingen?: Json
          omvormer_spec?: Json
          opdracht_id?: string | null
          opleverdatum?: string | null
          opstelling?: Json
          partner_id: string
          pdf_hash?: string | null
          pdf_url?: string | null
          rapportnummer: string
          scope_omschrijving?: string | null
          status?: string
          template_versie?: string
          updated_at?: string
          vervallen?: boolean
          vervallen_door?: string | null
          vervallen_op?: string | null
          vervallen_reden?: string | null
          vervallen_reden_categorie?: string | null
          vervangen_door_id?: string | null
          vervangt_id?: string | null
          visuele_inspectie?: Json
        }
        Update: {
          backup_box_spec?: Json
          batterij_spec?: Json
          bevindingen?: Json
          conformiteitstekst?: string | null
          created_at?: string
          created_by?: string
          documenten?: Json
          duplicaat_reden?: string | null
          duplicaat_van_id?: string | null
          extra_velden?: Json
          gefinaliseerd_op?: string | null
          groepenverdeling?: Json
          id?: string
          installateur_handtekening?: Json | null
          installateur_id?: string | null
          installatie_id?: string | null
          klant_handtekening?: Json | null
          klant_id?: string | null
          klant_token?: string | null
          klant_token_expires_at?: string | null
          klant_view_token?: string | null
          klant_view_token_expires_at?: string | null
          meetapparatuur?: Json
          metingen?: Json
          omvormer_spec?: Json
          opdracht_id?: string | null
          opleverdatum?: string | null
          opstelling?: Json
          partner_id?: string
          pdf_hash?: string | null
          pdf_url?: string | null
          rapportnummer?: string
          scope_omschrijving?: string | null
          status?: string
          template_versie?: string
          updated_at?: string
          vervallen?: boolean
          vervallen_door?: string | null
          vervallen_op?: string | null
          vervallen_reden?: string | null
          vervallen_reden_categorie?: string | null
          vervangen_door_id?: string | null
          vervangt_id?: string | null
          visuele_inspectie?: Json
        }
        Relationships: [
          {
            foreignKeyName: "opleverrapporten_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opleverrapporten_duplicaat_van_id_fkey"
            columns: ["duplicaat_van_id"]
            isOneToOne: false
            referencedRelation: "opleverrapporten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opleverrapporten_installateur_id_fkey"
            columns: ["installateur_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opleverrapporten_installatie_id_fkey"
            columns: ["installatie_id"]
            isOneToOne: false
            referencedRelation: "installaties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opleverrapporten_klant_id_fkey"
            columns: ["klant_id"]
            isOneToOne: false
            referencedRelation: "klanten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opleverrapporten_opdracht_id_fkey"
            columns: ["opdracht_id"]
            isOneToOne: false
            referencedRelation: "opdrachten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opleverrapporten_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opleverrapporten_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opleverrapporten_vervallen_door_fkey"
            columns: ["vervallen_door"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opleverrapporten_vervangen_door_id_fkey"
            columns: ["vervangen_door_id"]
            isOneToOne: false
            referencedRelation: "opleverrapporten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opleverrapporten_vervangt_id_fkey"
            columns: ["vervangt_id"]
            isOneToOne: false
            referencedRelation: "opleverrapporten"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_api_rate_log: {
        Row: {
          count: number
          minute_bucket: string
          partner_id: string
        }
        Insert: {
          count?: number
          minute_bucket: string
          partner_id: string
        }
        Update: {
          count?: number
          minute_bucket?: string
          partner_id?: string
        }
        Relationships: []
      }
      partner_api_tokens: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          label: string
          last_used_at: string | null
          partner_id: string
          revoked_at: string | null
          revoked_by: string | null
          token_hash: string
          token_prefix: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string
          last_used_at?: string | null
          partner_id: string
          revoked_at?: string | null
          revoked_by?: string | null
          token_hash: string
          token_prefix: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string
          last_used_at?: string | null
          partner_id?: string
          revoked_at?: string | null
          revoked_by?: string | null
          token_hash?: string
          token_prefix?: string
        }
        Relationships: []
      }
      partner_merken: {
        Row: {
          created_at: string
          id: string
          intro_html: string | null
          logo_url: string | null
          merk: string
          partner_id: string
          slug: string
          toon_op_website: boolean
          updated_at: string
          volgorde: number
        }
        Insert: {
          created_at?: string
          id?: string
          intro_html?: string | null
          logo_url?: string | null
          merk: string
          partner_id: string
          slug: string
          toon_op_website?: boolean
          updated_at?: string
          volgorde?: number
        }
        Update: {
          created_at?: string
          id?: string
          intro_html?: string | null
          logo_url?: string | null
          merk?: string
          partner_id?: string
          slug?: string
          toon_op_website?: boolean
          updated_at?: string
          volgorde?: number
        }
        Relationships: []
      }
      partner_product_datasheets: {
        Row: {
          created_at: string
          datasheet_type: string
          datasheet_url: string | null
          generated_specs: Json | null
          id: string
          partner_id: string
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          datasheet_type?: string
          datasheet_url?: string | null
          generated_specs?: Json | null
          id?: string
          partner_id: string
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          datasheet_type?: string
          datasheet_url?: string | null
          generated_specs?: Json | null
          id?: string
          partner_id?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_product_datasheets_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_product_datasheets_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_product_datasheets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "producten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_product_datasheets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "producten_publiek"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_product_teksten: {
        Row: {
          created_at: string | null
          id: string
          offerte_tekst: string | null
          partner_id: string
          product_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          offerte_tekst?: string | null
          partner_id: string
          product_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          offerte_tekst?: string | null
          partner_id?: string
          product_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_product_teksten_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_product_teksten_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_product_teksten_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "producten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_product_teksten_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "producten_publiek"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          abonnement_type: string | null
          adres: string | null
          adviseurs_delen_schouwen: boolean
          affiliate_sinds: string | null
          afzender_email: string | null
          afzender_naam: string | null
          bedrijfsslogan: string | null
          betalingsvoorwaarden_config: Json | null
          bic: string | null
          btw: string | null
          commissie_percentage: number | null
          contactpersoon_achternaam: string | null
          contactpersoon_email: string | null
          contactpersoon_functie: string | null
          contactpersoon_telefoon: string | null
          contactpersoon_voornaam: string | null
          contract_startdatum: string | null
          contract_type: string | null
          created_at: string
          demo_data_geseed_door_id: string | null
          demo_data_geseed_op: string | null
          email: string | null
          email_provider: string | null
          feature_flags_json: Json | null
          iban: string | null
          iban_tnv: string | null
          id: string
          imap_host: string | null
          imap_pass_encrypted: string | null
          imap_port: number | null
          imap_use_ssl: boolean | null
          imap_user: string | null
          is_affiliate: boolean
          kvk: string | null
          lead_bronnen: Json | null
          licentie_adviseurs: number | null
          licentie_installateurs: number | null
          logo_url: string | null
          logo_url_donker: string | null
          mollie_customer_id: string | null
          mollie_mandate_id: string | null
          mollie_mandate_status: string | null
          naam: string
          notities: string | null
          partner_slug: string | null
          plaats: string | null
          postcode: string | null
          primaire_kleur: string | null
          secundaire_kleur: string | null
          smtp_host: string | null
          smtp_pass_encrypted: string | null
          smtp_port: number | null
          smtp_user: string | null
          status: Database["public"]["Enums"]["partner_status"]
          telefoonnummer: string | null
          trial_aangemaakt_door_id: string | null
          trial_aangemaakt_op: string | null
          trial_einddatum: string | null
          updated_at: string
          voorwaarden_pdf_url: string | null
          website: string | null
        }
        Insert: {
          abonnement_type?: string | null
          adres?: string | null
          adviseurs_delen_schouwen?: boolean
          affiliate_sinds?: string | null
          afzender_email?: string | null
          afzender_naam?: string | null
          bedrijfsslogan?: string | null
          betalingsvoorwaarden_config?: Json | null
          bic?: string | null
          btw?: string | null
          commissie_percentage?: number | null
          contactpersoon_achternaam?: string | null
          contactpersoon_email?: string | null
          contactpersoon_functie?: string | null
          contactpersoon_telefoon?: string | null
          contactpersoon_voornaam?: string | null
          contract_startdatum?: string | null
          contract_type?: string | null
          created_at?: string
          demo_data_geseed_door_id?: string | null
          demo_data_geseed_op?: string | null
          email?: string | null
          email_provider?: string | null
          feature_flags_json?: Json | null
          iban?: string | null
          iban_tnv?: string | null
          id?: string
          imap_host?: string | null
          imap_pass_encrypted?: string | null
          imap_port?: number | null
          imap_use_ssl?: boolean | null
          imap_user?: string | null
          is_affiliate?: boolean
          kvk?: string | null
          lead_bronnen?: Json | null
          licentie_adviseurs?: number | null
          licentie_installateurs?: number | null
          logo_url?: string | null
          logo_url_donker?: string | null
          mollie_customer_id?: string | null
          mollie_mandate_id?: string | null
          mollie_mandate_status?: string | null
          naam: string
          notities?: string | null
          partner_slug?: string | null
          plaats?: string | null
          postcode?: string | null
          primaire_kleur?: string | null
          secundaire_kleur?: string | null
          smtp_host?: string | null
          smtp_pass_encrypted?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          status?: Database["public"]["Enums"]["partner_status"]
          telefoonnummer?: string | null
          trial_aangemaakt_door_id?: string | null
          trial_aangemaakt_op?: string | null
          trial_einddatum?: string | null
          updated_at?: string
          voorwaarden_pdf_url?: string | null
          website?: string | null
        }
        Update: {
          abonnement_type?: string | null
          adres?: string | null
          adviseurs_delen_schouwen?: boolean
          affiliate_sinds?: string | null
          afzender_email?: string | null
          afzender_naam?: string | null
          bedrijfsslogan?: string | null
          betalingsvoorwaarden_config?: Json | null
          bic?: string | null
          btw?: string | null
          commissie_percentage?: number | null
          contactpersoon_achternaam?: string | null
          contactpersoon_email?: string | null
          contactpersoon_functie?: string | null
          contactpersoon_telefoon?: string | null
          contactpersoon_voornaam?: string | null
          contract_startdatum?: string | null
          contract_type?: string | null
          created_at?: string
          demo_data_geseed_door_id?: string | null
          demo_data_geseed_op?: string | null
          email?: string | null
          email_provider?: string | null
          feature_flags_json?: Json | null
          iban?: string | null
          iban_tnv?: string | null
          id?: string
          imap_host?: string | null
          imap_pass_encrypted?: string | null
          imap_port?: number | null
          imap_use_ssl?: boolean | null
          imap_user?: string | null
          is_affiliate?: boolean
          kvk?: string | null
          lead_bronnen?: Json | null
          licentie_adviseurs?: number | null
          licentie_installateurs?: number | null
          logo_url?: string | null
          logo_url_donker?: string | null
          mollie_customer_id?: string | null
          mollie_mandate_id?: string | null
          mollie_mandate_status?: string | null
          naam?: string
          notities?: string | null
          partner_slug?: string | null
          plaats?: string | null
          postcode?: string | null
          primaire_kleur?: string | null
          secundaire_kleur?: string | null
          smtp_host?: string | null
          smtp_pass_encrypted?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          status?: Database["public"]["Enums"]["partner_status"]
          telefoonnummer?: string | null
          trial_aangemaakt_door_id?: string | null
          trial_aangemaakt_op?: string | null
          trial_einddatum?: string | null
          updated_at?: string
          voorwaarden_pdf_url?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partners_demo_data_geseed_door_id_fkey"
            columns: ["demo_data_geseed_door_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partners_trial_aangemaakt_door_id_fkey"
            columns: ["trial_aangemaakt_door_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_configuraties: {
        Row: {
          created_at: string
          default_temperatuur:
            | Database["public"]["Enums"]["lead_temperatuur"]
            | null
          fase_key: string
          id: string
          is_eindfase: boolean
          is_won: boolean
          kleur: string
          label: string
          sla_dagen: number | null
          updated_at: string
          user_id: string
          vereist_volgende_actie: boolean
          volgorde: number
          zichtbaar: boolean
        }
        Insert: {
          created_at?: string
          default_temperatuur?:
            | Database["public"]["Enums"]["lead_temperatuur"]
            | null
          fase_key: string
          id?: string
          is_eindfase?: boolean
          is_won?: boolean
          kleur?: string
          label: string
          sla_dagen?: number | null
          updated_at?: string
          user_id: string
          vereist_volgende_actie?: boolean
          volgorde?: number
          zichtbaar?: boolean
        }
        Update: {
          created_at?: string
          default_temperatuur?:
            | Database["public"]["Enums"]["lead_temperatuur"]
            | null
          fase_key?: string
          id?: string
          is_eindfase?: boolean
          is_won?: boolean
          kleur?: string
          label?: string
          sla_dagen?: number | null
          updated_at?: string
          user_id?: string
          vereist_volgende_actie?: boolean
          volgorde?: number
          zichtbaar?: boolean
        }
        Relationships: []
      }
      product_componenten: {
        Row: {
          aantal: number
          assemblage_id: string
          component_id: string
          created_at: string
          id: string
          partner_id: string
          updated_at: string
          verplicht: boolean
          volgorde: number
        }
        Insert: {
          aantal?: number
          assemblage_id: string
          component_id: string
          created_at?: string
          id?: string
          partner_id: string
          updated_at?: string
          verplicht?: boolean
          volgorde?: number
        }
        Update: {
          aantal?: number
          assemblage_id?: string
          component_id?: string
          created_at?: string
          id?: string
          partner_id?: string
          updated_at?: string
          verplicht?: boolean
          volgorde?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_componenten_assemblage_id_fkey"
            columns: ["assemblage_id"]
            isOneToOne: false
            referencedRelation: "producten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_componenten_assemblage_id_fkey"
            columns: ["assemblage_id"]
            isOneToOne: false
            referencedRelation: "producten_publiek"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_componenten_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "producten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_componenten_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "producten_publiek"
            referencedColumns: ["id"]
          },
        ]
      }
      product_kostprijs_historie: {
        Row: {
          created_at: string
          gewijzigd_door: string | null
          id: string
          nieuwe_kostprijs: number
          oude_kostprijs: number | null
          partner_id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          gewijzigd_door?: string | null
          id?: string
          nieuwe_kostprijs: number
          oude_kostprijs?: number | null
          partner_id: string
          product_id: string
        }
        Update: {
          created_at?: string
          gewijzigd_door?: string | null
          id?: string
          nieuwe_kostprijs?: number
          oude_kostprijs?: number | null
          partner_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_kostprijs_historie_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "producten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_kostprijs_historie_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "producten_publiek"
            referencedColumns: ["id"]
          },
        ]
      }
      product_serienummers: {
        Row: {
          component_type: string | null
          created_at: string
          garantie_einddatum: string | null
          garantie_maanden: number | null
          geregistreerd_door: string | null
          id: string
          installatie_id: string | null
          klant_id: string | null
          levering_datum: string | null
          notitie: string | null
          opdracht_id: string | null
          partner_id: string
          product_id: string
          serienummer: string
          status: string
          updated_at: string
          zending_id: string | null
        }
        Insert: {
          component_type?: string | null
          created_at?: string
          garantie_einddatum?: string | null
          garantie_maanden?: number | null
          geregistreerd_door?: string | null
          id?: string
          installatie_id?: string | null
          klant_id?: string | null
          levering_datum?: string | null
          notitie?: string | null
          opdracht_id?: string | null
          partner_id: string
          product_id: string
          serienummer: string
          status?: string
          updated_at?: string
          zending_id?: string | null
        }
        Update: {
          component_type?: string | null
          created_at?: string
          garantie_einddatum?: string | null
          garantie_maanden?: number | null
          geregistreerd_door?: string | null
          id?: string
          installatie_id?: string | null
          klant_id?: string | null
          levering_datum?: string | null
          notitie?: string | null
          opdracht_id?: string | null
          partner_id?: string
          product_id?: string
          serienummer?: string
          status?: string
          updated_at?: string
          zending_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_serienummers_zending_id_fkey"
            columns: ["zending_id"]
            isOneToOne: false
            referencedRelation: "opdracht_zendingen"
            referencedColumns: ["id"]
          },
        ]
      }
      producten: {
        Row: {
          afbeelding_url: string | null
          afbeeldingen: Json | null
          artikelnummer: string | null
          btw_percentage: number | null
          categorie: Database["public"]["Enums"]["product_categorie"]
          certificeringen: string | null
          created_at: string
          datasheet_type: string | null
          datasheet_url: string | null
          ean_code: string | null
          eenheid: string | null
          garantie_jaren: number | null
          gebruiker_handleiding_naam: string | null
          gebruiker_handleiding_url: string | null
          heeft_backup_box: boolean
          heeft_serienummer: boolean
          id: string
          installatie_handleiding_naam: string | null
          installatie_handleiding_url: string | null
          installatie_instructies: string | null
          is_assemblage: boolean
          kostprijs: number | null
          leverancier: string | null
          levertijd: string | null
          marge_opslag_percentage: number
          max_korting_euro: number | null
          max_korting_percentage: number | null
          merk: string | null
          min_voorraad: number
          model: string | null
          naam: string
          offerte_tekst: string | null
          omschrijving: string | null
          omvormer_modulair: boolean
          onderhoud: string | null
          partner_id: string | null
          prijs_excl_btw: number
          prijs_strategie: string
          product_code: string | null
          specs: Json | null
          status: Database["public"]["Enums"]["product_status"]
          toon_op_website: boolean
          updated_at: string
          voorraad: number | null
          website_ai_gegenereerd: boolean
          website_faq: Json
          website_omschrijving: string | null
          website_pitch: string | null
          website_slug: string | null
          website_usps: Json
        }
        Insert: {
          afbeelding_url?: string | null
          afbeeldingen?: Json | null
          artikelnummer?: string | null
          btw_percentage?: number | null
          categorie: Database["public"]["Enums"]["product_categorie"]
          certificeringen?: string | null
          created_at?: string
          datasheet_type?: string | null
          datasheet_url?: string | null
          ean_code?: string | null
          eenheid?: string | null
          garantie_jaren?: number | null
          gebruiker_handleiding_naam?: string | null
          gebruiker_handleiding_url?: string | null
          heeft_backup_box?: boolean
          heeft_serienummer?: boolean
          id?: string
          installatie_handleiding_naam?: string | null
          installatie_handleiding_url?: string | null
          installatie_instructies?: string | null
          is_assemblage?: boolean
          kostprijs?: number | null
          leverancier?: string | null
          levertijd?: string | null
          marge_opslag_percentage?: number
          max_korting_euro?: number | null
          max_korting_percentage?: number | null
          merk?: string | null
          min_voorraad?: number
          model?: string | null
          naam: string
          offerte_tekst?: string | null
          omschrijving?: string | null
          omvormer_modulair?: boolean
          onderhoud?: string | null
          partner_id?: string | null
          prijs_excl_btw?: number
          prijs_strategie?: string
          product_code?: string | null
          specs?: Json | null
          status?: Database["public"]["Enums"]["product_status"]
          toon_op_website?: boolean
          updated_at?: string
          voorraad?: number | null
          website_ai_gegenereerd?: boolean
          website_faq?: Json
          website_omschrijving?: string | null
          website_pitch?: string | null
          website_slug?: string | null
          website_usps?: Json
        }
        Update: {
          afbeelding_url?: string | null
          afbeeldingen?: Json | null
          artikelnummer?: string | null
          btw_percentage?: number | null
          categorie?: Database["public"]["Enums"]["product_categorie"]
          certificeringen?: string | null
          created_at?: string
          datasheet_type?: string | null
          datasheet_url?: string | null
          ean_code?: string | null
          eenheid?: string | null
          garantie_jaren?: number | null
          gebruiker_handleiding_naam?: string | null
          gebruiker_handleiding_url?: string | null
          heeft_backup_box?: boolean
          heeft_serienummer?: boolean
          id?: string
          installatie_handleiding_naam?: string | null
          installatie_handleiding_url?: string | null
          installatie_instructies?: string | null
          is_assemblage?: boolean
          kostprijs?: number | null
          leverancier?: string | null
          levertijd?: string | null
          marge_opslag_percentage?: number
          max_korting_euro?: number | null
          max_korting_percentage?: number | null
          merk?: string | null
          min_voorraad?: number
          model?: string | null
          naam?: string
          offerte_tekst?: string | null
          omschrijving?: string | null
          omvormer_modulair?: boolean
          onderhoud?: string | null
          partner_id?: string | null
          prijs_excl_btw?: number
          prijs_strategie?: string
          product_code?: string | null
          specs?: Json | null
          status?: Database["public"]["Enums"]["product_status"]
          toon_op_website?: boolean
          updated_at?: string
          voorraad?: number | null
          website_ai_gegenereerd?: boolean
          website_faq?: Json
          website_omschrijving?: string | null
          website_pitch?: string | null
          website_slug?: string | null
          website_usps?: Json
        }
        Relationships: [
          {
            foreignKeyName: "producten_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producten_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      retouren: {
        Row: {
          afgehandeld_door: string | null
          afgehandeld_op: string | null
          created_at: string
          creditnota_id: string | null
          fotos: Json | null
          gemaakt_door: string | null
          id: string
          inkooporder_id: string | null
          installatie_id: string | null
          klant_id: string | null
          leverancier_id: string | null
          notities: string | null
          opdracht_id: string | null
          oplossing: string | null
          partner_id: string
          reden: string
          regels: Json
          rma_nummer: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          afgehandeld_door?: string | null
          afgehandeld_op?: string | null
          created_at?: string
          creditnota_id?: string | null
          fotos?: Json | null
          gemaakt_door?: string | null
          id?: string
          inkooporder_id?: string | null
          installatie_id?: string | null
          klant_id?: string | null
          leverancier_id?: string | null
          notities?: string | null
          opdracht_id?: string | null
          oplossing?: string | null
          partner_id: string
          reden: string
          regels?: Json
          rma_nummer: string
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          afgehandeld_door?: string | null
          afgehandeld_op?: string | null
          created_at?: string
          creditnota_id?: string | null
          fotos?: Json | null
          gemaakt_door?: string | null
          id?: string
          inkooporder_id?: string | null
          installatie_id?: string | null
          klant_id?: string | null
          leverancier_id?: string | null
          notities?: string | null
          opdracht_id?: string | null
          oplossing?: string | null
          partner_id?: string
          reden?: string
          regels?: Json
          rma_nummer?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "retouren_afgehandeld_door_fkey"
            columns: ["afgehandeld_door"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retouren_creditnota_id_fkey"
            columns: ["creditnota_id"]
            isOneToOne: false
            referencedRelation: "financiele_documenten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retouren_gemaakt_door_fkey"
            columns: ["gemaakt_door"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retouren_inkooporder_id_fkey"
            columns: ["inkooporder_id"]
            isOneToOne: false
            referencedRelation: "financiele_documenten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retouren_installatie_id_fkey"
            columns: ["installatie_id"]
            isOneToOne: false
            referencedRelation: "installaties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retouren_klant_id_fkey"
            columns: ["klant_id"]
            isOneToOne: false
            referencedRelation: "klanten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retouren_leverancier_id_fkey"
            columns: ["leverancier_id"]
            isOneToOne: false
            referencedRelation: "leveranciers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retouren_opdracht_id_fkey"
            columns: ["opdracht_id"]
            isOneToOne: false
            referencedRelation: "opdrachten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retouren_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retouren_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_briefings: {
        Row: {
          created_at: string
          datum: string
          gebruiker_id: string
          id: string
          inhoud: Json
        }
        Insert: {
          created_at?: string
          datum?: string
          gebruiker_id: string
          id?: string
          inhoud: Json
        }
        Update: {
          created_at?: string
          datum?: string
          gebruiker_id?: string
          id?: string
          inhoud?: Json
        }
        Relationships: []
      }
      sales_coaching_tips: {
        Row: {
          context: Json | null
          created_at: string
          eigenaar_id: string
          gegenereerd_op: string
          id: string
          tips: Json
        }
        Insert: {
          context?: Json | null
          created_at?: string
          eigenaar_id: string
          gegenereerd_op?: string
          id?: string
          tips: Json
        }
        Update: {
          context?: Json | null
          created_at?: string
          eigenaar_id?: string
          gegenereerd_op?: string
          id?: string
          tips?: Json
        }
        Relationships: []
      }
      sales_snippets: {
        Row: {
          actief: boolean
          body: string
          created_at: string
          eigenaar_id: string
          id: string
          kanaal: string
          onderwerp: string | null
          temperatuur: Database["public"]["Enums"]["lead_temperatuur"] | null
          titel: string
          updated_at: string
          volgorde: number
        }
        Insert: {
          actief?: boolean
          body: string
          created_at?: string
          eigenaar_id?: string
          id?: string
          kanaal: string
          onderwerp?: string | null
          temperatuur?: Database["public"]["Enums"]["lead_temperatuur"] | null
          titel: string
          updated_at?: string
          volgorde?: number
        }
        Update: {
          actief?: boolean
          body?: string
          created_at?: string
          eigenaar_id?: string
          id?: string
          kanaal?: string
          onderwerp?: string | null
          temperatuur?: Database["public"]["Enums"]["lead_temperatuur"] | null
          titel?: string
          updated_at?: string
          volgorde?: number
        }
        Relationships: []
      }
      sales_tags: {
        Row: {
          aangemaakt_door: string | null
          created_at: string
          id: string
          kleur: string | null
          label: string
          omschrijving: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          aangemaakt_door?: string | null
          created_at?: string
          id?: string
          kleur?: string | null
          label: string
          omschrijving?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          aangemaakt_door?: string | null
          created_at?: string
          id?: string
          kleur?: string | null
          label?: string
          omschrijving?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      schouwen: {
        Row: {
          aandachtspunten: string | null
          adviseur_id: string | null
          categorie: Database["public"]["Enums"]["schouw_categorie"]
          checklist: Json | null
          consument_naam: string | null
          created_at: string
          fotos: Json | null
          gegevens: Json | null
          geplande_datum: string
          handtekening_akkoord_op: string | null
          handtekening_data: string | null
          id: string
          installateur_id: string | null
          is_self_service: boolean
          klant_email: string | null
          lead_id: string
          notities: string | null
          partner_id: string
          schouw_nummer: string
          self_service_completed_at: string | null
          self_service_token: string
          status: Database["public"]["Enums"]["schouw_status"]
          updated_at: string
        }
        Insert: {
          aandachtspunten?: string | null
          adviseur_id?: string | null
          categorie: Database["public"]["Enums"]["schouw_categorie"]
          checklist?: Json | null
          consument_naam?: string | null
          created_at?: string
          fotos?: Json | null
          gegevens?: Json | null
          geplande_datum: string
          handtekening_akkoord_op?: string | null
          handtekening_data?: string | null
          id?: string
          installateur_id?: string | null
          is_self_service?: boolean
          klant_email?: string | null
          lead_id: string
          notities?: string | null
          partner_id: string
          schouw_nummer: string
          self_service_completed_at?: string | null
          self_service_token?: string
          status?: Database["public"]["Enums"]["schouw_status"]
          updated_at?: string
        }
        Update: {
          aandachtspunten?: string | null
          adviseur_id?: string | null
          categorie?: Database["public"]["Enums"]["schouw_categorie"]
          checklist?: Json | null
          consument_naam?: string | null
          created_at?: string
          fotos?: Json | null
          gegevens?: Json | null
          geplande_datum?: string
          handtekening_akkoord_op?: string | null
          handtekening_data?: string | null
          id?: string
          installateur_id?: string | null
          is_self_service?: boolean
          klant_email?: string | null
          lead_id?: string
          notities?: string | null
          partner_id?: string
          schouw_nummer?: string
          self_service_completed_at?: string | null
          self_service_token?: string
          status?: Database["public"]["Enums"]["schouw_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schouwen_adviseur_id_fkey"
            columns: ["adviseur_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schouwen_installateur_id_fkey"
            columns: ["installateur_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schouwen_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schouwen_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schouwen_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      serienummer_toewijzing_log: {
        Row: {
          actie: string
          actor_id: string | null
          created_at: string
          id: string
          nieuwe_status: string | null
          opdracht_id: string | null
          oude_status: string | null
          partner_id: string
          product_id: string
          serienummer: string
          serienummer_id: string
        }
        Insert: {
          actie: string
          actor_id?: string | null
          created_at?: string
          id?: string
          nieuwe_status?: string | null
          opdracht_id?: string | null
          oude_status?: string | null
          partner_id: string
          product_id: string
          serienummer: string
          serienummer_id: string
        }
        Update: {
          actie?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          nieuwe_status?: string | null
          opdracht_id?: string | null
          oude_status?: string | null
          partner_id?: string
          product_id?: string
          serienummer?: string
          serienummer_id?: string
        }
        Relationships: []
      }
      superadmin_access_grants: {
        Row: {
          created_at: string
          id: string
          ingetrokken_door: string | null
          ingetrokken_op: string | null
          notify_partner: boolean
          partner_id: string
          reden: string
          superadmin_user_id: string
          verleend_op: string
          vervalt_op: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingetrokken_door?: string | null
          ingetrokken_op?: string | null
          notify_partner?: boolean
          partner_id: string
          reden: string
          superadmin_user_id: string
          verleend_op?: string
          vervalt_op: string
        }
        Update: {
          created_at?: string
          id?: string
          ingetrokken_door?: string | null
          ingetrokken_op?: string | null
          notify_partner?: boolean
          partner_id?: string
          reden?: string
          superadmin_user_id?: string
          verleend_op?: string
          vervalt_op?: string
        }
        Relationships: [
          {
            foreignKeyName: "superadmin_access_grants_ingetrokken_door_fkey"
            columns: ["ingetrokken_door"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "superadmin_access_grants_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "superadmin_access_grants_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "superadmin_access_grants_superadmin_user_id_fkey"
            columns: ["superadmin_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      system_error_logs: {
        Row: {
          bericht: string
          bron: string
          context: Json | null
          created_at: string
          edge_function_naam: string | null
          id: string
          ip: unknown
          niveau: string
          partner_id: string | null
          request_id: string | null
          route: string | null
          stacktrace: string | null
          status_code: number | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_rol: string | null
        }
        Insert: {
          bericht: string
          bron: string
          context?: Json | null
          created_at?: string
          edge_function_naam?: string | null
          id?: string
          ip?: unknown
          niveau?: string
          partner_id?: string | null
          request_id?: string | null
          route?: string | null
          stacktrace?: string | null
          status_code?: number | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_rol?: string | null
        }
        Update: {
          bericht?: string
          bron?: string
          context?: Json | null
          created_at?: string
          edge_function_naam?: string | null
          id?: string
          ip?: unknown
          niveau?: string
          partner_id?: string | null
          request_id?: string | null
          route?: string | null
          stacktrace?: string | null
          status_code?: number | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_rol?: string | null
        }
        Relationships: []
      }
      tickets: {
        Row: {
          berichten_json: Json | null
          beschrijving: string
          categorie: string | null
          consument_id: string
          created_at: string
          id: string
          onderwerp: string
          partner_id: string
          prioriteit: Database["public"]["Enums"]["ticket_prioriteit"]
          status: Database["public"]["Enums"]["ticket_status"]
          ticketnummer: string
          updated_at: string
        }
        Insert: {
          berichten_json?: Json | null
          beschrijving: string
          categorie?: string | null
          consument_id: string
          created_at?: string
          id?: string
          onderwerp: string
          partner_id: string
          prioriteit?: Database["public"]["Enums"]["ticket_prioriteit"]
          status?: Database["public"]["Enums"]["ticket_status"]
          ticketnummer: string
          updated_at?: string
        }
        Update: {
          berichten_json?: Json | null
          beschrijving?: string
          categorie?: string | null
          consument_id?: string
          created_at?: string
          id?: string
          onderwerp?: string
          partner_id?: string
          prioriteit?: Database["public"]["Enums"]["ticket_prioriteit"]
          status?: Database["public"]["Enums"]["ticket_status"]
          ticketnummer?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_consument_id_fkey"
            columns: ["consument_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          rol: Database["public"]["Enums"]["app_role"]
          toegekend_door: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rol: Database["public"]["Enums"]["app_role"]
          toegekend_door?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rol?: Database["public"]["Enums"]["app_role"]
          toegekend_door?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          achternaam: string
          affiliate_tier: Database["public"]["Enums"]["affiliate_tier"] | null
          avatar_url: string | null
          berichten_zichtbaarheid: string
          created_at: string
          dashboard_apps_layout: Json
          dashboard_view: string
          email: string
          functie: string | null
          handtekening_html: string | null
          ical_token: string | null
          id: string
          land: string | null
          last_login_at: string | null
          mfa_enabled: boolean | null
          onboarding_overgeslagen_op: string | null
          onboarding_stappen: Json | null
          onboarding_voltooid: boolean | null
          onboarding_voltooid_op: string | null
          opmerking: string | null
          partner_id: string | null
          rol: Database["public"]["Enums"]["app_role"]
          stad: string | null
          status: Database["public"]["Enums"]["user_status"]
          taal: string | null
          telefoon: string | null
          timezone: string | null
          uitgenodigd_door: string | null
          uitgenodigd_op: string | null
          uitnodiging_token: string | null
          uitnodiging_verloopt: string | null
          updated_at: string
          voorkeuren: Json
          voornaam: string
        }
        Insert: {
          achternaam: string
          affiliate_tier?: Database["public"]["Enums"]["affiliate_tier"] | null
          avatar_url?: string | null
          berichten_zichtbaarheid?: string
          created_at?: string
          dashboard_apps_layout?: Json
          dashboard_view?: string
          email: string
          functie?: string | null
          handtekening_html?: string | null
          ical_token?: string | null
          id: string
          land?: string | null
          last_login_at?: string | null
          mfa_enabled?: boolean | null
          onboarding_overgeslagen_op?: string | null
          onboarding_stappen?: Json | null
          onboarding_voltooid?: boolean | null
          onboarding_voltooid_op?: string | null
          opmerking?: string | null
          partner_id?: string | null
          rol?: Database["public"]["Enums"]["app_role"]
          stad?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          taal?: string | null
          telefoon?: string | null
          timezone?: string | null
          uitgenodigd_door?: string | null
          uitgenodigd_op?: string | null
          uitnodiging_token?: string | null
          uitnodiging_verloopt?: string | null
          updated_at?: string
          voorkeuren?: Json
          voornaam: string
        }
        Update: {
          achternaam?: string
          affiliate_tier?: Database["public"]["Enums"]["affiliate_tier"] | null
          avatar_url?: string | null
          berichten_zichtbaarheid?: string
          created_at?: string
          dashboard_apps_layout?: Json
          dashboard_view?: string
          email?: string
          functie?: string | null
          handtekening_html?: string | null
          ical_token?: string | null
          id?: string
          land?: string | null
          last_login_at?: string | null
          mfa_enabled?: boolean | null
          onboarding_overgeslagen_op?: string | null
          onboarding_stappen?: Json | null
          onboarding_voltooid?: boolean | null
          onboarding_voltooid_op?: string | null
          opmerking?: string | null
          partner_id?: string | null
          rol?: Database["public"]["Enums"]["app_role"]
          stad?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          taal?: string | null
          telefoon?: string | null
          timezone?: string | null
          uitgenodigd_door?: string | null
          uitgenodigd_op?: string | null
          uitnodiging_token?: string | null
          uitnodiging_verloopt?: string | null
          updated_at?: string
          voorkeuren?: Json
          voornaam?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_uitgenodigd_door_fkey"
            columns: ["uitgenodigd_door"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      voorraad_mutaties: {
        Row: {
          aantal: number
          actor_id: string | null
          created_at: string
          id: string
          partner_id: string
          product_id: string
          reden: string | null
          referentie_id: string | null
          referentie_type: string | null
          type: string
        }
        Insert: {
          aantal: number
          actor_id?: string | null
          created_at?: string
          id?: string
          partner_id: string
          product_id: string
          reden?: string | null
          referentie_id?: string | null
          referentie_type?: string | null
          type: string
        }
        Update: {
          aantal?: number
          actor_id?: string | null
          created_at?: string
          id?: string
          partner_id?: string
          product_id?: string
          reden?: string | null
          referentie_id?: string | null
          referentie_type?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "voorraad_mutaties_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voorraad_mutaties_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voorraad_mutaties_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voorraad_mutaties_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "producten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voorraad_mutaties_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "producten_publiek"
            referencedColumns: ["id"]
          },
        ]
      }
      voorraad_reserveringen: {
        Row: {
          aantal: number
          created_at: string
          id: string
          opdracht_id: string | null
          partner_id: string
          product_id: string
          regel_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          aantal: number
          created_at?: string
          id?: string
          opdracht_id?: string | null
          partner_id: string
          product_id: string
          regel_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          aantal?: number
          created_at?: string
          id?: string
          opdracht_id?: string | null
          partner_id?: string
          product_id?: string
          regel_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "voorraad_reserveringen_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voorraad_reserveringen_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voorraad_reserveringen_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "producten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voorraad_reserveringen_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "producten_publiek"
            referencedColumns: ["id"]
          },
        ]
      }
      web_widgets: {
        Row: {
          actief: boolean
          config: Json
          created_at: string
          id: string
          naam: string
          notificatie_email: string | null
          partner_id: string
          type: Database["public"]["Enums"]["widget_type"]
          updated_at: string
        }
        Insert: {
          actief?: boolean
          config?: Json
          created_at?: string
          id?: string
          naam?: string
          notificatie_email?: string | null
          partner_id: string
          type: Database["public"]["Enums"]["widget_type"]
          updated_at?: string
        }
        Update: {
          actief?: boolean
          config?: Json
          created_at?: string
          id?: string
          naam?: string
          notificatie_email?: string | null
          partner_id?: string
          type?: Database["public"]["Enums"]["widget_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "web_widgets_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_widgets_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      webshop_lead_bron: {
        Row: {
          bron: string
          created_at: string
          id: string
          lead_id: string
          partner_id: string
          product_id: string | null
          product_naam: string | null
          widget_id: string | null
        }
        Insert: {
          bron?: string
          created_at?: string
          id?: string
          lead_id: string
          partner_id: string
          product_id?: string | null
          product_naam?: string | null
          widget_id?: string | null
        }
        Update: {
          bron?: string
          created_at?: string
          id?: string
          lead_id?: string
          partner_id?: string
          product_id?: string | null
          product_naam?: string | null
          widget_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      partner_branding: {
        Row: {
          adres: string | null
          bedrijfsslogan: string | null
          btw: string | null
          email: string | null
          id: string | null
          kvk: string | null
          logo_url: string | null
          naam: string | null
          plaats: string | null
          postcode: string | null
          primaire_kleur: string | null
          secundaire_kleur: string | null
          telefoonnummer: string | null
          website: string | null
        }
        Insert: {
          adres?: string | null
          bedrijfsslogan?: string | null
          btw?: string | null
          email?: string | null
          id?: string | null
          kvk?: string | null
          logo_url?: string | null
          naam?: string | null
          plaats?: string | null
          postcode?: string | null
          primaire_kleur?: string | null
          secundaire_kleur?: string | null
          telefoonnummer?: string | null
          website?: string | null
        }
        Update: {
          adres?: string | null
          bedrijfsslogan?: string | null
          btw?: string | null
          email?: string | null
          id?: string | null
          kvk?: string | null
          logo_url?: string | null
          naam?: string | null
          plaats?: string | null
          postcode?: string | null
          primaire_kleur?: string | null
          secundaire_kleur?: string | null
          telefoonnummer?: string | null
          website?: string | null
        }
        Relationships: []
      }
      producten_publiek: {
        Row: {
          afbeelding_url: string | null
          afbeeldingen: Json | null
          artikelnummer: string | null
          btw_percentage: number | null
          categorie: Database["public"]["Enums"]["product_categorie"] | null
          certificeringen: string | null
          created_at: string | null
          datasheet_type: string | null
          datasheet_url: string | null
          ean_code: string | null
          eenheid: string | null
          garantie_jaren: number | null
          gebruiker_handleiding_naam: string | null
          gebruiker_handleiding_url: string | null
          id: string | null
          installatie_handleiding_naam: string | null
          installatie_handleiding_url: string | null
          installatie_instructies: string | null
          kostprijs: number | null
          leverancier: string | null
          levertijd: string | null
          max_korting_euro: number | null
          max_korting_percentage: number | null
          merk: string | null
          min_voorraad: number | null
          model: string | null
          naam: string | null
          offerte_tekst: string | null
          omschrijving: string | null
          onderhoud: string | null
          partner_id: string | null
          prijs_excl_btw: number | null
          product_code: string | null
          specs: Json | null
          status: Database["public"]["Enums"]["product_status"] | null
          toon_op_website: boolean | null
          updated_at: string | null
          voorraad: number | null
          website_ai_gegenereerd: boolean | null
          website_faq: Json | null
          website_omschrijving: string | null
          website_pitch: string | null
          website_slug: string | null
          website_usps: Json | null
        }
        Insert: {
          afbeelding_url?: string | null
          afbeeldingen?: Json | null
          artikelnummer?: string | null
          btw_percentage?: number | null
          categorie?: Database["public"]["Enums"]["product_categorie"] | null
          certificeringen?: string | null
          created_at?: string | null
          datasheet_type?: string | null
          datasheet_url?: string | null
          ean_code?: string | null
          eenheid?: string | null
          garantie_jaren?: number | null
          gebruiker_handleiding_naam?: string | null
          gebruiker_handleiding_url?: string | null
          id?: string | null
          installatie_handleiding_naam?: string | null
          installatie_handleiding_url?: string | null
          installatie_instructies?: string | null
          kostprijs?: number | null
          leverancier?: string | null
          levertijd?: string | null
          max_korting_euro?: number | null
          max_korting_percentage?: number | null
          merk?: string | null
          min_voorraad?: number | null
          model?: string | null
          naam?: string | null
          offerte_tekst?: string | null
          omschrijving?: string | null
          onderhoud?: string | null
          partner_id?: string | null
          prijs_excl_btw?: number | null
          product_code?: string | null
          specs?: Json | null
          status?: Database["public"]["Enums"]["product_status"] | null
          toon_op_website?: boolean | null
          updated_at?: string | null
          voorraad?: number | null
          website_ai_gegenereerd?: boolean | null
          website_faq?: Json | null
          website_omschrijving?: string | null
          website_pitch?: string | null
          website_slug?: string | null
          website_usps?: Json | null
        }
        Update: {
          afbeelding_url?: string | null
          afbeeldingen?: Json | null
          artikelnummer?: string | null
          btw_percentage?: number | null
          categorie?: Database["public"]["Enums"]["product_categorie"] | null
          certificeringen?: string | null
          created_at?: string | null
          datasheet_type?: string | null
          datasheet_url?: string | null
          ean_code?: string | null
          eenheid?: string | null
          garantie_jaren?: number | null
          gebruiker_handleiding_naam?: string | null
          gebruiker_handleiding_url?: string | null
          id?: string | null
          installatie_handleiding_naam?: string | null
          installatie_handleiding_url?: string | null
          installatie_instructies?: string | null
          kostprijs?: number | null
          leverancier?: string | null
          levertijd?: string | null
          max_korting_euro?: number | null
          max_korting_percentage?: number | null
          merk?: string | null
          min_voorraad?: number | null
          model?: string | null
          naam?: string | null
          offerte_tekst?: string | null
          omschrijving?: string | null
          onderhoud?: string | null
          partner_id?: string | null
          prijs_excl_btw?: number | null
          product_code?: string | null
          specs?: Json | null
          status?: Database["public"]["Enums"]["product_status"] | null
          toon_op_website?: boolean | null
          updated_at?: string | null
          voorraad?: number | null
          website_ai_gegenereerd?: boolean | null
          website_faq?: Json | null
          website_omschrijving?: string | null
          website_pitch?: string | null
          website_slug?: string | null
          website_usps?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "producten_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producten_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_tags_met_aantal: {
        Row: {
          aantal_leads: number | null
          created_at: string | null
          id: string | null
          kleur: string | null
          label: string | null
          omschrijving: string | null
          slug: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      v_affiliate_lead_duplicaten: {
        Row: {
          eigenaar_id: string | null
          lead_a_id: string | null
          lead_b_id: string | null
          match_redenen: string[] | null
          score: number | null
        }
        Relationships: []
      }
      v_lead_duplicaten: {
        Row: {
          lead_a_id: string | null
          lead_b_id: string | null
          match_redenen: string[] | null
          partner_id: string | null
          score: number | null
        }
        Relationships: []
      }
      web_widgets_public: {
        Row: {
          actief: boolean | null
          config: Json | null
          created_at: string | null
          id: string | null
          naam: string | null
          partner_id: string | null
          type: Database["public"]["Enums"]["widget_type"] | null
        }
        Insert: {
          actief?: boolean | null
          config?: Json | null
          created_at?: string | null
          id?: string | null
          naam?: string | null
          partner_id?: string | null
          type?: Database["public"]["Enums"]["widget_type"] | null
        }
        Update: {
          actief?: boolean | null
          config?: Json | null
          created_at?: string | null
          id?: string | null
          naam?: string | null
          partner_id?: string | null
          type?: Database["public"]["Enums"]["widget_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "web_widgets_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_branding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_widgets_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_bulk_delete_sales_leads: {
        Args: { _lead_ids: string[] }
        Returns: number
      }
      admin_bulk_import_sales_leads: {
        Args: {
          _affiliate_id?: string
          _bestandsnaam?: string
          _bestemming: string
          _fase?: Database["public"]["Enums"]["sales_fase"]
          _kolom_mapping?: Json
          _rows: Json
        }
        Returns: Json
      }
      admin_bulk_update_sales_fase: {
        Args: {
          _fase: Database["public"]["Enums"]["sales_fase"]
          _lead_ids: string[]
        }
        Returns: number
      }
      admin_doorzetten_naar_affiliate: {
        Args: { _affiliate_id: string; _lead_id: string; _notitie?: string }
        Returns: {
          aantal_medewerkers: number | null
          adres: string | null
          ai_bedrijf_kansen: Json | null
          ai_bedrijf_samenvatting: string | null
          ai_bedrijf_samenvatting_op: string | null
          ai_score: number | null
          ai_score_reden: string | null
          ai_volgende_actie: string | null
          ai_volgende_actie_op: string | null
          bedrijfsnaam: string
          beslissingscriteria: string | null
          branche: string | null
          bron: Database["public"]["Enums"]["affiliate_lead_bron"]
          bron_id: string | null
          btw_nummer: string | null
          claimed_at: string | null
          concurrenten: string | null
          contactpersoon: string | null
          created_at: string
          created_by: string | null
          doorgezet_op: string | null
          eigenaar_id: string | null
          email: string | null
          facebook_url: string | null
          fase_slug: string
          geschatte_waarde: number | null
          gewonnen_partner_id: string | null
          huidige_leverancier: string | null
          id: string
          import_batch_id: string | null
          in_pipeline: boolean
          instagram_url: string | null
          jaaromzet: number | null
          kvk_nummer: string | null
          laatst_bekeken_op: string | null
          laatst_gescoord_op: string | null
          lead_score_basis: number | null
          lead_score_basis_details: Json | null
          linkedin_url: string | null
          notities: string | null
          oprichtingsjaar: number | null
          plaats: string | null
          postcode: string | null
          regio: string | null
          review_bucket:
            | Database["public"]["Enums"]["affiliate_lost_review_bucket"]
            | null
          review_door_id: string | null
          review_notitie: string | null
          review_op: string | null
          risico_bijgewerkt_op: string | null
          risico_next_step: string | null
          risico_reden: string | null
          risico_score: string | null
          sales_fase: Database["public"]["Enums"]["sales_fase"] | null
          stale_gemeld_op: string | null
          status: Database["public"]["Enums"]["affiliate_lead_status"]
          tags: string[]
          telefoon: string | null
          temperatuur: Database["public"]["Enums"]["lead_temperatuur"]
          terug_in_pipeline_op: string | null
          toegewezen_door_admin_id: string | null
          updated_at: string
          verloren_categorie:
            | Database["public"]["Enums"]["affiliate_verloren_categorie"]
            | null
          verloren_op: string | null
          verloren_reden: string | null
          volgende_actie_datum: string | null
          volgende_actie_op: string | null
          website: string | null
          winning_play_bijgewerkt_op: string | null
          winning_play_hoogtepunten: Json | null
          winning_play_samenvatting: string | null
        }
        SetofOptions: {
          from: "*"
          to: "affiliate_leads"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_doorzetten_naar_affiliate_v2: {
        Args: {
          _affiliate_id: string
          _lead_id: string
          _notitie?: string
          _temperatuur?: Database["public"]["Enums"]["lead_temperatuur"]
          _volgende_actie_op?: string
        }
        Returns: {
          aantal_medewerkers: number | null
          adres: string | null
          ai_bedrijf_kansen: Json | null
          ai_bedrijf_samenvatting: string | null
          ai_bedrijf_samenvatting_op: string | null
          ai_score: number | null
          ai_score_reden: string | null
          ai_volgende_actie: string | null
          ai_volgende_actie_op: string | null
          bedrijfsnaam: string
          beslissingscriteria: string | null
          branche: string | null
          bron: Database["public"]["Enums"]["affiliate_lead_bron"]
          bron_id: string | null
          btw_nummer: string | null
          claimed_at: string | null
          concurrenten: string | null
          contactpersoon: string | null
          created_at: string
          created_by: string | null
          doorgezet_op: string | null
          eigenaar_id: string | null
          email: string | null
          facebook_url: string | null
          fase_slug: string
          geschatte_waarde: number | null
          gewonnen_partner_id: string | null
          huidige_leverancier: string | null
          id: string
          import_batch_id: string | null
          in_pipeline: boolean
          instagram_url: string | null
          jaaromzet: number | null
          kvk_nummer: string | null
          laatst_bekeken_op: string | null
          laatst_gescoord_op: string | null
          lead_score_basis: number | null
          lead_score_basis_details: Json | null
          linkedin_url: string | null
          notities: string | null
          oprichtingsjaar: number | null
          plaats: string | null
          postcode: string | null
          regio: string | null
          review_bucket:
            | Database["public"]["Enums"]["affiliate_lost_review_bucket"]
            | null
          review_door_id: string | null
          review_notitie: string | null
          review_op: string | null
          risico_bijgewerkt_op: string | null
          risico_next_step: string | null
          risico_reden: string | null
          risico_score: string | null
          sales_fase: Database["public"]["Enums"]["sales_fase"] | null
          stale_gemeld_op: string | null
          status: Database["public"]["Enums"]["affiliate_lead_status"]
          tags: string[]
          telefoon: string | null
          temperatuur: Database["public"]["Enums"]["lead_temperatuur"]
          terug_in_pipeline_op: string | null
          toegewezen_door_admin_id: string | null
          updated_at: string
          verloren_categorie:
            | Database["public"]["Enums"]["affiliate_verloren_categorie"]
            | null
          verloren_op: string | null
          verloren_reden: string | null
          volgende_actie_datum: string | null
          volgende_actie_op: string | null
          website: string | null
          winning_play_bijgewerkt_op: string | null
          winning_play_hoogtepunten: Json | null
          winning_play_samenvatting: string | null
        }
        SetofOptions: {
          from: "*"
          to: "affiliate_leads"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_lijst_sales_affiliates: {
        Args: never
        Returns: {
          achternaam: string
          email: string
          id: string
          partner_id: string
          voornaam: string
        }[]
      }
      admin_lijst_sales_managers: {
        Args: never
        Returns: {
          achternaam: string
          email: string
          id: string
          partner_id: string
          voornaam: string
        }[]
      }
      admin_overdracht_affiliate_lead: {
        Args: {
          _lead_id: string
          _nieuwe_eigenaar_id: string
          _notitie?: string
        }
        Returns: {
          aantal_medewerkers: number | null
          adres: string | null
          ai_bedrijf_kansen: Json | null
          ai_bedrijf_samenvatting: string | null
          ai_bedrijf_samenvatting_op: string | null
          ai_score: number | null
          ai_score_reden: string | null
          ai_volgende_actie: string | null
          ai_volgende_actie_op: string | null
          bedrijfsnaam: string
          beslissingscriteria: string | null
          branche: string | null
          bron: Database["public"]["Enums"]["affiliate_lead_bron"]
          bron_id: string | null
          btw_nummer: string | null
          claimed_at: string | null
          concurrenten: string | null
          contactpersoon: string | null
          created_at: string
          created_by: string | null
          doorgezet_op: string | null
          eigenaar_id: string | null
          email: string | null
          facebook_url: string | null
          fase_slug: string
          geschatte_waarde: number | null
          gewonnen_partner_id: string | null
          huidige_leverancier: string | null
          id: string
          import_batch_id: string | null
          in_pipeline: boolean
          instagram_url: string | null
          jaaromzet: number | null
          kvk_nummer: string | null
          laatst_bekeken_op: string | null
          laatst_gescoord_op: string | null
          lead_score_basis: number | null
          lead_score_basis_details: Json | null
          linkedin_url: string | null
          notities: string | null
          oprichtingsjaar: number | null
          plaats: string | null
          postcode: string | null
          regio: string | null
          review_bucket:
            | Database["public"]["Enums"]["affiliate_lost_review_bucket"]
            | null
          review_door_id: string | null
          review_notitie: string | null
          review_op: string | null
          risico_bijgewerkt_op: string | null
          risico_next_step: string | null
          risico_reden: string | null
          risico_score: string | null
          sales_fase: Database["public"]["Enums"]["sales_fase"] | null
          stale_gemeld_op: string | null
          status: Database["public"]["Enums"]["affiliate_lead_status"]
          tags: string[]
          telefoon: string | null
          temperatuur: Database["public"]["Enums"]["lead_temperatuur"]
          terug_in_pipeline_op: string | null
          toegewezen_door_admin_id: string | null
          updated_at: string
          verloren_categorie:
            | Database["public"]["Enums"]["affiliate_verloren_categorie"]
            | null
          verloren_op: string | null
          verloren_reden: string | null
          volgende_actie_datum: string | null
          volgende_actie_op: string | null
          website: string | null
          winning_play_bijgewerkt_op: string | null
          winning_play_hoogtepunten: Json | null
          winning_play_samenvatting: string | null
        }
        SetofOptions: {
          from: "*"
          to: "affiliate_leads"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      affiliate_lead_is_editable: {
        Args: { _lead_id: string; _user_id: string }
        Returns: boolean
      }
      affiliate_lead_klantstatus: { Args: { _lead_id: string }; Returns: Json }
      affiliate_lead_klantstatus_bulk: {
        Args: { _lead_ids: string[] }
        Returns: {
          lead_id: string
          partner_id: string
          partner_naam: string
          status: string
        }[]
      }
      affiliate_lead_markeer_bekeken: {
        Args: { _lead_id: string }
        Returns: undefined
      }
      affiliate_lead_ongelezen: {
        Args: { _lead_id: string }
        Returns: {
          laatst_bekeken_op: string
          nieuwe_contactmomenten: number
          nieuwe_mails: number
          nieuwe_notities: number
        }[]
      }
      affiliate_lead_signals: {
        Args: { _user_id: string }
        Returns: {
          aankomende_terugbel: number
          laatste_signaal: string
          lead_id: string
          ongelezen_mails: number
          ongelezen_opmerkingen: number
          openstaande_taken: number
        }[]
      }
      bereken_inkoop_match: {
        Args: { _inkoopfactuur_id: string }
        Returns: string
      }
      bereken_inkoop_voorstellen: {
        Args: { _partner_id: string }
        Returns: number
      }
      claim_affiliate_lead: {
        Args: { _lead_id: string }
        Returns: {
          aantal_medewerkers: number | null
          adres: string | null
          ai_bedrijf_kansen: Json | null
          ai_bedrijf_samenvatting: string | null
          ai_bedrijf_samenvatting_op: string | null
          ai_score: number | null
          ai_score_reden: string | null
          ai_volgende_actie: string | null
          ai_volgende_actie_op: string | null
          bedrijfsnaam: string
          beslissingscriteria: string | null
          branche: string | null
          bron: Database["public"]["Enums"]["affiliate_lead_bron"]
          bron_id: string | null
          btw_nummer: string | null
          claimed_at: string | null
          concurrenten: string | null
          contactpersoon: string | null
          created_at: string
          created_by: string | null
          doorgezet_op: string | null
          eigenaar_id: string | null
          email: string | null
          facebook_url: string | null
          fase_slug: string
          geschatte_waarde: number | null
          gewonnen_partner_id: string | null
          huidige_leverancier: string | null
          id: string
          import_batch_id: string | null
          in_pipeline: boolean
          instagram_url: string | null
          jaaromzet: number | null
          kvk_nummer: string | null
          laatst_bekeken_op: string | null
          laatst_gescoord_op: string | null
          lead_score_basis: number | null
          lead_score_basis_details: Json | null
          linkedin_url: string | null
          notities: string | null
          oprichtingsjaar: number | null
          plaats: string | null
          postcode: string | null
          regio: string | null
          review_bucket:
            | Database["public"]["Enums"]["affiliate_lost_review_bucket"]
            | null
          review_door_id: string | null
          review_notitie: string | null
          review_op: string | null
          risico_bijgewerkt_op: string | null
          risico_next_step: string | null
          risico_reden: string | null
          risico_score: string | null
          sales_fase: Database["public"]["Enums"]["sales_fase"] | null
          stale_gemeld_op: string | null
          status: Database["public"]["Enums"]["affiliate_lead_status"]
          tags: string[]
          telefoon: string | null
          temperatuur: Database["public"]["Enums"]["lead_temperatuur"]
          terug_in_pipeline_op: string | null
          toegewezen_door_admin_id: string | null
          updated_at: string
          verloren_categorie:
            | Database["public"]["Enums"]["affiliate_verloren_categorie"]
            | null
          verloren_op: string | null
          verloren_reden: string | null
          volgende_actie_datum: string | null
          volgende_actie_op: string | null
          website: string | null
          winning_play_bijgewerkt_op: string | null
          winning_play_hoogtepunten: Json | null
          winning_play_samenvatting: string | null
        }
        SetofOptions: {
          from: "*"
          to: "affiliate_leads"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cleanup_partner_api_rate_log: { Args: never; Returns: undefined }
      current_actor_meta: {
        Args: { _user_id: string }
        Returns: {
          naam: string
          rol: string
        }[]
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      extract_huisnummer: { Args: { _adres: string }; Returns: string }
      generate_abonnement_factuurnummer: { Args: never; Returns: string }
      generate_documentnummer_v2: {
        Args: { _partner_id: string; _subtype?: string; _type: string }
        Returns: string
      }
      generate_financieel_documentnummer:
        | {
            Args: {
              _partner_id: string
              _type: Database["public"]["Enums"]["financieel_document_type"]
            }
            Returns: string
          }
        | {
            Args: {
              _partner_id: string
              _subtype?: string
              _type: Database["public"]["Enums"]["financieel_document_type"]
            }
            Returns: string
          }
      generate_helpdesk_ticketnummer: {
        Args: { _partner_id: string }
        Returns: string
      }
      generate_keuringnummer: { Args: { _partner_id: string }; Returns: string }
      generate_rma_nummer: { Args: { _partner_id: string }; Returns: string }
      get_affiliate_lead_notities: {
        Args: { _lead_id: string }
        Returns: {
          affiliate_id: string
          auteur_naam: string
          created_at: string
          id: string
          is_eigen: boolean
          lead_id: string
          notitie: string
        }[]
      }
      get_gereserveerd: { Args: { _product_id: string }; Returns: number }
      get_my_email_account: {
        Args: never
        Returns: {
          actief: boolean
          email_adres: string
          id: string
          partner_id: string
          provider: string
          user_id: string
        }[]
      }
      get_my_ical_token: { Args: never; Returns: string }
      get_my_pipeline: {
        Args: never
        Returns: {
          created_at: string
          default_temperatuur:
            | Database["public"]["Enums"]["lead_temperatuur"]
            | null
          fase_key: string
          id: string
          is_eindfase: boolean
          is_won: boolean
          kleur: string
          label: string
          sla_dagen: number | null
          updated_at: string
          user_id: string
          vereist_volgende_actie: boolean
          volgorde: number
          zichtbaar: boolean
        }[]
        SetofOptions: {
          from: "*"
          to: "pipeline_configuraties"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_partner_by_slug: {
        Args: { _slug: string }
        Returns: {
          id: string
          logo_url: string
          logo_url_donker: string
          naam: string
          partner_slug: string
          primaire_kleur: string
          website: string
        }[]
      }
      get_user_partner_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      get_voorraad_stand: { Args: { _product_id: string }; Returns: number }
      has_break_glass_access: {
        Args: { _partner_id: string; _user_id: string }
        Returns: boolean
      }
      increment_kb_views: { Args: { _artikel_id: string }; Returns: undefined }
      inkoop_voorstellen_naar_concept: {
        Args: { _voorstel_ids: string[] }
        Returns: {
          inkooporder_id: string
          leverancier_id: string
          regelcount: number
        }[]
      }
      insert_oplever_pdf_versie: {
        Args: {
          _bestandsgrootte: number
          _gegenereerd_door: string
          _partner_id: string
          _pdf_hash: string
          _pdf_path: string
          _rapport_id: string
          _reden: string
          _status_op_moment: string
        }
        Returns: {
          id: string
          versie: number
        }[]
      }
      is_admin_tier: { Args: { _user_id: string }; Returns: boolean }
      is_affiliate: { Args: { _user_id: string }; Returns: boolean }
      is_lost_review_admin: { Args: { _user_id: string }; Returns: boolean }
      is_partner_admin_or_higher: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_sales_admin: { Args: { _user_id: string }; Returns: boolean }
      is_sales_manager: { Args: { _user_id: string }; Returns: boolean }
      is_superadmin: { Args: { _user_id: string }; Returns: boolean }
      kan_agenda_bekijken: {
        Args: { _target: string; _viewer: string }
        Returns: boolean
      }
      kan_agenda_plannen: {
        Args: { _target: string; _viewer: string }
        Returns: boolean
      }
      lijst_affiliates_voor_sales_admin: {
        Args: never
        Returns: {
          achternaam: string
          email: string
          has_google_calendar: boolean
          id: string
          partner_id: string
          voornaam: string
        }[]
      }
      log_audit_event: {
        Args: {
          _actie: string
          _actor_id: string
          _entity_id: string
          _entity_type: string
          _nieuwe: Json
          _oude: Json
          _partner_id: string
          _target_user_id: string
        }
        Returns: string
      }
      log_entity_change: {
        Args: {
          _actie: string
          _details?: Json
          _entiteit_id: string
          _entiteit_type: string
          _nieuwe?: string
          _oude?: string
          _partner_id: string
          _veld?: string
        }
        Returns: undefined
      }
      mag_sales_tags_beheren: { Args: { _uid: string }; Returns: boolean }
      mark_helpdesk_escalations: {
        Args: { _partner_id: string }
        Returns: number
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      normaliseer_bedrijfsnaam: { Args: { _naam: string }; Returns: string }
      normalize_bedrijfsnaam: { Args: { _input: string }; Returns: string }
      normalize_persoonsnaam: { Args: { _naam: string }; Returns: string }
      normalize_phone: { Args: { _telefoon: string }; Returns: string }
      normalize_postcode: { Args: { _postcode: string }; Returns: string }
      normalize_website: { Args: { _input: string }; Returns: string }
      purge_system_error_logs: { Args: { _dagen?: number }; Returns: number }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      recompute_assemblage_prijzen: {
        Args: { p_assemblage_id: string }
        Returns: undefined
      }
      sales_leads_tags_toevoegen: {
        Args: { _lead_ids: string[]; _tags: string[] }
        Returns: number
      }
      sales_leads_tags_verwijderen: {
        Args: { _lead_ids: string[]; _tags: string[] }
        Returns: number
      }
      sales_tag_hernoemen: {
        Args: { _nieuw: string; _oud: string }
        Returns: number
      }
      sales_tag_verwijderen: {
        Args: { _ook_van_leads?: boolean; _slug: string }
        Returns: number
      }
      seed_affiliate_pipeline_config: {
        Args: { _partner_id: string }
        Returns: undefined
      }
      seed_default_pipeline: { Args: { _user_id: string }; Returns: undefined }
      slugify_partner_naam: { Args: { _naam: string }; Returns: string }
      suggest_leverancier: {
        Args: { _partner_id: string; _product_id: string }
        Returns: {
          inkoopprijs: number
          leverancier_id: string
          leverancier_naam: string
          levertijd_dagen: number
        }[]
      }
      update_lead_fase: {
        Args: { _fase_slug: string; _lead_id: string }
        Returns: {
          aantal_medewerkers: number | null
          adres: string | null
          ai_bedrijf_kansen: Json | null
          ai_bedrijf_samenvatting: string | null
          ai_bedrijf_samenvatting_op: string | null
          ai_score: number | null
          ai_score_reden: string | null
          ai_volgende_actie: string | null
          ai_volgende_actie_op: string | null
          bedrijfsnaam: string
          beslissingscriteria: string | null
          branche: string | null
          bron: Database["public"]["Enums"]["affiliate_lead_bron"]
          bron_id: string | null
          btw_nummer: string | null
          claimed_at: string | null
          concurrenten: string | null
          contactpersoon: string | null
          created_at: string
          created_by: string | null
          doorgezet_op: string | null
          eigenaar_id: string | null
          email: string | null
          facebook_url: string | null
          fase_slug: string
          geschatte_waarde: number | null
          gewonnen_partner_id: string | null
          huidige_leverancier: string | null
          id: string
          import_batch_id: string | null
          in_pipeline: boolean
          instagram_url: string | null
          jaaromzet: number | null
          kvk_nummer: string | null
          laatst_bekeken_op: string | null
          laatst_gescoord_op: string | null
          lead_score_basis: number | null
          lead_score_basis_details: Json | null
          linkedin_url: string | null
          notities: string | null
          oprichtingsjaar: number | null
          plaats: string | null
          postcode: string | null
          regio: string | null
          review_bucket:
            | Database["public"]["Enums"]["affiliate_lost_review_bucket"]
            | null
          review_door_id: string | null
          review_notitie: string | null
          review_op: string | null
          risico_bijgewerkt_op: string | null
          risico_next_step: string | null
          risico_reden: string | null
          risico_score: string | null
          sales_fase: Database["public"]["Enums"]["sales_fase"] | null
          stale_gemeld_op: string | null
          status: Database["public"]["Enums"]["affiliate_lead_status"]
          tags: string[]
          telefoon: string | null
          temperatuur: Database["public"]["Enums"]["lead_temperatuur"]
          terug_in_pipeline_op: string | null
          toegewezen_door_admin_id: string | null
          updated_at: string
          verloren_categorie:
            | Database["public"]["Enums"]["affiliate_verloren_categorie"]
            | null
          verloren_op: string | null
          verloren_reden: string | null
          volgende_actie_datum: string | null
          volgende_actie_op: string | null
          website: string | null
          winning_play_bijgewerkt_op: string | null
          winning_play_hoogtepunten: Json | null
          winning_play_samenvatting: string | null
        }
        SetofOptions: {
          from: "*"
          to: "affiliate_leads"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      user_has_role: {
        Args: {
          _rol: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_kan_module: {
        Args: { _module_key: string; _user_id: string }
        Returns: boolean
      }
      validate_partner_api_token: {
        Args: { _token_hash: string }
        Returns: {
          allowed: boolean
          partner_id: string
          reden: string
        }[]
      }
    }
    Enums: {
      affiliate_contact_type: "telefoon" | "email" | "notitie" | "afspraak"
      affiliate_lead_bron:
        | "platform_pool"
        | "eigen_import"
        | "referral_klik"
        | "sales_admin"
      affiliate_lead_status:
        | "nieuw"
        | "gebeld_geen_gehoor"
        | "mail_gestuurd"
        | "terugbel_gepland"
        | "gesprek_gepland"
        | "demo_gepland"
        | "in_gesprek"
        | "voorstel_verstuurd"
        | "trial_gestart"
        | "gewonnen"
        | "verloren"
        | "nieuw_campagne"
        | "nieuw_demo_voltooid"
      affiliate_lost_review_bucket:
        | "te_beoordelen"
        | "terugbellen"
        | "wacht_3_maanden"
        | "wacht_6_maanden"
        | "echt_verloren"
      affiliate_tier: "brons" | "zilver" | "goud"
      affiliate_verloren_categorie:
        | "geen_interesse"
        | "geen_budget"
        | "concurrent"
        | "timing"
        | "geen_contact"
        | "anders"
      app_role:
        | "superadmin"
        | "partner_admin"
        | "partner_staff"
        | "adviseur"
        | "installateur"
        | "consument"
        | "affiliate"
        | "backoffice"
        | "sales_manager"
      document_entity_type: "lead" | "schouw" | "offerte" | "installatie"
      document_type: "contract" | "foto" | "certificaat" | "rapport" | "overig"
      financieel_document_status:
        | "concept"
        | "verzonden"
        | "betaald"
        | "verlopen"
        | "gecrediteerd"
        | "ontvangen"
        | "goedgekeurd"
        | "deels_ontvangen"
        | "volledig_ontvangen"
        | "aangemaakt"
        | "afgeleverd"
        | "wacht_goedkeuring"
        | "geannuleerd"
      financieel_document_type:
        | "verkoopfactuur"
        | "creditnota"
        | "inkoopfactuur"
        | "inkooporder"
        | "pakbon"
      helpdesk_artikel_status: "concept" | "gepubliceerd" | "gearchiveerd"
      helpdesk_bron_locatie:
        | "direct"
        | "order"
        | "installatie"
        | "factuur"
        | "klant"
        | "portal"
        | "whatsapp"
      helpdesk_taak_status: "open" | "in_behandeling" | "klaar" | "geannuleerd"
      helpdesk_ticket_kanaal:
        | "telefoon"
        | "email"
        | "webformulier"
        | "intern"
        | "monteur"
        | "overig"
      helpdesk_ticket_prioriteit: "laag" | "normaal" | "hoog" | "urgent"
      helpdesk_ticket_status:
        | "nieuw"
        | "open"
        | "wacht_op_klant"
        | "wacht_op_intern"
        | "in_behandeling"
        | "opgelost"
        | "gesloten"
        | "geescaleerd"
        | "wacht_op_onderdeel"
        | "ingepland"
        | "onderweg"
      helpdesk_ticket_type:
        | "vraag"
        | "klacht"
        | "storing"
        | "service_bezoek"
        | "overig"
      installatie_status:
        | "concept"
        | "gepland"
        | "bevestigd"
        | "onderweg"
        | "in_uitvoering"
        | "gereed"
        | "afgerond"
        | "geannuleerd"
      keuring_resultaat:
        | "goedgekeurd"
        | "goedgekeurd_met_opmerkingen"
        | "afgekeurd"
      keuring_status:
        | "gepland"
        | "in_uitvoering"
        | "afgerond"
        | "achterstallig"
        | "geannuleerd"
      keuring_type: "zonnepanelen" | "thuisbatterij" | "combi"
      lead_status:
        | "nieuw"
        | "gekwalificeerd"
        | "offerte_verzonden"
        | "klant"
        | "verloren"
        | "contact_geprobeerd"
        | "geen_gehoor"
        | "voicemail"
        | "terugbellen"
        | "gesproken"
        | "afspraak_gepland"
      lead_temperatuur: "koud" | "lauw" | "warm" | "heet"
      offerte_status:
        | "concept"
        | "verzonden"
        | "geaccepteerd"
        | "afgewezen"
        | "verlopen"
        | "geconverteerd_extern"
      opdracht_status:
        | "nieuw"
        | "bevestigd"
        | "schouw_gepland"
        | "installatie_gepland"
        | "in_uitvoering"
        | "afgerond"
        | "geannuleerd"
      partner_status: "in_review" | "actief" | "inactief" | "geblokkeerd"
      product_categorie:
        | "zonnepanelen"
        | "thuisbatterij"
        | "warmtepomp"
        | "laadpaal"
        | "omvormer"
        | "accessoires"
        | "installatiemateriaal"
      product_status: "actief" | "uitgefaseerd" | "niet_beschikbaar"
      sales_fase:
        | "koud"
        | "benaderd"
        | "warm"
        | "gekwalificeerd"
        | "doorgezet"
        | "gewonnen"
        | "verloren"
      schouw_categorie:
        | "zonnepanelen"
        | "warmtepomp"
        | "isolatie_dak"
        | "isolatie_muur"
        | "isolatie_vloer"
        | "hr_glas"
        | "ventilatie"
        | "thuisbatterij"
      schouw_status: "gepland" | "uitgevoerd" | "geannuleerd"
      ticket_prioriteit: "laag" | "normaal" | "hoog" | "urgent"
      ticket_status:
        | "open"
        | "in_behandeling"
        | "wacht_op_klant"
        | "opgelost"
        | "gesloten"
      user_status: "actief" | "inactief"
      widget_type:
        | "contactformulier"
        | "calculator_zonnepanelen"
        | "calculator_warmtepomp"
        | "calculator_isolatie"
        | "calculator_laadpaal"
        | "calculator_thuisbatterij"
        | "productcatalogus"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      affiliate_contact_type: ["telefoon", "email", "notitie", "afspraak"],
      affiliate_lead_bron: [
        "platform_pool",
        "eigen_import",
        "referral_klik",
        "sales_admin",
      ],
      affiliate_lead_status: [
        "nieuw",
        "gebeld_geen_gehoor",
        "mail_gestuurd",
        "terugbel_gepland",
        "gesprek_gepland",
        "demo_gepland",
        "in_gesprek",
        "voorstel_verstuurd",
        "trial_gestart",
        "gewonnen",
        "verloren",
        "nieuw_campagne",
        "nieuw_demo_voltooid",
      ],
      affiliate_lost_review_bucket: [
        "te_beoordelen",
        "terugbellen",
        "wacht_3_maanden",
        "wacht_6_maanden",
        "echt_verloren",
      ],
      affiliate_tier: ["brons", "zilver", "goud"],
      affiliate_verloren_categorie: [
        "geen_interesse",
        "geen_budget",
        "concurrent",
        "timing",
        "geen_contact",
        "anders",
      ],
      app_role: [
        "superadmin",
        "partner_admin",
        "partner_staff",
        "adviseur",
        "installateur",
        "consument",
        "affiliate",
        "backoffice",
        "sales_manager",
      ],
      document_entity_type: ["lead", "schouw", "offerte", "installatie"],
      document_type: ["contract", "foto", "certificaat", "rapport", "overig"],
      financieel_document_status: [
        "concept",
        "verzonden",
        "betaald",
        "verlopen",
        "gecrediteerd",
        "ontvangen",
        "goedgekeurd",
        "deels_ontvangen",
        "volledig_ontvangen",
        "aangemaakt",
        "afgeleverd",
        "wacht_goedkeuring",
        "geannuleerd",
      ],
      financieel_document_type: [
        "verkoopfactuur",
        "creditnota",
        "inkoopfactuur",
        "inkooporder",
        "pakbon",
      ],
      helpdesk_artikel_status: ["concept", "gepubliceerd", "gearchiveerd"],
      helpdesk_bron_locatie: [
        "direct",
        "order",
        "installatie",
        "factuur",
        "klant",
        "portal",
        "whatsapp",
      ],
      helpdesk_taak_status: ["open", "in_behandeling", "klaar", "geannuleerd"],
      helpdesk_ticket_kanaal: [
        "telefoon",
        "email",
        "webformulier",
        "intern",
        "monteur",
        "overig",
      ],
      helpdesk_ticket_prioriteit: ["laag", "normaal", "hoog", "urgent"],
      helpdesk_ticket_status: [
        "nieuw",
        "open",
        "wacht_op_klant",
        "wacht_op_intern",
        "in_behandeling",
        "opgelost",
        "gesloten",
        "geescaleerd",
        "wacht_op_onderdeel",
        "ingepland",
        "onderweg",
      ],
      helpdesk_ticket_type: [
        "vraag",
        "klacht",
        "storing",
        "service_bezoek",
        "overig",
      ],
      installatie_status: [
        "concept",
        "gepland",
        "bevestigd",
        "onderweg",
        "in_uitvoering",
        "gereed",
        "afgerond",
        "geannuleerd",
      ],
      keuring_resultaat: [
        "goedgekeurd",
        "goedgekeurd_met_opmerkingen",
        "afgekeurd",
      ],
      keuring_status: [
        "gepland",
        "in_uitvoering",
        "afgerond",
        "achterstallig",
        "geannuleerd",
      ],
      keuring_type: ["zonnepanelen", "thuisbatterij", "combi"],
      lead_status: [
        "nieuw",
        "gekwalificeerd",
        "offerte_verzonden",
        "klant",
        "verloren",
        "contact_geprobeerd",
        "geen_gehoor",
        "voicemail",
        "terugbellen",
        "gesproken",
        "afspraak_gepland",
      ],
      lead_temperatuur: ["koud", "lauw", "warm", "heet"],
      offerte_status: [
        "concept",
        "verzonden",
        "geaccepteerd",
        "afgewezen",
        "verlopen",
        "geconverteerd_extern",
      ],
      opdracht_status: [
        "nieuw",
        "bevestigd",
        "schouw_gepland",
        "installatie_gepland",
        "in_uitvoering",
        "afgerond",
        "geannuleerd",
      ],
      partner_status: ["in_review", "actief", "inactief", "geblokkeerd"],
      product_categorie: [
        "zonnepanelen",
        "thuisbatterij",
        "warmtepomp",
        "laadpaal",
        "omvormer",
        "accessoires",
        "installatiemateriaal",
      ],
      product_status: ["actief", "uitgefaseerd", "niet_beschikbaar"],
      sales_fase: [
        "koud",
        "benaderd",
        "warm",
        "gekwalificeerd",
        "doorgezet",
        "gewonnen",
        "verloren",
      ],
      schouw_categorie: [
        "zonnepanelen",
        "warmtepomp",
        "isolatie_dak",
        "isolatie_muur",
        "isolatie_vloer",
        "hr_glas",
        "ventilatie",
        "thuisbatterij",
      ],
      schouw_status: ["gepland", "uitgevoerd", "geannuleerd"],
      ticket_prioriteit: ["laag", "normaal", "hoog", "urgent"],
      ticket_status: [
        "open",
        "in_behandeling",
        "wacht_op_klant",
        "opgelost",
        "gesloten",
      ],
      user_status: ["actief", "inactief"],
      widget_type: [
        "contactformulier",
        "calculator_zonnepanelen",
        "calculator_warmtepomp",
        "calculator_isolatie",
        "calculator_laadpaal",
        "calculator_thuisbatterij",
        "productcatalogus",
      ],
    },
  },
} as const
