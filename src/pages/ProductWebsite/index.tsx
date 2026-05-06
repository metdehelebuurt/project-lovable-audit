import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Globe, Sparkles, Loader2, Save, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import UspsEditor from "@/components/producten/website/UspsEditor";
import FaqEditor from "@/components/producten/website/FaqEditor";
import { useProductWebsite } from "./useProductWebsite";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";

const AI_DISCLAIMER =
  "Deze specificatie is met zorg samengesteld maar kan fouten bevatten. Controleer altijd de gegevens vóór publicatie.";

export default function ProductWebsite() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasFeature } = useSubscriptionLimits() as any;
  const heeftAddon = typeof hasFeature === "function" ? hasFeature("webshop_module") : true;

  const { product, data, update, save, loading, saving, dirty } = useProductWebsite(id);
  const [aiBezig, setAiBezig] = useState(false);

  const genereerAi = async () => {
    if (!product) return;
    setAiBezig(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("ai-product-marketing", {
        body: { product_id: product.id },
      });
      if (error) throw error;
      if (!result) throw new Error("Geen antwoord van AI");
      update("website_pitch", result.pitch ?? data.website_pitch);
      update("website_omschrijving", result.omschrijving ?? data.website_omschrijving);
      if (Array.isArray(result.usps)) update("website_usps", result.usps.slice(0, 6));
      if (Array.isArray(result.faq)) update("website_faq", result.faq.slice(0, 10));
      update("website_ai_gegenereerd", true);
      toast.success("AI-content gegenereerd", { description: "Controleer en pas aan waar nodig." });
    } catch (e: any) {
      toast.error("AI-generatie mislukt", { description: e?.message ?? "Onbekende fout" });
    } finally {
      setAiBezig(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!product) {
    return <div className="text-center py-20 text-muted-foreground">Product niet gevonden.</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/producten/${id}`)} className="rounded-[40px]">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Terug
        </Button>
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Op mijn website
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{product.naam}</p>
        </div>
      </div>

      {!heeftAddon && (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            De <strong>Webshop & catalogus</strong> add-on is niet actief. Je kunt instellingen alvast configureren,
            maar publiceren op je website is pas mogelijk na activering.
          </AlertDescription>
        </Alert>
      )}

      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">Tonen op website</CardTitle>
              <CardDescription>
                Bezoekers van je site zien dit product in de catalogus en op een productdetailpagina.
              </CardDescription>
            </div>
            <Switch
              checked={data.toon_op_website}
              onCheckedChange={(v) => update("toon_op_website", v)}
              disabled={!heeftAddon}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="slug">URL-slug</Label>
          <Input
            id="slug"
            value={data.website_slug}
            onChange={(e) => update("website_slug", e.target.value)}
            placeholder="auto-gegenereerd op basis van productnaam"
            maxLength={80}
          />
          <p className="text-xs text-muted-foreground">
            Deze slug wordt gebruikt in de URL: <code>/p/{data.website_slug || "..."}</code>
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">Marketing-content</CardTitle>
              <CardDescription>
                Aparte teksten voor je website — los van de offerte-omschrijving.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={genereerAi}
              disabled={aiBezig}
              className="rounded-[40px] gap-1.5"
            >
              {aiBezig ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              AI-content genereren
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pitch">Korte pitch <span className="text-muted-foreground">(1 zin)</span></Label>
            <Input
              id="pitch"
              value={data.website_pitch}
              onChange={(e) => update("website_pitch", e.target.value)}
              placeholder="Krachtige one-liner voor boven de productpagina"
              maxLength={160}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="omschrijving">Lange omschrijving</Label>
            <Textarea
              id="omschrijving"
              value={data.website_omschrijving}
              onChange={(e) => update("website_omschrijving", e.target.value)}
              rows={6}
              placeholder="Verhalende productomschrijving — wat het product doet, voor wie en waarom dit een goede keuze is."
              maxLength={4000}
            />
          </div>
          <div className="space-y-2">
            <Label>USP's <span className="text-muted-foreground">(3-5 unieke verkoopargumenten)</span></Label>
            <UspsEditor usps={data.website_usps} onChange={(v) => update("website_usps", v)} />
          </div>
          <div className="space-y-2">
            <Label>FAQ</Label>
            <FaqEditor items={data.website_faq} onChange={(v) => update("website_faq", v)} />
          </div>

          {data.website_ai_gegenereerd && (
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription className="text-xs">{AI_DISCLAIMER}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between sticky bottom-4 bg-background/80 backdrop-blur p-3 rounded-2xl border">
        <div className="flex items-center gap-2">
          {dirty && <Badge variant="outline">Niet-opgeslagen wijzigingen</Badge>}
        </div>
        <Button onClick={save} disabled={saving || !dirty} className="rounded-[40px] gap-1.5">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Opslaan
        </Button>
      </div>
    </div>
  );
}