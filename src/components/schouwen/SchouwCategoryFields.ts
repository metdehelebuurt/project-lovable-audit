import type { Database } from "@/integrations/supabase/types";

type SchouwCategorie = Database["public"]["Enums"]["schouw_categorie"];

export interface CategoryField {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "boolean";
  options?: string[];
  section?: string;
}

export const categoryFields: Record<SchouwCategorie, CategoryField[]> = {
  zonnepanelen: [
    // Woning
    { key: "bouwjaar", label: "Bouwjaar woning", type: "number", section: "Woning" },
    { key: "woningtype", label: "Woningtype", type: "select", options: ["vrijstaand", "2_onder_1_kap", "hoekwoning", "tussenwoning", "appartement"], section: "Woning" },
    // Dak
    { key: "daktype", label: "Daktype", type: "select", options: ["schuin", "plat", "combinatie"], section: "Dak" },
    { key: "dakbedekking", label: "Dakbedekking", type: "select", options: ["pannen", "bitumen", "metaal", "riet", "leien", "EPDM"], section: "Dak" },
    { key: "dakoppervlakte_m2", label: "Dakoppervlakte (m²)", type: "number", section: "Dak" },
    { key: "orientatie", label: "Oriëntatie", type: "select", options: ["noord", "oost", "zuid", "west", "NO", "NW", "ZO", "ZW"], section: "Dak" },
    { key: "hellingshoek", label: "Hellingshoek (°)", type: "number", section: "Dak" },
    { key: "dakconstructie_materiaal", label: "Dakconstructie materiaal", type: "text", section: "Dak" },
    { key: "draagkracht_dak_kg_m2", label: "Draagkracht dak (kg/m²)", type: "number", section: "Dak" },
    { key: "aantal_dakpannen_rij", label: "Aantal dakpannen per rij", type: "number", section: "Dak" },
    { key: "asbest_aanwezig", label: "Asbest aanwezig", type: "select", options: ["ja", "nee", "onbekend"], section: "Dak" },
    { key: "dakdoorvoer_nodig", label: "Dakdoorvoer nodig", type: "select", options: ["ja", "nee"], section: "Dak" },
    { key: "toegankelijkheid_dak", label: "Toegankelijkheid dak", type: "select", options: ["goed", "matig", "slecht", "steiger_nodig"], section: "Dak" },
    { key: "type_bevestigingssysteem", label: "Type bevestigingssysteem", type: "text", section: "Dak" },
    // Schaduw
    { key: "schaduw", label: "Schaduw", type: "select", options: ["geen", "licht", "matig", "veel"], section: "Schaduw" },
    { key: "schaduw_bron", label: "Schaduwbron", type: "text", section: "Schaduw" },
    // Elektra
    { key: "type_aansluiting", label: "Type aansluiting", type: "select", options: ["1-fase", "3-fase"], section: "Elektra" },
    { key: "amperage_hoofdzekering", label: "Ampèrage hoofdzekering (A)", type: "number", section: "Elektra" },
    { key: "meterkast_geschikt", label: "Meterkast geschikt", type: "select", options: ["ja", "nee", "aanpassing_nodig"], section: "Elektra" },
    { key: "aantal_groepen_vrij", label: "Aantal vrije groepen", type: "number", section: "Elektra" },
    { key: "kabelroute_lengte_m", label: "Kabelroute lengte (m)", type: "number", section: "Elektra" },
    { key: "afstand_meterkast_omvormer_m", label: "Afstand meterkast – omvormer (m)", type: "number", section: "Elektra" },
    { key: "omvormer_locatie", label: "Omvormer locatie", type: "select", options: ["zolder", "garage", "meterkast", "buiten", "anders"], section: "Elektra" },
  ],
  warmtepomp: [
    // Woning
    { key: "bouwjaar", label: "Bouwjaar woning", type: "number", section: "Woning" },
    { key: "woningtype", label: "Woningtype", type: "select", options: ["vrijstaand", "2_onder_1_kap", "hoekwoning", "tussenwoning", "appartement"], section: "Woning" },
    { key: "woonoppervlakte_m2", label: "Woonoppervlakte (m²)", type: "number", section: "Woning" },
    { key: "energielabel", label: "Energielabel woning", type: "select", options: ["A++++", "A+++", "A++", "A+", "A", "B", "C", "D", "E", "F", "G", "onbekend"], section: "Woning" },
    { key: "isolatieniveau", label: "Isolatieniveau", type: "select", options: ["goed", "matig", "slecht"], section: "Woning" },
    // Huidig systeem
    { key: "huidig_verwarmingssysteem", label: "Huidig verwarmingssysteem", type: "select", options: ["cv_ketel", "stadsverwarming", "elektrisch", "anders"], section: "Huidig systeem" },
    { key: "huidige_gasverbruik_m3", label: "Huidig gasverbruik (m³/jaar)", type: "number", section: "Huidig systeem" },
    { key: "huidige_elektraverbruik_kwh", label: "Huidig elektraverbruik (kWh/jaar)", type: "number", section: "Huidig systeem" },
    { key: "terugvoertemp_bestaand", label: "Terugvoertemperatuur bestaand systeem (°C)", type: "number", section: "Huidig systeem" },
    // Afgiftesysteem
    { key: "radiatoren_type", label: "Radiatoren type", type: "select", options: ["regulier", "laagtemperatuur", "vloerverwarming", "combinatie"], section: "Afgiftesysteem" },
    { key: "type_vloerverwarming", label: "Type vloerverwarming", type: "select", options: ["nat", "droog", "nvt"], section: "Afgiftesysteem" },
    { key: "aantal_radiatoren", label: "Aantal radiatoren", type: "number", section: "Afgiftesysteem" },
    { key: "cv_buisdiameter_mm", label: "CV-buisdiameter (mm)", type: "number", section: "Afgiftesysteem" },
    // Buitenunit
    { key: "buitenruimte_geschikt", label: "Buitenruimte geschikt", type: "select", options: ["ja", "nee", "beperkt"], section: "Buitenunit" },
    { key: "afstand_meterkast_buitenunit_m", label: "Afstand meterkast – buitenunit (m)", type: "number", section: "Buitenunit" },
    { key: "afstand_buitenunit_binnenunit_m", label: "Afstand buitenunit – binnenunit (m)", type: "number", section: "Buitenunit" },
    { key: "leidingdoorvoer_locatie", label: "Leidingdoorvoer locatie", type: "text", section: "Buitenunit" },
    { key: "geluidseis_db", label: "Geluidseis (dB)", type: "number", section: "Buitenunit" },
    { key: "bodemgesteldheid", label: "Bodemgesteldheid (voor bronpomp)", type: "select", options: ["zand", "klei", "veen", "nvt"], section: "Buitenunit" },
    // Elektra
    { key: "type_aansluiting", label: "Type aansluiting", type: "select", options: ["1-fase", "3-fase"], section: "Elektra" },
    { key: "elektrische_aansluiting_a", label: "Elektrische aansluiting (A)", type: "number", section: "Elektra" },
  ],
  isolatie_dak: [
    { key: "bouwjaar", label: "Bouwjaar woning", type: "number", section: "Woning" },
    { key: "daktype", label: "Daktype", type: "select", options: ["schuin", "plat"], section: "Dak" },
    { key: "oppervlakte_m2", label: "Oppervlakte (m²)", type: "number", section: "Dak" },
    { key: "huidige_isolatie", label: "Huidige isolatie", type: "select", options: ["geen", "dun", "matig", "goed"], section: "Dak" },
    { key: "dakconstructie", label: "Dakconstructie", type: "text", section: "Dak" },
    { key: "type_spanten", label: "Type spanten", type: "text", section: "Constructie" },
    { key: "spantafstand_cm", label: "Spantafstand (cm)", type: "number", section: "Constructie" },
    { key: "dampscherm_aanwezig", label: "Dampscherm aanwezig", type: "select", options: ["ja", "nee", "onbekend"], section: "Constructie" },
    { key: "ventilatieruimte_cm", label: "Ventilatieruimte (cm)", type: "number", section: "Constructie" },
    { key: "max_isolatiedikte_mm", label: "Max isolatiedikte (mm)", type: "number", section: "Constructie" },
    { key: "bereikbaarheid_kruipzolder", label: "Bereikbaarheid kruipzolder", type: "select", options: ["goed", "beperkt", "niet_bereikbaar"], section: "Constructie" },
    { key: "leidingen_kabels_in_dak", label: "Leidingen/kabels in dakconstructie", type: "select", options: ["ja", "nee"], section: "Constructie" },
    { key: "vochtproblemen", label: "Vochtproblemen", type: "select", options: ["ja", "nee"], section: "Staat" },
  ],
  isolatie_muur: [
    { key: "bouwjaar", label: "Bouwjaar woning", type: "number", section: "Woning" },
    { key: "muurtype", label: "Muurtype", type: "select", options: ["spouwmuur", "massief", "houtskelet"], section: "Muur" },
    { key: "oppervlakte_m2", label: "Oppervlakte (m²)", type: "number", section: "Muur" },
    { key: "spouwbreedte_mm", label: "Spouwbreedte (mm)", type: "number", section: "Muur" },
    { key: "huidige_isolatie", label: "Huidige isolatie", type: "select", options: ["geen", "dun", "matig", "goed"], section: "Muur" },
    { key: "geveloppervlakte_noord", label: "Geveloppervlakte noord (m²)", type: "number", section: "Per gevel" },
    { key: "geveloppervlakte_oost", label: "Geveloppervlakte oost (m²)", type: "number", section: "Per gevel" },
    { key: "geveloppervlakte_zuid", label: "Geveloppervlakte zuid (m²)", type: "number", section: "Per gevel" },
    { key: "geveloppervlakte_west", label: "Geveloppervlakte west (m²)", type: "number", section: "Per gevel" },
    { key: "hoekopstellingen", label: "Hoekopstellingen", type: "text", section: "Details" },
    { key: "lateien_lintelen", label: "Lateien/lintelen", type: "select", options: ["ja", "nee"], section: "Details" },
    { key: "spouwankers_aanwezig", label: "Spouwankers aanwezig", type: "select", options: ["ja", "nee", "onbekend"], section: "Details" },
    { key: "voeg_type", label: "Voeg type", type: "text", section: "Details" },
    { key: "gevel_orientatie", label: "Gevel oriëntatie", type: "text", section: "Details" },
    { key: "vochtproblemen", label: "Vochtproblemen", type: "select", options: ["ja", "nee"], section: "Staat" },
  ],
  isolatie_vloer: [
    { key: "bouwjaar", label: "Bouwjaar woning", type: "number", section: "Woning" },
    { key: "vloertype", label: "Vloertype", type: "select", options: ["kruipruimte", "begane_grond", "souterrain"], section: "Vloer" },
    { key: "oppervlakte_m2", label: "Oppervlakte (m²)", type: "number", section: "Vloer" },
    { key: "kruipruimte_hoogte_cm", label: "Kruipruimte hoogte (cm)", type: "number", section: "Vloer" },
    { key: "huidige_isolatie", label: "Huidige isolatie", type: "select", options: ["geen", "dun", "matig", "goed"], section: "Vloer" },
    { key: "type_fundering", label: "Type fundering", type: "select", options: ["stroken", "poer", "plaat", "onbekend"], section: "Constructie" },
    { key: "draagconstructie_type", label: "Draagconstructie type", type: "select", options: ["hout", "beton", "staal"], section: "Constructie" },
    { key: "vloer_materiaal", label: "Vloer materiaal", type: "text", section: "Constructie" },
    { key: "leidingen_gas", label: "Gasleidingen in kruipruimte", type: "select", options: ["ja", "nee"], section: "Leidingen" },
    { key: "leidingen_water", label: "Waterleidingen in kruipruimte", type: "select", options: ["ja", "nee"], section: "Leidingen" },
    { key: "leidingen_riool", label: "Rioolleidingen in kruipruimte", type: "select", options: ["ja", "nee"], section: "Leidingen" },
    { key: "grondwater_stand", label: "Grondwaterstand", type: "select", options: ["droog", "vochtig", "nat"], section: "Staat" },
    { key: "ventilatieopeningen", label: "Ventilatieopeningen kruipruimte", type: "select", options: ["voldoende", "onvoldoende", "geen"], section: "Staat" },
    { key: "vochtproblemen", label: "Vochtproblemen", type: "select", options: ["ja", "nee"], section: "Staat" },
  ],
  hr_glas: [
    { key: "bouwjaar", label: "Bouwjaar woning", type: "number", section: "Woning" },
    { key: "aantal_gevels_met_glas", label: "Aantal gevels met glas", type: "number", section: "Glas" },
    { key: "aantal_ramen", label: "Totaal aantal ramen", type: "number", section: "Glas" },
    { key: "huidig_glastype", label: "Huidig glastype", type: "select", options: ["enkel", "dubbel", "hr", "hr_plus", "hr_plusplus"], section: "Glas" },
    { key: "totaal_m2", label: "Totaal glasoppervlakte (m²)", type: "number", section: "Glas" },
    { key: "kozijn_materiaal", label: "Kozijn materiaal", type: "select", options: ["hout", "kunststof", "aluminium", "combinatie"], section: "Kozijnen" },
    { key: "kozijn_staat", label: "Kozijn staat", type: "select", options: ["goed", "matig", "slecht"], section: "Kozijnen" },
    { key: "sponning_maat_mm", label: "Sponningmaat (mm)", type: "number", section: "Kozijnen" },
    { key: "ventilatieroosters_in_kozijn", label: "Ventilatieroosters in kozijn", type: "select", options: ["ja", "nee"], section: "Kozijnen" },
    { key: "monumentale_status", label: "Monumentale status", type: "select", options: ["ja", "nee"], section: "Bijzonderheden" },
    { key: "draairichting_notities", label: "Draai-/kieprichting notities", type: "text", section: "Bijzonderheden" },
  ],
  ventilatie: [
    { key: "bouwjaar", label: "Bouwjaar woning", type: "number", section: "Woning" },
    { key: "woningtype", label: "Woningtype", type: "select", options: ["vrijstaand", "2_onder_1_kap", "hoekwoning", "tussenwoning", "appartement"], section: "Woning" },
    { key: "aantal_verdiepingen", label: "Aantal verdiepingen", type: "number", section: "Woning" },
    { key: "huidig_systeem", label: "Huidig systeem", type: "select", options: ["natuurlijk", "mechanisch_afzuiging", "gebalanceerd", "geen"], section: "Huidig systeem" },
    { key: "aantal_kamers", label: "Aantal kamers", type: "number", section: "Woning" },
    { key: "huidige_co2_niveaus", label: "Huidige CO2-niveaus (ppm)", type: "number", section: "Metingen" },
    { key: "huidige_rv_percentage", label: "Huidige RV (%)", type: "number", section: "Metingen" },
    { key: "vochtklachten", label: "Vochtklachten", type: "select", options: ["ja", "nee"], section: "Metingen" },
    { key: "co2_klachten", label: "CO2 klachten", type: "select", options: ["ja", "nee"], section: "Metingen" },
    { key: "kanalen_materiaal_bestaand", label: "Kanalen materiaal bestaand", type: "text", section: "Installatie" },
    { key: "dakdoorvoer_aanwezig", label: "Dakdoorvoer aanwezig", type: "select", options: ["ja", "nee"], section: "Installatie" },
    { key: "zolderruimte_voor_unit", label: "Zolderruimte voor unit", type: "select", options: ["voldoende", "beperkt", "geen"], section: "Installatie" },
    { key: "brandklep_locaties", label: "Brandklep locaties", type: "text", section: "Installatie" },
  ],
  thuisbatterij: [
    { key: "bouwjaar", label: "Bouwjaar woning", type: "number", section: "Woning" },
    // Zonnepanelen
    { key: "zonnepanelen_aanwezig", label: "Zonnepanelen aanwezig", type: "select", options: ["ja", "nee"], section: "Zonnepanelen" },
    { key: "aantal_zonnepanelen", label: "Aantal zonnepanelen", type: "number", section: "Zonnepanelen" },
    { key: "zonnepanelen_wp", label: "Vermogen zonnepanelen (Wp)", type: "number", section: "Zonnepanelen" },
    { key: "piekvermogen_systeem_kw", label: "Piekvermogen systeem (kW)", type: "number", section: "Zonnepanelen" },
    { key: "omvormer_type", label: "Omvormer type (merk/model)", type: "text", section: "Zonnepanelen" },
    // Elektra
    { key: "type_aansluiting", label: "Type aansluiting", type: "select", options: ["1-fase", "3-fase"], section: "Elektra" },
    { key: "meterkast_geschikt", label: "Meterkast geschikt", type: "select", options: ["ja", "nee", "aanpassing_nodig"], section: "Elektra" },
    { key: "afstand_meterkast_batterij_m", label: "Afstand meterkast – batterij (m)", type: "number", section: "Elektra" },
    { key: "kabelroute_bepaald", label: "Kabelroute", type: "text", section: "Elektra" },
    { key: "teruglevercapaciteit_netbeheerder", label: "Teruglevercapaciteit netbeheerder", type: "text", section: "Elektra" },
    // Batterij locatie
    { key: "batterij_locatie", label: "Batterij locatie", type: "select", options: ["garage", "berging", "zolder", "kelder", "buiten", "anders"], section: "Batterij locatie" },
    { key: "beschikbare_wandruimte", label: "Beschikbare wandruimte (BxH cm)", type: "text", section: "Batterij locatie" },
    { key: "gewichtscapaciteit_vloer_wand", label: "Gewichtscapaciteit vloer/wand", type: "select", options: ["voldoende", "onvoldoende", "onbekend"], section: "Batterij locatie" },
    { key: "gewenste_capaciteit_kwh", label: "Gewenste capaciteit (kWh)", type: "number", section: "Batterij locatie" },
  ],
};

export const getSections = (categorie: SchouwCategorie): string[] => {
  const fields = categoryFields[categorie] || [];
  const seen = new Set<string>();
  return fields.reduce<string[]>((acc, f) => {
    const s = f.section || "Algemeen";
    if (!seen.has(s)) { seen.add(s); acc.push(s); }
    return acc;
  }, []);
};
