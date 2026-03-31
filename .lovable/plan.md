

## Plan: Feedback & Functieverzoek Module

### Overzicht

Een compleet feedbacksysteem met drie delen: (1) een database-tabel voor feedback-items met bijlagen, (2) een gebruikerspagina om feedback/verzoeken in te dienen, (3) een admin-dashboard met AI-categorisering en overzicht.

### Database

**Nieuwe tabel: `feedback_verzoeken`**

| Kolom | Type | Opmerkingen |
|-------|------|-------------|
| id | uuid PK | |
| user_id | uuid | Indiener |
| partner_id | uuid | Nullable (voor multi-tenancy) |
| type | text | "feedback" of "functieverzoek" |
| titel | text | Korte samenvatting |
| beschrijving | text | Uitgebreide tekst |
| categorie | text | AI-gegenereerd: "ui", "performance", "nieuwe_functie", "bug", "integratie", "overig" |
| prioriteit | text | AI-bepaald: "laag", "normaal", "hoog", "kritiek" |
| status | text | "nieuw", "in_behandeling", "gepland", "afgerond", "afgewezen" |
| ai_samenvatting | text | AI-gegenereerde korte analyse |
| ai_tags | jsonb | AI-gegenereerde tags voor groepering |
| bijlagen | jsonb | Array van bestandspaden in storage |
| stemmen | integer | Aantal upvotes van andere gebruikers |
| admin_reactie | text | Antwoord van admin |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**RLS**: Gebruikers zien eigen feedback + kunnen aanmaken. Superadmin/partner_admin zien alles (binnen partner). Superadmin ziet cross-partner.

**Storage bucket**: `feedback-bijlagen` (privaat, RLS-beveiligd)

**Realtime**: Inschakelen voor live admin-notificaties.

### Edge Function: `ai-feedback-categorize`

Wordt aangeroepen bij het indienen van feedback. Gebruikt Lovable AI om:
- Categorie te bepalen (ui, performance, nieuwe_functie, bug, integratie, overig)
- Prioriteit in te schatten
- Korte samenvatting te genereren
- Tags toe te kennen
- Te detecteren of het verzoek lijkt op bestaande items (deduplicatie-hint)

### Frontend componenten

#### 1. Feedback indienen — `src/pages/FeedbackNieuw.tsx`
- Formulier met: type (feedback/functieverzoek), titel, beschrijving (RichTextEditor)
- Multi-file upload (max 5 bestanden, 10MB per stuk) naar `feedback-bijlagen` bucket
- Beschikbaar voor alle ingelogde rollen
- Na indienen: AI categoriseert automatisch op de achtergrond

#### 2. Mijn Feedback — `src/pages/FeedbackOverzicht.tsx`
- Lijst van eigen ingediende items met status, categorie-badge, datum
- Mogelijkheid om op andermans verzoeken te stemmen (upvote)
- Filter op type en status
- Detailweergave met admin-reactie

#### 3. Admin Feedback Dashboard — `src/pages/FeedbackAdmin.tsx`
- Alleen voor superadmin en partner_admin
- Statistieken: totaal nieuw, per categorie, meest gestemd
- Tabel met alle verzoeken, sorteerbaar en filterbaar
- AI-samenvatting knop: genereert rapport over trends en veelgevraagde zaken
- Status wijzigen en admin-reactie toevoegen
- Bijlagen bekijken

#### 4. Sidebar & Header integratie
- **Sidebar**: "Feedback" item toevoegen onder een nieuwe groep "Support" voor alle rollen
- **AppHeader gebruikersmenu**: "Feedback geven" menuitem toevoegen
- **Admin notificatie**: Bij nieuw item wordt notificatie aangemaakt voor superadmin/partner_admin via bestaande notificatie-tabel

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| **Database migratie** | Tabel `feedback_verzoeken` + RLS + storage bucket + realtime |
| `supabase/functions/ai-feedback-categorize/index.ts` | Nieuw: AI-categorisering edge function |
| `src/pages/FeedbackNieuw.tsx` | Nieuw: indienformulier met bijlagen |
| `src/pages/FeedbackOverzicht.tsx` | Nieuw: overzicht eigen feedback + stemmen |
| `src/pages/FeedbackAdmin.tsx` | Nieuw: admin dashboard met AI-analyse |
| `src/components/AppSidebar.tsx` | "Feedback" nav-item toevoegen |
| `src/components/AppHeader.tsx` | "Feedback geven" in gebruikersmenu |
| `src/App.tsx` | Routes toevoegen voor 3 nieuwe pagina's |
| `supabase/config.toml` | Edge function config |

