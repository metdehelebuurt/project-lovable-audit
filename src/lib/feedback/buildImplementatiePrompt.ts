function stripHtml(html: string) {
  if (!html) return "";
  if (typeof document === "undefined") return html.replace(/<[^>]*>/g, "").trim();
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || "").trim();
}

export function buildImplementatiePrompt(item: {
  titel: string;
  type: string;
  categorie: string;
  prioriteit: string;
  status: string;
  stemmen?: number;
  created_at: string;
  beschrijving?: string | null;
  admin_reactie?: string | null;
  ai_samenvatting?: string | null;
  ai_tags?: unknown;
  ai_interview?: unknown;
  bijlagen?: unknown;
}): string {
  const beschrijving = stripHtml(item.beschrijving ?? "");
  const interview = Array.isArray(item.ai_interview)
    ? (item.ai_interview as Array<{ vraag: string; antwoord?: string }>)
        .map((q, i) => `${i + 1}. ${q.vraag}\n   Antwoord: ${q.antwoord || "(niet beantwoord)"}`)
        .join("\n")
    : "";
  const tags = Array.isArray(item.ai_tags) ? (item.ai_tags as string[]).join(", ") : "";
  const isBug = (item.type ?? "").toLowerCase() === "bug" || (item.categorie ?? "").toLowerCase() === "bug";
  const isFunctie = item.type === "functieverzoek";
  const datum = new Date(item.created_at).toLocaleDateString("nl-NL", {
    day: "numeric", month: "long", year: "numeric",
  });
  const bijlagen = Array.isArray(item.bijlagen) ? (item.bijlagen as Array<{ naam: string }>) : [];
  const adminReactieTekst = stripHtml(item.admin_reactie ?? "");

  const lines: Array<string | false | undefined> = [
    `# Implementatieopdracht voor mijnhuis.nu`,
    "",
    `Implementeer het volgende ${isBug ? "bug-fix verzoek" : isFunctie ? "functieverzoek" : "feedbackpunt"} van een gebruiker in het platform mijnhuis.nu. Lever een productieklare oplossing — geen schets of mock — die voldoet aan alle onderstaande punten.`,
    "",
    `## 1. Context van het verzoek`,
    `- **Titel:** ${item.titel}`,
    `- **Type:** ${item.type}`,
    `- **Categorie:** ${item.categorie}`,
    `- **Prioriteit:** ${item.prioriteit}`,
    `- **Aantal stemmen van gebruikers:** ${item.stemmen || 0}`,
    `- **Ingediend op:** ${datum}`,
    `- **Huidige status:** ${item.status}`,
    tags && `- **AI-tags:** ${tags}`,
    "",
    `## 2. Beschrijving van de gebruiker`,
    beschrijving || "(geen beschrijving opgegeven)",
    item.ai_samenvatting && "",
    item.ai_samenvatting && `## 3. AI-samenvatting van het verzoek`,
    item.ai_samenvatting,
    interview && "",
    interview && `## 4. Verduidelijkingsvragen & antwoorden van de indiener`,
    interview,
    adminReactieTekst && "",
    adminReactieTekst && `## 5. Reeds gegeven admin-reactie / richting`,
    adminReactieTekst,
    bijlagen.length > 0 && "",
    bijlagen.length > 0 && `## 6. Bijlagen van de gebruiker`,
    bijlagen.length > 0 && bijlagen.map((b) => `- ${b.naam}`).join("\n"),
    bijlagen.length > 0 && `Open en interpreteer relevante schermafbeeldingen/logs voor je begint.`,
    "",
    `## ${item.ai_samenvatting || interview || adminReactieTekst || bijlagen.length ? "7" : "3"}. Doelstelling`,
    isBug
      ? `Los de gerapporteerde bug volledig op: reproduceer eerst, identificeer de root cause, fix de oorzaak (niet alleen het symptoom) en voorkom regressie. Beschrijf in je antwoord kort wat de oorzaak was en hoe je het hebt opgelost.`
      : isFunctie
      ? `Realiseer de gevraagde functionaliteit end-to-end (UI + business logic + database + permissies + notificaties) zodat de gebruiker hem direct kan gebruiken vanuit zijn dagelijkse workflow.`
      : `Verwerk de feedback in een concrete verbetering die meetbaar bijdraagt aan gebruiksgemak of kwaliteit.`,
    "",
    `## Analyse & aanpak`,
    `1. **Verken eerst de codebase**: identificeer welke pagina's, modules, hooks, edge functions en database-tabellen geraakt worden. Lees bestaande gelijkaardige features om patronen te volgen.`,
    `2. **Plan de wijziging** voor je code schrijft: welke bestanden, welke nieuwe componenten/hooks/migraties, welke RLS-policies, welke edge functions.`,
    `3. **Houd bestanden klein** (max 800 regels) en splits componenten op zodra ze die grens naderen.`,
    `4. **Hergebruik bestaande componenten** uit \`src/components/ui\` (shadcn) en gedeelde hooks; bouw niets dubbel.`,
    `5. **Schrijf in het Nederlands** voor alle UI-teksten, labels, toasts en e-mails. Gebruik consequent 'Offerte' (nooit 'Opdrachtbevestiging').`,
    "",
    `## Functionele eisen`,
    `- Werkt voor alle relevante rollen: superadmin, partner_admin, partner_staff, backoffice, adviseur, installateur, affiliate en consument — beperk per rol via \`ProtectedRoute\` + \`allowedRoles\` waar nodig.`,
    `- Respecteert multi-tenancy: elke query/insert is gescoped op \`partner_id\` via \`get_user_partner_id(auth.uid())\`.`,
    `- Werkt zowel op desktop als mobiel (offcanvas sidebar, gestapelde cards op klein scherm).`,
    `- Loading-, lege- en foutstates zijn aanwezig — geen kale happy path.`,
    `- Toegankelijk: labels op inputs, keyboard-navigatie, voldoende kleurcontrast.`,
    "",
    `## Technische eisen`,
    `- **Database:** elke nieuwe public-tabel krijgt in dezelfde migratie GRANTs + \`ENABLE ROW LEVEL SECURITY\` + policies per rol. Voeg \`created_at\`/\`updated_at\` + update-trigger toe.`,
    `- **Edge functions:** valideer input met Zod, gebruik service role alleen waar nodig, log fouten gestructureerd, geef nette JSON errors terug.`,
    `- **AI-calls:** gebruik Lovable AI Gateway (\`LOVABLE_API_KEY\`) via \`@ai-sdk/openai-compatible\`; default model \`google/gemini-3-flash-preview\`. Nooit API-keys in frontend.`,
    `- **Server-state via TanStack Query**, forms via React Hook Form + Zod, geen \`useEffect\`-fetching.`,
    `- **Geen \`any\`, geen \`@ts-ignore\`**, geen hardgecodeerde kleuren — gebruik design tokens (paars primary).`,
    `- **Rich text** via \`ensureHtml\` + Tailwind \`prose\`; \`dangerouslySetInnerHTML\` alleen met DOMPurify.`,
    `- **Bestandsuploads** als WebP waar mogelijk, in bestaande Supabase-buckets met partner-RLS.`,
    "",
    isBug
      ? `## Bug-specifieke checks\n- Schrijf een korte reproductie-stappen-lijst en bevestig dat de fix die scenario's afdekt.\n- Check of dezelfde bug elders in de codebase voorkomt (zoek vergelijkbare patronen) en fix het ook daar.\n- Controleer console-logs en edge-function-logs op gerelateerde fouten.\n- Voorkom regressie: voeg waar mogelijk defensieve checks of types toe.`
      : `## Functie-specifieke checks\n- Integreer de feature zichtbaar in de navigatie/sidebar of relevante detailpagina, zodat gebruikers hem zonder uitleg vinden.\n- Voeg notificaties (in-app + e-mail via bestaande \`send-transactional-email\` flow) toe wanneer dat de workflow versnelt.\n- Documenteer nieuwe velden of statussen kort via UI-tooltips of helpteksten.`,
    "",
    `## Acceptatiecriteria (de wijziging is pas klaar als…)`,
    `- [ ] De gevraagde functionaliteit / fix werkt aantoonbaar in de preview (klik door de flow).`,
    `- [ ] Geen TypeScript- of build-errors; geen runtime-errors in console of network-tab.`,
    `- [ ] RLS-policies zijn aanwezig en getest voor alle relevante rollen (geen 403 voor toegestane rollen, geen lek naar andere partners).`,
    `- [ ] UI is consistent met de rest van het platform (paars primary, shadcn, Tailwind, geen Inter-default look).`,
    `- [ ] Nederlandse teksten, correcte terminologie (Offerte, Schouw, Lead, Klant, Installatie).`,
    `- [ ] Mobiele weergave gecontroleerd.`,
    `- [ ] Geen dode code, commented-out code of ongebruikte imports achtergelaten.`,
    "",
    `## Te vermijden`,
    `- Geen pop-ups voor stappen die als full-page flow horen (zie schouw-/installatie-patroon).`,
    `- Geen client-side admin-checks via localStorage; altijd server-side via \`has_role\` / edge function met service role.`,
    `- Geen VITE_-env vars voor secrets (Google Maps, AI, etc.) — altijd via proxy edge function.`,
    `- Geen wijzigingen aan auto-gegenereerde bestanden (\`src/integrations/supabase/client.ts\`, \`types.ts\`, \`.env\`).`,
    "",
    `## Oplevering`,
    `Sluit af met één korte zin voor de gebruiker waarin staat wat er nu mogelijk is en waar in het platform hij/zij het terugvindt.`,
  ];

  return lines.filter((l): l is string => typeof l === "string").join("\n");
}