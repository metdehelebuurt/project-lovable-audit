import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import RichTextEditor from "@/components/shared/RichTextEditor";
import { toast } from "sonner";
import { Loader2, Save, RotateCcw } from "lucide-react";
import {
  EMAIL_TEMPLATE_KEYS,
  EMAIL_TEMPLATE_KEY_LIST,
  type EmailTemplateKey,
} from "@/lib/email/emailTemplateKeys";
import { TEMPLATE_VARIABLES } from "@/lib/email/renderTemplate";

interface Props {
  partnerId: string;
}

interface TemplateState {
  id?: string;
  onderwerp: string;
  html_body: string;
  bijlage_default: boolean;
  source: "partner" | "default";
}

const EMPTY: TemplateState = {
  onderwerp: "",
  html_body: "",
  bijlage_default: true,
  source: "default",
};

export default function EmailTemplatesBeheer({ partnerId }: Props) {
  const [active, setActive] = useState<EmailTemplateKey>("offerte_nieuw");
  const [state, setState] = useState<TemplateState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async (sleutel: EmailTemplateKey) => {
    setLoading(true);
    try {
      const { data: row } = await supabase
        .from("email_templates")
        .select("id, onderwerp, html_body, bijlage_default")
        .eq("partner_id", partnerId)
        .eq("sleutel", sleutel)
        .maybeSingle();
      if (row) {
        setState({
          id: row.id,
          onderwerp: row.onderwerp,
          html_body: row.html_body,
          bijlage_default: row.bijlage_default ?? true,
          source: "partner",
        });
      } else {
        // Standaard-fallback ophalen via Edge Function-default (lokaal: leeg + placeholder).
        setState({
          onderwerp: defaultSubject(sleutel),
          html_body: defaultBody(sleutel),
          bijlage_default: true,
          source: "default",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, partnerId]);

  const save = async () => {
    if (!state.onderwerp.trim() || !state.html_body.trim()) {
      toast.error("Onderwerp en bericht zijn verplicht");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        partner_id: partnerId,
        sleutel: active,
        onderwerp: state.onderwerp,
        html_body: state.html_body,
        bijlage_default: state.bijlage_default,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("email_templates")
        .upsert(payload, { onConflict: "partner_id,sleutel" });
      if (error) throw error;
      toast.success("Template opgeslagen");
      void load(active);
    } catch (err: any) {
      toast.error("Opslaan mislukt", { description: err?.message });
    }
    setSaving(false);
  };

  const resetToDefault = async () => {
    if (!state.id) {
      setState({
        onderwerp: defaultSubject(active),
        html_body: defaultBody(active),
        bijlage_default: true,
        source: "default",
      });
      return;
    }
    if (!confirm("Eigen template verwijderen en standaard herstellen?")) return;
    const { error } = await supabase
      .from("email_templates")
      .delete()
      .eq("id", state.id);
    if (error) {
      toast.error("Verwijderen mislukt", { description: error.message });
      return;
    }
    toast.success("Standaard hersteld");
    void load(active);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">E-mailtemplates</CardTitle>
        <p className="text-sm text-muted-foreground">
          Pas onderwerp en inhoud aan voor automatische e-mails. Gebruik{" "}
          <code className="text-xs">{"{{variabele}}"}</code> voor dynamische velden.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={active} onValueChange={(v) => setActive(v as EmailTemplateKey)}>
          <TabsList className="flex flex-wrap h-auto">
            {EMAIL_TEMPLATE_KEY_LIST.map((key) => (
              <TabsTrigger key={key} value={key} className="text-xs">
                {EMAIL_TEMPLATE_KEYS[key]}
              </TabsTrigger>
            ))}
          </TabsList>

          {EMAIL_TEMPLATE_KEY_LIST.map((key) => (
            <TabsContent key={key} value={key} className="space-y-4 pt-4">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Laden…
                </div>
              ) : (
                <>
                  <div className="text-xs text-muted-foreground">
                    {state.source === "partner"
                      ? "Eigen template actief"
                      : "Standaard template (nog niet aangepast)"}
                  </div>
                  <div>
                    <Label>Onderwerp</Label>
                    <Input
                      value={state.onderwerp}
                      onChange={(e) => setState({ ...state, onderwerp: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Bericht</Label>
                    <div className="mt-1 border rounded-md">
                      <RichTextEditor
                        value={state.html_body}
                        onChange={(html) => setState({ ...state, html_body: html })}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="text-xs text-muted-foreground self-center mr-1">
                        Variabelen:
                      </span>
                      {TEMPLATE_VARIABLES.map((v) => (
                        <Button
                          key={v.key}
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs px-2"
                          onClick={() =>
                            setState({ ...state, html_body: state.html_body + ` {{${v.key}}}` })
                          }
                        >
                          {v.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <Label className="text-sm">PDF-bijlage standaard meesturen</Label>
                      <p className="text-xs text-muted-foreground">
                        Geldt voor offertes, facturen en orderbevestigingen
                      </p>
                    </div>
                    <Switch
                      checked={state.bijlage_default}
                      onCheckedChange={(c) => setState({ ...state, bijlage_default: c })}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetToDefault}
                      disabled={saving}
                      className="gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Standaard herstellen
                    </Button>
                    <Button onClick={save} disabled={saving} className="gap-2">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Opslaan
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

function defaultSubject(key: EmailTemplateKey): string {
  const map: Record<EmailTemplateKey, string> = {
    offerte_nieuw: "Uw offerte {{document.nummer}} van {{partner.naam}}",
    offerte_herinnering: "Herinnering: offerte {{document.nummer}}",
    factuur_nieuw: "Factuur {{document.nummer}} van {{partner.naam}}",
    factuur_herinnering: "Herinnering factuur {{document.nummer}}",
    orderbevestiging: "Orderbevestiging — {{partner.naam}}",
    oplevering_klaar: "Opleverdocument {{document.nummer}}",
  };
  return map[key];
}

function defaultBody(key: EmailTemplateKey): string {
  const greet = "<p>Beste {{klant.voornaam}},</p>";
  const sign = "<p>Met vriendelijke groet,<br/>{{partner.afzender}}</p>";
  const map: Record<EmailTemplateKey, string> = {
    offerte_nieuw: `${greet}<p>Hierbij ontvangt u onze offerte met nummer <strong>{{document.nummer}}</strong>. De volledige specificatie vindt u in de bijlage.</p><p>U kunt de offerte ook online bekijken en digitaal accepteren via onderstaande link:</p><p><a href="{{document.url}}">Bekijk en accepteer offerte</a></p><p>Heeft u vragen? Reageer gerust op deze e-mail.</p>${sign}`,
    offerte_herinnering: `${greet}<p>Wij willen u graag herinneren aan onze offerte <strong>{{document.nummer}}</strong>.</p><p>U kunt de offerte hier bekijken: <a href="{{document.url}}">{{document.url}}</a></p>${sign}`,
    factuur_nieuw: `${greet}<p>In de bijlage vindt u factuur <strong>{{document.nummer}}</strong> ten bedrage van {{document.totaal}}.</p>${sign}`,
    factuur_herinnering: `${greet}<p>Onze administratie geeft aan dat factuur <strong>{{document.nummer}}</strong> nog openstaat. Mocht u de betaling al hebben verricht, dan kunt u deze e-mail als niet verzonden beschouwen.</p>${sign}`,
    orderbevestiging: `${greet}<p>Hartelijk dank voor uw opdracht. In de bijlage vindt u onze orderbevestiging met de afgesproken specificatie.</p><p>Wij nemen contact met u op voor de inplanning van de werkzaamheden.</p>${sign}`,
    oplevering_klaar: `${greet}<p>De installatie is succesvol opgeleverd. In de bijlage vindt u het opleverdocument met alle relevante gegevens.</p>${sign}`,
  };
  return map[key];
}