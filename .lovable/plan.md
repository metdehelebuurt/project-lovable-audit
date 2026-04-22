

## Plan — Opleverrapport: vollediger conform NEN1010/NEN3140 + duidelijkere stap-namen

Op basis van het voorbeeldrapport breiden we het opleverrapport uit zodat alle vereiste velden aanwezig zijn, en we hernoemen de stappen van "Stap 1 t/m 7" naar herkenbare onderwerpen met iconen.

### Nieuwe / hernoemde stappen (was → wordt)

| Was | Wordt | Icoon |
|---|---|---|
| Identificatie | **Klant & project** | User |
| Installatie | **Installatie & specs** | Cpu |
| — (nieuw) | **Normen & scope** | BookCheck |
| Visuele inspectie | **Visuele inspectie** | Eye |
| — (nieuw) | **Bekabeling & meterkast** | Cable |
| — (nieuw) | **Aarding & beveiligingen** | ShieldCheck |
| Metingen | **Metingen** | Gauge |
| — (nieuw) | **Backup / noodstroom** | BatteryCharging |
| Documentatie | **Documenten & labels** | FileText |
| Bevindingen | **Bevindingen & verklaring** | ClipboardCheck |
| Ondertekening | **Ondertekening** | PenLine |

`WizardShell` toont op desktop nu **iconen + naam**, op mobiel scrollbare chips. Stapnummers verdwijnen — alleen progress-bar blijft.

### Velden die erbij komen (uit voorbeeldrapport)

**Klant & project** — projectnummer, datum installatie (apart van opleverdatum), woningadres-snapshot in rapport (bevriest na ondertekening).

**Installatie & specs** — type systeem (AC / DC gekoppeld), aansluitwaarde woning (1×25A, 3×25A, etc.), gateway/ATS serienummer (apart veld).

**Normen & scope** (nieuwe stap, korte checklist) — beoordeeld conform NEN1010 / NEN3140 / fabrikantrichtlijnen / netbeheerder-eisen.

**Visuele inspectie** — uitbreiding standaard checklist met punten uit voorbeeld (deugdelijk gemonteerd, geen beschadigingen, ventilatie, brandveilige plaatsing, toegankelijk voor onderhoud, temperatuurregeling OK).

**Bekabeling & meterkast** (nieuwe stap, checklist) — kabeldoorsneden, mechanische bescherming, mantelbuis, trekontlasting, aansluitklemmen, hoofdschakelaar, aparte groep, aardlek correct, selectiviteit, groepen gelabeld, installatieschema bijgewerkt.

**Aarding & beveiligingen** (nieuwe stap) — checklist (hoofdaardrail, potentiaalvereffening, SPD AC/DC, kortsluit-/overbelastings-/automatische uitschakeling) + numeriek veld **aardweerstand (Ω)**.

**Backup / noodstroom** (nieuwe stap, conditioneel — alleen als `heeft_backup` aangevinkt) — gateway/ATS geïnstalleerd, kritische groepen gescheiden, functionele test, automatische omschakeling.

**Documenten & labels** — extra checklist boven de uploads: waarschuwingsstickers, schema's overhandigd, handleidingen overgedragen, garantievoorwaarden verstrekt, foto's installatie opgeslagen.

**Bevindingen** — losse vrije-tekst sectie "Opmerkingen / afwijkingen" naast bestaande tekortkomingen + adviezen.

### Datamodel

Eén nieuwe migratie voegt **één extra JSONB-kolom** toe aan `opleverrapporten`:

```sql
alter table public.opleverrapporten
  add column if not exists extra_velden jsonb not null default '{}'::jsonb;
```

Daarin slaan we alle nieuwe velden gestructureerd op (geen schema-uitbreiding per veld, blijft toekomstvast):

```ts
extra_velden: {
  projectnummer?: string;
  installatiedatum?: string;
  aansluitwaarde?: string;          // bv "3x25A"
  systeem_type?: "AC" | "DC";
  gateway_serienummer?: string;
  aardweerstand_ohm?: number;
  heeft_backup?: boolean;
  scope_normen?: { nen1010, nen3140, fabrikant, netbeheerder: boolean };
  bekabeling_meterkast?: ChecklistItem[];
  aarding_beveiliging?: ChecklistItem[];
  backup_check?: ChecklistItem[];
  doc_labels?: ChecklistItem[];
  opmerkingen_afwijkingen?: string;
}
```

Bestaande RLS op `opleverrapporten` dekt deze kolom automatisch — geen extra policy.

### Bestanden-overzicht

| Bestand | Actie |
|---|---|
| `supabase/migrations/<nieuw>_oplever_extra_velden.sql` | nieuw — JSONB-kolom |
| `src/components/oplever/types.ts` | edit — `extra_velden`-type + `ChecklistItem`-helpers |
| `src/components/oplever/GrenswaardenLogic.ts` | edit — extra checklist-presets (bekabeling, aarding, backup, doc_labels) |
| `src/components/oplever/WizardShell.tsx` | edit — iconen + naam i.p.v. nummers, scrollbare chips op mobiel |
| `src/components/oplever/StepIdentificatie.tsx` | edit — projectnummer, installatiedatum erbij; titel "Klant & project" |
| `src/components/oplever/StepInstallatie.tsx` | edit — systeemtype, aansluitwaarde, gateway-sn |
| `src/components/oplever/StepNormenScope.tsx` | nieuw — 4-checkboxen + heeft_backup-toggle |
| `src/components/oplever/StepVisueleInspectie.tsx` | edit — uitgebreide presets |
| `src/components/oplever/StepBekabelingMeterkast.tsx` | nieuw — checklist |
| `src/components/oplever/StepAardingBeveiliging.tsx` | nieuw — checklist + aardweerstand-input |
| `src/components/oplever/StepBackup.tsx` | nieuw — conditioneel zichtbaar |
| `src/components/oplever/StepDocumentatie.tsx` | edit — extra checklist boven uploads |
| `src/components/oplever/StepBevindingen.tsx` | edit — opmerkingen/afwijkingen-textarea |
| `src/components/oplever/OpleverRapportPDF.tsx` | edit — extra secties weergeven; logo blijft, NEN1010/NEN3140 in header |
| `src/pages/OpleverDetail.tsx` | edit — nieuwe steps[] met icoon, conditionele Backup-stap |

### UX-verbeteringen meegenomen

- Stappen krijgen een **icoon links van de naam** (lucide), zelfde patroon als sidebar.
- Standaardchecklists zijn **direct ingevuld als "n.v.t."** zodat alleen relevante punten op "OK"/"Niet OK" gezet hoeven te worden — sneller invullen.
- Backup-stap is **automatisch verborgen** als de installatie geen noodstroom heeft (geen klikvermoeidheid).
- PDF-secties kennen `pageBreakInside: avoid` (al aanwezig) zodat het rapport netjes per onderwerp opbreekt op A4.

### Geen wijzigingen aan
- Bestaande ondertekening-flow, klant-token, archief-bucket, PDF-download, klant-koppeling.
- Bestaande wizard-autosave (slaat `extra_velden` automatisch mee via patch).
- RLS / multi-tenancy.

