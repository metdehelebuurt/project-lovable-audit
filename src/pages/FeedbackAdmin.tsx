import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import DOMPurify from "dompurify";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sparkles, MessageSquare, Lightbulb, Bug, TrendingUp, AlertCircle, CheckCircle, Wand2, Copy, ExternalLink, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import RichTextEditor from "@/components/shared/RichTextEditor";
import { Textarea } from "@/components/ui/textarea";
import FeedbackNotificatieLog from "@/components/feedback/FeedbackNotificatieLog";

const categorieIcons: Record<string, React.ElementType> = {
  ui: MessageSquare, performance: TrendingUp, nieuwe_functie: Lightbulb,
  bug: Bug, integratie: Sparkles, workflow: AlertCircle, overig: MessageSquare,
};

const statusOptions = [
  { value: "nieuw", label: "Nieuw" },
  { value: "in_behandeling", label: "In behandeling" },
  { value: "gepland", label: "Gepland" },
  { value: "afgerond", label: "Afgerond" },
  { value: "afgewezen", label: "Afgewezen" },
];

const prioriteitKleur: Record<string, string> = {
  laag: "text-muted-foreground",
  normaal: "text-foreground",
  hoog: "text-amber-600",
  kritiek: "text-destructive",
};

export default function FeedbackAdmin() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterCat, setFilterCat] = useState("alle");
  const [filterStatus, setFilterStatus] = useState("alle");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [adminReactie, setAdminReactie] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState("");
  const [implPrompt, setImplPrompt] = useState("");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["feedback_admin", filterCat, filterStatus],
    queryFn: async () => {
      let q = supabase.from("feedback_verzoeken").select("*").order("stemmen", { ascending: false });
      if (filterCat !== "alle") q = q.eq("categorie", filterCat);
      if (filterStatus !== "alle") q = q.eq("status", filterStatus);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  // Auto-open item if ?id= present
  useEffect(() => {
    const id = searchParams.get("id");
    if (id && items.length && !selectedItem) {
      const item = items.find((i: any) => i.id === id);
      if (item) openDetail(item);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, searchParams]);

  const stats = {
    total: items.length,
    nieuw: items.filter((i: any) => i.status === "nieuw").length,
    bugs: items.filter((i: any) => i.categorie === "bug").length,
    topVoted: items.slice(0, 3),
    categories: Object.entries(
      items.reduce((acc: Record<string, number>, i: any) => {
        acc[i.categorie] = (acc[i.categorie] || 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1]),
  };

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, admin_reactie, oude_status }: { id: string; status: string; admin_reactie?: string; oude_status?: string }) => {
      const update: any = { status };
      if (admin_reactie !== undefined) update.admin_reactie = admin_reactie;
      const { error } = await supabase.from("feedback_verzoeken").update(update).eq("id", id);
      if (error) throw error;

      const statusChanged = oude_status && oude_status !== status;
      const reactieChanged = admin_reactie !== undefined && admin_reactie.trim().length > 0;
      if (statusChanged || reactieChanged) {
        supabase.functions.invoke("feedback-notify", {
          body: {
            event: "status_wijziging",
            feedback_id: id,
            oude_status,
            nieuwe_status: status,
          },
        }).catch(console.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback_admin"] });
      toast.success("Feedback bijgewerkt — indiener is per e-mail geïnformeerd");
      setSelectedItem(null);
    },
  });

  const generateAiReport = async () => {
    setAiLoading(true);
    try {
      const summary = items.map((i: any) =>
        `- [${i.type}] ${i.titel} (categorie: ${i.categorie}, prioriteit: ${i.prioriteit}, stemmen: ${i.stemmen}, status: ${i.status})`
      ).join("\n");

      const { data, error } = await supabase.functions.invoke("ai-feedback-categorize", {
        body: { report_mode: true, summary },
      });

      // Fallback: generate report client-side if edge function doesn't support report_mode
      const categoryBreakdown = stats.categories.map(([cat, count]) => `${cat}: ${count}`).join(", ");
      const topItems = items.slice(0, 5).map((i: any) => `• ${i.titel} (${i.stemmen} stemmen, ${i.categorie})`).join("\n");

      setAiReport(`## Feedback Analyse Rapport\n\n**Totaal:** ${stats.total} items | **Nieuw:** ${stats.nieuw} | **Bugs:** ${stats.bugs}\n\n**Verdeling per categorie:** ${categoryBreakdown}\n\n**Meest gevraagd:**\n${topItems}`);
    } catch (e) {
      toast.error("Fout bij genereren rapport");
    } finally {
      setAiLoading(false);
    }
  };

  const openDetail = (item: any) => {
    setSelectedItem(item);
    setAdminReactie(item.admin_reactie || "");
    setNewStatus(item.status);
    setImplPrompt("");
  };

  const stripHtml = (html: string) => {
    if (!html) return "";
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return (tmp.textContent || tmp.innerText || "").trim();
  };

  const buildImplementatiePrompt = (item: any) => {
    const beschrijving = stripHtml(item.beschrijving || "");
    const interview = Array.isArray(item.ai_interview)
      ? (item.ai_interview as any[])
          .map((q: any, i: number) => `${i + 1}. ${q.vraag}\n   Antwoord: ${q.antwoord || "(niet beantwoord)"}`)
          .join("\n")
      : "";
    const tags = Array.isArray(item.ai_tags) ? (item.ai_tags as string[]).join(", ") : "";
    const isBug = (item.type ?? "").toLowerCase() === "bug" || (item.categorie ?? "").toLowerCase() === "bug";
    const isFunctie = (item.type ?? "") === "functieverzoek";
    const datum = new Date(item.created_at).toLocaleDateString("nl-NL", {
      day: "numeric", month: "long", year: "numeric",
    });
    const bijlagen = Array.isArray(item.bijlagen) ? (item.bijlagen as any[]) : [];
    const adminReactieTekst = stripHtml(item.admin_reactie || "");

    const lines: (string | false | undefined)[] = [
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
      bijlagen.length > 0 && bijlagen.map((b: any) => `- ${b.naam}`).join("\n"),
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

    return lines.filter((l): l is string => typeof l === "string" && l.length >= 0).join("\n");
  };

  const genereerPrompt = () => {
    if (!selectedItem) return;
    setImplPrompt(buildImplementatiePrompt(selectedItem));
  };

  const kopieerPrompt = async () => {
    if (!implPrompt) return;
    try {
      await navigator.clipboard.writeText(implPrompt);
      toast.success("Prompt gekopieerd naar klembord");
    } catch {
      toast.error("Kopiëren mislukt");
    }
  };

  const [aiVerrijkLoading, setAiVerrijkLoading] = useState(false);
  const aiVerrijkPrompt = async () => {
    if (!implPrompt || !selectedItem) return;
    setAiVerrijkLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("feedback-prompt-uitbreiden", {
        body: { basis_prompt: implPrompt, titel: selectedItem.titel, type: selectedItem.type },
      });
      if (error) throw error;
      if (data?.prompt) {
        setImplPrompt(data.prompt);
        toast.success("Prompt uitgebreid met AI");
      } else {
        toast.error("AI gaf geen uitbreiding terug");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "AI-uitbreiding mislukt");
    } finally {
      setAiVerrijkLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Feedback Beheer</h1>
          <p className="text-muted-foreground">Overzicht en beheer van alle feedback en functieverzoeken</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generateAiReport} disabled={aiLoading} variant="outline">
            <Sparkles className="h-4 w-4 mr-2" />
            {aiLoading ? "Analyseren..." : "AI Rapport"}
          </Button>
          <Button asChild variant="outline">
            <Link to="/feedback/notificatie-instellingen">
              <Settings className="h-4 w-4 mr-2" />
              Meldinginstellingen
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Totaal</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-primary">{stats.nieuw}</p>
          <p className="text-xs text-muted-foreground">Nieuw</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-destructive">{stats.bugs}</p>
          <p className="text-xs text-muted-foreground">Bugs</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{items.filter((i: any) => i.prioriteit === "hoog" || i.prioriteit === "kritiek").length}</p>
          <p className="text-xs text-muted-foreground">Hoge prioriteit</p>
        </CardContent></Card>
      </div>

      {/* AI Report */}
      {aiReport && (
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4" /> AI Analyse</CardTitle></CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm">{aiReport}</div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle categorieën</SelectItem>
            <SelectItem value="ui">UI/UX</SelectItem>
            <SelectItem value="performance">Performance</SelectItem>
            <SelectItem value="nieuwe_functie">Nieuwe functie</SelectItem>
            <SelectItem value="bug">Bug</SelectItem>
            <SelectItem value="integratie">Integratie</SelectItem>
            <SelectItem value="workflow">Workflow</SelectItem>
            <SelectItem value="overig">Overig</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle statussen</SelectItem>
            {statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Items list */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Laden...</div>
      ) : (
        <div className="space-y-2">
          {items.map((item: any) => {
            const Icon = categorieIcons[item.categorie] || MessageSquare;
            return (
              <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openDetail(item)}>
                <CardContent className="py-3 flex items-center gap-4">
                  <div className="flex flex-col items-center min-w-[40px]">
                    <span className="text-sm font-bold">{item.stemmen || 0}</span>
                    <span className="text-[10px] text-muted-foreground">stemmen</span>
                  </div>
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{item.titel}</span>
                      <Badge variant={item.type === "functieverzoek" ? "default" : "secondary"} className="text-[10px]">
                        {item.type === "functieverzoek" ? "Verzoek" : "Feedback"}
                      </Badge>
                    </div>
                    {item.ai_samenvatting && (
                      <p className="text-xs text-muted-foreground truncate">{item.ai_samenvatting.split("\n")[0]}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {statusOptions.find(s => s.value === item.status)?.label || item.status}
                  </Badge>
                  <span className={`text-xs font-medium shrink-0 ${prioriteitKleur[item.prioriteit] || ""}`}>
                    {item.prioriteit}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(item.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => {
        if (!open) {
          setSelectedItem(null);
          if (searchParams.get("id")) {
            searchParams.delete("id");
            setSearchParams(searchParams, { replace: true });
          }
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedItem.titel}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <Badge>{selectedItem.type === "functieverzoek" ? "Functieverzoek" : "Feedback"}</Badge>
                  <Badge variant="outline">Categorie: {selectedItem.categorie}</Badge>
                  <Badge variant="outline">Prioriteit: {selectedItem.prioriteit}</Badge>
                  <Badge variant="outline">{selectedItem.stemmen || 0} stemmen</Badge>
                </div>

                {selectedItem.ai_samenvatting && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs font-medium mb-1 flex items-center gap-1"><Sparkles className="h-3 w-3" /> AI Analyse</p>
                    <p className="text-sm">{selectedItem.ai_samenvatting}</p>
                  </div>
                )}

                {selectedItem.ai_tags && (selectedItem.ai_tags as string[]).length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {(selectedItem.ai_tags as string[]).map((tag: string, i: number) => (
                      <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                )}

                {/* AI Interview dossier */}
                {selectedItem.ai_interview && Array.isArray(selectedItem.ai_interview) && (selectedItem.ai_interview as any[]).length > 0 && (
                  <div className="bg-primary/5 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-medium flex items-center gap-1"><Sparkles className="h-3 w-3 text-primary" /> Verduidelijkingsvragen & Antwoorden</p>
                    {(selectedItem.ai_interview as any[]).map((item: any, i: number) => (
                      <div key={i} className="text-sm">
                        <p className="text-muted-foreground text-xs font-medium">{i + 1}. {item.vraag}</p>
                        <p className="mt-0.5">{item.antwoord || <span className="text-muted-foreground italic">Niet beantwoord</span>}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedItem.beschrijving) }} />

                {selectedItem.bijlagen && (selectedItem.bijlagen as any[]).length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Bijlagen:</p>
                    {(selectedItem.bijlagen as any[]).map((b: any, i: number) => (
                      <a
                        key={i}
                        href="#"
                        onClick={async (e) => {
                          e.preventDefault();
                          const { data } = await supabase.storage.from("feedback-bijlagen").createSignedUrl(b.pad, 3600);
                          if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                        }}
                        className="block text-sm text-primary hover:underline"
                      >
                        📎 {b.naam}
                      </a>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Admin reactie</label>
                  <RichTextEditor value={adminReactie} onChange={setAdminReactie} placeholder="Schrijf een reactie..." />
                </div>

                <div className="space-y-2 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-1">
                      <Wand2 className="h-4 w-4 text-primary" /> Implementatieprompt
                    </label>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={genereerPrompt}>
                        <Sparkles className="h-3.5 w-3.5 mr-1" />
                        {implPrompt ? "Opnieuw genereren" : "Genereer prompt"}
                      </Button>
                      {implPrompt && (
                        <Button type="button" size="sm" variant="outline" onClick={kopieerPrompt}>
                          <Copy className="h-3.5 w-3.5 mr-1" /> Kopieer
                        </Button>
                      )}
                    </div>
                  </div>
                  {implPrompt ? (
                    <>
                      <Textarea
                        value={implPrompt}
                        onChange={(e) => setImplPrompt(e.target.value)}
                        className="min-h-[220px] font-mono text-xs"
                      />
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        Kopieer deze prompt en plak hem in Lovable om het verzoek direct te verwerken.
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Genereer een kant-en-klare prompt op basis van dit verzoek die je in Lovable kunt plakken om het meteen te implementeren.
                    </p>
                  )}
                </div>

                <FeedbackNotificatieLog feedbackId={selectedItem.id} />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedItem(null)}>Annuleren</Button>
                <Button onClick={() => updateMutation.mutate({
                  id: selectedItem.id,
                  status: newStatus,
                  admin_reactie: adminReactie,
                  oude_status: selectedItem.status,
                })}>
                  <CheckCircle className="h-4 w-4 mr-2" /> Opslaan
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
