import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sparkles, MessageSquare, Lightbulb, Bug, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import RichTextEditor from "@/components/shared/RichTextEditor";

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
  const [filterCat, setFilterCat] = useState("alle");
  const [filterStatus, setFilterStatus] = useState("alle");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [adminReactie, setAdminReactie] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState("");

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
    mutationFn: async ({ id, status, admin_reactie }: { id: string; status: string; admin_reactie?: string }) => {
      const update: any = { status };
      if (admin_reactie !== undefined) update.admin_reactie = admin_reactie;
      const { error } = await supabase.from("feedback_verzoeken").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback_admin"] });
      toast.success("Feedback bijgewerkt");
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
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Feedback Beheer</h1>
          <p className="text-muted-foreground">Overzicht en beheer van alle feedback en functieverzoeken</p>
        </div>
        <Button onClick={generateAiReport} disabled={aiLoading} variant="outline">
          <Sparkles className="h-4 w-4 mr-2" />
          {aiLoading ? "Analyseren..." : "AI Rapport"}
        </Button>
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
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
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

                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: selectedItem.beschrijving }} />

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
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedItem(null)}>Annuleren</Button>
                <Button onClick={() => updateMutation.mutate({
                  id: selectedItem.id,
                  status: newStatus,
                  admin_reactie: adminReactie,
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
