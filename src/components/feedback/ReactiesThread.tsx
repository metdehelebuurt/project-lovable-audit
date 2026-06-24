import { useState } from "react";
import DOMPurify from "dompurify";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import RichTextEditor from "@/components/shared/RichTextEditor";
import { Lock, MessageSquare, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Props {
  feedbackId: string;
}

export default function ReactiesThread({ feedbackId }: Props) {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  const isSuperadmin = profile?.rol === "superadmin";
  const [nieuw, setNieuw] = useState("");
  const [intern, setIntern] = useState(false);

  const { data: reacties = [] } = useQuery({
    queryKey: ["feedback_reacties", feedbackId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback_reacties")
        .select("id, bericht, intern, soort, created_at, user_id")
        .eq("feedback_id", feedbackId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const userIds = Array.from(new Set(reacties.map((r) => r.user_id)));
  const { data: usersMap = {} } = useQuery({
    queryKey: ["feedback_reacties_users", userIds.sort().join(",")],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("users")
        .select("id, voornaam, achternaam, rol")
        .in("id", userIds);
      const map: Record<string, { naam: string; rol: string }> = {};
      (data ?? []).forEach((u: any) => {
        map[u.id] = {
          naam: [u.voornaam, u.achternaam].filter(Boolean).join(" ").trim() || "Gebruiker",
          rol: u.rol,
        };
      });
      return map;
    },
  });

  const verstuur = useMutation({
    mutationFn: async ({ bericht, isIntern }: { bericht: string; isIntern: boolean }) => {
      if (!user) throw new Error("Niet ingelogd");
      const { error } = await supabase.from("feedback_reacties").insert({
        feedback_id: feedbackId,
        user_id: user.id,
        bericht,
        intern: isIntern,
      });
      if (error) throw error;
      if (!isIntern && isSuperadmin) {
        await supabase
          .from("feedback_verzoeken")
          .update({ admin_reactie: bericht })
          .eq("id", feedbackId);
        supabase.functions.invoke("feedback-notify", {
          body: {
            event: "status_wijziging",
            feedback_id: feedbackId,
            nieuwe_status: "in_behandeling",
          },
        }).catch(console.error);
      }
    },
    onSuccess: () => {
      setNieuw("");
      queryClient.invalidateQueries({ queryKey: ["feedback_reacties", feedbackId] });
      toast.success("Reactie geplaatst");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Mislukt"),
  });

  const verstuurReactie = () => {
    if (!nieuw.trim() || nieuw === "<p></p>") return;
    verstuur.mutate({ bericht: nieuw, isIntern: intern && isSuperadmin });
  };

  const publiek = reacties.filter((r) => !r.intern);
  const internItems = reacties.filter((r) => r.intern);

  const renderLijst = (items: typeof reacties) =>
    items.length === 0 ? (
      <p className="text-xs text-muted-foreground italic py-4 text-center">Nog geen reacties.</p>
    ) : (
      <div className="space-y-3">
        {items.map((r) => {
          const u = usersMap[r.user_id];
          return (
            <div key={r.id} className="flex gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium">{u?.naam ?? "Gebruiker"}</span>
                  {u?.rol === "superadmin" && (
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      Platform
                    </span>
                  )}
                  {r.intern && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Lock className="h-2.5 w-2.5" /> Intern
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("nl-NL", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div
                  className={`prose prose-sm max-w-none text-sm rounded-md p-2 ${
                    r.intern ? "bg-amber-50" : "bg-muted/50"
                  }`}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(r.bericht) }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4" /> Gesprek
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isSuperadmin ? (
          <Tabs defaultValue="publiek">
            <TabsList>
              <TabsTrigger value="publiek">Publiek ({publiek.length})</TabsTrigger>
              <TabsTrigger value="intern">Intern ({internItems.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="publiek" className="mt-3">{renderLijst(publiek)}</TabsContent>
            <TabsContent value="intern" className="mt-3">{renderLijst(internItems)}</TabsContent>
          </Tabs>
        ) : (
          renderLijst(publiek)
        )}

        <div className="space-y-2 pt-2 border-t">
          <RichTextEditor value={nieuw} onChange={setNieuw} placeholder="Typ je reactie…" />
          <div className="flex items-center justify-between">
            {isSuperadmin ? (
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={intern}
                  onChange={(e) => setIntern(e.target.checked)}
                  className="h-3.5 w-3.5"
                />
                <Lock className="h-3 w-3" /> Interne notitie (niet zichtbaar voor indiener)
              </label>
            ) : (
              <span className="text-xs text-muted-foreground">Zichtbaar voor het platformteam</span>
            )}
            <Button size="sm" onClick={verstuurReactie} disabled={verstuur.isPending}>
              <Send className="h-3.5 w-3.5 mr-1" />
              {verstuur.isPending ? "Versturen…" : "Verstuur"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}