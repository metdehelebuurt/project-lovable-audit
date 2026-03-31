

## Plan: Feedback Beheer alleen voor superadmin + AI-gestuurde functieverzoek wizard

### Problemen

1. **Feedback Beheer** is zichtbaar voor `partner_admin` in de sidebar — moet alleen voor `superadmin`
2. Feedback en functieverzoeken staan op dezelfde pagina — gebruikers zien niet duidelijk dat ze een functieverzoek apart kunnen indienen
3. Bij functieverzoeken worden geen gerichte vragen gesteld om het verzoek te verduidelijken
4. AI-gegenereerde vragen en antwoorden worden niet opgeslagen in het dossier

### Oplossing

#### 1. Sidebar: Feedback Beheer alleen superadmin

**`src/components/AppSidebar.tsx`** regel 88: wijzig `["superadmin", "partner_admin"]` naar `["superadmin"]`

#### 2. Route: Feedback Admin alleen superadmin

**`src/App.tsx`** regel 222: wijzig `allowedRoles` van `["superadmin", "partner_admin"]` naar `["superadmin"]`

#### 3. Sidebar: aparte "Functieverzoek" link

In de Support-groep twee aparte items tonen:
- "Feedback" → `/feedback` (bestaand)
- "Functieverzoek" → `/feedback/nieuw?type=functieverzoek`

#### 4. Functieverzoek wizard met AI-vragen — `src/pages/FeedbackNieuw.tsx`

Volledige herstructurering naar een stapsgewijze wizard specifiek voor functieverzoeken:

**Stap 1**: Type kiezen (feedback of functieverzoek) + titel invoeren
**Stap 2** (alleen bij functieverzoek): AI stelt max 5 verduidelijkende vragen op basis van de titel. Vragen worden gegenereerd via de edge function en gaan over:
- Welk probleem lost dit op?
- Wie gebruikt dit? (rol/doelgroep)
- Hoe vaak heb je dit nodig?
- Wat is het gewenste resultaat?
- Zijn er voorbeelden van andere tools die dit hebben?

De gebruiker beantwoordt de vragen in tekstvelden. Antwoorden worden opgeslagen als `ai_interview` (jsonb) in het feedback-record.

**Stap 3**: Aanvullende beschrijving (WYSIWYG) + bestanden uploaden (max 5)
**Stap 4**: Samenvatting tonen + versturen

Bij feedback (niet functieverzoek) wordt stap 2 overgeslagen.

#### 5. Database: `ai_interview` kolom toevoegen

Nieuw jsonb-veld `ai_interview` op `feedback_verzoeken` tabel — slaat array op van `{ vraag: string, antwoord: string }` objecten.

#### 6. Edge function uitbreiden — `supabase/functions/ai-feedback-categorize/index.ts`

Nieuwe modus `generate_questions`: op basis van titel + type, genereer max 5 verduidelijkende vragen (Nederlands). Antwoord via tool-call met `{ vragen: string[] }`.

Bij categorisatie: de `ai_interview` antwoorden meenemen in de prompt zodat de AI een rijker beeld krijgt.

#### 7. Admin dashboard — `src/pages/FeedbackAdmin.tsx`

In het detail-dialog de `ai_interview` vragen+antwoorden tonen als apart blok zodat de admin het volledige dossier ziet.

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| Database migratie | `ai_interview` jsonb kolom toevoegen aan `feedback_verzoeken` |
| `src/components/AppSidebar.tsx` | Feedback Beheer alleen superadmin; apart "Functieverzoek" menu-item |
| `src/App.tsx` | Route feedback/admin alleen superadmin |
| `src/pages/FeedbackNieuw.tsx` | Wizard met stappen; AI-vragen ophalen en antwoorden verzamelen |
| `supabase/functions/ai-feedback-categorize/index.ts` | `generate_questions` modus toevoegen |
| `src/pages/FeedbackAdmin.tsx` | AI-interview blok tonen in detail-dialog |

