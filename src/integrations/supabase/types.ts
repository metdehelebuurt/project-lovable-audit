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
      abonnementen: {
        Row: {
          affiliate_referral_id: string | null
          created_at: string
          id: string
          korting_actief_tot: string | null
          kortingscode_id: string | null
          maand_bedrag: number
          partner_id: string
          plan: string
          start_datum: string
          status: string
          updated_at: string
          verloop_datum: string | null
        }
        Insert: {
          affiliate_referral_id?: string | null
          created_at?: string
          id?: string
          korting_actief_tot?: string | null
          kortingscode_id?: string | null
          maand_bedrag?: number
          partner_id: string
          plan?: string
          start_datum?: string
          status?: string
          updated_at?: string
          verloop_datum?: string | null
        }
        Update: {
          affiliate_referral_id?: string | null
          created_at?: string
          id?: string
          korting_actief_tot?: string | null
          kortingscode_id?: string | null
          maand_bedrag?: number
          partner_id?: string
          plan?: string
          start_datum?: string
          status?: string
          updated_at?: string
          verloop_datum?: string | null
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
      installaties: {
        Row: {
          consument_id: string | null
          consument_naam: string | null
          created_at: string
          geplande_einddatum: string | null
          geplande_startdatum: string | null
          id: string
          installateur_id: string | null
          lead_id: string | null
          notities: string | null
          offerte_id: string | null
          partner_id: string
          status: Database["public"]["Enums"]["installatie_status"]
          updated_at: string
        }
        Insert: {
          consument_id?: string | null
          consument_naam?: string | null
          created_at?: string
          geplande_einddatum?: string | null
          geplande_startdatum?: string | null
          id?: string
          installateur_id?: string | null
          lead_id?: string | null
          notities?: string | null
          offerte_id?: string | null
          partner_id: string
          status?: Database["public"]["Enums"]["installatie_status"]
          updated_at?: string
        }
        Update: {
          consument_id?: string | null
          consument_naam?: string | null
          created_at?: string
          geplande_einddatum?: string | null
          geplande_startdatum?: string | null
          id?: string
          installateur_id?: string | null
          lead_id?: string | null
          notities?: string | null
          offerte_id?: string | null
          partner_id?: string
          status?: Database["public"]["Enums"]["installatie_status"]
          updated_at?: string
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
            foreignKeyName: "installaties_installateur_id_fkey"
            columns: ["installateur_id"]
            isOneToOne: false
            referencedRelation: "users"
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
          affiliate_id: string
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
          affiliate_id: string
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
          affiliate_id?: string
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
          feature_flags_json: Json | null
          id: string
          kvk: string | null
          licentie_adviseurs: number | null
          licentie_installateurs: number | null
          logo_url: string | null
          logo_url_donker: string | null
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
          feature_flags_json?: Json | null
          id?: string
          kvk?: string | null
          licentie_adviseurs?: number | null
          licentie_installateurs?: number | null
          logo_url?: string | null
          logo_url_donker?: string | null
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
          feature_flags_json?: Json | null
          id?: string
          kvk?: string | null
          licentie_adviseurs?: number | null
          licentie_installateurs?: number | null
          logo_url?: string | null
          logo_url_donker?: string | null
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
          created_at: string
          email: string
          ical_token: string | null
          id: string
          partner_id: string | null
          rol: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["user_status"]
          telefoon: string | null
          updated_at: string
          voornaam: string
        }
        Insert: {
          achternaam: string
          created_at?: string
          email: string
          ical_token?: string | null
          id: string
          partner_id?: string | null
          rol?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["user_status"]
          telefoon?: string | null
          updated_at?: string
          voornaam: string
        }
        Update: {
          achternaam?: string
          created_at?: string
          email?: string
          ical_token?: string | null
          id?: string
          partner_id?: string | null
          rol?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["user_status"]
          telefoon?: string | null
          updated_at?: string
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
    }
    Functions: {
      get_user_partner_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      is_superadmin: { Args: { _user_id: string }; Returns: boolean }
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
      document_entity_type: "lead" | "schouw" | "offerte" | "installatie"
      document_type: "contract" | "foto" | "certificaat" | "rapport" | "overig"
      installatie_status:
        | "gepland"
        | "in_uitvoering"
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
      ],
      document_entity_type: ["lead", "schouw", "offerte", "installatie"],
      document_type: ["contract", "foto", "certificaat", "rapport", "overig"],
      installatie_status: [
        "gepland",
        "in_uitvoering",
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
