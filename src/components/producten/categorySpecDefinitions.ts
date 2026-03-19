export interface SpecDefinition {
  key: string;
  label: string;
  group: string;
  unit?: string;
  type: "text" | "number" | "boolean" | "select";
  options?: string[];
}

const shared: SpecDefinition[] = [
  { key: "gewicht_kg", label: "Gewicht", group: "Fysiek", unit: "kg", type: "number" },
  { key: "lengte_mm", label: "Lengte", group: "Fysiek", unit: "mm", type: "number" },
  { key: "breedte_mm", label: "Breedte", group: "Fysiek", unit: "mm", type: "number" },
  { key: "hoogte_mm", label: "Hoogte / Diepte", group: "Fysiek", unit: "mm", type: "number" },
  { key: "ip_rating", label: "IP-rating", group: "Fysiek", type: "text" },
  { key: "kleur", label: "Kleur", group: "Fysiek", type: "text" },
  { key: "bedrijfstemperatuur_bereik", label: "Bedrijfstemperatuur bereik", group: "Fysiek", unit: "°C", type: "text" },
  { key: "productgarantie_jaar", label: "Productgarantie", group: "Garantie & Certificering", unit: "jaar", type: "number" },
  { key: "certificeringen", label: "Certificeringen", group: "Garantie & Certificering", type: "text" },
  { key: "land_van_herkomst", label: "Land van herkomst", group: "Algemeen", type: "text" },
];

const zonnepanelen: SpecDefinition[] = [
  // Elektrisch
  { key: "vermogen_wp", label: "Vermogen", group: "Elektrisch", unit: "Wp", type: "number" },
  { key: "efficiency_pct", label: "Efficiency", group: "Elektrisch", unit: "%", type: "number" },
  { key: "celtype", label: "Celtype", group: "Elektrisch", type: "select", options: ["Mono PERC", "Mono HJT", "Mono TOPCon", "Poly", "Bifacial HJT", "Bifacial TOPCon", "IBC", "Anders"] },
  { key: "aantal_cellen", label: "Aantal cellen", group: "Elektrisch", type: "number" },
  { key: "voc_v", label: "Voc (open klemspanning)", group: "Elektrisch", unit: "V", type: "number" },
  { key: "isc_a", label: "Isc (kortsluitstroom)", group: "Elektrisch", unit: "A", type: "number" },
  { key: "vmpp_v", label: "Vmpp", group: "Elektrisch", unit: "V", type: "number" },
  { key: "impp_a", label: "Impp", group: "Elektrisch", unit: "A", type: "number" },
  { key: "max_systeemspanning_v", label: "Max systeemspanning", group: "Elektrisch", unit: "V", type: "number" },
  { key: "max_zekering_a", label: "Max zekering", group: "Elektrisch", unit: "A", type: "number" },
  { key: "bifacial", label: "Bifacial", group: "Elektrisch", type: "boolean" },
  { key: "bifacial_factor_pct", label: "Bifacial factor", group: "Elektrisch", unit: "%", type: "number" },
  // Thermisch
  { key: "temp_coeff_pmax", label: "Temp.coëff. Pmax", group: "Thermisch", unit: "%/°C", type: "text" },
  { key: "temp_coeff_voc", label: "Temp.coëff. Voc", group: "Thermisch", unit: "%/°C", type: "text" },
  { key: "temp_coeff_isc", label: "Temp.coëff. Isc", group: "Thermisch", unit: "%/°C", type: "text" },
  { key: "noct_c", label: "NOCT", group: "Thermisch", unit: "°C", type: "number" },
  // Fysiek
  { key: "connectortype", label: "Connectortype", group: "Fysiek", type: "select", options: ["MC4", "MC4 EVO2", "QC4", "Stäubli", "Anders"] },
  { key: "kabellengte_mm", label: "Kabellengte", group: "Fysiek", unit: "mm", type: "number" },
  { key: "kleur_frame", label: "Kleur frame", group: "Fysiek", type: "select", options: ["Zwart", "Zilver", "Wit", "Anders"] },
  { key: "kleur_backsheet", label: "Kleur backsheet", group: "Fysiek", type: "select", options: ["Zwart", "Wit", "Transparant", "Anders"] },
  { key: "glastype", label: "Glastype", group: "Fysiek", type: "select", options: ["Gehard glas", "Dual glas", "Anti-reflectie", "Anders"] },
  { key: "glasdikte_mm", label: "Glasdikte", group: "Fysiek", unit: "mm", type: "number" },
  // Mechanisch
  { key: "windbelasting_pa", label: "Windbelasting", group: "Mechanisch", unit: "Pa", type: "number" },
  { key: "sneeuwbelasting_pa", label: "Sneeuwbelasting", group: "Mechanisch", unit: "Pa", type: "number" },
  { key: "brandklasse", label: "Brandklasse", group: "Mechanisch", type: "text" },
  // Prestatie
  { key: "degradatie_jaar1_pct", label: "Degradatie jaar 1", group: "Prestatie", unit: "%", type: "number" },
  { key: "degradatie_jaarlijks_pct", label: "Degradatie jaarlijks", group: "Prestatie", unit: "%", type: "number" },
  { key: "vermogensgarantie_jaar", label: "Vermogensgarantie", group: "Garantie & Certificering", unit: "jaar", type: "number" },
  { key: "vermogensgarantie_pct", label: "Gegarandeerd vermogen na 25j", group: "Garantie & Certificering", unit: "%", type: "number" },
];

const thuisbatterij: SpecDefinition[] = [
  // Capaciteit
  { key: "bruikbare_capaciteit_kwh", label: "Bruikbare capaciteit", group: "Capaciteit", unit: "kWh", type: "number" },
  { key: "nominale_capaciteit_kwh", label: "Nominale capaciteit", group: "Capaciteit", unit: "kWh", type: "number" },
  { key: "dod_pct", label: "Depth of Discharge (DoD)", group: "Capaciteit", unit: "%", type: "number" },
  // Vermogen
  { key: "nominaal_vermogen_kw", label: "Nominaal vermogen (continu)", group: "Vermogen", unit: "kW", type: "number" },
  { key: "piekvermogen_kw", label: "Piekvermogen", group: "Vermogen", unit: "kW", type: "number" },
  { key: "max_laadstroom_a", label: "Max laadstroom", group: "Vermogen", unit: "A", type: "number" },
  { key: "max_ontlaadstroom_a", label: "Max ontlaadstroom", group: "Vermogen", unit: "A", type: "number" },
  // Elektrisch
  { key: "celtype", label: "Celtype", group: "Elektrisch", type: "select", options: ["LFP (LiFePO4)", "NMC", "LTO", "Natrium-ion", "Anders"] },
  { key: "roundtrip_efficiency_pct", label: "Roundtrip efficiëntie", group: "Elektrisch", unit: "%", type: "number" },
  { key: "nominale_spanning_v", label: "Nominale spanning", group: "Elektrisch", unit: "V", type: "number" },
  { key: "spanningsbereik_v", label: "Spanningsbereik", group: "Elektrisch", type: "text" },
  { key: "fase", label: "Fase", group: "Elektrisch", type: "select", options: ["1-fase", "3-fase", "1/3-fase"] },
  // Levensduur
  { key: "cycli", label: "Aantal cycli", group: "Levensduur", type: "text" },
  { key: "verwachte_levensduur_jaar", label: "Verwachte levensduur", group: "Levensduur", unit: "jaar", type: "number" },
  // Fysiek
  { key: "montagetype", label: "Montagetype", group: "Fysiek", type: "select", options: ["Wandmontage", "Vloerstaand", "Rack", "Anders"] },
  { key: "opslagtemperatuur_bereik", label: "Opslagtemperatuur bereik", group: "Fysiek", unit: "°C", type: "text" },
  // Connectiviteit
  { key: "wifi", label: "WiFi", group: "Connectiviteit", type: "boolean" },
  { key: "ethernet", label: "Ethernet", group: "Connectiviteit", type: "boolean" },
  { key: "rs485", label: "RS485", group: "Connectiviteit", type: "boolean" },
  { key: "can_bus", label: "CAN bus", group: "Connectiviteit", type: "boolean" },
  { key: "bluetooth", label: "Bluetooth", group: "Connectiviteit", type: "boolean" },
  { key: "app_aanwezig", label: "App aanwezig", group: "Connectiviteit", type: "boolean" },
  { key: "monitoring_platform", label: "Monitoring platform", group: "Connectiviteit", type: "text" },
  // Functionaliteit
  { key: "noodstroom", label: "Noodstroom (backup)", group: "Functionaliteit", type: "boolean" },
  { key: "uitbreidbaar", label: "Uitbreidbaar", group: "Functionaliteit", type: "boolean" },
  { key: "max_modules_cascade", label: "Max modules in cascade", group: "Functionaliteit", type: "number" },
  { key: "compatibele_omvormers", label: "Compatibele omvormers", group: "Functionaliteit", type: "text" },
  // Veiligheid
  { key: "brandklasse", label: "Brandklassificatie", group: "Veiligheid", type: "text" },
];

const warmtepomp: SpecDefinition[] = [
  // Type
  { key: "type_warmtepomp", label: "Type warmtepomp", group: "Type", type: "select", options: ["Lucht-water", "Lucht-lucht", "Bodem-water", "Water-water", "Hybride", "Anders"] },
  { key: "split_monoblock", label: "Uitvoering", group: "Type", type: "select", options: ["Split", "Monoblock"] },
  // Prestatie verwarming
  { key: "verwarmingscapaciteit_a7w35_kw", label: "Verwarmingscapaciteit (A7/W35)", group: "Prestatie", unit: "kW", type: "number" },
  { key: "verwarmingscapaciteit_a2w35_kw", label: "Verwarmingscapaciteit (A2/W35)", group: "Prestatie", unit: "kW", type: "number" },
  { key: "verwarmingscapaciteit_a_7w35_kw", label: "Verwarmingscapaciteit (A-7/W35)", group: "Prestatie", unit: "kW", type: "number" },
  { key: "cop_a7w35", label: "COP (A7/W35)", group: "Prestatie", type: "number" },
  { key: "cop_a2w35", label: "COP (A2/W35)", group: "Prestatie", type: "number" },
  { key: "scop", label: "SCOP", group: "Prestatie", type: "number" },
  // Koeling
  { key: "koelvermogen_kw", label: "Koelvermogen", group: "Koeling", unit: "kW", type: "number" },
  { key: "eer", label: "EER", group: "Koeling", type: "number" },
  { key: "seer", label: "SEER", group: "Koeling", type: "number" },
  // Geluid
  { key: "geluid_buitenunit_dba", label: "Geluidsniveau buitenunit", group: "Geluid", unit: "dB(A)", type: "number" },
  { key: "geluid_binnenunit_dba", label: "Geluidsniveau binnenunit", group: "Geluid", unit: "dB(A)", type: "number" },
  // Koudemiddel
  { key: "koudemiddel_type", label: "Koudemiddel type", group: "Koudemiddel", type: "select", options: ["R32", "R290 (propaan)", "R410A", "R454B", "R134a", "Anders"] },
  { key: "gwp", label: "GWP", group: "Koudemiddel", type: "number" },
  { key: "koudemiddel_hoeveelheid_kg", label: "Hoeveelheid koudemiddel", group: "Koudemiddel", unit: "kg", type: "number" },
  // Elektrisch
  { key: "elektrisch_vermogen_max_kw", label: "Elektrisch vermogen max", group: "Elektrisch", unit: "kW", type: "number" },
  { key: "aansluitspanning_v", label: "Aansluitspanning", group: "Elektrisch", unit: "V", type: "text" },
  { key: "zekering_a", label: "Zekering", group: "Elektrisch", unit: "A", type: "number" },
  { key: "fase", label: "Fase", group: "Elektrisch", type: "select", options: ["1-fase", "3-fase"] },
  // Water
  { key: "max_watertemperatuur_c", label: "Max watertemperatuur", group: "Water", unit: "°C", type: "number" },
  { key: "debiet_l_min", label: "Debiet", group: "Water", unit: "l/min", type: "number" },
  { key: "wateraansluiting", label: "Wateraansluiting", group: "Water", type: "text" },
  // Fysiek - buitenunit
  { key: "buitenunit_breedte_mm", label: "Buitenunit breedte", group: "Fysiek buitenunit", unit: "mm", type: "number" },
  { key: "buitenunit_hoogte_mm", label: "Buitenunit hoogte", group: "Fysiek buitenunit", unit: "mm", type: "number" },
  { key: "buitenunit_diepte_mm", label: "Buitenunit diepte", group: "Fysiek buitenunit", unit: "mm", type: "number" },
  { key: "buitenunit_gewicht_kg", label: "Buitenunit gewicht", group: "Fysiek buitenunit", unit: "kg", type: "number" },
  // Fysiek - binnenunit
  { key: "binnenunit_breedte_mm", label: "Binnenunit breedte", group: "Fysiek binnenunit", unit: "mm", type: "number" },
  { key: "binnenunit_hoogte_mm", label: "Binnenunit hoogte", group: "Fysiek binnenunit", unit: "mm", type: "number" },
  { key: "binnenunit_diepte_mm", label: "Binnenunit diepte", group: "Fysiek binnenunit", unit: "mm", type: "number" },
  { key: "binnenunit_gewicht_kg", label: "Binnenunit gewicht", group: "Fysiek binnenunit", unit: "kg", type: "number" },
  // Energie
  { key: "energielabel_verwarming", label: "Energielabel verwarming", group: "Energie", type: "select", options: ["A+++", "A++", "A+", "A", "B", "C"] },
  { key: "energielabel_warm_water", label: "Energielabel warm water", group: "Energie", type: "select", options: ["A+++", "A++", "A+", "A", "B", "C"] },
  // Subsidie & regelgeving
  { key: "subsidiabel", label: "Subsidiabel (ISDE)", group: "Subsidie & Regelgeving", type: "boolean" },
  { key: "smart_grid_ready", label: "Smart Grid Ready (SG Ready)", group: "Subsidie & Regelgeving", type: "boolean" },
];

const laadpaal: SpecDefinition[] = [
  // Laden
  { key: "laadvermogen_kw", label: "Laadvermogen", group: "Laden", unit: "kW", type: "number" },
  { key: "max_laadstroom_a", label: "Max laadstroom", group: "Laden", unit: "A", type: "number" },
  { key: "fase", label: "Fase", group: "Laden", type: "select", options: ["1-fase", "3-fase", "1/3-fase"] },
  { key: "aansluitspanning_v", label: "Aansluitspanning", group: "Laden", unit: "V", type: "text" },
  { key: "connector_type", label: "Connector type", group: "Laden", type: "select", options: ["Type 1", "Type 2", "CCS Combo 2", "CHAdeMO", "Type 2 + CCS", "Anders"] },
  { key: "vaste_kabel", label: "Vaste kabel", group: "Laden", type: "boolean" },
  { key: "kabellengte_m", label: "Kabellengte", group: "Laden", unit: "m", type: "number" },
  // Smart functies
  { key: "smart_charging", label: "Smart charging", group: "Smart functies", type: "boolean" },
  { key: "load_balancing", label: "Load balancing", group: "Smart functies", type: "boolean" },
  { key: "dynamic_load_balancing", label: "Dynamic load balancing", group: "Smart functies", type: "boolean" },
  { key: "solar_charging", label: "Zonne-energie laden", group: "Smart functies", type: "boolean" },
  { key: "vehicle_to_grid", label: "Vehicle-to-Grid (V2G)", group: "Smart functies", type: "boolean" },
  { key: "thuisbatterij_compatibel", label: "Thuisbatterij compatibel", group: "Smart functies", type: "boolean" },
  // Connectiviteit
  { key: "wifi", label: "WiFi", group: "Connectiviteit", type: "boolean" },
  { key: "4g_lte", label: "4G/LTE", group: "Connectiviteit", type: "boolean" },
  { key: "ethernet", label: "Ethernet", group: "Connectiviteit", type: "boolean" },
  { key: "bluetooth", label: "Bluetooth", group: "Connectiviteit", type: "boolean" },
  { key: "ocpp_versie", label: "OCPP versie", group: "Connectiviteit", type: "select", options: ["OCPP 1.6", "OCPP 2.0.1", "Geen", "Anders"] },
  { key: "app_aanwezig", label: "App aanwezig", group: "Connectiviteit", type: "boolean" },
  { key: "monitoring_platform", label: "Monitoring platform", group: "Connectiviteit", type: "text" },
  // Authenticatie
  { key: "rfid", label: "RFID", group: "Authenticatie", type: "boolean" },
  { key: "plug_and_charge", label: "Plug & Charge (ISO 15118)", group: "Authenticatie", type: "boolean" },
  { key: "pin_code", label: "PIN-code", group: "Authenticatie", type: "boolean" },
  // Meting
  { key: "energiemeter_ingebouwd", label: "Energiemeter ingebouwd", group: "Meting", type: "boolean" },
  { key: "mid_gecertificeerd", label: "MID-gecertificeerd", group: "Meting", type: "boolean" },
  // Fysiek
  { key: "ik_rating", label: "IK-rating", group: "Fysiek", type: "text" },
  { key: "installatiewijze", label: "Installatiewijze", group: "Fysiek", type: "select", options: ["Wandmontage", "Paalmontage", "Wand + paal", "Anders"] },
];

const omvormer: SpecDefinition[] = [
  // Type
  { key: "type_omvormer", label: "Type omvormer", group: "Type", type: "select", options: ["String", "Micro", "Hybride", "Batterij", "Anders"] },
  { key: "hybride", label: "Hybride (batterij-ready)", group: "Type", type: "boolean" },
  // DC-zijde
  { key: "max_dc_vermogen_wp", label: "Max DC-vermogen", group: "DC-zijde", unit: "Wp", type: "number" },
  { key: "max_dc_spanning_v", label: "Max DC-spanning", group: "DC-zijde", unit: "V", type: "number" },
  { key: "mppt_bereik_v", label: "MPPT spanningsbereik", group: "DC-zijde", unit: "V", type: "text" },
  { key: "aantal_mppt_trackers", label: "Aantal MPPT-trackers", group: "DC-zijde", type: "number" },
  { key: "strings_per_mppt", label: "Strings per MPPT", group: "DC-zijde", type: "number" },
  { key: "max_ingangsstroom_per_mppt_a", label: "Max ingangsstroom per MPPT", group: "DC-zijde", unit: "A", type: "number" },
  { key: "max_kortsluitstroom_a", label: "Max kortsluitstroom", group: "DC-zijde", unit: "A", type: "number" },
  // AC-zijde
  { key: "nominaal_ac_vermogen_w", label: "Nominaal AC-vermogen", group: "AC-zijde", unit: "W", type: "number" },
  { key: "max_ac_vermogen_va", label: "Max AC-vermogen", group: "AC-zijde", unit: "VA", type: "number" },
  { key: "fase", label: "Fase", group: "AC-zijde", type: "select", options: ["1-fase", "3-fase"] },
  { key: "nominale_ac_spanning_v", label: "Nominale AC-spanning", group: "AC-zijde", unit: "V", type: "text" },
  { key: "frequentie_hz", label: "Frequentie", group: "AC-zijde", unit: "Hz", type: "text" },
  { key: "thd_pct", label: "THD", group: "AC-zijde", unit: "%", type: "text" },
  { key: "power_factor", label: "Power factor", group: "AC-zijde", type: "text" },
  // Rendement
  { key: "europees_rendement_pct", label: "Europees rendement", group: "Rendement", unit: "%", type: "number" },
  { key: "max_rendement_pct", label: "Max rendement", group: "Rendement", unit: "%", type: "number" },
  { key: "nachtverbruik_w", label: "Nachtverbruik", group: "Rendement", unit: "W", type: "number" },
  // Fysiek
  { key: "koeling", label: "Koeling", group: "Fysiek", type: "select", options: ["Natuurlijke convectie", "Ventilator", "Anders"] },
  { key: "max_hoogte_m", label: "Max installatiehoogte", group: "Fysiek", unit: "m", type: "number" },
  // Communicatie
  { key: "wifi", label: "WiFi", group: "Communicatie", type: "boolean" },
  { key: "ethernet", label: "Ethernet", group: "Communicatie", type: "boolean" },
  { key: "rs485", label: "RS485", group: "Communicatie", type: "boolean" },
  { key: "monitoring_platform", label: "Monitoring platform", group: "Communicatie", type: "text" },
  { key: "app_aanwezig", label: "App aanwezig", group: "Communicatie", type: "boolean" },
  // Batterij
  { key: "batterij_compatibel", label: "Batterij compatibel", group: "Batterij", type: "boolean" },
  { key: "compatibele_batterijen", label: "Compatibele batterijen", group: "Batterij", type: "text" },
  { key: "max_batterij_stroom_a", label: "Max batterijstroom", group: "Batterij", unit: "A", type: "number" },
];

const accessoires: SpecDefinition[] = [
  { key: "materiaal", label: "Materiaal", group: "Algemeen", type: "text" },
  { key: "waterdichtheid", label: "Waterdichtheid", group: "Algemeen", type: "text" },
  { key: "belastbaarheid", label: "Belastbaarheid", group: "Algemeen", type: "text" },
  { key: "compatibele_merken", label: "Compatibele merken", group: "Compatibiliteit", type: "text" },
  { key: "compatibele_modellen", label: "Compatibele modellen", group: "Compatibiliteit", type: "text" },
  { key: "inhoud_verpakking", label: "Inhoud verpakking", group: "Algemeen", type: "text" },
  { key: "kleur", label: "Kleur", group: "Algemeen", type: "text" },
];

const installatiemateriaal: SpecDefinition[] = [
  { key: "materiaal", label: "Materiaal", group: "Algemeen", type: "text" },
  { key: "belastbaarheid", label: "Belastbaarheid", group: "Technisch", type: "text" },
  { key: "daktype_compatibiliteit", label: "Daktype compatibiliteit", group: "Technisch", type: "select", options: ["Schuin dak (pannen)", "Schuin dak (leien)", "Platdak (bitumen)", "Platdak (grind)", "Metalen dak", "Universeel", "Anders"] },
  { key: "spanning_v", label: "Spanning", group: "Technisch", unit: "V", type: "text" },
  { key: "doorsnede_mm2", label: "Doorsnede", group: "Technisch", unit: "mm²", type: "text" },
  { key: "uv_bestendig", label: "UV-bestendig", group: "Technisch", type: "boolean" },
  { key: "brandvertragend", label: "Brandvertragend", group: "Technisch", type: "boolean" },
  { key: "compatibele_merken", label: "Compatibele merken", group: "Compatibiliteit", type: "text" },
  { key: "inhoud_verpakking", label: "Inhoud verpakking", group: "Algemeen", type: "text" },
];

export const categorySpecDefinitions: Record<string, SpecDefinition[]> = {
  zonnepanelen: [...zonnepanelen, ...shared],
  thuisbatterij: [...thuisbatterij, ...shared],
  warmtepomp: [...warmtepomp, ...shared],
  laadpaal: [...laadpaal, ...shared],
  omvormer: [...omvormer, ...shared],
  accessoires: [...accessoires, ...shared],
  installatiemateriaal: [...installatiemateriaal, ...shared],
};

/** Get grouped specs for a category */
export function getGroupedSpecs(categorie: string): Record<string, SpecDefinition[]> {
  const defs = categorySpecDefinitions[categorie] || shared;
  const grouped: Record<string, SpecDefinition[]> = {};
  for (const def of defs) {
    if (!grouped[def.group]) grouped[def.group] = [];
    grouped[def.group].push(def);
  }
  return grouped;
}

/** Get all spec keys for a category (for AI prompts) */
export function getSpecKeysForCategory(categorie: string): string[] {
  return (categorySpecDefinitions[categorie] || shared).map(d => d.key);
}

/** Build AI prompt text listing all expected specs for a category */
export function buildSpecPromptForCategory(categorie: string): string {
  const grouped = getGroupedSpecs(categorie);
  const lines: string[] = [`Essentiële specificaties voor ${categorie}:`];
  for (const [group, defs] of Object.entries(grouped)) {
    const items = defs.map(d => `${d.label}${d.unit ? ` (${d.unit})` : ""}`).join(", ");
    lines.push(`  ${group}: ${items}`);
  }
  return lines.join("\n");
}
