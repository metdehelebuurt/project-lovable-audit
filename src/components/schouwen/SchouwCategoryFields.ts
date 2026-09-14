import type { Database } from "@/integrations/supabase/types";

type SchouwCategorie = Database["public"]["Enums"]["schouw_categorie"];

export type WizardStep = "wensen" | "situatie" | "technisch";

export interface CategoryField {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "boolean";
  options?: string[];
  section?: string;
  wizardStep?: WizardStep;
  visibleWhen?: { field: string; values: string[] };
}

// Helper: check if a field should be visible based on current gegevens
export const isFieldVisible = (field: CategoryField, gegevens: Record<string, any>): boolean => {
  if (!field.visibleWhen) return true;
  const currentValue = gegevens[field.visibleWhen.field];
  if (!currentValue) return true; // show field if condition field not yet filled
  return field.visibleWhen.values.includes(currentValue);
};

/** Gedeelde wensen-vragen voor alle isolatiecategorieën (incl. HR++ glas). */
export const isolatieWensen: CategoryField[] = [
  { key: "motivatie_isolatie", label: "Motivatie", type: "select", options: ["besparing", "comfort", "duurzaamheid", "vocht_klachten", "subsidie", "combinatie"], section: "Motivatie", wizardStep: "wensen" },
  { key: "comfortklacht", label: "Belangrijkste comfortklacht", type: "select", options: ["koude_ruimte", "tocht", "warmte_zomer", "geluid", "vocht_schimmel", "geen"], section: "Motivatie", wizardStep: "wensen" },
  { key: "gewenste_rd_waarde", label: "Gewenste Rd-waarde (m²K/W)", type: "number", section: "Voorkeuren", wizardStep: "wensen" },
  { key: "voorkeur_materiaal", label: "Voorkeur isolatiemateriaal", type: "select", options: ["glaswol", "steenwol", "PIR", "EPS", "houtvezel", "cellulose", "geen_voorkeur"], section: "Voorkeuren", wizardStep: "wensen" },
  { key: "duurzaam_materiaal_gewenst", label: "Voorkeur biobased/duurzaam materiaal", type: "select", options: ["ja", "nee", "geen_voorkeur"], section: "Voorkeuren", wizardStep: "wensen" },
  { key: "budget_min", label: "Budget minimum (€)", type: "number", section: "Budget", wizardStep: "wensen" },
  { key: "budget_max", label: "Budget maximum (€)", type: "number", section: "Budget", wizardStep: "wensen" },
  { key: "isde_subsidie_gewenst", label: "ISDE-subsidie aanvragen", type: "select", options: ["ja", "nee", "onbekend"], section: "Subsidie", wizardStep: "wensen" },
  { key: "tweede_maatregel_gepland", label: "Tweede maatregel gepland (ISDE-voorwaarde)", type: "select", options: ["ja", "nee", "onbekend"], section: "Subsidie", wizardStep: "wensen" },
  { key: "gewenste_uitvoerperiode", label: "Gewenste uitvoerperiode", type: "text", section: "Planning", wizardStep: "wensen" },
  { key: "bewoond_tijdens_werk", label: "Woning bewoond tijdens werk", type: "select", options: ["ja", "nee"], section: "Planning", wizardStep: "wensen" },
];

/** Gedeelde woninggegevens voor isolatiecategorieën. */
export const isolatieWoning: CategoryField[] = [
  { key: "bouwjaar", label: "Bouwjaar woning", type: "number", section: "Woning", wizardStep: "situatie" },
  { key: "woningtype", label: "Woningtype", type: "select", options: ["vrijstaand", "2_onder_1_kap", "hoekwoning", "tussenwoning", "appartement"], section: "Woning", wizardStep: "situatie" },
  { key: "energielabel", label: "Energielabel woning", type: "select", options: ["A++++", "A+++", "A++", "A+", "A", "B", "C", "D", "E", "F", "G", "onbekend"], section: "Woning", wizardStep: "situatie" },
  { key: "gasverbruik_m3", label: "Gasverbruik (m³/jaar)", type: "number", section: "Woning", wizardStep: "situatie" },
  { key: "verwarmingssysteem", label: "Verwarmingssysteem", type: "select", options: ["cv_ketel", "warmtepomp", "hybride", "stadsverwarming", "anders"], section: "Woning", wizardStep: "situatie" },
];

export const categoryFields: Record<SchouwCategorie, CategoryField[]> = {
  zonnepanelen: [
    // WENSEN
    { key: "motivatie_zonnepanelen", label: "Motivatie voor zonnepanelen", type: "select", options: ["besparing", "duurzaamheid", "onafhankelijkheid", "combinatie"], section: "Motivatie", wizardStep: "wensen" },
    { key: "budget_min", label: "Budget minimum (€)", type: "number", section: "Budget", wizardStep: "wensen" },
    { key: "budget_max", label: "Budget maximum (€)", type: "number", section: "Budget", wizardStep: "wensen" },
    { key: "merkvoorkeur", label: "Merkvoorkeur panelen", type: "text", section: "Voorkeuren", wizardStep: "wensen" },
    { key: "gewenst_vermogen_kw", label: "Gewenst vermogen systeem (kW)", type: "number", section: "Voorkeuren", wizardStep: "wensen" },
    { key: "batterij_interesse", label: "Interesse in thuisbatterij", type: "select", options: ["ja", "nee", "later"], section: "Voorkeuren", wizardStep: "wensen" },

    // SITUATIE
    { key: "bouwjaar", label: "Bouwjaar woning", type: "number", section: "Woning", wizardStep: "situatie" },
    { key: "woningtype", label: "Woningtype", type: "select", options: ["vrijstaand", "2_onder_1_kap", "hoekwoning", "tussenwoning", "appartement"], section: "Woning", wizardStep: "situatie" },
    { key: "installatie_jaar", label: "Installatie jaar (bestaand)", type: "number", section: "Bestaande installatie", wizardStep: "situatie" },
    { key: "omvormer_merk", label: "Omvormer merk", type: "text", section: "Bestaande installatie", wizardStep: "situatie" },
    { key: "omvormer_model", label: "Omvormer model", type: "text", section: "Bestaande installatie", wizardStep: "situatie" },
    { key: "omvormer_vermogen_kw", label: "Omvormer vermogen (kW)", type: "number", section: "Bestaande installatie", wizardStep: "situatie" },
    { key: "omvormer_type", label: "Omvormer type", type: "select", options: ["string", "micro", "optimizers", "hybride"], section: "Bestaande installatie", wizardStep: "situatie" },
    { key: "omvormer_serienummer", label: "Serienummer omvormer", type: "text", section: "Bestaande installatie", wizardStep: "situatie" },
    { key: "monitoring_aanwezig", label: "Monitoring aanwezig", type: "select", options: ["ja", "nee"], section: "Bestaande installatie", wizardStep: "situatie" },
    { key: "opmerkingen_installatie", label: "Opmerkingen installatie", type: "text", section: "Bestaande installatie", wizardStep: "situatie" },

    // TECHNISCH
    { key: "daktype", label: "Daktype", type: "select", options: ["schuin", "plat", "combinatie"], section: "Dak", wizardStep: "technisch" },
    { key: "dakbedekking", label: "Dakbedekking", type: "select", options: ["pannen", "bitumen", "metaal", "riet", "leien", "EPDM"], section: "Dak", wizardStep: "technisch" },
    { key: "dakoppervlakte_m2", label: "Dakoppervlakte (m²)", type: "number", section: "Dak", wizardStep: "technisch" },
    { key: "dakconstructie_materiaal", label: "Dakconstructie materiaal", type: "text", section: "Dak", wizardStep: "technisch" },
    { key: "draagkracht_dak_kg_m2", label: "Draagkracht dak (kg/m²)", type: "number", section: "Dak", wizardStep: "technisch" },
    { key: "aantal_dakpannen_rij", label: "Aantal dakpannen per rij", type: "number", section: "Dak", wizardStep: "technisch", visibleWhen: { field: "daktype", values: ["schuin", "combinatie"] } },
    { key: "asbest_aanwezig", label: "Asbest aanwezig", type: "select", options: ["ja", "nee", "onbekend"], section: "Dak", wizardStep: "technisch" },
    { key: "dakdoorvoer_nodig", label: "Dakdoorvoer nodig", type: "select", options: ["ja", "nee"], section: "Dak", wizardStep: "technisch" },
    { key: "toegankelijkheid_dak", label: "Toegankelijkheid dak", type: "select", options: ["goed", "matig", "slecht", "steiger_nodig"], section: "Dak", wizardStep: "technisch" },
    { key: "type_bevestigingssysteem", label: "Type bevestigingssysteem", type: "text", section: "Dak", wizardStep: "technisch" },
    { key: "schaduw", label: "Schaduw", type: "select", options: ["geen", "licht", "matig", "veel"], section: "Schaduw", wizardStep: "technisch" },
    { key: "schaduw_bron", label: "Schaduwbron", type: "text", section: "Schaduw", wizardStep: "technisch", visibleWhen: { field: "schaduw", values: ["licht", "matig", "veel"] } },
    { key: "type_aansluiting", label: "Type aansluiting", type: "select", options: ["1-fase", "3-fase"], section: "Elektra", wizardStep: "technisch" },
    { key: "amperage_hoofdzekering", label: "Ampèrage hoofdzekering (A)", type: "number", section: "Elektra", wizardStep: "technisch" },
    { key: "meterkast_geschikt", label: "Meterkast geschikt", type: "select", options: ["ja", "nee", "aanpassing_nodig"], section: "Elektra", wizardStep: "technisch" },
    { key: "aantal_groepen_vrij", label: "Aantal vrije groepen", type: "number", section: "Elektra", wizardStep: "technisch" },
    { key: "kabelroute_lengte_m", label: "Kabelroute lengte (m)", type: "number", section: "Elektra", wizardStep: "technisch" },
    { key: "afstand_meterkast_omvormer_m", label: "Afstand meterkast – omvormer (m)", type: "number", section: "Elektra", wizardStep: "technisch" },
    { key: "omvormer_locatie", label: "Omvormer locatie", type: "select", options: ["zolder", "garage", "meterkast", "buiten", "anders"], section: "Elektra", wizardStep: "technisch" },
  ],
  warmtepomp: [
    // WENSEN
    { key: "motivatie_warmtepomp", label: "Motivatie", type: "select", options: ["besparing", "duurzaamheid", "comfort", "subsidie", "combinatie"], section: "Motivatie", wizardStep: "wensen" },
    { key: "budget_indicatie", label: "Budget indicatie (€)", type: "number", section: "Budget", wizardStep: "wensen" },
    { key: "voorkeur_type", label: "Voorkeur type warmtepomp", type: "select", options: ["lucht_water", "bodem", "hybride", "geen_voorkeur"], section: "Voorkeuren", wizardStep: "wensen" },

    // SITUATIE
    { key: "bouwjaar", label: "Bouwjaar woning", type: "number", section: "Woning", wizardStep: "situatie" },
    { key: "woningtype", label: "Woningtype", type: "select", options: ["vrijstaand", "2_onder_1_kap", "hoekwoning", "tussenwoning", "appartement"], section: "Woning", wizardStep: "situatie" },
    { key: "woonoppervlakte_m2", label: "Woonoppervlakte (m²)", type: "number", section: "Woning", wizardStep: "situatie" },
    { key: "energielabel", label: "Energielabel woning", type: "select", options: ["A++++", "A+++", "A++", "A+", "A", "B", "C", "D", "E", "F", "G", "onbekend"], section: "Woning", wizardStep: "situatie" },
    { key: "isolatieniveau", label: "Isolatieniveau", type: "select", options: ["goed", "matig", "slecht"], section: "Woning", wizardStep: "situatie" },
    { key: "huidig_verwarmingssysteem", label: "Huidig verwarmingssysteem", type: "select", options: ["cv_ketel", "stadsverwarming", "elektrisch", "anders"], section: "Huidig systeem", wizardStep: "situatie" },
    { key: "huidige_gasverbruik_m3", label: "Huidig gasverbruik (m³/jaar)", type: "number", section: "Huidig systeem", wizardStep: "situatie" },
    { key: "huidige_elektraverbruik_kwh", label: "Huidig elektraverbruik (kWh/jaar)", type: "number", section: "Huidig systeem", wizardStep: "situatie" },
    { key: "terugvoertemp_bestaand", label: "Terugvoertemperatuur bestaand systeem (°C)", type: "number", section: "Huidig systeem", wizardStep: "situatie" },

    // TECHNISCH
    { key: "radiatoren_type", label: "Radiatoren type", type: "select", options: ["regulier", "laagtemperatuur", "vloerverwarming", "combinatie"], section: "Afgiftesysteem", wizardStep: "technisch" },
    { key: "type_vloerverwarming", label: "Type vloerverwarming", type: "select", options: ["nat", "droog", "nvt"], section: "Afgiftesysteem", wizardStep: "technisch" },
    { key: "aantal_radiatoren", label: "Aantal radiatoren", type: "number", section: "Afgiftesysteem", wizardStep: "technisch" },
    { key: "cv_buisdiameter_mm", label: "CV-buisdiameter (mm)", type: "number", section: "Afgiftesysteem", wizardStep: "technisch" },
    { key: "buitenruimte_geschikt", label: "Buitenruimte geschikt", type: "select", options: ["ja", "nee", "beperkt"], section: "Buitenunit", wizardStep: "technisch" },
    { key: "afstand_meterkast_buitenunit_m", label: "Afstand meterkast – buitenunit (m)", type: "number", section: "Buitenunit", wizardStep: "technisch" },
    { key: "afstand_buitenunit_binnenunit_m", label: "Afstand buitenunit – binnenunit (m)", type: "number", section: "Buitenunit", wizardStep: "technisch" },
    { key: "leidingdoorvoer_locatie", label: "Leidingdoorvoer locatie", type: "text", section: "Buitenunit", wizardStep: "technisch" },
    { key: "geluidseis_db", label: "Geluidseis (dB)", type: "number", section: "Buitenunit", wizardStep: "technisch" },
    { key: "bodemgesteldheid", label: "Bodemgesteldheid (voor bronpomp)", type: "select", options: ["zand", "klei", "veen", "nvt"], section: "Buitenunit", wizardStep: "technisch" },
    { key: "type_aansluiting", label: "Type aansluiting", type: "select", options: ["1-fase", "3-fase"], section: "Elektra", wizardStep: "technisch" },
    { key: "elektrische_aansluiting_a", label: "Elektrische aansluiting (A)", type: "number", section: "Elektra", wizardStep: "technisch" },
  ],
  isolatie_dak: [
    ...isolatieWensen,
    ...isolatieWoning,
    { key: "daktype", label: "Daktype", type: "select", options: ["schuin", "plat"], section: "Dak", wizardStep: "situatie" },
    { key: "oppervlakte_m2", label: "Oppervlakte (m²)", type: "number", section: "Dak", wizardStep: "situatie" },
    { key: "huidige_isolatie", label: "Huidige isolatie", type: "select", options: ["geen", "dun", "matig", "goed"], section: "Dak", wizardStep: "situatie" },
    { key: "dakconstructie", label: "Dakconstructie", type: "text", section: "Dak", wizardStep: "situatie" },
    // TECHNISCH
    { key: "type_spanten", label: "Type spanten", type: "text", section: "Constructie", wizardStep: "technisch" },
    { key: "spantafstand_cm", label: "Spantafstand (cm)", type: "number", section: "Constructie", wizardStep: "technisch" },
    { key: "dampscherm_aanwezig", label: "Dampscherm aanwezig", type: "select", options: ["ja", "nee", "onbekend"], section: "Constructie", wizardStep: "technisch" },
    { key: "ventilatieruimte_cm", label: "Ventilatieruimte (cm)", type: "number", section: "Constructie", wizardStep: "technisch" },
    { key: "max_isolatiedikte_mm", label: "Max isolatiedikte (mm)", type: "number", section: "Constructie", wizardStep: "technisch" },
    { key: "bereikbaarheid_kruipzolder", label: "Bereikbaarheid kruipzolder", type: "select", options: ["goed", "beperkt", "niet_bereikbaar"], section: "Constructie", wizardStep: "technisch" },
    { key: "leidingen_kabels_in_dak", label: "Leidingen/kabels in dakconstructie", type: "select", options: ["ja", "nee"], section: "Constructie", wizardStep: "technisch" },
    { key: "vochtproblemen", label: "Vochtproblemen", type: "select", options: ["ja", "nee"], section: "Staat", wizardStep: "technisch" },
    { key: "schimmel_aanwezig", label: "Schimmel/houtrot aanwezig", type: "select", options: ["ja", "nee"], section: "Staat", wizardStep: "technisch" },
    { key: "dakbedekking_staat", label: "Staat dakbedekking", type: "select", options: ["goed", "matig", "vervangen_nodig"], section: "Staat", wizardStep: "technisch" },
    { key: "asbest_verdacht", label: "Asbestverdacht materiaal", type: "select", options: ["ja", "nee", "onbekend"], section: "Staat", wizardStep: "technisch" },
    { key: "werkhoogte_m", label: "Werkhoogte (m)", type: "number", section: "Uitvoering", wizardStep: "technisch" },
    { key: "steiger_nodig", label: "Steiger/hoogwerker nodig", type: "select", options: ["ja", "nee"], section: "Uitvoering", wizardStep: "technisch" },
    { key: "toegang_zolder", label: "Toegang zolder/werkplek", type: "select", options: ["ruim", "krap", "via_luik", "niet_bereikbaar"], section: "Uitvoering", wizardStep: "technisch" },
    { key: "afvoer_oud_materiaal", label: "Afvoer oud isolatiemateriaal nodig", type: "select", options: ["ja", "nee"], section: "Uitvoering", wizardStep: "technisch" },
  ],
  isolatie_muur: [
    ...isolatieWensen,
    ...isolatieWoning,
    { key: "muurtype", label: "Muurtype", type: "select", options: ["spouwmuur", "massief", "houtskelet"], section: "Muur", wizardStep: "situatie" },
    { key: "oppervlakte_m2", label: "Oppervlakte (m²)", type: "number", section: "Muur", wizardStep: "situatie" },
    { key: "spouwbreedte_mm", label: "Spouwbreedte (mm)", type: "number", section: "Muur", wizardStep: "situatie", visibleWhen: { field: "muurtype", values: ["spouwmuur"] } },
    { key: "huidige_isolatie", label: "Huidige isolatie", type: "select", options: ["geen", "dun", "matig", "goed"], section: "Muur", wizardStep: "situatie" },
    { key: "geveloppervlakte_noord", label: "Geveloppervlakte noord (m²)", type: "number", section: "Per gevel", wizardStep: "technisch" },
    { key: "geveloppervlakte_oost", label: "Geveloppervlakte oost (m²)", type: "number", section: "Per gevel", wizardStep: "technisch" },
    { key: "geveloppervlakte_zuid", label: "Geveloppervlakte zuid (m²)", type: "number", section: "Per gevel", wizardStep: "technisch" },
    { key: "geveloppervlakte_west", label: "Geveloppervlakte west (m²)", type: "number", section: "Per gevel", wizardStep: "technisch" },
    { key: "hoekopstellingen", label: "Hoekopstellingen", type: "text", section: "Details", wizardStep: "technisch" },
    { key: "lateien_lintelen", label: "Lateien/lintelen", type: "select", options: ["ja", "nee"], section: "Details", wizardStep: "technisch" },
    { key: "spouwankers_aanwezig", label: "Spouwankers aanwezig", type: "select", options: ["ja", "nee", "onbekend"], section: "Details", wizardStep: "technisch" },
    { key: "voeg_type", label: "Voeg type", type: "text", section: "Details", wizardStep: "technisch" },
    { key: "gevel_orientatie", label: "Gevel oriëntatie", type: "text", section: "Details", wizardStep: "technisch" },
    { key: "vochtproblemen", label: "Vochtproblemen", type: "select", options: ["ja", "nee"], section: "Staat", wizardStep: "technisch" },
    { key: "doorslaand_vocht", label: "Doorslaand vocht / optrekkend vocht", type: "select", options: ["ja", "nee"], section: "Staat", wizardStep: "technisch" },
    { key: "scheurvorming_gevel", label: "Scheurvorming in gevel", type: "select", options: ["geen", "licht", "ernstig"], section: "Staat", wizardStep: "technisch" },
    { key: "spouw_vrij_van_puin", label: "Spouw vrij van puin/vuil", type: "select", options: ["ja", "nee", "onbekend"], section: "Staat", wizardStep: "technisch", visibleWhen: { field: "muurtype", values: ["spouwmuur"] } },
    { key: "endoscopie_uitgevoerd", label: "Endoscopisch onderzoek uitgevoerd", type: "select", options: ["ja", "nee"], section: "Staat", wizardStep: "technisch", visibleWhen: { field: "muurtype", values: ["spouwmuur"] } },
    { key: "boorgaten_herstel", label: "Herstelwerk boorgaten inbegrepen", type: "select", options: ["ja", "nee"], section: "Uitvoering", wizardStep: "technisch" },
    { key: "steiger_nodig", label: "Steiger/hoogwerker nodig", type: "select", options: ["ja", "nee"], section: "Uitvoering", wizardStep: "technisch" },
    { key: "bereikbaarheid_gevel", label: "Bereikbaarheid gevels", type: "select", options: ["goed", "beperkt", "zeer_beperkt"], section: "Uitvoering", wizardStep: "technisch" },
    { key: "beschermde_diersoorten", label: "Controle beschermde diersoorten (vleermuizen/gierzwaluw)", type: "select", options: ["uitgevoerd", "nodig", "niet_van_toepassing"], section: "Uitvoering", wizardStep: "technisch" },
  ],
  isolatie_vloer: [
    ...isolatieWensen,
    ...isolatieWoning,
    { key: "vloertype", label: "Vloertype", type: "select", options: ["kruipruimte", "begane_grond", "souterrain"], section: "Vloer", wizardStep: "situatie" },
    { key: "oppervlakte_m2", label: "Oppervlakte (m²)", type: "number", section: "Vloer", wizardStep: "situatie" },
    { key: "kruipruimte_hoogte_cm", label: "Kruipruimte hoogte (cm)", type: "number", section: "Vloer", wizardStep: "situatie", visibleWhen: { field: "vloertype", values: ["kruipruimte"] } },
    { key: "huidige_isolatie", label: "Huidige isolatie", type: "select", options: ["geen", "dun", "matig", "goed"], section: "Vloer", wizardStep: "situatie" },
    { key: "type_fundering", label: "Type fundering", type: "select", options: ["stroken", "poer", "plaat", "onbekend"], section: "Constructie", wizardStep: "technisch" },
    { key: "draagconstructie_type", label: "Draagconstructie type", type: "select", options: ["hout", "beton", "staal"], section: "Constructie", wizardStep: "technisch" },
    { key: "vloer_materiaal", label: "Vloer materiaal", type: "text", section: "Constructie", wizardStep: "technisch" },
    { key: "leidingen_gas", label: "Gasleidingen in kruipruimte", type: "select", options: ["ja", "nee"], section: "Leidingen", wizardStep: "technisch" },
    { key: "leidingen_water", label: "Waterleidingen in kruipruimte", type: "select", options: ["ja", "nee"], section: "Leidingen", wizardStep: "technisch" },
    { key: "leidingen_riool", label: "Rioolleidingen in kruipruimte", type: "select", options: ["ja", "nee"], section: "Leidingen", wizardStep: "technisch" },
    { key: "grondwater_stand", label: "Grondwaterstand", type: "select", options: ["droog", "vochtig", "nat"], section: "Staat", wizardStep: "technisch" },
    { key: "ventilatieopeningen", label: "Ventilatieopeningen kruipruimte", type: "select", options: ["voldoende", "onvoldoende", "geen"], section: "Staat", wizardStep: "technisch" },
    { key: "vochtproblemen", label: "Vochtproblemen", type: "select", options: ["ja", "nee"], section: "Staat", wizardStep: "technisch" },
    { key: "waterstand_kruipruimte", label: "Water in kruipruimte", type: "select", options: ["geen", "plassen", "permanent_water"], section: "Staat", wizardStep: "technisch" },
    { key: "bodemafdekking_aanwezig", label: "Bodemafdekking aanwezig", type: "select", options: ["ja", "nee"], section: "Staat", wizardStep: "technisch" },
    { key: "kruipluik_afmeting_cm", label: "Afmeting kruipluik (cm)", type: "text", section: "Uitvoering", wizardStep: "technisch" },
    { key: "kruipluik_locatie", label: "Locatie kruipluik", type: "text", section: "Uitvoering", wizardStep: "technisch" },
    { key: "werkruimte_voldoende", label: "Voldoende werkruimte (min. 35 cm)", type: "select", options: ["ja", "nee"], section: "Uitvoering", wizardStep: "technisch" },
    { key: "puin_obstakels", label: "Puin/obstakels in kruipruimte", type: "select", options: ["geen", "beperkt", "veel"], section: "Uitvoering", wizardStep: "technisch" },
    { key: "asbest_verdacht", label: "Asbestverdacht materiaal", type: "select", options: ["ja", "nee", "onbekend"], section: "Uitvoering", wizardStep: "technisch" },
  ],
  hr_glas: [
    ...isolatieWensen,
    ...isolatieWoning,
    { key: "aantal_gevels_met_glas", label: "Aantal gevels met glas", type: "number", section: "Glas", wizardStep: "situatie" },
    { key: "aantal_ramen", label: "Totaal aantal ramen", type: "number", section: "Glas", wizardStep: "situatie" },
    { key: "huidig_glastype", label: "Huidig glastype", type: "select", options: ["enkel", "dubbel", "hr", "hr_plus", "hr_plusplus"], section: "Glas", wizardStep: "situatie" },
    { key: "totaal_m2", label: "Totaal glasoppervlakte (m²)", type: "number", section: "Glas", wizardStep: "situatie" },
    { key: "kozijn_materiaal", label: "Kozijn materiaal", type: "select", options: ["hout", "kunststof", "aluminium", "combinatie"], section: "Kozijnen", wizardStep: "technisch" },
    { key: "kozijn_staat", label: "Kozijn staat", type: "select", options: ["goed", "matig", "slecht"], section: "Kozijnen", wizardStep: "technisch" },
    { key: "sponning_maat_mm", label: "Sponningmaat (mm)", type: "number", section: "Kozijnen", wizardStep: "technisch" },
    { key: "ventilatieroosters_in_kozijn", label: "Ventilatieroosters in kozijn", type: "select", options: ["ja", "nee"], section: "Kozijnen", wizardStep: "technisch" },
    { key: "monumentale_status", label: "Monumentale status", type: "select", options: ["ja", "nee"], section: "Bijzonderheden", wizardStep: "technisch" },
    { key: "draairichting_notities", label: "Draai-/kieprichting notities", type: "text", section: "Bijzonderheden", wizardStep: "technisch" },
  ],
  ventilatie: [
    { key: "bouwjaar", label: "Bouwjaar woning", type: "number", section: "Woning", wizardStep: "situatie" },
    { key: "woningtype", label: "Woningtype", type: "select", options: ["vrijstaand", "2_onder_1_kap", "hoekwoning", "tussenwoning", "appartement"], section: "Woning", wizardStep: "situatie" },
    { key: "aantal_verdiepingen", label: "Aantal verdiepingen", type: "number", section: "Woning", wizardStep: "situatie" },
    { key: "huidig_systeem", label: "Huidig systeem", type: "select", options: ["natuurlijk", "mechanisch_afzuiging", "gebalanceerd", "geen"], section: "Huidig systeem", wizardStep: "situatie" },
    { key: "aantal_kamers", label: "Aantal kamers", type: "number", section: "Woning", wizardStep: "situatie" },
    { key: "huidige_co2_niveaus", label: "Huidige CO2-niveaus (ppm)", type: "number", section: "Metingen", wizardStep: "technisch" },
    { key: "huidige_rv_percentage", label: "Huidige RV (%)", type: "number", section: "Metingen", wizardStep: "technisch" },
    { key: "vochtklachten", label: "Vochtklachten", type: "select", options: ["ja", "nee"], section: "Metingen", wizardStep: "technisch" },
    { key: "co2_klachten", label: "CO2 klachten", type: "select", options: ["ja", "nee"], section: "Metingen", wizardStep: "technisch" },
    { key: "kanalen_materiaal_bestaand", label: "Kanalen materiaal bestaand", type: "text", section: "Installatie", wizardStep: "technisch" },
    { key: "dakdoorvoer_aanwezig", label: "Dakdoorvoer aanwezig", type: "select", options: ["ja", "nee"], section: "Installatie", wizardStep: "technisch" },
    { key: "zolderruimte_voor_unit", label: "Zolderruimte voor unit", type: "select", options: ["voldoende", "beperkt", "geen"], section: "Installatie", wizardStep: "technisch" },
    { key: "brandklep_locaties", label: "Brandklep locaties", type: "text", section: "Installatie", wizardStep: "technisch" },
  ],
  thuisbatterij: [
    // WENSEN
    { key: "motivatie_zelfconsumptie", label: "Zelfconsumptie verhogen", type: "select", options: ["ja", "nee"], section: "Wensen & verwachtingen", wizardStep: "wensen" },
    { key: "motivatie_piekshaving", label: "Piekshaving", type: "select", options: ["ja", "nee"], section: "Wensen & verwachtingen", wizardStep: "wensen" },
    { key: "motivatie_noodstroom", label: "Noodstroom/backup", type: "select", options: ["ja", "nee"], section: "Wensen & verwachtingen", wizardStep: "wensen" },
    { key: "motivatie_dynamisch_laden", label: "Dynamisch laden (spotprijzen)", type: "select", options: ["ja", "nee"], section: "Wensen & verwachtingen", wizardStep: "wensen" },
    { key: "motivatie_offgrid", label: "Off-grid / autarkie", type: "select", options: ["ja", "nee"], section: "Wensen & verwachtingen", wizardStep: "wensen" },
    { key: "gewenste_capaciteit_kwh", label: "Gewenste capaciteit (kWh)", type: "number", section: "Wensen & verwachtingen", wizardStep: "wensen" },
    { key: "budget_min", label: "Budget minimum (€)", type: "number", section: "Budget", wizardStep: "wensen" },
    { key: "budget_max", label: "Budget maximum (€)", type: "number", section: "Budget", wizardStep: "wensen" },
    { key: "merkvoorkeur", label: "Merkvoorkeur", type: "text", section: "Voorkeuren", wizardStep: "wensen" },
    { key: "prioriteit_besparing_onafhankelijkheid", label: "Prioriteit", type: "select", options: ["besparing", "onafhankelijkheid", "beide"], section: "Voorkeuren", wizardStep: "wensen" },

    // Off-grid (conditioneel)
    { key: "volledige_offgrid", label: "Volledige off-grid gewenst", type: "select", options: ["ja", "nee"], section: "Off-grid vereisten", wizardStep: "wensen", visibleWhen: { field: "motivatie_offgrid", values: ["ja"] } },
    { key: "essentiele_apparaten_uitval", label: "Essentiële apparaten bij stroomuitval", type: "text", section: "Off-grid vereisten", wizardStep: "wensen", visibleWhen: { field: "motivatie_offgrid", values: ["ja"] } },
    { key: "noodstroom_verbruik_kwh_dag", label: "Geschat noodstroomverbruik (kWh/dag)", type: "number", section: "Noodstroom details", wizardStep: "wensen", visibleWhen: { field: "motivatie_noodstroom", values: ["ja"] } },
    { key: "gewenste_autonomie_uren", label: "Gewenste autonomie (uren)", type: "number", section: "Noodstroom details", wizardStep: "wensen", visibleWhen: { field: "motivatie_noodstroom", values: ["ja"] } },
    { key: "generator_backup", label: "Generator aanwezig als backup", type: "select", options: ["ja", "nee"], section: "Off-grid vereisten", wizardStep: "wensen", visibleWhen: { field: "motivatie_offgrid", values: ["ja"] } },
    { key: "eilandbedrijf_vereist", label: "Eilandbedrijf (islanding) vereist", type: "select", options: ["ja", "nee"], section: "Off-grid vereisten", wizardStep: "wensen", visibleWhen: { field: "motivatie_offgrid", values: ["ja"] } },
    { key: "driefase_offgrid", label: "3-fase nodig bij off-grid", type: "select", options: ["ja", "nee", "onbekend"], section: "Off-grid vereisten", wizardStep: "wensen", visibleWhen: { field: "motivatie_offgrid", values: ["ja"] } },

    // SITUATIE
    { key: "bouwjaar", label: "Bouwjaar woning", type: "number", section: "Woning", wizardStep: "situatie" },
    { key: "woningtype", label: "Woningtype", type: "select", options: ["vrijstaand", "2_onder_1_kap", "hoekwoning", "tussenwoning", "appartement"], section: "Woning", wizardStep: "situatie" },
    { key: "zonnepanelen_aanwezig", label: "Zonnepanelen aanwezig", type: "select", options: ["ja", "nee"], section: "Huidige zonnepanelen", wizardStep: "situatie" },
    { key: "aantal_zonnepanelen", label: "Aantal zonnepanelen", type: "number", section: "Huidige zonnepanelen", wizardStep: "situatie", visibleWhen: { field: "zonnepanelen_aanwezig", values: ["ja"] } },
    { key: "zonnepanelen_wp", label: "Vermogen per paneel (Wp)", type: "number", section: "Huidige zonnepanelen", wizardStep: "situatie", visibleWhen: { field: "zonnepanelen_aanwezig", values: ["ja"] } },
    { key: "piekvermogen_systeem_kw", label: "Piekvermogen systeem (kW)", type: "number", section: "Huidige zonnepanelen", wizardStep: "situatie", visibleWhen: { field: "zonnepanelen_aanwezig", values: ["ja"] } },
    { key: "installatie_jaar", label: "Installatie jaar zonnepanelen", type: "number", section: "Huidige zonnepanelen", wizardStep: "situatie", visibleWhen: { field: "zonnepanelen_aanwezig", values: ["ja"] } },
    { key: "omvormer_merk", label: "Omvormer merk", type: "text", section: "Huidige zonnepanelen", wizardStep: "situatie", visibleWhen: { field: "zonnepanelen_aanwezig", values: ["ja"] } },
    { key: "omvormer_model", label: "Omvormer model", type: "text", section: "Huidige zonnepanelen", wizardStep: "situatie", visibleWhen: { field: "zonnepanelen_aanwezig", values: ["ja"] } },
    { key: "omvormer_vermogen_kw", label: "Omvormer vermogen (kW)", type: "number", section: "Huidige zonnepanelen", wizardStep: "situatie", visibleWhen: { field: "zonnepanelen_aanwezig", values: ["ja"] } },
    { key: "omvormer_type", label: "Omvormer type", type: "select", options: ["string", "micro", "hybride", "optimizers"], section: "Huidige zonnepanelen", wizardStep: "situatie", visibleWhen: { field: "zonnepanelen_aanwezig", values: ["ja"] } },
    { key: "hybride_omvormer", label: "Hybride omvormer", type: "select", options: ["ja", "nee", "onbekend"], section: "Huidige zonnepanelen", wizardStep: "situatie", visibleWhen: { field: "zonnepanelen_aanwezig", values: ["ja"] } },
    { key: "monitoring_aanwezig", label: "Monitoring aanwezig", type: "select", options: ["ja", "nee"], section: "Huidige zonnepanelen", wizardStep: "situatie", visibleWhen: { field: "zonnepanelen_aanwezig", values: ["ja"] } },
    { key: "jaarlijks_verbruik_kwh", label: "Jaarlijks verbruik (kWh)", type: "number", section: "Verbruik", wizardStep: "situatie" },
    { key: "jaarlijkse_teruglevering_kwh", label: "Jaarlijkse teruglevering (kWh)", type: "number", section: "Verbruik", wizardStep: "situatie" },
    { key: "energiecontract_type", label: "Energiecontract type", type: "select", options: ["vast", "dynamisch", "variabel"], section: "Verbruik", wizardStep: "situatie" },

    // TECHNISCH
    { key: "omvormer_compatibel_batterij", label: "Huidige omvormer compatibel met batterij", type: "select", options: ["ja", "nee", "onbekend"], section: "Omvormer compatibiliteit", wizardStep: "technisch" },
    { key: "omvormer_vervanging_nodig", label: "Omvormer vervanging nodig", type: "select", options: ["ja", "nee", "onbekend"], section: "Omvormer compatibiliteit", wizardStep: "technisch", visibleWhen: { field: "omvormer_compatibel_batterij", values: ["nee", "onbekend"] } },
    { key: "gewenst_omvormertype_vervanging", label: "Gewenst omvormertype bij vervanging", type: "select", options: ["hybride", "ac_gekoppeld", "nvt"], section: "Omvormer compatibiliteit", wizardStep: "technisch", visibleWhen: { field: "omvormer_vervanging_nodig", values: ["ja"] } },
    { key: "type_aansluiting", label: "Type aansluiting", type: "select", options: ["1-fase", "3-fase"], section: "Elektra", wizardStep: "technisch" },
    { key: "meterkast_geschikt", label: "Meterkast geschikt", type: "select", options: ["ja", "nee", "aanpassing_nodig"], section: "Elektra", wizardStep: "technisch" },
    { key: "afstand_meterkast_batterij_m", label: "Afstand meterkast – batterij (m)", type: "number", section: "Elektra", wizardStep: "technisch" },
    { key: "kabelroute_bepaald", label: "Kabelroute", type: "text", section: "Elektra", wizardStep: "technisch" },
    { key: "teruglevercapaciteit_netbeheerder", label: "Teruglevercapaciteit netbeheerder", type: "text", section: "Elektra", wizardStep: "technisch" },
    { key: "batterij_locatie", label: "Batterij locatie", type: "select", options: ["garage", "berging", "zolder", "kelder", "buiten", "anders"], section: "Batterij locatie", wizardStep: "technisch" },
    { key: "beschikbare_wandruimte", label: "Beschikbare wandruimte (BxH cm)", type: "text", section: "Batterij locatie", wizardStep: "technisch" },
    { key: "gewichtscapaciteit_vloer_wand", label: "Gewichtscapaciteit vloer/wand", type: "select", options: ["voldoende", "onvoldoende", "onbekend"], section: "Batterij locatie", wizardStep: "technisch" },
    { key: "ventilatie_batterijruimte", label: "Ventilatie batterijruimte", type: "select", options: ["goed", "matig", "onvoldoende"], section: "Batterij locatie", wizardStep: "technisch" },
    { key: "temperatuur_batterijruimte", label: "Temperatuur batterijruimte", type: "select", options: ["stabiel_15_25", "wisselend", "te_koud", "te_warm"], section: "Batterij locatie", wizardStep: "technisch" },
    { key: "brandveiligheid_locatie", label: "Brandveiligheid locatie", type: "select", options: ["goed", "aandachtspunten", "onvoldoende"], section: "Batterij locatie", wizardStep: "technisch" },
  ],
};

export const getSections = (categorie: SchouwCategorie, wizardStep?: WizardStep): string[] => {
  const fields = categoryFields[categorie] || [];
  const filtered = wizardStep ? fields.filter(f => f.wizardStep === wizardStep) : fields;
  const seen = new Set<string>();
  return filtered.reduce<string[]>((acc, f) => {
    const s = f.section || "Algemeen";
    if (!seen.has(s)) { seen.add(s); acc.push(s); }
    return acc;
  }, []);
};

export const getFieldsForStep = (categorie: SchouwCategorie, wizardStep: WizardStep): CategoryField[] => {
  return (categoryFields[categorie] || []).filter(f => f.wizardStep === wizardStep);
};

export const getVisibleFieldsForStep = (
  categorie: SchouwCategorie,
  wizardStep: WizardStep,
  gegevens: Record<string, any>
): CategoryField[] => {
  return getFieldsForStep(categorie, wizardStep).filter(f => isFieldVisible(f, gegevens));
};
