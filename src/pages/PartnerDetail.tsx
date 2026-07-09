import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Building2, Mail, Phone, FileText, Handshake, Clock, History, UserCheck, Sparkles, CalendarClock, Info, Rocket, PlayCircle, AlertTriangle } from "lucide-react";
import { PromotePartnerToAffiliateButton } from "@/components/affiliate/PromotePartnerToAffiliateButton";
import type { Database } from "@/integrations/supabase/types";

type Partner = Database["public"]["Tables"]["partners"]["Row"];
type PartnerStatus = Database["public"]["Enums"]["partner_status"];

const statusLabels: Record<PartnerStatus, string> = {
  in_review: "In review",
  actief: "Actief",
  inactief: "Inactief",
  geblokkeerd: "Geblokkeerd",
};

const statusColors: Record<PartnerStatus, string> = {
  in_review: "bg-warning-light text-warning-foreground",
  actief: "bg-success-light text-success",
  inactief: "bg-muted text-muted-foreground",
  geblokkeerd: "bg-error-light text-error",
};

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

function SalesRow({
  icon,
  label,
  primary,
  secondary,
}: {
  icon: React.ReactNode;
  label: string;
  primary: string;
  secondary?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/30 p-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{primary}</p>
        {secondary && <p className="text-xs text-muted-foreground mt-0.5">{secondary}</p>}
      </div>
    </div>
  );
}

type TimelineEvent = {
  id: string;
  icon: React.ReactNode;
  title: string;
  description?: string;
  at: string;
  tone: "primary" | "success" | "warning" | "error" | "muted";
};

const toneClasses: Record<TimelineEvent["tone"], string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-warning-foreground",
  error: "bg-error-light text-error",
  muted: "bg-muted text-muted-foreground",
};

export default function PartnerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: partner, isLoading } = useQuery({
    queryKey: ["partner", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("partners").select("*").eq("id", id!).single();
      if (error) throw error;
      return data as Partner;
    },
    enabled: !!id,
  });

  const { data: historie } = useQuery({
    queryKey: ["partner-historie", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entiteit_historie")
        .select("id, actie, veld, oude_waarde, nieuwe_waarde, actor_naam, actor_rol, created_at")
        .eq("entiteit_type", "partner")
        .eq("entiteit_id", id!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!id,
  });

  // Aanbrenger (affiliate referral)
  const { data: referral } = useQuery({
    queryKey: ["partner-referral", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("affiliate_referrals")
        .select("id, created_at, affiliate_id, affiliate_link_id")
        .eq("partner_id", id!)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!data) return null;
      const [{ data: aff }, { data: link }] = await Promise.all([
        supabase.from("users").select("voornaam, achternaam, email").eq("id", data.affiliate_id).maybeSingle(),
        data.affiliate_link_id
          ? supabase.from("affiliate_links").select("code").eq("id", data.affiliate_link_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      return { ...data, affiliate: aff, link };
    },
    enabled: !!id,
  });

  // Wie heeft trial aangemaakt / demo geseed
  const trialDoorId = (partner as any)?.trial_aangemaakt_door_id ?? null;
  const demoDoorId = (partner as any)?.demo_data_geseed_door_id ?? null;
  const userIds = Array.from(new Set([trialDoorId, demoDoorId].filter(Boolean))) as string[];
  const { data: users } = useQuery({
    queryKey: ["partner-actor-users", id, userIds.join(",")],
    queryFn: async () => {
      if (userIds.length === 0) return {} as Record<string, { voornaam: string | null; achternaam: string | null; email: string }>;
      const { data } = await supabase.from("users").select("id, voornaam, achternaam, email").in("id", userIds);
      const map: Record<string, any> = {};
      (data ?? []).forEach((u: any) => { map[u.id] = u; });
      return map;
    },
    enabled: !!id && userIds.length > 0,
  });

  if (isLoading) return <div className="p-6 text-muted-foreground">Laden...</div>;
  if (!partner) return <div className="p-6">Partner niet gevonden.</div>;

  const contact = [partner.contactpersoon_voornaam, partner.contactpersoon_achternaam].filter(Boolean).join(" ");

  const userLabel = (uid: string | null | undefined) => {
    if (!uid) return null;
    const u = users?.[uid];
    if (!u) return "Onbekende gebruiker";
    const naam = [u.voornaam, u.achternaam].filter(Boolean).join(" ");
    return naam || u.email;
  };

  const trialAangemaaktOp = (partner as any).trial_aangemaakt_op as string | null;
  const demoGeseedOp = (partner as any).demo_data_geseed_op as string | null;

  const trialEinde = partner.trial_einddatum ? new Date(partner.trial_einddatum) : null;
  const trialDagenResterend = trialEinde
    ? Math.ceil((trialEinde.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const isTrial = partner.abonnement_type === "trial";
  const trialVerlopen = isTrial && trialDagenResterend !== null && trialDagenResterend < 0;

  let klantStatusLabel = statusLabels[partner.status];
  let klantStatusClass = statusColors[partner.status];
  if (isTrial) {
    if (trialVerlopen) {
      klantStatusLabel = "Trial verlopen";
      klantStatusClass = "bg-error-light text-error";
    } else if (trialDagenResterend !== null) {
      klantStatusLabel = `Trial actief · nog ${trialDagenResterend} ${trialDagenResterend === 1 ? "dag" : "dagen"}`;
      klantStatusClass = trialDagenResterend <= 7 ? "bg-warning-light text-warning-foreground" : "bg-success-light text-success";
    } else {
      klantStatusLabel = "Trial actief";
      klantStatusClass = "bg-success-light text-success";
    }
  } else if (partner.abonnement_type) {
    klantStatusLabel = `Betalend · ${partner.abonnement_type}`;
    klantStatusClass = "bg-primary/10 text-primary";
  }

  const formatDateTime = (iso: string | null | undefined) =>
    iso ? new Date(iso).toLocaleString("nl-NL", { dateStyle: "medium", timeStyle: "short" }) : "—";
  const formatDate = (iso: string | null | undefined) =>
    iso ? new Date(iso).toLocaleDateString("nl-NL", { dateStyle: "medium" }) : "—";

  const aanbrengerNaam = referral?.affiliate
    ? [referral.affiliate.voornaam, referral.affiliate.achternaam].filter(Boolean).join(" ") || referral.affiliate.email
    : null;

  // Bouw tijdlijn
  const timeline: TimelineEvent[] = [];
  if (partner.created_at) {
    timeline.push({
      id: "created",
      icon: <Building2 className="h-3.5 w-3.5" />,
      title: "Partner aangemaakt",
      description: "Account is aangemaakt in Lovable Cloud",
      at: partner.created_at,
      tone: "muted",
    });
  }
  if (referral?.created_at) {
    timeline.push({
      id: "referral",
      icon: <Handshake className="h-3.5 w-3.5" />,
      title: `Aangebracht door ${aanbrengerNaam ?? "affiliate"}`,
      description: referral.link?.code ? `Via affiliate-link "${referral.link.code}"` : "Via affiliate-programma",
      at: referral.created_at,
      tone: "primary",
    });
  }
  if (trialAangemaaktOp) {
    timeline.push({
      id: "trial-created",
      icon: <Rocket className="h-3.5 w-3.5" />,
      title: `Trial aangevraagd${userLabel(trialDoorId) ? ` door ${userLabel(trialDoorId)}` : ""}`,
      description: partner.trial_einddatum ? `Loopt tot ${formatDate(partner.trial_einddatum)}` : undefined,
      at: trialAangemaaktOp,
      tone: "primary",
    });
  }
  if (demoGeseedOp) {
    timeline.push({
      id: "demo-seeded",
      icon: <Sparkles className="h-3.5 w-3.5" />,
      title: `Demo-data geplaatst${userLabel(demoDoorId) ? ` door ${userLabel(demoDoorId)}` : ""}`,
      description: "Voorbeeld-leads, offertes en installaties zijn toegevoegd zodat het account direct gevuld is",
      at: demoGeseedOp,
      tone: "success",
    });
  }
  (historie ?? []).forEach((h) => {
    if (h.veld === "status" || h.actie === "status_gewijzigd") {
      timeline.push({
        id: `hist-${h.id}`,
        icon: <UserCheck className="h-3.5 w-3.5" />,
        title: `Status gewijzigd${h.nieuwe_waarde ? ` naar "${h.nieuwe_waarde}"` : ""}`,
        description: [h.oude_waarde ? `van "${h.oude_waarde}"` : null, h.actor_naam ? `door ${h.actor_naam}` : null].filter(Boolean).join(" · ") || undefined,
        at: h.created_at,
        tone: "warning",
      });
    }
  });
  if (trialVerlopen && partner.trial_einddatum) {
    timeline.push({
      id: "trial-expired",
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      title: "Trial verlopen",
      description: `Sinds ${Math.abs(trialDagenResterend ?? 0)} dagen`,
      at: partner.trial_einddatum,
      tone: "error",
    });
  }
  timeline.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  // Uitleg voor status-badge popover
  const statusUitleg = (() => {
    if (isTrial && trialVerlopen) {
      return {
        titel: "Trial verlopen",
        tekst: "De proefperiode van 30 dagen is voorbij. De klant heeft nog geen betaald abonnement afgesloten.",
        bron: `Berekend op basis van trial_einddatum (${formatDate(partner.trial_einddatum)}).`,
      };
    }
    if (isTrial) {
      return {
        titel: "Trial actief",
        tekst: "De klant zit in de gratis proefperiode. Zolang de trial loopt heeft de klant volledige toegang.",
        bron: `Berekend op basis van abonnement_type = "trial" en trial_einddatum (${formatDate(partner.trial_einddatum)}).`,
      };
    }
    if (partner.abonnement_type) {
      return {
        titel: `Betalend abonnement: ${partner.abonnement_type}`,
        tekst: "Deze klant heeft een lopend betaald abonnement.",
        bron: `Afkomstig uit partners.abonnement_type.`,
      };
    }
    return {
      titel: statusLabels[partner.status],
      tekst: "Algemene partnerstatus in de administratie.",
      bron: "Afkomstig uit partners.status.",
    };
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Terug
        </Button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{partner.naam}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className="focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-full">
                    <Badge className={`${klantStatusClass} gap-1 cursor-pointer hover:opacity-90`}>
                      {klantStatusLabel}
                      <Info className="h-3 w-3 opacity-70" />
                    </Badge>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-80 text-sm">
                  <p className="font-semibold text-foreground">{statusUitleg.titel}</p>
                  <p className="text-muted-foreground mt-1">{statusUitleg.tekst}</p>
                  <p className="text-xs text-muted-foreground mt-2 italic">Bron: {statusUitleg.bron}</p>
                </PopoverContent>
              </Popover>
              <Badge variant="outline">{statusLabels[partner.status]}</Badge>
              {partner.abonnement_type && (
                <Badge variant="outline" className="capitalize">{partner.abonnement_type}</Badge>
              )}
              {demoGeseedOp && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-full">
                      <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-muted">
                        <Sparkles className="h-3 w-3" /> Demo-data aanwezig
                        <Info className="h-3 w-3 opacity-70" />
                      </Badge>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-80 text-sm">
                    <p className="font-semibold text-foreground">Demo-data aanwezig</p>
                    <p className="text-muted-foreground mt-1">
                      Het account is gevuld met voorbeeld-leads, offertes en installaties zodat de klant direct kan verkennen zonder eigen data in te voeren.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Geplaatst op {formatDateTime(demoGeseedOp)}
                      {userLabel(demoDoorId) ? ` door ${userLabel(demoDoorId)}` : ""}.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      Bron: partners.demo_data_geseed_op (gezet door de trial-signup functie of handmatige seed).
                    </p>
                  </PopoverContent>
                </Popover>
              )}
              {partner.is_affiliate && (
                <Badge className="bg-primary/10 text-primary border-0 gap-1">
                  <Handshake className="h-3 w-3" /> Affiliate
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <PromotePartnerToAffiliateButton
            partnerId={partner.id}
            partnerNaam={partner.naam}
            isAffiliate={!!partner.is_affiliate}
            size="default"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="rounded-2xl border-0 shadow-sm lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4" /> Sales &amp; Onboarding
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SalesRow
              icon={<Handshake className="h-4 w-4" />}
              label="Aangebracht door"
              primary={aanbrengerNaam ? `${aanbrengerNaam} (affiliate)` : "Direct aangemeld"}
              secondary={
                referral
                  ? `${referral.link?.code ? `via link "${referral.link.code}" · ` : ""}${formatDate(referral.created_at)}`
                  : "Geen affiliate-referral"
              }
            />
            <SalesRow
              icon={<UserCheck className="h-4 w-4" />}
              label="Trial aangemaakt"
              primary={userLabel(trialDoorId) ?? (trialAangemaaktOp ? "Zelf aangemeld (selfservice)" : "Onbekend")}
              secondary={formatDateTime(trialAangemaaktOp)}
            />
            <SalesRow
              icon={<CalendarClock className="h-4 w-4" />}
              label="Trial periode"
              primary={
                partner.contract_startdatum || partner.trial_einddatum
                  ? `${formatDate(partner.contract_startdatum)} → ${formatDate(partner.trial_einddatum)}`
                  : "Geen trial actief"
              }
              secondary={
                trialDagenResterend === null
                  ? undefined
                  : trialVerlopen
                    ? `Verlopen sinds ${Math.abs(trialDagenResterend)} dagen`
                    : `Nog ${trialDagenResterend} ${trialDagenResterend === 1 ? "dag" : "dagen"}`
              }
            />
            <SalesRow
              icon={<Sparkles className="h-4 w-4" />}
              label="Demo-data"
              primary={
                demoGeseedOp
                  ? `Geseed door ${userLabel(demoDoorId) ?? "systeem"}`
                  : "Nog niet geseed"
              }
              secondary={demoGeseedOp ? formatDateTime(demoGeseedOp) : undefined}
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PlayCircle className="h-4 w-4" /> Tijdlijn
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nog geen events.</p>
            ) : (
              <ol className="relative space-y-4 border-l border-border/60 pl-6">
                {timeline.map((e) => (
                  <li key={e.id} className="relative">
                    <span className={`absolute -left-[34px] top-0 flex h-6 w-6 items-center justify-center rounded-full ${toneClasses[e.tone]}`}>
                      {e.icon}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{e.title}</p>
                      {e.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{e.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(e.at)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Bedrijfsgegevens</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Field label="Bedrijfsnaam" value={partner.naam} />
            <Field label="KvK-nummer" value={partner.kvk} />
            <Field label="BTW-nummer" value={partner.btw} />
            <Field label="Website" value={partner.website} />
            <Field label="E-mail" value={partner.email} />
            <Field label="Telefoon" value={partner.telefoonnummer} />
            <Field label="Adres" value={partner.adres} />
            <Field label="Postcode" value={partner.postcode} />
            <Field label="Plaats" value={partner.plaats} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Contactpersoon</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Field label="Naam" value={contact} />
            <Field label="Functie" value={partner.contactpersoon_functie} />
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{partner.contactpersoon_email || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{partner.contactpersoon_telefoon || "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Contract & licentie</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Field label="Contract type" value={partner.contract_type} />
            <Field label="Abonnement" value={partner.abonnement_type} />
            <Field label="Max adviseurs" value={partner.licentie_adviseurs} />
            <Field label="Max installateurs" value={partner.licentie_installateurs} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" /> Administratie
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Field label="Aangemaakt" value={formatDateTime(partner.created_at)} />
            <Field label="Laatst gewijzigd" value={formatDateTime(partner.updated_at)} />
            <Field label="Partner-ID" value={partner.id} />
            <Field label="Status" value={statusLabels[partner.status]} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" /> Notities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap text-foreground">
              {partner.notities || <span className="text-muted-foreground">Geen notities</span>}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" /> Historie
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!historie || historie.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nog geen historie vastgelegd.</p>
            ) : (
              <ul className="space-y-3">
                {historie.map((h) => (
                  <li key={h.id} className="flex gap-3 text-sm border-l-2 border-primary/30 pl-3">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {h.actie}{h.veld ? ` · ${h.veld}` : ""}
                      </p>
                      {(h.oude_waarde || h.nieuwe_waarde) && (
                        <p className="text-xs text-muted-foreground">
                          {h.oude_waarde ? `"${h.oude_waarde}" → ` : ""}{h.nieuwe_waarde ? `"${h.nieuwe_waarde}"` : ""}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDateTime(h.created_at)}
                        {h.actor_naam ? ` · ${h.actor_naam}` : ""}
                        {h.actor_rol ? ` (${h.actor_rol})` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}