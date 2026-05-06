import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Check, Crown, Loader2, Plus, Sparkles, ShieldAlert, Info, AlertTriangle } from "lucide-react";
import { FEATURE_BY_KEY } from "@/lib/abonnementFeatures";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Plan {
  id: string;
  naam: string;
  slug: string;
  beschrijving: string | null;
  maand_prijs: number;
  jaar_prijs: number;
  max_leads: number | null;
  max_offertes: number | null;
  max_gebruikers: number | null;
  modules: string[];
  features: string[];
  volgorde: number;
}

interface Addon {
  id: string;
  naam: string;
  slug: string;
  type: string;
  maand_prijs: number;
  beschrijving: string | null;
}

interface AddonAankoop {
  id: string;
  addon_id: string;
  aantal: number;
  abonnement_addons: { naam: string; type: string } | null;
}

export default function AbonnementSelfService() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const sub = useSubscriptionLimits();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [actieveAddons, setActieveAddons] = useState<AddonAankoop[]>([]);
  const [interval, setInterval] = useState<"maand" | "jaar">("maand");
  const [aboId, setAboId] = useState<string | null>(null);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [busyAddon, setBusyAddon] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState({ leads: 0, offertes: 0, gebruikers: 0 });
  const [loadError, setLoadError] = useState<string | null>(null);

  const partnerId = profile?.partner_id ?? null;
  const isPartnerAdmin = profile?.rol === "partner_admin";
  const isSuperadmin = profile?.rol === "superadmin";
  const mayWrite = isPartnerAdmin || isSuperadmin;

  /**
   * Vertaalt Postgres/Supabase fouten naar leesbare Nederlandse meldingen.
   */
  const parseError = (err: unknown, context: "plan" | "addon"): { titel: string; uitleg: string } => {
    const raw = err instanceof Error ? err.message : String(err ?? "");
    const code = (err as { code?: string })?.code;

    if (code === "42501" || /row[- ]level security|permission denied/i.test(raw)) {
      return {
        titel: "Geen rechten",
        uitleg:
          "Alleen organisatiebeheerders (partner_admin) mogen abonnementen of add-ons wijzigen. Vraag je beheerder of log in met een admin-account.",
      };
    }
    if (code === "23503") {
      return {
        titel: context === "plan" ? "Plan bestaat niet meer" : "Add-on niet beschikbaar",
        uitleg: "Vernieuw de pagina en probeer opnieuw — de gekozen optie bestaat niet meer in de catalogus.",
      };
    }
    if (code === "23505") {
      return {
        titel: "Al actief",
        uitleg: "Deze add-on staat al actief — pas in plaats daarvan het aantal aan.",
      };
    }
    if (/network|failed to fetch/i.test(raw)) {
      return {
        titel: "Geen verbinding",
        uitleg: "Controleer je internetverbinding en probeer het opnieuw.",
      };
    }
    return {
      titel: context === "plan" ? "Plan wijzigen mislukt" : "Add-on toevoegen mislukt",
      uitleg: raw || "Onbekende fout — probeer het later opnieuw of neem contact op met support.",
    };
  };

  /**
   * Bepaalt of een actie geblokkeerd is (en waarom). Geeft `null` terug als alles OK is.
   */
  const blokkadeReden = (): string | null => {
    if (!profile) return "Profiel laden mislukt — log uit en opnieuw in.";
    if (!partnerId) return "Je account is niet gekoppeld aan een organisatie. Vraag een beheerder of neem contact op.";
    if (!mayWrite)
      return `Je rol "${profile.rol}" mag geen abonnementen wijzigen. Alleen "partner_admin" of "superadmin".`;
    return null;
  };

  const algemeneBlokkade = blokkadeReden();

  useEffect(() => {
    if (!partnerId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const [
          planRes,
          addonRes,
          aboRes,
          aankoopRes,
          leadsRes,
          offertesRes,
          usersRes,
        ] = await Promise.all([
          supabase.from("abonnement_plannen").select("*").eq("actief", true).order("volgorde"),
          supabase.from("abonnement_addons").select("*").eq("actief", true),
          supabase
            .from("abonnementen")
            .select("id")
            .eq("partner_id", partnerId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("abonnement_addon_aankopen")
            .select("id, addon_id, aantal, abonnement_addons(naam, type)")
            .eq("partner_id", partnerId)
            .eq("status", "actief"),
          supabase.from("leads").select("id", { count: "exact", head: true }).eq("partner_id", partnerId),
          supabase.from("offertes").select("id", { count: "exact", head: true }).eq("partner_id", partnerId),
          supabase.from("users").select("id", { count: "exact", head: true }).eq("partner_id", partnerId),
        ]);
        const firstError = [planRes, addonRes, aboRes, aankoopRes].find((r) => r.error)?.error;
        if (firstError) throw firstError;
        setPlans((planRes.data ?? []) as unknown as Plan[]);
        setAddons((addonRes.data ?? []) as unknown as Addon[]);
        setAboId(aboRes.data?.id ?? null);
        setActieveAddons((aankoopRes.data ?? []) as unknown as AddonAankoop[]);
        setUsage({
          leads: leadsRes.count ?? 0,
          offertes: offertesRes.count ?? 0,
          gebruikers: usersRes.count ?? 0,
        });
      } catch (e) {
        const parsed = parseError(e, "plan");
        setLoadError(`${parsed.titel}: ${parsed.uitleg}`);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId]);

  const isCurrent = (slug: string) => sub.plan_slug === slug;

  /**
   * Controleert of een downgrade naar `plan` zou betekenen dat huidige verbruik over de plan-limiet gaat.
   */
  const checkDowngradeConflicts = (plan: Plan): string[] => {
    const issues: string[] = [];
    if (plan.max_leads != null && usage.leads > plan.max_leads) {
      issues.push(`${usage.leads} leads (limiet ${plan.max_leads})`);
    }
    if (plan.max_offertes != null && usage.offertes > plan.max_offertes) {
      issues.push(`${usage.offertes} offertes (limiet ${plan.max_offertes})`);
    }
    if (plan.max_gebruikers != null && usage.gebruikers > plan.max_gebruikers) {
      issues.push(`${usage.gebruikers} gebruikers (limiet ${plan.max_gebruikers})`);
    }
    return issues;
  };

  const switchPlan = async (plan: Plan) => {
    const blok = blokkadeReden();
    if (blok) {
      toast.error(blok);
      return;
    }
    if (!partnerId) return;
    const conflicts = checkDowngradeConflicts(plan);
    if (conflicts.length > 0) {
      toast.error(
        `Plan past niet bij huidig verbruik: ${conflicts.join(", ")}. Verwijder gegevens of kies een hoger plan.`
      );
      return;
    }
    if (!confirm(`Wisselen naar plan "${plan.naam}"?`)) return;
    setBusyPlan(plan.id);
    try {
      const bedrag = interval === "jaar" ? plan.jaar_prijs : plan.maand_prijs;
      if (aboId) {
        const { error } = await supabase
          .from("abonnementen")
          .update({
            plan_id: plan.id,
            plan: plan.slug,
            interval,
            maand_bedrag: interval === "jaar" ? Math.round(plan.jaar_prijs / 12) : plan.maand_prijs,
            status: "actief",
          } as never)
          .eq("id", aboId);
        if (error) throw error;
        await supabase.from("abonnement_wijzigingen").insert({
          abonnement_id: aboId,
          partner_id: partnerId,
          type: "self_service_wijziging",
          naar_plan_id: plan.id,
        } as never);
      } else {
        const { data: nieuw, error } = await supabase
          .from("abonnementen")
          .insert({
            partner_id: partnerId,
            plan_id: plan.id,
            plan: plan.slug,
            interval,
            maand_bedrag: interval === "jaar" ? Math.round(plan.jaar_prijs / 12) : plan.maand_prijs,
            status: "actief",
            start_datum: new Date().toISOString().split("T")[0],
          } as never)
          .select("id")
          .single();
        if (error) throw error;
        setAboId((nieuw as { id: string }).id);
      }
      toast.success(`Plan gewijzigd naar ${plan.naam} (€${bedrag}/${interval === "jaar" ? "jr" : "mnd"})`);
      setTimeout(() => window.location.reload(), 600);
    } catch (e) {
      const { titel, uitleg } = parseError(e, "plan");
      toast.error(titel, { description: uitleg, duration: 8000 });
    } finally {
      setBusyPlan(null);
    }
  };

  const buyAddon = async (addon: Addon, aantal: number) => {
    const blok = blokkadeReden();
    if (blok) {
      toast.error(blok);
      return;
    }
    if (!partnerId) return;
    if (!Number.isInteger(aantal) || aantal < 1 || aantal > 50) {
      toast.error("Aantal moet tussen 1 en 50 liggen.");
      return;
    }
    if (!aboId) {
      toast.error("Geen actief abonnement", {
        description: "Kies eerst een plan voordat je add-ons kunt toevoegen.",
        duration: 8000,
      });
      return;
    }
    setBusyAddon(addon.id);
    try {
      const bestaand = actieveAddons.find((a) => a.addon_id === addon.id);
      if (bestaand) {
        if (bestaand.aantal + aantal > 50) {
          throw new Error("Max 50 stuks per add-on. Reduceer het aantal.");
        }
        const { error } = await supabase
          .from("abonnement_addon_aankopen")
          .update({ aantal: bestaand.aantal + aantal } as never)
          .eq("id", bestaand.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("abonnement_addon_aankopen")
          .insert({
            partner_id: partnerId,
            addon_id: addon.id,
            aantal,
            maand_bedrag: addon.maand_prijs * aantal,
            status: "actief",
            start_datum: new Date().toISOString().split("T")[0],
          } as never);
        if (error) throw error;
      }
      toast.success(`${addon.naam} (${aantal}×) toegevoegd`);
      setTimeout(() => window.location.reload(), 600);
    } catch (e) {
      const { titel, uitleg } = parseError(e, "addon");
      toast.error(titel, { description: uitleg, duration: 8000 });
    } finally {
      setBusyAddon(null);
    }
  };

  const sortedPlans = useMemo(() => [...plans].sort((a, b) => a.volgorde - b.volgorde), [plans]);

  if (!partnerId) {
    return (
      <div className="p-6 max-w-2xl">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Geen organisatie gekoppeld</AlertTitle>
          <AlertDescription>
            Je account heeft geen <code>partner_id</code>. Vraag een beheerder om je toe te voegen aan een
            organisatie, of log opnieuw in.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading || sub.loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Plannen laden…
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/instellingen")} className="-ml-2 mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Terug
          </Button>
          <h1 className="text-2xl font-semibold text-foreground">Abonnement & add-ons</h1>
          <p className="text-muted-foreground mt-1">
            Wijzig zelf je plan of voeg add-ons toe. Wijzigingen gaan direct in.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={interval === "maand" ? "default" : "outline"}
            onClick={() => setInterval("maand")}
          >
            Maandelijks
          </Button>
          <Button
            size="sm"
            variant={interval === "jaar" ? "default" : "outline"}
            onClick={() => setInterval("jaar")}
          >
            Jaarlijks · 2 mnd korting
          </Button>
        </div>
      </div>

      {loadError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Pagina niet volledig geladen</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {algemeneBlokkade && (
        <Alert>
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Lezen toegestaan, wijzigen geblokkeerd</AlertTitle>
          <AlertDescription>{algemeneBlokkade}</AlertDescription>
        </Alert>
      )}

      {!aboId && mayWrite && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Nog geen actief abonnement</AlertTitle>
          <AlertDescription>
            Kies hieronder een plan. Add-ons kun je pas toevoegen nádat een plan actief is.
          </AlertDescription>
        </Alert>
      )}

      {sub.plan_naam && (
        <Card className="rounded-2xl border-primary/30 bg-primary/5">
          <CardContent className="py-3 flex items-center gap-2 text-sm">
            <Crown className="h-4 w-4 text-primary" />
            Huidig plan: <strong>{sub.plan_naam}</strong>
            <Badge variant="secondary" className="ml-2 capitalize">{sub.status}</Badge>
            <Link to="/instellingen" className="ml-auto text-xs underline text-muted-foreground">
              Verbruik bekijken
            </Link>
          </CardContent>
        </Card>
      )}

      <TooltipProvider delayDuration={150}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sortedPlans.map((plan) => {
          const current = isCurrent(plan.slug);
          const prijs = interval === "jaar" ? plan.jaar_prijs : plan.maand_prijs;
          const features = Array.isArray(plan.features) ? plan.features : [];
          const conflicts = checkDowngradeConflicts(plan);
          const disabledReason = current
            ? "Dit is je huidige plan."
            : algemeneBlokkade
            ? algemeneBlokkade
            : conflicts.length > 0
            ? `Niet mogelijk: ${conflicts.join(", ")}.`
            : null;
          return (
            <Card
              key={plan.id}
              className={`rounded-2xl flex flex-col ${current ? "ring-2 ring-primary" : ""}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.naam}</CardTitle>
                  {current && <Badge className="bg-primary text-primary-foreground">Huidig</Badge>}
                </div>
                <p className="text-3xl font-bold mt-2">
                  €{prijs}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{interval === "jaar" ? "jaar" : "mnd"}
                  </span>
                </p>
                {plan.beschrijving && (
                  <p className="text-sm text-muted-foreground mt-1">{plan.beschrijving}</p>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-1.5 text-sm flex-1">
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <span>
                      {plan.max_leads ? `${plan.max_leads} leads` : "Onbeperkt leads"} ·{" "}
                      {plan.max_offertes ? `${plan.max_offertes} offertes` : "onbeperkt offertes"}
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <span>{plan.max_gebruikers ? `${plan.max_gebruikers} gebruikers` : "Onbeperkt gebruikers"}</span>
                  </li>
                  {features.slice(0, 8).map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <span>{FEATURE_BY_KEY[f]?.label ?? f}</span>
                    </li>
                  ))}
                  {features.length > 8 && (
                    <li className="text-xs text-muted-foreground pl-6">
                      +{features.length - 8} extra features
                    </li>
                  )}
                </ul>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="mt-4 block">
                      <Button
                        className="w-full"
                        variant={current ? "outline" : "default"}
                        disabled={!!disabledReason || busyPlan === plan.id}
                        onClick={() => switchPlan(plan)}
                      >
                        {busyPlan === plan.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        {current ? "Huidig plan" : `Kies ${plan.naam}`}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {disabledReason && !current && (
                    <TooltipContent className="max-w-xs">{disabledReason}</TooltipContent>
                  )}
                </Tooltip>
              </CardContent>
            </Card>
          );
        })}
      </div>
      </TooltipProvider>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Add-ons
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {addons.length === 0 ? (
            <p className="text-sm text-muted-foreground">Geen add-ons beschikbaar.</p>
          ) : (
            addons.map((addon) => (
              <AddonRow
                key={addon.id}
                addon={addon}
                actief={actieveAddons.find((a) => a.addon_id === addon.id)?.aantal ?? 0}
                busy={busyAddon === addon.id}
                disabled={!!algemeneBlokkade || !aboId}
                disabledReason={
                  algemeneBlokkade ?? (!aboId ? "Kies eerst een plan voordat je add-ons koopt." : undefined)
                }
                onBuy={(aantal) => buyAddon(addon, aantal)}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface AddonRowProps {
  addon: Addon;
  actief: number;
  busy: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onBuy: (aantal: number) => void;
}

function AddonRow({ addon, actief, busy, disabled, disabledReason, onBuy }: AddonRowProps) {
  const [aantal, setAantal] = useState(1);
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/20 p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm">{addon.naam}</p>
          <Badge variant="secondary" className="text-xs capitalize">{addon.type}</Badge>
          {actief > 0 && (
            <Badge className="bg-green-100 text-green-800 text-xs">Actief: {actief}×</Badge>
          )}
        </div>
        {addon.beschrijving && (
          <p className="text-xs text-muted-foreground mt-0.5">{addon.beschrijving}</p>
        )}
        <p className="text-xs text-muted-foreground mt-0.5">€{addon.maand_prijs} per stuk per maand</p>
        {disabled && disabledReason && (
          <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
            <Info className="h-3 w-3" /> {disabledReason}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor={`aantal-${addon.id}`} className="text-xs text-muted-foreground">
          Aantal
        </Label>
        <Input
          id={`aantal-${addon.id}`}
          type="number"
          min={1}
          max={50}
          value={aantal}
          onChange={(e) => setAantal(Math.max(1, Number(e.target.value) || 1))}
          className="w-20"
          disabled={disabled}
        />
        <Button size="sm" onClick={() => onBuy(aantal)} disabled={busy || disabled}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-1" />}
          Toevoegen
        </Button>
      </div>
    </div>
  );
}