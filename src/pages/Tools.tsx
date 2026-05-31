import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Battery, Zap, ArrowRight, MessageSquare, Sun, Thermometer, Home, Plug,
  Plus, Code, Pencil, Trash2, Loader2,
} from "lucide-react";
import { WidgetConfigurator, type WidgetFormData } from "@/components/webtools/WidgetConfigurator";
import { EmbedCodeDialog } from "@/components/webtools/EmbedCodeDialog";
import { toast } from "@/hooks/use-toast";

/* ── Adviestools ─────────────────────────────────── */

const adviesTools = [
  {
    title: "Energieadvies",
    description: "Uitgebreide wizard voor het opstellen van een energieadvies op basis van woningsituatie, verbruik en wensen.",
    icon: Zap,
    path: "/tools/energieadvies",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    title: "Thuisbatterij Selector",
    description: "Selecteer de ideale thuisbatterij op basis van zonnepanelen, verbruik, contract en klantvoorkeuren.",
    icon: Battery,
    path: "/tools/thuisbatterij",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    title: "Daklayout — Zonnepanelen intekenen",
    description: "Teken dakvlakken op de satellietfoto en plaats zonnepanelen automatisch of handmatig. Export naar PDF.",
    icon: Sun,
    path: "/tools/daklayout",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
];

/* ── Webtool templates ───────────────────────────── */

const widgetTemplates = [
  { type: "contactformulier", label: "Contactformulier", beschrijving: "Laat bezoekers eenvoudig contact opnemen. Leads komen direct in uw CRM.", icon: MessageSquare },
  { type: "calculator_zonnepanelen", label: "Zonnepanelen Calculator", beschrijving: "Bereken de besparing op basis van verbruik, dakoriëntatie en aantal panelen.", icon: Sun },
  { type: "calculator_warmtepomp", label: "Warmtepomp Calculator", beschrijving: "Toon de besparing bij overstap van gas naar een warmtepomp.", icon: Thermometer },
  { type: "calculator_isolatie", label: "Isolatie Calculator", beschrijving: "Bereken hoeveel bezoekers besparen met betere isolatie.", icon: Home },
  { type: "calculator_laadpaal", label: "Laadpaal Calculator", beschrijving: "Vergelijk laadkosten thuis versus openbaar laden.", icon: Plug },
  { type: "calculator_thuisbatterij", label: "Thuisbatterij Calculator", beschrijving: "Adviseer de ideale batterijcapaciteit op basis van teruglevering en verbruik.", icon: Battery },
];

const typeLabels: Record<string, string> = Object.fromEntries(widgetTemplates.map(t => [t.type, t.label]));

/* ── Types ───────────────────────────────────────── */

type Widget = {
  id: string;
  type: string;
  naam: string;
  config: Record<string, unknown>;
  actief: boolean;
  created_at: string;
  notificatie_email?: string | null;
};

/* ── Page ─────────────────────────────────────────── */

const Tools = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  // Widget state
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [widgetsLoading, setWidgetsLoading] = useState(true);
  const [configuratorOpen, setConfiguratorOpen] = useState(false);
  const [configuratorType, setConfiguratorType] = useState<string>("contactformulier");
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [embedWidget, setEmbedWidget] = useState<Widget | null>(null);

  const isSuperadmin = profile?.rol === "superadmin";
  const canManageWebtools = isSuperadmin || profile?.rol === "partner_admin";

  /* ── Data fetching ──────────────────────────────── */

  const fetchWidgets = async () => {
    if (!profile?.partner_id && !isSuperadmin) {
      setWidgetsLoading(false);
      return;
    }
    let query = (supabase.from("web_widgets") as any).select("*");
    if (!isSuperadmin && profile?.partner_id) {
      query = query.eq("partner_id", profile.partner_id);
    }
    const { data } = await query.order("created_at", { ascending: false });
    setWidgets((data as Widget[]) || []);
    setWidgetsLoading(false);
  };

  useEffect(() => {
    if (canManageWebtools) fetchWidgets();
    else setWidgetsLoading(false);
  }, [profile?.partner_id]);

  /* ── CRUD helpers ───────────────────────────────── */

  const handleCreate = async (formData: WidgetFormData) => {
    if (!profile?.partner_id) return;
    // Veiligheidsvalidatie: het opgeslagen type moet altijd overeenkomen met de
    // aangeklikte template, ongeacht eventuele stale form-state.
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

  /* ── Helpers ────────────────────────────────────── */

  const widgetsForType = (type: string) => widgets.filter((w) => w.type === type);

  const openCreateForType = (type: string) => {
    setConfiguratorType(type);
    setConfiguratorOpen(true);
  };

  /* ── Render ─────────────────────────────────────── */

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Tools</h1>
        <p className="text-muted-foreground mt-1">Adviestools en webtools voor uw dagelijkse werkzaamheden</p>
      </div>

      {/* ── Adviestools ─────────────────────────────── */}
      <div>
        <h2 className="text-lg font-medium text-foreground mb-4">Adviestools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adviesTools.map((tool) => (
            <Card
              key={tool.path}
              className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => navigate(tool.path)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${tool.bgColor}`}>
                    <tool.icon className={`h-6 w-6 ${tool.color}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{tool.title}</CardTitle>
                    <CardDescription className="mt-1">{tool.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="rounded-[40px] gap-2 group-hover:text-primary transition-colors">
                  Openen <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Webtools ────────────────────────────────── */}
      {canManageWebtools && (
        <>
          <Separator />

          <div>
            <h2 className="text-lg font-medium text-foreground mb-1">Webtools</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Kant-en-klare widgets voor uw website — configureer, embed en ontvang leads automatisch.
            </p>

            {widgetsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {widgetTemplates.map((t) => {
                  const Icon = t.icon;
                  const existing = widgetsForType(t.type);

                  return (
                    <Card key={t.type} className="rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base">{t.label}</CardTitle>
                          </div>
                          {existing.length > 0 && (
                            <Badge variant="default" className="shrink-0">
                              {existing.length} actief
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground leading-relaxed">{t.beschrijving}</p>

                        {/* Existing widgets for this type */}
                        {existing.length > 0 && (
                          <div className="space-y-2">
                            {existing.map((w) => (
                              <div key={w.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{w.naam || "Naamloos"}</p>
                                  {w.notificatie_email && (
                                    <p className="text-xs text-muted-foreground truncate">📧 {w.notificatie_email}</p>
                                  )}
                                </div>
                                <Badge variant={w.actief ? "default" : "secondary"} className="text-xs shrink-0">
                                  {w.actief ? "Actief" : "Inactief"}
                                </Badge>
                                <Button variant="outline" size="icon" className="h-7 w-7 shrink-0" onClick={() => setEmbedWidget(w)}>
                                  <Code className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setEditingWidget(w)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive hover:text-destructive" onClick={() => handleDelete(w.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        <Button
                          onClick={() => openCreateForType(t.type)}
                          size="sm"
                          variant={existing.length > 0 ? "outline" : "default"}
                          className="rounded-[40px] gap-1.5"
                        >
                          <Plus className="h-3.5 w-3.5" /> {existing.length > 0 ? "Nog een toevoegen" : "Configureer & Embed"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Dialogs ─────────────────────────────────── */}
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

export default Tools;
