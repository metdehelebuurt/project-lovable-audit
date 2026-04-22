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
      affiliate_instellingen: {
        Row: {
          cookie_dagen: number
          id: string
          max_commissie_percentage: number
          max_korting_percentage: number
          max_korting_vast_bedrag: number
          min_abonnement_maanden: number
          standaard_commissie_percentage: number
          updated_at: string
        }
        Insert: {
          cookie_dagen?: number
          id?: string
          max_commissie_percentage?: number
          max_korting_percentage?: number
          max_korting_vast_bedrag?: number
          min_abonnement_maanden?: number
          standaard_commissie_percentage?: number
          updated_at?: string
        }
        Update: {
          cookie_dagen?: number
          id?: string
          max_commissie_percentage?: number
          max_korting_percentage?: number
          max_korting_vast_bedrag?: number
          min_abonnement_maanden?: number
          standaard_commissie_percentage?: number
          updated_at?: string
        }
        Relationships: []
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
      afspraken: {
        Row: {
          adviseur_id: string
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
          adviseur_id: string
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
          adviseur_id?: string
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
          created_at: string
          email_adres: string
          id: string
          is_default_voor_partner: boolean | null
          last_sync_at: string | null
          partner_id: string
          provider: string
          refresh_token: string | null
          scopes: string[] | null
          sync_cursor: string | null
          token_expiry: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          actief?: boolean
          created_at?: string
          email_adres: string
          id?: string
          is_default_voor_partner?: boolean | null
          last_sync_at?: string | null
          partner_id: string
          provider: string
          refresh_token?: string | null
          scopes?: string[] | null
          sync_cursor?: string | null
          token_expiry?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          actief?: boolean
          created_at?: string
          email_adres?: string
          id?: string
          is_default_voor_partner?: boolean | null
          last_sync_at?: string | null
          partner_id?: string
          provider?: string
          refresh_token?: string | null
          scopes?: string[] | null
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
          bijlagen: Json | null
          body_html: string | null
          body_text: string | null
          created_at: string
          datum: string
          email_account_id: string
          id: string
          is_gelezen: boolean
          klant_id: string | null
          labels: string[] | null
          lead_id: string | null
          offerte_id: string | null
          onderwerp: string
          partner_id: string
          provider_message_id: string | null
          richting: string
          thread_id: string | null
          van: string
        }
        Insert: {
          aan: string
          bijlagen?: Json | null
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          datum?: string
          email_account_id: string
          id?: string
          is_gelezen?: boolean
          klant_id?: string | null
          labels?: string[] | null
          lead_id?: string | null
          offerte_id?: string | null
          onderwerp?: string
          partner_id: string
          provider_message_id?: string | null
          richting: string
          thread_id?: string | null
          van: string
        }
        Update: {
          aan?: string
          bijlagen?: Json | null
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          datum?: string
          email_account_id?: string
          id?: string
          is_gelezen?: boolean
          klant_id?: string | null
          labels?: string[] | null
          lead_id?: string | null
          offerte_id?: string | null
          onderwerp?: string
          partner_id?: string
          provider_message_id?: string | null
          richting?: string
          thread_id?: string | null
          van?: string
        }
        Relationships: [
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
          created_at: string
          html_body: string
          id: string
          naam: string
          onderwerp: string
          partner_id: string
          standaard: boolean | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          html_body: string
          id?: string
          naam: string
          onderwerp: string
          partner_id: string
          standaard?: boolean | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          html_body?: string
          id?: string
          naam?: string
          onderwerp?: string
          partner_id?: string
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
      feedback_verzoeken: {
        Row: {
          admin_reactie: string | null
          ai_interview: Json | null
          ai_samenvatting: string | null
          ai_tags: Json | null
          beschrijving: string
          bijlagen: Json | null
          categorie: string | null
          created_at: string
          id: string
          partner_id: string | null
          prioriteit: string | null
          status: string | null
          stemmen: number | null
          titel: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_reactie?: string | null
          ai_interview?: Json | null
          ai_samenvatting?: string | null
          ai_tags?: Json | null
          beschrijving: string
          bijlagen?: Json | null
          categorie?: string | null
          created_at?: string
          id?: string
          partner_id?: string | null
          prioriteit?: string | null
          status?: string | null
          stemmen?: number | null
          titel: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_reactie?: string | null
          ai_interview?: Json | null
          ai_samenvatting?: string | null
          ai_tags?: Json | null
          beschrijving?: string
          bijlagen?: Json | null
          categorie?: string | null
          created_at?: string
          id?: string
          partner_id?: string | null
          prioriteit?: string | null
          status?: string | null
          stemmen?: number | null
          titel?: string
          type?: string
          updated_at?: string
          user_id?: string
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
          btw_bedrag: number
          created_at: string
          created_by: string
          documentnummer: string
          eenmalige_relatie: Json | null
          factuur_subtype: string
          factuurdatum: string
          id: string
          installatie_id: string | null
          klant_id: string | null
          korting_totaal: number
          leverancier_id: string | null
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
          verzonden_op: string | null
          voorschot_van_facturen: string[] | null
        }
        Insert: {
          betaald_op?: string | null
          betaald_via?: string | null
          betalingstermijn_dagen?: number
          btw_bedrag?: number
          created_at?: string
          created_by: string
          documentnummer: string
          eenmalige_relatie?: Json | null
          factuur_subtype?: string
          factuurdatum?: string
          id?: string
          installatie_id?: string | null
          klant_id?: string | null
          korting_totaal?: number
          leverancier_id?: string | null
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
          verzonden_op?: string | null
          voorschot_van_facturen?: string[] | null
        }
        Update: {
          betaald_op?: string | null
          betaald_via?: string | null
          betalingstermijn_dagen?: number
          btw_bedrag?: number
          created_at?: string
          created_by?: string
          documentnummer?: string
          eenmalige_relatie?: Json | null
          factuur_subtype?: string
          factuurdatum?: string
          id?: string
          installatie_id?: string | null
          klant_id?: string | null
          korting_totaal?: number
          leverancier_id?: string | null
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
          verzonden_op?: string | null
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
          id: string
          inhoud: string
          partner_id: string
          richting: string
          ticket_id: string
        }
        Insert: {
          auteur_id: string
          bijlagen?: Json | null
          created_at?: string
          id?: string
          inhoud: string
          partner_id: string
          richting?: string
          ticket_id: string
        }
        Update: {
          auteur_id?: string
          bijlagen?: Json | null
          created_at?: string
          id?: string
          inhoud?: string
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
          created_at: string
          deadline: string | null
          gemaakt_door: string
          id: string
          omschrijving: string | null
          partner_id: string
          prioriteit: Database["public"]["Enums"]["helpdesk_ticket_prioriteit"]
          status: Database["public"]["Enums"]["helpdesk_taak_status"]
          ticket_id: string
          titel: string
          toegewezen_aan: string | null
          updated_at: string
          voltooid_op: string | null
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          gemaakt_door: string
          id?: string
          omschrijving?: string | null
          partner_id: string
          prioriteit?: Database["public"]["Enums"]["helpdesk_ticket_prioriteit"]
          status?: Database["public"]["Enums"]["helpdesk_taak_status"]
          ticket_id: string
          titel: string
          toegewezen_aan?: string | null
          updated_at?: string
          voltooid_op?: string | null
        }
        Update: {
          created_at?: string
          deadline?: string | null
          gemaakt_door?: string
          id?: string
          omschrijving?: string | null
          partner_id?: string
          prioriteit?: Database["public"]["Enums"]["helpdesk_ticket_prioriteit"]
          status?: Database["public"]["Enums"]["helpdesk_taak_status"]
          ticket_id?: string
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
          start_tijd: string | null
          status: Database["public"]["Enums"]["installatie_status"]
          updated_at: string
          werkadres: string | null
          werkelijke_eindtijd: string | null
          werkelijke_starttijd: string | null
          werkomschrijving: string | null
        }
        Insert: {
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
          start_tijd?: string | null
          status?: Database["public"]["Enums"]["installatie_status"]
          updated_at?: string
          werkadres?: string | null
          werkelijke_eindtijd?: string | null
          werkelijke_starttijd?: string | null
          werkomschrijving?: string | null
        }
        Update: {
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
      lead_contactmomenten: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string
          notitie: string | null
          partner_id: string
          resultaat: string | null
          richting: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id: string
          notitie?: string | null
          partner_id: string
          resultaat?: string | null
          richting?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string
          notitie?: string | null
          partner_id?: string
          resultaat?: string | null
          richting?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
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
          lead_id: string
          partner_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inhoud: string
          lead_id: string
          partner_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inhoud?: string
          lead_id?: string
          partner_id?: string
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
          owner_user_id: string
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
          owner_user_id: string
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
          owner_user_id?: string
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
          adviseur_id: string
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
          adviseur_id: string
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
          adviseur_id?: string
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
          offerte_id: string
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
          offerte_id: string
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
          offerte_id?: string
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
      opleverrapporten: {
        Row: {
          batterij_spec: Json
          bevindingen: Json
          conformiteitstekst: string | null
          created_at: string
          created_by: string
          documenten: Json
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
          meetapparatuur: Json
          metingen: Json
          omvormer_spec: Json
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
          visuele_inspectie: Json
        }
        Insert: {
          batterij_spec?: Json
          bevindingen?: Json
          conformiteitstekst?: string | null
          created_at?: string
          created_by: string
          documenten?: Json
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
          meetapparatuur?: Json
          metingen?: Json
          omvormer_spec?: Json
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
          visuele_inspectie?: Json
        }
        Update: {
          batterij_spec?: Json
          bevindingen?: Json
          conformiteitstekst?: string | null
          created_at?: string
          created_by?: string
          documenten?: Json
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
          meetapparatuur?: Json
          metingen?: Json
          omvormer_spec?: Json
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
        ]
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
          trial_einddatum: string | null
          updated_at: string
          voorwaarden_pdf_url: string | null
          website: string | null
        }
        Insert: {
          abonnement_type?: string | null
          adres?: string | null
          adviseurs_delen_schouwen?: boolean
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
          trial_einddatum?: string | null
          updated_at?: string
          voorwaarden_pdf_url?: string | null
          website?: string | null
        }
        Update: {
          abonnement_type?: string | null
          adres?: string | null
          adviseurs_delen_schouwen?: boolean
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
          trial_einddatum?: string | null
          updated_at?: string
          voorwaarden_pdf_url?: string | null
          website?: string | null
        }
        Relationships: []
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
          id: string
          installatie_instructies: string | null
          kostprijs: number | null
          leverancier: string | null
          levertijd: string | null
          max_korting_euro: number | null
          max_korting_percentage: number | null
          merk: string | null
          model: string | null
          naam: string
          offerte_tekst: string | null
          omschrijving: string | null
          onderhoud: string | null
          partner_id: string | null
          prijs_excl_btw: number
          product_code: string | null
          specs: Json | null
          status: Database["public"]["Enums"]["product_status"]
          updated_at: string
          voorraad: number | null
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
          id?: string
          installatie_instructies?: string | null
          kostprijs?: number | null
          leverancier?: string | null
          levertijd?: string | null
          max_korting_euro?: number | null
          max_korting_percentage?: number | null
          merk?: string | null
          model?: string | null
          naam: string
          offerte_tekst?: string | null
          omschrijving?: string | null
          onderhoud?: string | null
          partner_id?: string | null
          prijs_excl_btw?: number
          product_code?: string | null
          specs?: Json | null
          status?: Database["public"]["Enums"]["product_status"]
          updated_at?: string
          voorraad?: number | null
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
          id?: string
          installatie_instructies?: string | null
          kostprijs?: number | null
          leverancier?: string | null
          levertijd?: string | null
          max_korting_euro?: number | null
          max_korting_percentage?: number | null
          merk?: string | null
          model?: string | null
          naam?: string
          offerte_tekst?: string | null
          omschrijving?: string | null
          onderhoud?: string | null
          partner_id?: string | null
          prijs_excl_btw?: number
          product_code?: string | null
          specs?: Json | null
          status?: Database["public"]["Enums"]["product_status"]
          updated_at?: string
          voorraad?: number | null
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
      schouwen: {
        Row: {
          aandachtspunten: string | null
          adviseur_id: string
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
          klant_email: string | null
          lead_id: string
          notities: string | null
          partner_id: string
          schouw_nummer: string
          status: Database["public"]["Enums"]["schouw_status"]
          updated_at: string
        }
        Insert: {
          aandachtspunten?: string | null
          adviseur_id: string
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
          klant_email?: string | null
          lead_id: string
          notities?: string | null
          partner_id: string
          schouw_nummer: string
          status?: Database["public"]["Enums"]["schouw_status"]
          updated_at?: string
        }
        Update: {
          aandachtspunten?: string | null
          adviseur_id?: string
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
          klant_email?: string | null
          lead_id?: string
          notities?: string | null
          partner_id?: string
          schouw_nummer?: string
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
      users: {
        Row: {
          achternaam: string
          avatar_url: string | null
          created_at: string
          email: string
          functie: string | null
          handtekening_html: string | null
          ical_token: string | null
          id: string
          last_login_at: string | null
          mfa_enabled: boolean | null
          onboarding_overgeslagen_op: string | null
          onboarding_stappen: Json | null
          onboarding_voltooid: boolean | null
          onboarding_voltooid_op: string | null
          opmerking: string | null
          partner_id: string | null
          rol: Database["public"]["Enums"]["app_role"]
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
          avatar_url?: string | null
          created_at?: string
          email: string
          functie?: string | null
          handtekening_html?: string | null
          ical_token?: string | null
          id: string
          last_login_at?: string | null
          mfa_enabled?: boolean | null
          onboarding_overgeslagen_op?: string | null
          onboarding_stappen?: Json | null
          onboarding_voltooid?: boolean | null
          onboarding_voltooid_op?: string | null
          opmerking?: string | null
          partner_id?: string | null
          rol?: Database["public"]["Enums"]["app_role"]
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
          avatar_url?: string | null
          created_at?: string
          email?: string
          functie?: string | null
          handtekening_html?: string | null
          ical_token?: string | null
          id?: string
          last_login_at?: string | null
          mfa_enabled?: boolean | null
          onboarding_overgeslagen_op?: string | null
          onboarding_stappen?: Json | null
          onboarding_voltooid?: boolean | null
          onboarding_voltooid_op?: string | null
          opmerking?: string | null
          partner_id?: string | null
          rol?: Database["public"]["Enums"]["app_role"]
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
          id: string | null
          installatie_instructies: string | null
          kostprijs: number | null
          leverancier: string | null
          levertijd: string | null
          max_korting_euro: number | null
          max_korting_percentage: number | null
          merk: string | null
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
          updated_at: string | null
          voorraad: number | null
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
          id?: string | null
          installatie_instructies?: string | null
          kostprijs?: number | null
          leverancier?: string | null
          levertijd?: string | null
          max_korting_euro?: number | null
          max_korting_percentage?: number | null
          merk?: string | null
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
          updated_at?: string | null
          voorraad?: number | null
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
          id?: string | null
          installatie_instructies?: string | null
          kostprijs?: number | null
          leverancier?: string | null
          levertijd?: string | null
          max_korting_euro?: number | null
          max_korting_percentage?: number | null
          merk?: string | null
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
          updated_at?: string | null
          voorraad?: number | null
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
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
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
      get_user_partner_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      increment_kb_views: { Args: { _artikel_id: string }; Returns: undefined }
      is_admin_tier: { Args: { _user_id: string }; Returns: boolean }
      is_partner_admin_or_higher: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_superadmin: { Args: { _user_id: string }; Returns: boolean }
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
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      user_kan_module: {
        Args: { _module_key: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "superadmin"
        | "partner_admin"
        | "partner_staff"
        | "adviseur"
        | "installateur"
        | "consument"
        | "affiliate"
        | "backoffice"
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
      offerte_status:
        | "concept"
        | "verzonden"
        | "geaccepteerd"
        | "afgewezen"
        | "verlopen"
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
      app_role: [
        "superadmin",
        "partner_admin",
        "partner_staff",
        "adviseur",
        "installateur",
        "consument",
        "affiliate",
        "backoffice",
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
      offerte_status: [
        "concept",
        "verzonden",
        "geaccepteerd",
        "afgewezen",
        "verlopen",
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
      ],
    },
  },
} as const
