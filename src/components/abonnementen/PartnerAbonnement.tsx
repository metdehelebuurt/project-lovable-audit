import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Crown, Check, ArrowUp, FileText, AlertTriangle } from "lucide-react";

export default function PartnerAbonnement() {
  const { profile } = useAuth();
  const partnerId = profile?.partner_id;
  const [abo, setAbo] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [facturen, setFacturen] = useState<any[]>([]);
  const [usage, setUsage] = useState({ leads: 0, offertes: 0, gebruikers: 0, adviseurs: 0 });
  const [loading, setLoading] = useState(true);
  const [upgradeDialog, setUpgradeDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!partnerId) return;
    const fetchAll = async () => {
      const [{ data: aboData }, { data: planData }, { data: factuurData }, { data: leadsCount }, { data: offertesCount }, { data: usersCount }] = await Promise.all([
        supabase.from("abonnementen").select("*, abonnement_plannen(*)").eq("partner_id", partnerId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("abonnement_plannen").select("*").eq("actief", true).order("volgorde"),
        supabase.from("facturen").select("*").eq("partner_id", partnerId).order("created_at", { ascending: false }),
        supabase.from("leads").select("id", { count: "exact" }).eq("partner_id", partnerId),
        supabase.from("offertes").select("id", { count: "exact" }).eq("partner_id", partnerId),
        supabase.from("users").select("id, rol").eq("partner_id", partnerId),
      ]);

      if (aboData) {
        setAbo(aboData);
        setPlan((aboData as any).abonnement_plannen);
      }
      if (planData) setPlans(planData);
      if (factuurData) setFacturen(factuurData);

      const adviseurs = (usersCount ?? []).filter((u: any) => u.rol === "adviseur").length;
      setUsage({
        leads: leadsCount?.length ?? 0,
        offertes: offertesCount?.length ?? 0,
        gebruikers: usersCount?.length ?? 0,
        adviseurs,
      });
      setLoading(false);
    };
    fetchAll();
  }, [partnerId]);

  const handleCancel = async () => {
    if (!abo) return;
    setCancelling(true);
    const opzegDatum = new Date();
    opzegDatum.setDate(opzegDatum.getDate() + ((abo as any).opzegtermijn_dagen ?? 30));
    const { error } = await supabase.from("abonnementen").update({
      opzeg_datum: opzegDatum.toISOString().split("T")[0],
      status: "opgezegd",
    } as any).eq("id", abo.id);
    setCancelling(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Abonnement opgezegd. Uw account blijft actief tot " + format(opzegDatum, "d MMMM yyyy", { locale: nl }));
    setAbo({ ...abo, status: "opgezegd", opzeg_datum: opzegDatum.toISOString().split("T")[0] });
  };

  const handleUpgrade = async (targetPlan: any) => {
    if (!abo) return;
    const { error } = await supabase.from("abonnementen").update({
      plan_id: targetPlan.id,
      plan: targetPlan.slug,
      maand_bedrag: targetPlan.maand_prijs,
      status: "actief",
    } as any).eq("id", abo.id);
    if (error) { toast.error(error.message); return; }

    await supabase.from("abonnement_wijzigingen").insert({
      abonnement_id: abo.id,
      partner_id: partnerId,
      type: "upgrade",
      van_plan_id: abo.plan_id,
      naar_plan_id: targetPlan.id,
    } as any);

    toast.success(`Upgrade naar ${targetPlan.naam} succesvol!`);
    setUpgradeDialog(false);
    window.location.reload();
  };

  if (loading) return <p className="text-sm text-muted-foreground">Laden...</p>;
  if (!abo) return <p className="text-sm text-muted-foreground">Geen abonnement gevonden</p>;

  const usageLimits = [
    { label: "Leads", used: usage.leads, max: plan?.max_leads },
    { label: "Offertes", used: usage.offertes, max: plan?.max_offertes },
    { label: "Gebruikers", used: usage.gebruikers, max: plan?.max_gebruikers },
    { label: "Adviseurs", used: usage.adviseurs, max: plan?.max_adviseurs },
  ];

  return (
    <div className="space-y-6">
      {/* Huidig plan */}
      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              {plan?.naam ?? abo.plan}
            </CardTitle>
            <Badge className={abo.status === "actief" ? "bg-green-100 text-green-800" : abo.status === "trial" ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"}>
              {abo.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {plan?.beschrijving && <p className="text-sm text-muted-foreground">{plan.beschrijving}</p>}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div><span className="text-muted-foreground">Maandbedrag</span><p className="font-bold text-lg">€{abo.maand_bedrag}</p></div>
            <div><span className="text-muted-foreground">Interval</span><p className="font-medium capitalize">{(abo as any).interval ?? "maandelijks"}</p></div>
            <div><span className="text-muted-foreground">Start</span><p className="font-medium">{format(new Date(abo.start_datum), "d MMM yyyy", { locale: nl })}</p></div>
            <div><span className="text-muted-foreground">Verloopt</span><p className="font-medium">{abo.verloop_datum ? format(new Date(abo.verloop_datum), "d MMM yyyy", { locale: nl }) : "Doorlopend"}</p></div>
          </div>

          {(abo as any).opzeg_datum && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-50 text-orange-800 text-sm">
              <AlertTriangle className="h-4 w-4" />
              Opgezegd — actief tot {format(new Date((abo as any).opzeg_datum), "d MMMM yyyy", { locale: nl })}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={() => setUpgradeDialog(true)} size="sm">
              <ArrowUp className="h-4 w-4 mr-1" />Upgrade plan
            </Button>
            {abo.status !== "opgezegd" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive">Opzeggen</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Abonnement opzeggen</AlertDialogTitle>
                    <AlertDialogDescription>
                      Na opzegging blijft uw account actief gedurende de opzegtermijn van {(abo as any).opzegtermijn_dagen ?? 30} dagen.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuleren</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancel} disabled={cancelling}>
                      {cancelling ? "Verwerken..." : "Bevestig opzegging"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gebruiksoverzicht */}
      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="text-base">Verbruik & limieten</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {usageLimits.map(item => (
            <div key={item.label}>
              <div className="flex justify-between text-sm mb-1">
                <span>{item.label}</span>
                <span className="font-medium">{item.used} / {item.max ?? "∞"}</span>
              </div>
              {item.max && (
                <Progress value={(item.used / item.max) * 100} className="h-2" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Factuurhistorie */}
      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />Facturen</CardTitle></CardHeader>
        <CardContent>
          {facturen.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nog geen facturen</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nr.</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Bedrag</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facturen.map(f => (
                  <TableRow key={f.id}>
                    <TableCell className="font-mono text-sm">{f.factuurnummer}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(f.periode_start), "d MMM", { locale: nl })} — {format(new Date(f.periode_eind), "d MMM yyyy", { locale: nl })}
                    </TableCell>
                    <TableCell className="font-medium">€{f.totaal_bedrag?.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={f.status === "betaald" ? "bg-green-100 text-green-800" : "bg-muted text-foreground"}>
                        {f.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upgrade dialog */}
      <Dialog open={upgradeDialog} onOpenChange={setUpgradeDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Plan vergelijken & upgraden</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map(p => {
              const isCurrent = p.id === abo.plan_id;
              const modules = Array.isArray(p.modules) ? p.modules as string[] : [];
              return (
                <Card key={p.id} className={`rounded-2xl ${isCurrent ? "ring-2 ring-primary" : ""}`}>
                  <CardContent className="pt-6 space-y-4">
                    <div className="text-center">
                      <h3 className="font-bold text-lg">{p.naam}</h3>
                      <p className="text-2xl font-bold mt-1">€{p.maand_prijs}<span className="text-sm font-normal text-muted-foreground">/mnd</span></p>
                      <p className="text-xs text-muted-foreground">of €{p.jaar_prijs}/jaar</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Leads: {p.max_leads ?? "∞"} | Offertes: {p.max_offertes ?? "∞"}</p>
                      <p className="text-xs text-muted-foreground">Gebruikers: {p.max_gebruikers ?? "∞"} | Adviseurs: {p.max_adviseurs ?? "∞"}</p>
                    </div>
                    <div className="space-y-1">
                      {modules.slice(0, 6).map(m => (
                        <div key={m} className="flex items-center gap-1.5 text-xs">
                          <Check className="h-3 w-3 text-green-600" />{m}
                        </div>
                      ))}
                      {modules.length > 6 && <p className="text-xs text-muted-foreground">+{modules.length - 6} meer</p>}
                    </div>
                    {isCurrent ? (
                      <Button disabled className="w-full" variant="outline">Huidig plan</Button>
                    ) : (
                      <Button className="w-full" onClick={() => handleUpgrade(p)}>
                        {p.maand_prijs > (plan?.maand_prijs ?? 0) ? "Upgraden" : "Wijzigen"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
