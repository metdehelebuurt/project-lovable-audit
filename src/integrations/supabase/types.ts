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
            referencedRelation: "partners"
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
      offertes: {
        Row: {
          adviseur_id: string
          betalingsvoorwaarden: string | null
          btw_bedrag: number
          created_at: string
          feedback_berichten: Json | null
          geldig_tot: string
          id: string
          include_energieadvies: boolean | null
          include_schouw: boolean | null
          klant_adres: string | null
          klant_email: string
          klant_naam: string
          klant_plaats: string | null
          klant_postcode: string | null
          klant_telefoon: string | null
          lead_id: string | null
          notities: string | null
          offertenummer: string
          partner_id: string
          regels: Json
          schouw_id: string | null
          status: Database["public"]["Enums"]["offerte_status"]
          subtotaal: number
          totaal_bedrag: number
          updated_at: string
        }
        Insert: {
          adviseur_id: string
          betalingsvoorwaarden?: string | null
          btw_bedrag?: number
          created_at?: string
          feedback_berichten?: Json | null
          geldig_tot?: string
          id?: string
          include_energieadvies?: boolean | null
          include_schouw?: boolean | null
          klant_adres?: string | null
          klant_email: string
          klant_naam: string
          klant_plaats?: string | null
          klant_postcode?: string | null
          klant_telefoon?: string | null
          lead_id?: string | null
          notities?: string | null
          offertenummer: string
          partner_id: string
          regels?: Json
          schouw_id?: string | null
          status?: Database["public"]["Enums"]["offerte_status"]
          subtotaal?: number
          totaal_bedrag?: number
          updated_at?: string
        }
        Update: {
          adviseur_id?: string
          betalingsvoorwaarden?: string | null
          btw_bedrag?: number
          created_at?: string
          feedback_berichten?: Json | null
          geldig_tot?: string
          id?: string
          include_energieadvies?: boolean | null
          include_schouw?: boolean | null
          klant_adres?: string | null
          klant_email?: string
          klant_naam?: string
          klant_plaats?: string | null
          klant_postcode?: string | null
          klant_telefoon?: string | null
          lead_id?: string | null
          notities?: string | null
          offertenummer?: string
          partner_id?: string
          regels?: Json
          schouw_id?: string | null
          status?: Database["public"]["Enums"]["offerte_status"]
          subtotaal?: number
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
      partners: {
        Row: {
          abonnement_type: string | null
          adres: string | null
          adviseurs_delen_schouwen: boolean
          afzender_email: string | null
          afzender_naam: string | null
          bedrijfsslogan: string | null
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
          website: string | null
        }
        Insert: {
          abonnement_type?: string | null
          adres?: string | null
          adviseurs_delen_schouwen?: boolean
          afzender_email?: string | null
          afzender_naam?: string | null
          bedrijfsslogan?: string | null
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
          website?: string | null
        }
        Update: {
          abonnement_type?: string | null
          adres?: string | null
          adviseurs_delen_schouwen?: boolean
          afzender_email?: string | null
          afzender_naam?: string | null
          bedrijfsslogan?: string | null
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
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
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
      offerte_status:
        | "concept"
        | "verzonden"
        | "geaccepteerd"
        | "afgewezen"
        | "verlopen"
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
      ],
      offerte_status: [
        "concept",
        "verzonden",
        "geaccepteerd",
        "afgewezen",
        "verlopen",
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
    },
  },
} as const
