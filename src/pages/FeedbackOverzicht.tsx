import { useState } from "react";
import DOMPurify from "dompurify";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ThumbsUp, MessageSquareText, Lightbulb, ChevronDown, ChevronUp, Settings2 } from "lucide-react";

const categorieBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ui: { label: "UI/UX", variant: "secondary" },
  performance: { label: "Performance", variant: "outline" },
  nieuwe_functie: { label: "Nieuwe functie", variant: "default" },
  bug: { label: "Bug", variant: "destructive" },
  integratie: { label: "Integratie", variant: "outline" },
  workflow: { label: "Workflow", variant: "secondary" },
  overig: { label: "Overig", variant: "outline" },
};

const statusLabel: Record<string, string> = {
  nieuw: "Nieuw",
  in_behandeling: "In behandeling",
  gepland: "Gepland",
  afgerond: "Afgerond",
  afgewezen: "Afgewezen",
};

export default function FeedbackOverzicht() {
  const { user, profile } = useAuth();
  const isSuperadmin = profile?.rol === "superadmin";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<string>("alle");
  const [filterStatus, setFilterStatus] = useState<string>("alle");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["feedback_verzoeken", filterType, filterStatus],
    queryFn: async () => {
      let q = supabase.from("feedback_verzoeken").select("*").order("created_at", { ascending: false });
      if (filterType !== "alle") q = q.eq("type", filterType);
      if (filterStatus !== "alle") q = q.eq("status", filterStatus);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const voteMutation = useMutation({
    mutationFn: async (id: string) => {
      const item = items.find((i: any) => i.id === id);
      if (!item) return;
      const { error } = await supabase
        .from("feedback_verzoeken")
        .update({ stemmen: (item.stemmen || 0) + 1 } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback_verzoeken"] });
      toast.success("Stem uitgebracht!");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Feedback & Verzoeken</h1>
          <p className="text-muted-foreground">Bekijk en stem op feedback en functieverzoeken</p>
        </div>
        <div className="flex gap-2">
          {isSuperadmin && (
            <Button variant="outline" onClick={() => navigate("/feedback/admin")}>
              <Settings2 className="h-4 w-4 mr-2" /> Beheer
            </Button>
          )}
          <Button onClick={() => navigate("/feedback/nieuw")}>
            <Plus className="h-4 w-4 mr-2" /> Nieuw verzoek
          </Button>
        </div>
      </div>

      <div className="flex gap-3">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle types</SelectItem>
            <SelectItem value="feedback">Feedback</SelectItem>
            <SelectItem value="functieverzoek">Functieverzoeken</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle statussen</SelectItem>
            <SelectItem value="nieuw">Nieuw</SelectItem>
            <SelectItem value="in_behandeling">In behandeling</SelectItem>
            <SelectItem value="gepland">Gepland</SelectItem>
            <SelectItem value="afgerond">Afgerond</SelectItem>
            <SelectItem value="afgewezen">Afgewezen</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-center py-12">Laden...</div>
      ) : items.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nog geen feedback ingediend</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map((item: any) => {
            const cat = categorieBadge[item.categorie] || categorieBadge.overig;
            const isOwn = item.user_id === user?.id;
            const expanded = expandedId === item.id;
            return (
              <Card
                key={item.id}
                className={`hover:shadow-md transition-shadow ${isSuperadmin ? "cursor-pointer" : ""}`}
                onClick={isSuperadmin ? () => navigate(`/feedback/admin?id=${item.id}`) : undefined}
              >
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); if (!isOwn) voteMutation.mutate(item.id); }}
                      disabled={isOwn}
                      className={`flex flex-col items-center gap-1 min-w-[48px] pt-1 ${
                        isOwn ? "text-muted-foreground/40 cursor-not-allowed" : "text-muted-foreground hover:text-primary cursor-pointer"
                      }`}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span className="text-xs font-semibold">{item.stemmen || 0}</span>
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {item.type === "functieverzoek" ? (
                          <Lightbulb className="h-4 w-4 text-amber-500 shrink-0" />
                        ) : (
                          <MessageSquareText className="h-4 w-4 text-primary shrink-0" />
                        )}
                        <h3 className="font-medium text-sm">{item.titel}</h3>
                        <Badge variant={cat.variant} className="text-[10px]">{cat.label}</Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {statusLabel[item.status] || item.status}
                        </Badge>
                      </div>

                      {item.ai_samenvatting && (
                        <p className="text-xs text-muted-foreground mb-1">{item.ai_samenvatting.split("\n")[0]}</p>
                      )}

                      {item.ai_tags && (item.ai_tags as string[]).length > 0 && (
                        <div className="flex gap-1 flex-wrap mb-1">
                          {(item.ai_tags as string[]).map((tag: string, i: number) => (
                            <span key={i} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{tag}</span>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedId(expanded ? null : item.id); }}
                        className="text-xs text-primary flex items-center gap-1 mt-1"
                      >
                        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {expanded ? "Minder tonen" : "Meer tonen"}
                      </button>

                      {expanded && (
                        <div className="mt-3 space-y-3">
                          <div className="prose prose-sm max-w-none text-sm" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.beschrijving) }} />

                          {item.bijlagen && (item.bijlagen as any[]).length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">Bijlagen:</p>
                              {(item.bijlagen as any[]).map((b: any, i: number) => (
                                <a
                                  key={i}
                                  href="#"
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    const { data } = await supabase.storage.from("feedback-bijlagen").createSignedUrl(b.pad, 3600);
                                    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                                  }}
                                  className="block text-xs text-primary hover:underline"
                                >
                                  📎 {b.naam}
                                </a>
                              ))}
                            </div>
                          )}

                          {item.admin_reactie && (
                            <div className="bg-muted/50 rounded-lg p-3">
                              <p className="text-xs font-medium mb-1">Admin reactie:</p>
                              <div className="prose prose-sm max-w-none text-sm" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.admin_reactie) }} />
                            </div>
                          )}
                        </div>
                      )}

                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(item.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}
                        {isOwn && " · Door jou"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
