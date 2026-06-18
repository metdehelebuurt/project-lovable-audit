import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import DOMPurify from "dompurify";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "@/components/shared/RichTextEditor";
import FeedbackNotificatieLog from "@/components/feedback/FeedbackNotificatieLog";
import { buildImplementatiePrompt } from "@/lib/feedback/buildImplementatiePrompt";
import {
  ArrowLeft, Sparkles, Wand2, Copy, ExternalLink, CheckCircle,
  Paperclip, User, Calendar, ThumbsUp, Tag,
} from "lucide-react";

const statusOptions = [
  { value: "nieuw", label: "Nieuw" },
  { value: "in_behandeling", label: "In behandeling" },
  { value: "gepland", label: "Gepland" },
  { value: "afgerond", label: "Afgerond" },
  { value: "afgewezen", label: "Afgewezen" },
];

const statusKleur: Record<string, string> = {
  nieuw: "bg-primary/10 text-primary border-primary/20",
  in_behandeling: "bg-amber-100 text-amber-700 border-amber-200",
  gepland: "bg-blue-100 text-blue-700 border-blue-200",
  afgerond: "bg-emerald-100 text-emerald-700 border-emerald-200",
  afgewezen: "bg-muted text-muted-foreground border-transparent",
};

const prioriteitKleur: Record<string, string> = {
  laag: "text-muted-foreground",
  normaal: "text-foreground",
  hoog: "text-amber-600",
  kritiek: "text-destructive",
};

export default function FeedbackDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [adminReactie, setAdminReactie] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [implPrompt, setImplPrompt] = useState("");
  const [aiVerrijkLoading, setAiVerrijkLoading] = useState(false);

  const { data: item, isLoading } = useQuery({
    queryKey: ["feedback_detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback_verzoeken")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: indiener } = useQuery({
    queryKey: ["feedback_detail_indiener", item?.user_id],
    enabled: !!item?.user_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("users")
        .select("voornaam, achternaam, email")
        .eq("id", item!.user_id!)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (item) {
      setAdminReactie(item.admin_reactie || "");
      setNewStatus(item.status);
    }
  }, [item]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!item) return;
      const oudeStatus = item.status;
      const { error } = await supabase
        .from("feedback_verzoeken")
        .update({ status: newStatus, admin_reactie: adminReactie })
        .eq("id", item.id);
      if (error) throw error;

      const statusChanged = oudeStatus !== newStatus;
      const reactieChanged = (adminReactie || "").trim().length > 0 && adminReactie !== item.admin_reactie;
      if (statusChanged || reactieChanged) {
        supabase.functions.invoke("feedback-notify", {
          body: {
            event: "status_wijziging",
            feedback_id: item.id,
            oude_status: oudeStatus,
            nieuwe_status: newStatus,
          },
        }).catch(console.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback_detail", id] });
      queryClient.invalidateQueries({ queryKey: ["feedback_admin"] });
      toast.success("Feedback bijgewerkt — indiener is per e-mail geïnformeerd");
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Opslaan mislukt"),
  });

  const genereerPrompt = () => {
    if (!item) return;
    setImplPrompt(buildImplementatiePrompt(item));
  };

  const kopieerPrompt = async () => {
    if (!implPrompt) return;
    try {
      await navigator.clipboard.writeText(implPrompt);
      toast.success("Prompt gekopieerd");
    } catch {
      toast.error("Kopiëren mislukt");
    }
  };

  const aiVerrijkPrompt = async () => {
    if (!implPrompt || !item) return;
    setAiVerrijkLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("feedback-prompt-uitbreiden", {
        body: { basis_prompt: implPrompt, titel: item.titel, type: item.type },
      });
      if (error) throw error;
      if (data?.prompt) {
        setImplPrompt(data.prompt);
        toast.success("Prompt uitgebreid met AI");
      } else {
        toast.error("AI gaf geen uitbreiding terug");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "AI-uitbreiding mislukt");
    } finally {
      setAiVerrijkLoading(false);
    }
  };

  const indienerNaam = useMemo(() => {
    if (!indiener) return "Onbekend";
    return (
      [indiener.voornaam, indiener.achternaam].filter(Boolean).join(" ").trim() ||
      indiener.email ||
      "Onbekend"
    );
  }, [indiener]);

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Laden…</div>;
  }

  if (!item) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/feedback/admin">
            <ArrowLeft className="h-4 w-4 mr-1" /> Terug
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Dit verzoek bestaat niet (meer).
          </CardContent>
        </Card>
      </div>
    );
  }

  const bijlagen = Array.isArray(item.bijlagen) ? (item.bijlagen as Array<{ pad: string; naam: string }>) : [];
  const tags = Array.isArray(item.ai_tags) ? (item.ai_tags as string[]) : [];
  const interview = Array.isArray(item.ai_interview)
    ? (item.ai_interview as Array<{ vraag: string; antwoord?: string }>)
    : [];

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
          <Link to="/feedback/admin">
            <ArrowLeft className="h-4 w-4 mr-1" /> Terug naar overzicht
          </Link>
        </Button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={item.type === "functieverzoek" ? "default" : "secondary"}>
                {item.type === "functieverzoek" ? "Functieverzoek" : "Feedback"}
              </Badge>
              <Badge variant="outline" className={statusKleur[item.status] ?? ""}>
                {statusOptions.find((s) => s.value === item.status)?.label ?? item.status}
              </Badge>
              <Badge variant="outline">
                <Tag className="h-3 w-3 mr-1" /> {item.categorie}
              </Badge>
              <span className={`text-xs font-medium ${prioriteitKleur[item.prioriteit] ?? ""}`}>
                Prioriteit: {item.prioriteit}
              </span>
            </div>
            <h1 className="text-2xl font-bold leading-tight">{item.titel}</h1>
            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> {indienerNaam}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(item.created_at).toLocaleDateString("nl-NL", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" /> {item.stemmen || 0} stemmen
              </span>
            </div>
          </div>
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="shrink-0"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? "Opslaan…" : "Wijzigingen opslaan"}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Hoofdkolom */}
        <div className="lg:col-span-2 space-y-6">
          {item.ai_samenvatting && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> AI-analyse
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">{item.ai_samenvatting}</p>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tags.map((t, i) => (
                      <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Beschrijving</CardTitle>
            </CardHeader>
            <CardContent>
              {item.beschrijving ? (
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.beschrijving) }}
                />
              ) : (
                <p className="text-sm text-muted-foreground italic">Geen beschrijving opgegeven.</p>
              )}
            </CardContent>
          </Card>

          {interview.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Verduidelijkingsvragen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {interview.map((q, i) => (
                  <div key={i} className="text-sm">
                    <p className="text-muted-foreground text-xs font-medium">
                      {i + 1}. {q.vraag}
                    </p>
                    <p className="mt-0.5">
                      {q.antwoord || (
                        <span className="text-muted-foreground italic">Niet beantwoord</span>
                      )}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {bijlagen.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Paperclip className="h-4 w-4" /> Bijlagen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {bijlagen.map((b, i) => (
                  <button
                    key={i}
                    type="button"
                    className="block text-sm text-primary hover:underline text-left"
                    onClick={async () => {
                      const { data } = await supabase.storage
                        .from("feedback-bijlagen")
                        .createSignedUrl(b.pad, 3600);
                      if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                    }}
                  >
                    📎 {b.naam}
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Implementatieprompt */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-primary" /> Implementatieprompt
                </CardTitle>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={genereerPrompt}>
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    {implPrompt ? "Opnieuw genereren" : "Genereer prompt"}
                  </Button>
                  {implPrompt && (
                    <>
                      <Button type="button" size="sm" variant="outline" onClick={kopieerPrompt}>
                        <Copy className="h-3.5 w-3.5 mr-1" /> Kopieer
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={aiVerrijkPrompt}
                        disabled={aiVerrijkLoading}
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1" />
                        {aiVerrijkLoading ? "Uitbreiden…" : "AI uitbreiden"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {implPrompt ? (
                <div className="space-y-2">
                  <Textarea
                    value={implPrompt}
                    onChange={(e) => setImplPrompt(e.target.value)}
                    className="min-h-[280px] font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    Kopieer deze prompt en plak hem in Lovable om het verzoek direct te verwerken.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Genereer een kant-en-klare prompt op basis van dit verzoek die je in Lovable kunt plakken.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Notificatielogboek */}
          <Card>
            <CardContent className="pt-4">
              <FeedbackNotificatieLog feedbackId={item.id} />
            </CardContent>
          </Card>
        </div>

        {/* Zijkolom */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Status & reactie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Admin reactie (zichtbaar voor indiener in mail)
                </label>
                <RichTextEditor
                  value={adminReactie}
                  onChange={setAdminReactie}
                  placeholder="Schrijf een reactie…"
                />
              </div>
              <Button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                className="w-full"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? "Opslaan…" : "Opslaan & indiener informeren"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Indiener</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{indienerNaam}</p>
              {indiener?.email && (
                <a
                  href={`mailto:${indiener.email}`}
                  className="text-primary hover:underline text-xs"
                >
                  {indiener.email}
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}