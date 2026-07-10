import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertCircle, Phone, Mail, Search, MapPin, User, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AffiliateSubnav } from "@/components/affiliate/AffiliateSubnav";
import { useIsLostReviewAdmin } from "@/hooks/affiliate/useIsLostReviewAdmin";
import SalesTrials from "@/pages/sales/Trials";

interface ReferralRow {
  id: string;
  commissie_percentage: number | null;
  created_at: string;
  partners: {
    id: string;
    naam: string | null;
    email: string | null;
    telefoon: string | null;
    trial_einddatum: string | null;
    status: string | null;
    created_at: string;
  } | null;
}

interface SalesTrialRow {
  id: string;
  naam: string | null;
  email: string | null;
  telefoonnummer: string | null;
  contactpersoon_voornaam: string | null;
  contactpersoon_achternaam: string | null;
  contactpersoon_email: string | null;
  contactpersoon_telefoon: string | null;
  contactpersoon_functie: string | null;
  plaats: string | null;
  postcode: string | null;
  adres: string | null;
  website: string | null;
  kvk: string | null;
  status: string | null;
  trial_einddatum: string | null;
  created_at: string;
  affiliate: {
    affiliate_id: string;
    commissie_percentage: number | null;
    voornaam: string | null;
    achternaam: string | null;
    email: string | null;
  } | null;
}

const AffiliateTrials = () => {
  const { user } = useAuth();
  const isSalesManager = useIsLostReviewAdmin(); // superadmin | sales_manager | bas@mijnhuis.nu

  if (isSalesManager) {
    // Zelfde weergave als /sales/trials zodat iedereen met sales-toegang exact
    // dezelfde lijst, filters en KPI-tellers ziet.
    return (
      <div className="p-6 space-y-4">
        <AffiliateSubnav />
        <SalesTrials />
      </div>
    );
  }

  const { data: referrals = [] } = useQuery({
    queryKey: ["affiliate-trials", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_referrals")
        .select("id, commissie_percentage, created_at, partners:partner_id(id, naam, email, telefoon, trial_einddatum, status, created_at)")
        .eq("affiliate_id", user!.id);
      if (error) throw error;
      return (data ?? []) as unknown as ReferralRow[];
    },
  });

  const today = new Date();
  const trialsHulp = referrals.filter((r) => {
    const p = r.partners;
    if (!p?.trial_einddatum) return false;
    const eind = new Date(p.trial_einddatum);
    const dagenTot = Math.floor((eind.getTime() - today.getTime()) / 86400000);
    return dagenTot >= 0 && dagenTot <= 14;
  });

  return (
    <div className="p-6">
      <AffiliateSubnav />
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Trials die opvolging nodig hebben</h1>
        <p className="text-sm text-muted-foreground">Partners die je hebt aangebracht en wiens trial binnen 14 dagen afloopt. {trialsHulp.length} stuks.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {trialsHulp.length === 0 && (
          <Card><CardContent className="py-10 text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            Geen trials die op korte termijn opvolging nodig hebben.
          </CardContent></Card>
        )}
        {trialsHulp.map((r) => {
          const p = r.partners!;
          const eind = new Date(p.trial_einddatum!);
          const dagen = Math.max(0, Math.floor((eind.getTime() - today.getTime()) / 86400000));
          return (
            <Card key={r.id}>
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{p.naam}</h3>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                  </div>
                  <Badge variant={dagen <= 3 ? "destructive" : "secondary"}>
                    {dagen === 0 ? "Verloopt vandaag" : `Nog ${dagen} dagen`}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  {p.telefoon && <Button asChild size="sm" variant="outline"><a href={`tel:${p.telefoon}`}><Phone className="h-4 w-4 mr-1" />Bellen</a></Button>}
                  {p.email && <Button asChild size="sm" variant="outline"><a href={`mailto:${p.email}?subject=Hulp%20met%20je%20mijnhuis.nu%20trial`}><Mail className="h-4 w-4 mr-1" />Mail</a></Button>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AffiliateTrials;

function SalesManagerTrials() {
  const [zoek, setZoek] = useState("");
  const [filter, setFilter] = useState<"actief" | "verloopt7" | "verlopen" | "alle">("actief");

  const { data, isLoading, error } = useQuery({
    queryKey: ["sales-manager-trials"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<{ trials: SalesTrialRow[] }>(
        "sales-manager-trials",
        { body: {} },
      );
      if (error) throw error;
      if (data && "error" in data) throw new Error((data as { error: string }).error);
      return (data?.trials ?? []) as SalesTrialRow[];
    },
  });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const trials = data ?? [];

  const gefilterd = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    return trials.filter((t) => {
      const eind = t.trial_einddatum ? new Date(t.trial_einddatum) : null;
      const dagen = eind ? Math.floor((eind.getTime() - today.getTime()) / 86400000) : null;
      if (filter === "actief" && (dagen === null || dagen < 0)) return false;
      if (filter === "verloopt7" && (dagen === null || dagen < 0 || dagen > 7)) return false;
      if (filter === "verlopen" && (dagen === null || dagen >= 0)) return false;
      if (q) {
        const contact = `${t.contactpersoon_voornaam ?? ""} ${t.contactpersoon_achternaam ?? ""}`.trim();
        const hay = [t.naam, t.email, t.plaats, t.postcode, contact,
          t.affiliate ? `${t.affiliate.voornaam ?? ""} ${t.affiliate.achternaam ?? ""}` : "",
        ].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [trials, filter, zoek, today]);

  const stats = useMemo(() => {
    let actief = 0, verloopt7 = 0, verlopen = 0;
    for (const t of trials) {
      if (!t.trial_einddatum) continue;
      const dagen = Math.floor((new Date(t.trial_einddatum).getTime() - today.getTime()) / 86400000);
      if (dagen >= 0) actief++;
      if (dagen >= 0 && dagen <= 7) verloopt7++;
      if (dagen < 0) verlopen++;
    }
    return { actief, verloopt7, verlopen };
  }, [trials, today]);

  return (
    <div className="p-6">
      <AffiliateSubnav />
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Alle trials — sales-overzicht</h1>
        <p className="text-sm text-muted-foreground">
          Alle bedrijven met een lopende of recent afgelopen trial. Bel of mail vandaag om een sale te maken.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiTile label="Actieve trials" value={stats.actief} kleur="bg-primary/10 text-primary border-primary/30" />
        <KpiTile label="Verloopt binnen 7 dagen" value={stats.verloopt7} kleur="bg-amber-50 text-amber-800 border-amber-200" />
        <KpiTile label="Recent verlopen (≤30d)" value={stats.verlopen} kleur="bg-rose-50 text-rose-700 border-rose-200" />
        <KpiTile label="Totaal in overzicht" value={trials.length} kleur="bg-slate-50 text-slate-700 border-slate-200" />
      </div>

      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <div className="flex gap-1 flex-wrap">
          {(["actief", "verloopt7", "verlopen", "alle"] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
              {f === "actief" ? "Actief" : f === "verloopt7" ? "Verloopt ≤7d" : f === "verlopen" ? "Verlopen" : "Alle"}
            </Button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={zoek} onChange={(e) => setZoek(e.target.value)}
            placeholder="Zoek op bedrijf, contact, plaats, affiliate…" className="pl-7" />
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Laden…</p>}
      {error && <p className="text-sm text-destructive">Fout bij laden: {(error as Error).message}</p>}
      {!isLoading && gefilterd.length === 0 && (
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          Geen trials gevonden voor deze filter.
        </CardContent></Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {gefilterd.map((t) => {
          const eind = t.trial_einddatum ? new Date(t.trial_einddatum) : null;
          const dagen = eind ? Math.floor((eind.getTime() - today.getTime()) / 86400000) : null;
          const verlopen = dagen !== null && dagen < 0;
          const kritiek = dagen !== null && dagen >= 0 && dagen <= 3;
          const contactNaam = [t.contactpersoon_voornaam, t.contactpersoon_achternaam].filter(Boolean).join(" ").trim();
          const belnr = t.contactpersoon_telefoon || t.telefoonnummer;
          const mail = t.contactpersoon_email || t.email;
          const subject = encodeURIComponent(`Hulp met je ${t.naam ?? ""} trial op mijnhuis.nu`);
          return (
            <Card key={t.id} className={verlopen ? "border-rose-200" : kritiek ? "border-amber-300" : ""}>
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      to={`/partners/${t.id}`}
                      className="font-semibold truncate hover:underline block"
                    >
                      {t.naam ?? "—"}
                    </Link>
                    {contactNaam && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" /> {contactNaam}
                        {t.contactpersoon_functie ? ` · ${t.contactpersoon_functie}` : ""}
                      </p>
                    )}
                    {t.plaats && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {t.plaats}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button size="sm" variant="ghost" asChild className="h-7 w-7 p-0">
                      <Link to={`/partners/${t.id}`} aria-label="Klantkaart openen">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Badge variant={verlopen ? "destructive" : kritiek ? "destructive" : "secondary"}>
                      {dagen === null ? "—" : verlopen ? `${Math.abs(dagen)}d verlopen` : dagen === 0 ? "Verloopt vandaag" : `Nog ${dagen}d`}
                    </Badge>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground space-y-0.5">
                  {mail && <p>{mail}</p>}
                  {belnr && <p>{belnr}</p>}
                  {t.affiliate && (
                    <p className="text-primary">
                      Aangebracht door {[t.affiliate.voornaam, t.affiliate.achternaam].filter(Boolean).join(" ") || t.affiliate.email || "affiliate"}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {belnr && (
                    <Button asChild size="sm">
                      <a href={`tel:${belnr}`}><Phone className="h-4 w-4 mr-1" />Bel nu</a>
                    </Button>
                  )}
                  {mail && (
                    <Button asChild size="sm" variant="outline">
                      <a href={`mailto:${mail}?subject=${subject}`}><Mail className="h-4 w-4 mr-1" />Mail</a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function KpiTile({ label, value, kleur }: { label: string; value: number; kleur: string }) {
  return (
    <div className={`rounded-lg border p-3 ${kleur}`}>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}