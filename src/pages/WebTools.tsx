import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Code, Pencil, Trash2, Loader2 } from "lucide-react";
import { WidgetConfigurator, type WidgetFormData } from "@/components/webtools/WidgetConfigurator";
import { EmbedCodeDialog } from "@/components/webtools/EmbedCodeDialog";
import { toast } from "@/hooks/use-toast";

type Widget = {
  id: string;
  type: string;
  naam: string;
  config: Record<string, unknown>;
  actief: boolean;
  created_at: string;
};

const typeLabels: Record<string, string> = {
  contactformulier: "Contactformulier",
  calculator_zonnepanelen: "Calculator — Zonnepanelen",
  calculator_warmtepomp: "Calculator — Warmtepomp",
  calculator_isolatie: "Calculator — Isolatie",
  calculator_laadpaal: "Calculator — Laadpaal",
};

const WebTools = () => {
  const { profile } = useAuth();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [configuratorOpen, setConfiguratorOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [embedWidget, setEmbedWidget] = useState<Widget | null>(null);

  const isSuperadmin = profile?.rol === "superadmin";

  const fetchWidgets = async () => {
    if (!profile?.partner_id && !isSuperadmin) {
      setLoading(false);
      return;
    }
    let query = (supabase.from("web_widgets") as any).select("*");
    if (!isSuperadmin && profile?.partner_id) {
      query = query.eq("partner_id", profile.partner_id);
    }
    const { data } = await query.order("created_at", { ascending: false });
    setWidgets((data as Widget[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchWidgets(); }, [profile?.partner_id]);

  const handleCreate = async (formData: WidgetFormData) => {
    if (!profile?.partner_id) return;
    const { error } = await (supabase.from("web_widgets") as any).insert({
      partner_id: profile.partner_id,
      type: formData.type,
      naam: formData.naam,
      config: formData.config,
      actief: formData.actief,
    });
    if (error) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Widget aangemaakt" });
      fetchWidgets();
    }
  };

  const handleUpdate = async (formData: WidgetFormData) => {
    if (!editingWidget) return;
    const { error } = await (supabase.from("web_widgets") as any)
      .update({ naam: formData.naam, config: formData.config, actief: formData.actief })
      .eq("id", editingWidget.id);
    if (error) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Widget bijgewerkt" });
      setEditingWidget(null);
      fetchWidgets();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Weet u zeker dat u deze widget wilt verwijderen?")) return;
    const { error } = await (supabase.from("web_widgets") as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Widget verwijderd" });
      fetchWidgets();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Webtools</h1>
          <p className="text-muted-foreground mt-1">
            Maak embeddable widgets voor uw website — in uw eigen huisstijl
          </p>
        </div>
        <Button onClick={() => setConfiguratorOpen(true)} className="rounded-[40px] gap-2">
          <Plus className="h-4 w-4" /> Nieuwe widget
        </Button>
      </div>

      {widgets.length === 0 ? (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              U heeft nog geen widgets aangemaakt. Maak uw eerste contactformulier of besparingscalculator.
            </p>
            <Button onClick={() => setConfiguratorOpen(true)} className="mt-4 rounded-[40px] gap-2">
              <Plus className="h-4 w-4" /> Eerste widget aanmaken
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {widgets.map((w) => (
            <Card key={w.id} className="rounded-2xl border-0 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{w.naam || "Naamloos"}</CardTitle>
                    <CardDescription className="mt-0.5">{typeLabels[w.type] || w.type}</CardDescription>
                  </div>
                  <Badge variant={w.actief ? "default" : "secondary"}>
                    {w.actief ? "Actief" : "Inactief"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-[40px] gap-1"
                  onClick={() => setEmbedWidget(w)}
                >
                  <Code className="h-3.5 w-3.5" /> Embed
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-[40px] gap-1"
                  onClick={() => setEditingWidget(w)}
                >
                  <Pencil className="h-3.5 w-3.5" /> Bewerken
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-[40px] gap-1 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(w.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <WidgetConfigurator
        open={configuratorOpen}
        onOpenChange={setConfiguratorOpen}
        onSave={handleCreate}
      />

      {editingWidget && (
        <WidgetConfigurator
          open={!!editingWidget}
          onOpenChange={(open) => !open && setEditingWidget(null)}
          onSave={handleUpdate}
          initialData={{
            type: editingWidget.type,
            naam: editingWidget.naam,
            config: editingWidget.config as WidgetFormData["config"],
            actief: editingWidget.actief,
          }}
          isEditing
        />
      )}

      {embedWidget && (
        <EmbedCodeDialog
          open={!!embedWidget}
          onOpenChange={(open) => !open && setEmbedWidget(null)}
          widgetId={embedWidget.id}
          widgetType={embedWidget.type}
        />
      )}
    </div>
  );
};

export default WebTools;
