import type { Database } from "@/integrations/supabase/types";

type SchouwCategorie = Database["public"]["Enums"]["schouw_categorie"];

export interface ChecklistItem {
  key: string;
  label: string;
  required: boolean;
}

export const categoryChecklists: Record<SchouwCategorie, ChecklistItem[]> = {
  zonnepanelen: [
    { key: "dakconstructie_gecontroleerd", label: "Dakconstructie gecontroleerd", required: true },
    { key: "dakbedekking_gecontroleerd", label: "Dakbedekking staat gecontroleerd", required: true },
    { key: "schaduwanalyse_uitgevoerd", label: "Schaduwanalyse uitgevoerd", required: true },
    { key: "meterkast_gefotografeerd", label: "Meterkast gefotografeerd", required: true },
    { key: "kabelroute_bepaald", label: "Kabelroute bepaald", required: true },
    { key: "dak_afmetingen_opgemeten", label: "Dak afmetingen opgemeten", required: true },
    { key: "omvormer_locatie_bepaald", label: "Omvormer locatie bepaald", required: false },
    { key: "bestaande_installaties_genoteerd", label: "Bestaande installaties genoteerd", required: false },
    { key: "dakdoorvoer_mogelijkheid", label: "Dakdoorvoer mogelijkheid beoordeeld", required: false },
  ],
  warmtepomp: [
    { key: "buitenunit_locatie_bepaald", label: "Buitenunit locatie bepaald", required: true },
    { key: "binnenunit_locatie_bepaald", label: "Binnenunit locatie bepaald", required: true },
    { key: "leidingwerk_route_bepaald", label: "Leidingwerk route bepaald", required: true },
    { key: "meterkast_capaciteit", label: "Meterkast capaciteit gecontroleerd", required: true },
    { key: "radiatoren_gecontroleerd", label: "Radiatoren/afgiftesysteem gecontroleerd", required: true },
    { key: "isolatieniveau_beoordeeld", label: "Isolatieniveau beoordeeld", required: true },
    { key: "geluid_beoordeling", label: "Geluidsbeoordeling buitenunit locatie", required: false },
    { key: "bestaand_systeem_gefotografeerd", label: "Bestaand verwarmingssysteem gefotografeerd", required: false },
  ],
  isolatie_dak: [
    { key: "dakconstructie_beoordeeld", label: "Dakconstructie beoordeeld", required: true },
    { key: "vochtschade_gecontroleerd", label: "Vochtschade gecontroleerd", required: true },
    { key: "huidige_isolatie_gecontroleerd", label: "Huidige isolatie gecontroleerd", required: true },
    { key: "ventilatie_gecontroleerd", label: "Ventilatie gecontroleerd", required: true },
    { key: "afmetingen_opgenomen", label: "Afmetingen opgenomen", required: true },
    { key: "toegankelijkheid_beoordeeld", label: "Toegankelijkheid beoordeeld", required: false },
  ],
  isolatie_muur: [
    { key: "spouw_gecontroleerd", label: "Spouw gecontroleerd", required: true },
    { key: "vochtschade_gecontroleerd", label: "Vochtschade gecontroleerd", required: true },
    { key: "huidige_isolatie_gecontroleerd", label: "Huidige isolatie gecontroleerd", required: true },
    { key: "boorpunten_bepaald", label: "Boorpunten bepaald", required: true },
    { key: "afmetingen_opgenomen", label: "Afmetingen opgenomen", required: true },
    { key: "obstructies_genoteerd", label: "Obstructies genoteerd (leidingen, etc.)", required: false },
  ],
  isolatie_vloer: [
    { key: "kruipruimte_toegankelijk", label: "Kruipruimte toegankelijkheid gecontroleerd", required: true },
    { key: "vochtschade_gecontroleerd", label: "Vochtschade gecontroleerd", required: true },
    { key: "leidingwerk_gecontroleerd", label: "Leidingwerk gecontroleerd", required: true },
    { key: "afmetingen_opgenomen", label: "Afmetingen opgenomen", required: true },
    { key: "hoogte_kruipruimte_gemeten", label: "Hoogte kruipruimte gemeten", required: true },
  ],
  hr_glas: [
    { key: "kozijnen_beoordeeld", label: "Kozijnen beoordeeld", required: true },
    { key: "huidig_glas_geidentificeerd", label: "Huidig glastype geïdentificeerd", required: true },
    { key: "afmetingen_ramen_opgenomen", label: "Afmetingen ramen opgenomen", required: true },
    { key: "draairichting_genoteerd", label: "Draai-/kiepmogelijkheden genoteerd", required: true },
    { key: "sponning_maat_gecontroleerd", label: "Sponningmaat gecontroleerd", required: false },
  ],
  ventilatie: [
    { key: "huidig_systeem_beoordeeld", label: "Huidig systeem beoordeeld", required: true },
    { key: "ventielen_gecontroleerd", label: "Ventielen/roosters gecontroleerd", required: true },
    { key: "kanalen_route_bepaald", label: "Kanalen/route bepaald", required: true },
    { key: "unit_locatie_bepaald", label: "Unit locatie bepaald", required: true },
    { key: "vochtmetingen_uitgevoerd", label: "Vochtmetingen uitgevoerd", required: false },
  ],
  thuisbatterij: [
    { key: "meterkast_gecontroleerd", label: "Meterkast gecontroleerd", required: true },
    { key: "omvormer_gecontroleerd", label: "Omvormer gecontroleerd", required: true },
    { key: "batterij_locatie_bepaald", label: "Batterij locatie bepaald", required: true },
    { key: "zonnepanelen_gegevens_genoteerd", label: "Zonnepanelen gegevens genoteerd", required: true },
    { key: "kabelroute_bepaald", label: "Kabelroute bepaald", required: true },
    { key: "netaansluiting_gecontroleerd", label: "Netaansluiting gecontroleerd", required: false },
  ],
};
