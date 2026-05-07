import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Code, Pencil, Trash2, Loader2, Sun, Thermometer, Home, Plug, Battery, MessageSquare, AlertTriangle } from "lucide-react";
import { WidgetConfigurator, type WidgetFormData } from "@/components/webtools/WidgetConfigurator";
import { EmbedCodeDialog } from "@/components/webtools/EmbedCodeDialog";
import ProductcatalogusCard from "@/components/webtools/ProductcatalogusCard";
import { toast } from "@/hooks/use-toast";

type Widget = {
  id: string;
  type: string;
  naam: string;
  config: Record<string, unknown>;
  actief: boolean;
  created_at: string;
  notificatie_email?: string | null;
};

const widgetTemplates = [
  { type: "contactformulier", label: "Contactformulier", beschrijving: "Laat bezoekers eenvoudig contact opnemen. Leads komen direct in uw CRM.", icon: MessageSquare },
  { type: "calculator_zonnepanelen", label: "Zonnepanelen Calculator", beschrijving: "Bereken de besparing op basis van verbruik, dakoriëntatie en aantal panelen.", icon: Sun },
  { type: "calculator_warmtepomp", label: "Warmtepomp Calculator", beschrijving: "Toon de besparing bij overstap van gas naar een warmtepomp.", icon: Thermometer },
  { type: "calculator_isolatie", label: "Isolatie Calculator", beschrijving: "Bereken hoeveel bezoekers besparen met betere isolatie.", icon: Home },
  { type: "calculator_laadpaal", label: "Laadpaal Calculator", beschrijving: "Vergelijk laadkosten thuis versus openbaar laden.", icon: Plug },
  { type: "calculator_thuisbatterij", label: "Thuisbatterij Calculator", beschrijving: "Adviseer de ideale batterijcapaciteit op basis van teruglevering en verbruik.", icon: Battery },
];

const typeLabels: Record<string, string> = Object.fromEntries(widgetTemplates.map(t => [t.type, t.label]));

const CALCULATOR_NAAM_KEYWORDS = [
  "calculator",
  "thuisbatterij",
  "zonnepanelen",
  "warmtepomp",
  "isolatie",
  "laadpaal",
];

const lijktVerkeerdType = (w: Widget) => {
  if (w.type !== "contactformulier") return false;
  const naam = (w.naam || "").toLowerCase();
  return CALCULATOR_NAAM_KEYWORDS.some((k) => naam.includes(k));
};

const WebTools = () => {
  const { profile } = useAuth();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [configuratorOpen, setConfiguratorOpen] = useState(false);
  const [configuratorType, setConfiguratorType] = useState<string>("contactformulier");
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

  const openCreateForType = (type: string) => {
    setConfiguratorType(type);
    setConfiguratorOpen(true);
  };

  const handleCreate = async (formData: WidgetFormData) => {
    if (!profile?.partner_id) return;
    // Veiligheidsvalidatie: zorg dat het opgeslagen type altijd overeenkomt met
    // de template-knop die de gebruiker heeft aangeklikt. Voorkomt dat stale
    // form-state ooit nog tot een verkeerd type kan leiden.
    const veiligType = configuratorType;
    if (formData.type !== veiligType) {
      console.warn("Widget type mismatch — corrigeren naar", veiligType);
    }
    const { error } = await (supabase.from("web_widgets") as any).insert({
      partner_id: profile.partner_id,
      type: veiligType,
      naam: formData.naam,
      config: formData.config,
      actief: formData.actief,
      notificatie_email: formData.notificatie_email || null,
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
      .update({
        naam: formData.naam,
        config: formData.config,
        actief: formData.actief,
        notificatie_email: formData.notificatie_email || null,
      })
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Webtools</h1>
        <p className="text-muted-foreground mt-1">
          Kant-en-klare widgets voor uw website — in uw eigen huisstijl. Kies een template en embed het op uw site.
        </p>
      </div>

      {/* Productcatalogus add-on: aparte sectie bovenaan */}
      <ProductcatalogusCard />

      {/* Template cards */}
      <div>
        <h2 className="text-lg font-medium text-foreground mb-3">Beschikbare widgets</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {widgetTemplates.map((t) => {
            const Icon = t.icon;
            return (
              <Card key={t.type} className="rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{t.label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">{t.beschrijving}</p>
                  <Button
                    onClick={() => openCreateForType(t.type)}
                    size="sm"
                    className="rounded-[40px] gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" /> Aanmaken
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Existing widgets */}
      {widgets.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-foreground mb-3">
            Uw widgets ({widgets.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {widgets.map((w) => (
              <Card key={w.id} className="rounded-2xl border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{w.naam || "Naamloos"}</CardTitle>
                      <CardDescription className="mt-0.5">{typeLabels[w.type] || w.type}</CardDescription>
                      {w.notificatie_email && (
                        <p className="text-xs text-muted-foreground mt-1">📧 {w.notificatie_email}</p>
                      )}
                      {lijktVerkeerdType(w) && (
                        <p className="text-xs text-destructive mt-1 flex items-start gap-1">
                          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                          <span>Type lijkt niet te kloppen — verwijder en maak opnieuw aan.</span>
                        </p>
                      )}
                    </div>
                    <Badge variant={w.actief ? "default" : "secondary"}>
                      {w.actief ? "Actief" : "Inactief"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-[40px] gap-1" onClick={() => setEmbedWidget(w)}>
                    <Code className="h-3.5 w-3.5" /> Embed
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-[40px] gap-1" onClick={() => setEditingWidget(w)}>
                    <Pencil className="h-3.5 w-3.5" /> Bewerken
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-[40px] gap-1 text-destructive hover:text-destructive" onClick={() => handleDelete(w.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {configuratorOpen && (
        <WidgetConfigurator
          open
          onOpenChange={setConfiguratorOpen}
          onSave={handleCreate}
          initialData={{
            type: configuratorType,
            naam: "",
            config: { intro_tekst: "", cta_tekst: "Verstuur aanvraag", toon_telefoon: true, toon_bericht: true },
            actief: true,
            notificatie_email: "",
          }}
        />
      )}

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
            notificatie_email: (editingWidget as any).notificatie_email || "",
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
