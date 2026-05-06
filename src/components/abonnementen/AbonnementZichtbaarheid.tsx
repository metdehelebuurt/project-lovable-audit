import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Crown, Sparkles, ExternalLink, Lock, ArrowRight, Code2 } from "lucide-react";
import { FEATURE_BY_KEY } from "@/lib/abonnementFeatures";
import { MODULES } from "@/lib/modules";

interface AddonAankoop {
  aantal: number;
  abonnement_addons: { naam: string; slug: string; type: string } | null;
}

interface PlanRow {
  naam: string;
  slug: string;
  volgorde: number;
  modules: string[];
  features: string[];
}

interface ZichtCheck {
  key: string;
  label: string;
  feature: string;
  module?: string;
  toelichting: string;
  altijdZichtbaar?: boolean;
}

/**
 * Toont het huidige abonnement met modules, features en uitleg waarom
 * specifieke onderdelen (zoals de Productcatalogus / API-toegang) wel of
 * niet zichtbaar zijn voor deze partner.
 */
export default function AbonnementZichtbaarheid() {
  const { profile } = useAuth();
  const sub = useSubscriptionLimits();
  const [addons, setAddons] = useState<AddonAankoop[]>([]);
  const [loadingExtra, setLoadingExtra] = useState(true);
  const [allePlannen, setAllePlannen] = useState<PlanRow[]>([]);

  useEffect(() => {
    if (!profile?.partner_id) {
      setLoadingExtra(false);
      return;
    }
    Promise.all([
      supabase
        .from("abonnement_addon_aankopen")
        .select("aantal, abonnement_addons(naam, slug, type)")
        .eq("partner_id", profile.partner_id)
        .eq("status", "actief"),
      supabase
        .from("abonnement_plannen")
        .select("naam, slug, volgorde, modules, features")
        .eq("actief", true)
        .order("volgorde"),
    ]).then(([addonRes, planRes]) => {
      setAddons((addonRes.data ?? []) as unknown as AddonAankoop[]);
      setAllePlannen((planRes.data ?? []) as unknown as PlanRow[]);
      setLoadingExtra(false);
    });
  }, [profile?.partner_id]);

  const checks = useMemo<ZichtCheck[]>(
    () => [
      {
        key: "productcatalogus",
        label: "Productcatalogus & webshop",
        feature: "webshop_module",
        toelichting:
          "Geeft toegang tot embed-snippets, vergelijker en de publieke catalogus-pagina's.",
      },
      {
        key: "api_toegang",
        label: "REST API-toegang",
        feature: "api_toegang",
        toelichting:
          "Maak tokens aan om producten en leads te lezen/schrijven via /functions/v1/partner-api.",
        altijdZichtbaar: true,
      },
      {
        key: "white_label",
        label: "White-label branding",
        feature: "white_label",
        module: "instellingen",
        toelichting: "Eigen logo, kleuren en domein op alle PDF's en e-mails.",
      },
      {
        key: "ai_offerte_intro",
        label: "AI offerte-intro",
        feature: "ai_offerte_intro",
        module: "offertes",
        toelichting: "Automatisch gegenereerde introtekst per offerte.",
      },
      {
        key: "thuisbatterij",
        label: "Thuisbatterij selector",
        feature: "thuisbatterij_selector",
        module: "tools",
        toelichting: "Webtool die klanten helpt bij batterijkeuze en lead doorzet.",
      },
      {
        key: "klantportaal",
        label: "Klantportaal",
        feature: "klantportaal",
        toelichting: "Publiek portaal /offerte/:token met chat en schouwgegevens.",
      },
    ],
    []
  );

  /**
   * Vind het eerstvolgende (goedkoopste op volgorde) plan dat een feature unlockt.
   */
  const planDieFeatureBevat = (feature: string): PlanRow | null => {
    return (
      allePlannen.find(
        (p) => Array.isArray(p.features) && p.features.includes(feature) && p.slug !== sub.plan_slug
      ) ?? null
    );
  };

  const planDieModuleBevat = (module: string): PlanRow | null => {
    return (
      allePlannen.find(
        (p) => Array.isArray(p.modules) && p.modules.includes(module) && p.slug !== sub.plan_slug
      ) ?? null
    );
  };

  if (sub.loading || loadingExtra) {
    return <p className="text-sm text-muted-foreground">Abonnementinformatie laden…</p>;
  }

  const planFeatures = sub.limits.features ?? [];
  const planModules = sub.limits.modules ?? [];
  const heeftAbonnement = !!sub.plan_naam;
  const isSuperadmin = profile?.rol === "superadmin";

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" />
              Mijn abonnement
            </CardTitle>
            <Button asChild size="sm" variant="outline">
              <Link to="/instellingen/abonnement">
                Plan wijzigen
                <ExternalLink className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!heeftAbonnement ? (
            <p className="text-sm text-muted-foreground">
              Geen actief abonnement gevonden. Kies een plan om alle modules vrij te schakelen.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">Plan</span>
                <p className="font-semibold">{sub.plan_naam}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Status</span>
                <p className="font-medium capitalize">{sub.status}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Interval</span>
                <p className="font-medium capitalize">{sub.interval}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Verloopt</span>
                <p className="font-medium">
                  {sub.verloop_datum ? new Date(sub.verloop_datum).toLocaleDateString("nl-NL") : "Doorlopend"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Zichtbaarheid van modules en add-ons
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {checks.map((c) => {
            const featureActief = sub.hasFeature(c.feature);
            const moduleActief = c.module ? sub.canAccess(c.module) : true;
            const actief = featureActief && moduleActief;
            const featureInPlan = planFeatures.includes(c.feature);
            const moduleInPlan = !c.module || planModules.includes(c.module);
            const upgradePlan = !featureActief
              ? planDieFeatureBevat(c.feature)
              : !moduleActief && c.module
              ? planDieModuleBevat(c.module)
              : null;

            // Bepaal exacte blokker
            let blokker: string | null = null;
            if (!actief) {
              if (!heeftAbonnement) {
                blokker = "Geen actief abonnement gevonden — kies eerst een plan.";
              } else if (!moduleActief && c.module) {
                blokker = `Module "${c.module}" zit niet in plan ${sub.plan_naam}.`;
              } else if (!featureActief) {
                blokker = `Feature-key "${c.feature}" zit niet in plan ${sub.plan_naam}.`;
              }
            }

            return (
              <div
                key={c.key}
                className="flex items-start justify-between gap-3 rounded-xl border bg-muted/20 p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {actief ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <p className="text-sm font-medium">{c.label}</p>
                    {isSuperadmin && !actief && (
                      <Badge variant="outline" className="text-[10px]">superadmin override actief</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{c.toelichting}</p>

                  {!actief && (
                    <div className="mt-2 space-y-1.5 rounded-lg bg-amber-50 border border-amber-200 p-2">
                      <div className="flex items-start gap-1.5 text-xs text-amber-900">
                        <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <div className="space-y-1 min-w-0">
                          <p className="font-medium">
                            {c.altijdZichtbaar
                              ? "Standaard beschikbaar — als je dit niet ziet, controleer rol-rechten."
                              : `Geblokkeerd door FeatureGate.`}
                          </p>
                          {blokker && <p>{blokker}</p>}
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            <Badge variant="outline" className="font-mono text-[10px] gap-1">
                              <Code2 className="h-3 w-3" />
                              feature: {c.feature}{" "}
                              {featureInPlan ? "✓" : "✗"}
                            </Badge>
                            {c.module && (
                              <Badge variant="outline" className="font-mono text-[10px] gap-1">
                                <Code2 className="h-3 w-3" />
                                module: {c.module}{" "}
                                {moduleInPlan ? "✓" : "✗"}
                              </Badge>
                            )}
                          </div>
                          {upgradePlan && (
                            <Button asChild variant="link" size="sm" className="h-auto p-0 text-amber-900">
                              <Link to="/instellingen/abonnement">
                                Beschikbaar vanaf <strong className="mx-1">{upgradePlan.naam}</strong>
                                <ArrowRight className="h-3 w-3 ml-1" />
                              </Link>
                            </Button>
                          )}
                          {!upgradePlan && c.feature === "webshop_module" && (
                            <p>Tip: dit is een add-on — vraag superadmin om activatie.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <Badge
                  className={
                    actief
                      ? "bg-green-100 text-green-800"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {actief ? "Zichtbaar" : "Verborgen"}
                </Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Modules in dit plan ({planModules.length || "alle"})</CardTitle>
        </CardHeader>
        <CardContent>
          {planModules.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Geen plan-restricties — alle modules van het systeem zijn beschikbaar (rolafhankelijk).
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {planModules.map((m) => {
                const def = MODULES.find((x) => x.key === m);
                return (
                  <Badge key={m} variant="secondary" className="font-normal">
                    {def?.label ?? m}
                  </Badge>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Features in dit plan ({planFeatures.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {planFeatures.length === 0 ? (
            <p className="text-sm text-muted-foreground">Geen actieve features.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {planFeatures.map((f) => (
                <Badge key={f} variant="secondary" className="font-normal">
                  {FEATURE_BY_KEY[f]?.label ?? f}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Actieve add-ons</CardTitle>
        </CardHeader>
        <CardContent>
          {addons.length === 0 ? (
            <p className="text-sm text-muted-foreground">Geen add-ons gekoppeld.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {addons.map((a, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span>{a.abonnement_addons?.naam ?? "Onbekende add-on"}</span>
                  <Badge variant="outline">×{a.aantal}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}