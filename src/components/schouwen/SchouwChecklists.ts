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
    { key: "dampscherm_beoordeeld", label: "Dampscherm/dampremmer beoordeeld", required: true },
    { key: "koudebruggen_geinventariseerd", label: "Koudebruggen geïnventariseerd", required: true },
    { key: "asbest_check_uitgevoerd", label: "Asbestcheck uitgevoerd", required: true },
    { key: "isde_maatregel_getoetst", label: "ISDE-eisen getoetst (Rd-waarde en oppervlakte)", required: true },
    { key: "fotos_werkvlakken", label: "Foto's van alle te isoleren vlakken gemaakt", required: true },
    { key: "afvoer_afgestemd", label: "Afvoer oud materiaal afgestemd", required: false },
  ],
  isolatie_muur: [
    { key: "spouw_gecontroleerd", label: "Spouw gecontroleerd", required: true },
    { key: "vochtschade_gecontroleerd", label: "Vochtschade gecontroleerd", required: true },
    { key: "huidige_isolatie_gecontroleerd", label: "Huidige isolatie gecontroleerd", required: true },
    { key: "boorpunten_bepaald", label: "Boorpunten bepaald", required: true },
    { key: "afmetingen_opgenomen", label: "Afmetingen opgenomen", required: true },
    { key: "obstructies_genoteerd", label: "Obstructies genoteerd (leidingen, etc.)", required: false },
    { key: "spouwbreedte_gemeten", label: "Spouwbreedte gemeten (endoscopie)", required: true },
    { key: "gevelstaat_beoordeeld", label: "Gevelstaat en voegwerk beoordeeld", required: true },
    { key: "diersoorten_getoetst", label: "Beschermde diersoorten getoetst", required: true },
    { key: "isde_maatregel_getoetst", label: "ISDE-eisen getoetst (Rd-waarde en oppervlakte)", required: true },
    { key: "fotos_alle_gevels", label: "Foto's van alle gevels gemaakt", required: true },
  ],
  isolatie_vloer: [
    { key: "kruipruimte_toegankelijk", label: "Kruipruimte toegankelijkheid gecontroleerd", required: true },
    { key: "vochtschade_gecontroleerd", label: "Vochtschade gecontroleerd", required: true },
    { key: "leidingwerk_gecontroleerd", label: "Leidingwerk gecontroleerd", required: true },
    { key: "afmetingen_opgenomen", label: "Afmetingen opgenomen", required: true },
    { key: "hoogte_kruipruimte_gemeten", label: "Hoogte kruipruimte gemeten", required: true },
    { key: "grondwaterstand_beoordeeld", label: "Grondwaterstand beoordeeld", required: true },
    { key: "kruipluik_opgemeten", label: "Kruipluik opgemeten en gefotografeerd", required: true },
    { key: "ventilatie_kruipruimte_gecontroleerd", label: "Ventilatie kruipruimte gecontroleerd", required: true },
    { key: "isde_maatregel_getoetst", label: "ISDE-eisen getoetst (Rd-waarde en oppervlakte)", required: true },
    { key: "asbest_check_uitgevoerd", label: "Asbestcheck uitgevoerd", required: false },
  ],
  hr_glas: [
    { key: "kozijnen_beoordeeld", label: "Kozijnen beoordeeld", required: true },
    { key: "huidig_glas_geidentificeerd", label: "Huidig glastype geïdentificeerd", required: true },
    { key: "afmetingen_ramen_opgenomen", label: "Afmetingen ramen opgenomen", required: true },
    { key: "draairichting_genoteerd", label: "Draai-/kiepmogelijkheden genoteerd", required: true },
    { key: "sponning_maat_gecontroleerd", label: "Sponningmaat gecontroleerd", required: false },
    { key: "u_waarde_doel_bepaald", label: "Gewenste U-waarde bepaald", required: true },
    { key: "ventilatie_getoetst", label: "Ventilatievoorziening getoetst na glasvervanging", required: true },
    { key: "isde_maatregel_getoetst", label: "ISDE-eisen getoetst (U-waarde en oppervlakte)", required: true },
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
    { key: "omvormer_compatibiliteit_gecontroleerd", label: "Omvormer compatibiliteit met batterij gecontroleerd", required: true },
    { key: "offgrid_vereisten_besproken", label: "Off-grid vereisten besproken met klant", required: true },
    { key: "noodstroom_scenario_doorgenomen", label: "Noodstroomscenario doorgenomen", required: false },
    { key: "teruglevering_netbeheerder_gecontroleerd", label: "Teruglevering bij netbeheerder gecontroleerd", required: false },
    { key: "ventilatie_batterijruimte_gecontroleerd", label: "Ventilatie batterijruimte gecontroleerd", required: true },
    { key: "brandveiligheid_locatie_beoordeeld", label: "Brandveiligheid locatie beoordeeld", required: true },
    { key: "netaansluiting_gecontroleerd", label: "Netaansluiting gecontroleerd", required: false },
  ],
};
