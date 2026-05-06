import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, ExternalLink, Copy, Check, Globe, Package, EyeOff, Settings2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { FeatureGate } from "@/components/abonnementen/FeatureGate";
import { ApiTokensManager } from "./ApiTokensManager";

interface Stats {
  totaal: number;
  zichtbaar: number;
}

const useCatalogusStats = (partnerId: string | null | undefined) => {
  const [stats, setStats] = useState<Stats>({ totaal: 0, zichtbaar: 0 });
  const [partnerSlug, setPartnerSlug] = useState<string>("");

  useEffect(() => {
    if (!partnerId) return;
    let active = true;
    (async () => {
      const [{ count: totaal }, { count: zichtbaar }, { data: partner }] = await Promise.all([
        supabase.from("producten").select("id", { count: "exact", head: true }).eq("partner_id", partnerId),
        (supabase.from("producten") as any)
          .select("id", { count: "exact", head: true })
          .eq("partner_id", partnerId)
          .eq("toon_op_website", true),
        (supabase.from("partners") as any).select("partner_slug").eq("id", partnerId).maybeSingle(),
      ]);
      if (!active) return;
      setStats({ totaal: totaal ?? 0, zichtbaar: zichtbaar ?? 0 });
      setPartnerSlug((partner as any)?.partner_slug ?? "");
    })();
    return () => {
      active = false;
    };
  }, [partnerId]);

  return { stats, partnerSlug };
};

const useCatalogusWidget = (partnerId: string | null | undefined) => {
  const [widget, setWidget] = useState<{ id: string; naam: string; actief: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = async () => {
    if (!partnerId) {
      setLoading(false);
      return;
    }
    const { data } = await (supabase.from("web_widgets") as any)
      .select("id, naam, actief")
      .eq("partner_id", partnerId)
      .eq("type", "productcatalogus")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setWidget(data ?? null);
    setLoading(false);
  };

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId]);

  return { widget, loading, refetch };
};

export default function ProductcatalogusCard() {
  const { profile } = useAuth();
  const partnerId = profile?.partner_id ?? null;
  const { stats, partnerSlug } = useCatalogusStats(partnerId);
  const { widget, refetch } = useCatalogusWidget(partnerId);
  const [copied, setCopied] = useState<string | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const publiekeUrl = partnerSlug ? `${baseUrl}/c/${partnerSlug}` : "";
  const embedUrl = widget ? `${baseUrl}/embed/catalogus/${widget.id}` : "";
  const embedCode = widget
    ? `<iframe
  src="${embedUrl}"
  width="100%"
  height="900"
  frameborder="0"
  style="border: none; border-radius: 12px; max-width: 1080px;"
  title="Productcatalogus"
></iframe>`
    : "";

  const kopieer = async (tekst: string, key: string) => {
    if (!tekst) return;
    await navigator.clipboard.writeText(tekst);
    setCopied(key);
    toast.success("Gekopieerd naar klembord");
    setTimeout(() => setCopied(null), 2000);
  };

  const activeer = async () => {
    if (!partnerId) return;
    const { error } = await (supabase.from("web_widgets") as any).insert({
      partner_id: partnerId,
      type: "productcatalogus",
      naam: "Productcatalogus",
      config: {},
      actief: true,
    });
    if (error) {
      toast.error("Activeren mislukt", { description: error.message });
      return;
    }
    toast.success("Productcatalogus geactiveerd");
    refetch();
  };

  return (
    <Card className="rounded-2xl border shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Productcatalogus</CardTitle>
              <CardDescription>
                Toon je assortiment op een eigen pagina, embed in je website of haal op via REST.
              </CardDescription>
            </div>
          </div>
          <FeatureGate feature="webshop_module" fallback={<Badge variant="secondary">Add-on vereist</Badge>}>
            <Badge>Actief</Badge>
          </FeatureGate>
        </div>
      </CardHeader>

      <CardContent>
        <FeatureGate
          feature="webshop_module"
          fallback={
            <div className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
              De <strong>Webshop & catalogus</strong> add-on is niet actief op je abonnement. Activeer
              de add-on om de productcatalogus te publiceren en de REST-API te gebruiken.
            </div>
          }
        >
          {/* Statistieken */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Globe className="h-3.5 w-3.5" /> Zichtbaar op website
              </div>
              <div className="text-2xl font-semibold">{stats.zichtbaar}</div>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Package className="h-3.5 w-3.5" /> Totaal in catalogus
              </div>
              <div className="text-2xl font-semibold">{stats.totaal}</div>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <EyeOff className="h-3.5 w-3.5" /> Verborgen
              </div>
              <div className="text-2xl font-semibold">{Math.max(0, stats.totaal - stats.zichtbaar)}</div>
            </div>
          </div>

          <Tabs defaultValue="publiek" className="space-y-4">
            <TabsList>
              <TabsTrigger value="publiek">Publieke pagina</TabsTrigger>
              <TabsTrigger value="embed">Embed</TabsTrigger>
            </TabsList>

            {/* Publieke URL */}
            <TabsContent value="publiek" className="space-y-3">
              {partnerSlug ? (
                <>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input readOnly value={publiekeUrl} className="font-mono text-sm" />
                    <Button
                      variant="outline"
                      onClick={() => kopieer(publiekeUrl, "url")}
                      className="rounded-[40px] gap-2"
                    >
                      {copied === "url" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      Kopieer
                    </Button>
                    <Button asChild className="rounded-[40px] gap-2">
                      <a href={publiekeUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" /> Bekijken
                      </a>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Beheer welke producten zichtbaar zijn via{" "}
                    <Link to="/producten" className="underline">
                      Producten
                    </Link>{" "}
                    of per product via "Op mijn website".
                  </p>
                </>
              ) : (
                <div className="rounded-xl bg-muted/40 p-4 text-sm">
                  <p className="font-medium mb-1">Geen publieke slug ingesteld</p>
                  <p className="text-muted-foreground">
                    Stel je publieke catalogus-slug in via{" "}
                    <Link to="/instellingen/partner" className="underline">
                      partnerinstellingen
                    </Link>
                    .
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Embed-snippet */}
            <TabsContent value="embed" className="space-y-3">
              {!widget ? (
                <div className="rounded-xl bg-muted/40 p-4 space-y-3">
                  <p className="text-sm">
                    Activeer de embed-versie om je catalogus in een iframe op je website te plaatsen.
                  </p>
                  <Button onClick={activeer} className="rounded-[40px] gap-2">
                    <Plus className="h-4 w-4" /> Activeer embed
                  </Button>
                </div>
              ) : (
                <>
                  <Textarea readOnly value={embedCode} rows={8} className="font-mono text-xs" />
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => kopieer(embedCode, "embed")} className="rounded-[40px] gap-2">
                      {copied === "embed" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      Kopieer code
                    </Button>
                    <Button variant="outline" asChild className="rounded-[40px] gap-2">
                      <a href={embedUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" /> Preview
                      </a>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Status:{" "}
                    <Badge variant={widget.actief ? "default" : "secondary"} className="ml-1">
                      {widget.actief ? "Actief" : "Inactief"}
                    </Badge>
                  </p>
                </>
              )}
            </TabsContent>

          </Tabs>
        </FeatureGate>

        {/* REST API tokens — altijd beschikbaar voor partner_admin, los van webshop add-on */}
        <div className="mt-6 pt-6 border-t">
          <ApiTokensManager />
        </div>
      </CardContent>
    </Card>
  );
}