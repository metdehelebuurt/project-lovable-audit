

## Plan: Uitgebreide technische specificatie-parameters per productcategorie

### Probleem
De huidige specificatie-editor is een vrij key-value formulier zonder voorgedefinieerde velden. De AI-verificatie heeft een beperkte lijst van essentiële specs (~15-25 per categorie). Er ontbreken veel parameters zoals gewicht, afmetingen, waterdichtheid, app-ondersteuning, monitoring, etc.

### Oplossing

**1. Nieuw bestand: `src/components/producten/categorySpecDefinitions.ts`**

Een uitgebreid schema met ~100 specificatie-parameters verdeeld over 7 categorieën. Elke parameter bevat:
- `key` (database key)
- `label` (Nederlands label)
- `group` (groepering: "Elektrisch", "Fysiek", "Installatie", "Connectiviteit", "Garantie & Certificering", etc.)
- `unit` (optioneel: "kg", "mm", "W", "%", etc.)
- `type` ("text" | "number" | "boolean" | "select")
- `options` (voor select-velden, bijv. ja/nee, celtype)

Per categorie ~15-30 params, totaal ca. 100+ unieke parameters verdeeld over:

| Categorie | Groepen | Voorbeeld-parameters |
|-----------|---------|---------------------|
| **Zonnepanelen** | Elektrisch, Thermisch, Fysiek, Mechanisch, Certificering | Vermogen (Wp), Efficiency (%), Celtype, Voc, Isc, Vmpp, Impp, Temp.coëff, Afmetingen, Gewicht, IP-rating, Brandklasse, Wind/sneeuwbelasting, Kleur frame/backsheet, Connectortype, Kabellengte, Max systeemspanning, Degradatie jaar 1/25 |
| **Thuisbatterij** | Capaciteit, Vermogen, Elektrisch, Fysiek, Connectiviteit, Veiligheid | Bruikbare capaciteit, DoD, Roundtrip eff., Celtype (LFP/NMC), Cycli, Levensduur, IP-rating, Gewicht, App aanwezig, Monitoring, WiFi/Ethernet/RS485/CAN, Fase, Uitbreidbaar, Max cascade, Noodstroom, Brandklasse |
| **Warmtepomp** | Prestatie, Geluid, Koudemiddel, Elektrisch, Fysiek, Installatie | COP, SCOP, Verwarmingscapaciteit, Koelvermogen, Geluid buitenunit, Geluid binnenunit, Koudemiddel, GWP, Max watertemp, Debiet, Energielabel, Subsidiabel, Smart grid ready |
| **Laadpaal** | Laden, Connectiviteit, Authenticatie, Fysiek, Installatie | Laadvermogen, Fase, Connector type, Smart charging, Load balancing, OCPP, RFID, App, MID meter, IP-rating, IK-rating, Vaste kabel, Zonne-energie compatibel |
| **Omvormer** | DC-zijde, AC-zijde, Rendement, Fysiek, Communicatie | MPPT trackers, Strings per MPPT, Max DC spanning, Europees rendement, THD, Power factor, Nachtverbruik, Hybride (ja/nee), Batterij-compatibel, Monitoring platform |
| **Accessoires** | Algemeen, Fysiek, Compatibiliteit | Gewicht, Afmetingen, Materiaal, Waterdichtheid, Compatibele merken |
| **Installatiemateriaal** | Algemeen, Fysiek, Technisch | Gewicht, Afmetingen, Materiaal, Belastbaarheid, Daktype compatibiliteit |

**2. Refactor `src/components/producten/SpecsEditor.tsx`**

Vervang de vrije key-value editor met een gegroepeerde formulier-layout:
- Toon voorgedefinieerde velden per categorie, gegroepeerd met accordions
- Velden tonen label + unit + input
- Boolean velden als switch, select velden als dropdown
- Ongebruikte velden tonen als leeg (gebruiker kan invullen)
- Behoud de mogelijkheid om custom key-value specs toe te voegen (onderaan)
- Props uitbreiden met `categorie: string`

**3. Update `supabase/functions/ai-verify-product-specs/index.ts`**

De `categoryEssentialSpecs` map vervangen met de volledige parameterlijst zodat de AI weet welke velden ingevuld moeten worden. De AI retourneert dan alle ~30 specs per categorie in de `corrected_specs` response.

**4. Update `supabase/functions/ai-product-import/index.ts`**

De prompt uitbreiden zodat geïmporteerde producten ook alle relevante specs bevatten (niet slechts 3).

**5. Update aanroepende componenten**

Waar `SpecsEditor` wordt gebruikt, de `categorie` prop meegeven.

### Bestanden

| Bestand | Actie |
|---------|-------|
| `src/components/producten/categorySpecDefinitions.ts` | **Nieuw** — schema met ~100 parameters |
| `src/components/producten/SpecsEditor.tsx` | Refactor naar gegroepeerd formulier |
| `supabase/functions/ai-verify-product-specs/index.ts` | Uitbreiden met volledige parameterlijst |
| `supabase/functions/ai-product-import/index.ts` | Prompt uitbreiden voor meer specs |
| Componenten die SpecsEditor gebruiken | `categorie` prop toevoegen |

