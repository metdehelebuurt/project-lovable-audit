import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, KeyRound, Mail, ShieldCheck, ShieldAlert, Power, Save } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import GebruikerStats from "@/components/gebruikers/GebruikerStats";
import AuditTijdlijn from "@/components/gebruikers/AuditTijdlijn";
import AfwezigheidEditor from "@/components/gebruikers/AfwezigheidEditor";
import PermissieToggles from "@/components/gebruikers/PermissieToggles";
import HandtekeningEditor from "@/components/gebruikers/HandtekeningEditor";
import UserModuleOverrides from "@/components/gebruikers/UserModuleOverrides";
import type { Database } from "@/integrations/supabase/types";
import { PromoteToAffiliateButton } from "@/components/affiliate/PromoteToAffiliateButton";

type AppRole = Database["public"]["Enums"]["app_role"];

const ROL_LABELS: Record<string, string> = {
  superadmin: "Platformbeheerder", partner_admin: "Beheerder", backoffice: "Backoffice",
  partner_staff: "Medewerker", adviseur: "Energieadviseur", installateur: "Installateur",
  consument: "Consument", affiliate: "Affiliate",
};

const GebruikerDetail = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { profile: me } = useAuth();

  const [voornaam, setVoornaam] = useState("");
  const [achternaam, setAchternaam] = useState("");
  const [telefoon, setTelefoon] = useState("");
  const [functie, setFunctie] = useState("");
  const [opmerking, setOpmerking] = useState("");
  const [rol, setRol] = useState<AppRole>("adviseur");
  const [status, setStatus] = useState("actief");

  const { data: user, isLoading } = useQuery({
    queryKey: ["gebruiker", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("users").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: extraRollen = [] } = useQuery({
    queryKey: ["gebruiker-extra-rollen", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("rol").eq("user_id", id!);
      if (error) throw error;
      return (data ?? []).map((r) => r.rol as AppRole);
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (!user) return;
    setVoornaam(user.voornaam || ""); setAchternaam(user.achternaam || "");
    setTelefoon(user.telefoon || ""); setFunctie((user as any).functie || "");
    setOpmerking((user as any).opmerking || ""); setRol(user.rol); setStatus(user.status);
  }, [user]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("users").update({
        voornaam, achternaam, telefoon: telefoon || null,
        functie: functie || null, opmerking: opmerking || null,
      }).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gebruiker", id] }); toast.success("Profiel opgeslagen"); },
    onError: (err: Error) => toast.error("Opslaan mislukt", { description: err.message }),
  });

  const saveRolStatus = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("users").update({ rol, status: status as any }).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gebruiker", id] }); toast.success("Rol/status opgeslagen"); },
    onError: (err: Error) => toast.error("Opslaan mislukt", { description: err.message }),
  });

  const resendInvite = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("user-management", {
        body: { action: "resend_invite", user_id: id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => toast.success("Uitnodiging opnieuw verstuurd"),
    onError: (err: Error) => toast.error("Verzenden mislukt", { description: err.message }),
  });

  const sendMagicLink = useMutation({
    mutationFn: async () => {
      if (!user?.email) return;
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Wachtwoord-resetlink verstuurd"),
    onError: (err: Error) => toast.error("Verzenden mislukt", { description: err.message }),
  });

  if (isLoading || !user) return <div className="text-sm text-muted-foreground">Laden...</div>;

  const isOwn = me?.id === user.id;
  const canManage = me?.rol === "superadmin" || (me?.rol === "partner_admin" && me?.partner_id === user.partner_id);
  const isUitgenodigd = !!(user as any).uitnodiging_token && !user.last_login_at;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => nav(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-foreground">{user.voornaam} {user.achternaam}</h1>
          <p className="text-muted-foreground text-sm">{user.email}</p>
        </div>
        <Badge variant="outline">{ROL_LABELS[user.rol]}</Badge>
        {extraRollen.map((r) => (
          <Badge key={r} variant="outline" className="border-dashed">+ {ROL_LABELS[r] ?? r}</Badge>
        ))}
        <Badge className={user.status === "actief" ? "bg-success-light text-success" : "bg-muted text-muted-foreground"}>
          {user.status}
        </Badge>
        {me?.rol === "superadmin" && me.id !== user.id && (
          <PromoteToAffiliateButton userId={user.id} currentRol={user.rol} extraRollen={extraRollen} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="profiel">
            <TabsList>
              <TabsTrigger value="profiel">Profiel</TabsTrigger>
              <TabsTrigger value="rol">Rol & rechten</TabsTrigger>
              <TabsTrigger value="modules">Module-toegang</TabsTrigger>
              <TabsTrigger value="stats">Statistieken</TabsTrigger>
              <TabsTrigger value="audit">Activiteit</TabsTrigger>
              <TabsTrigger value="afwezigheid">Verlof</TabsTrigger>
            </TabsList>

            <TabsContent value="profiel" className="space-y-4 mt-4">
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Voornaam</Label><Input value={voornaam} onChange={e => setVoornaam(e.target.value)} disabled={!canManage && !isOwn} className="rounded-xl mt-1" /></div>
                    <div><Label>Achternaam</Label><Input value={achternaam} onChange={e => setAchternaam(e.target.value)} disabled={!canManage && !isOwn} className="rounded-xl mt-1" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Telefoon</Label><Input value={telefoon} onChange={e => setTelefoon(e.target.value)} disabled={!canManage && !isOwn} className="rounded-xl mt-1" /></div>
                    <div><Label>Functie</Label><Input value={functie} onChange={e => setFunctie(e.target.value)} disabled={!canManage && !isOwn} className="rounded-xl mt-1" /></div>
                  </div>
                  <div><Label>Opmerking (intern)</Label><Input value={opmerking} onChange={e => setOpmerking(e.target.value)} disabled={!canManage} className="rounded-xl mt-1" /></div>
                  {(canManage || isOwn) && (
                    <Button onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending} className="rounded-pill gap-2">
                      <Save className="h-4 w-4" /> Opslaan
                    </Button>
                  )}
                </CardContent>
              </Card>
              <HandtekeningEditor userId={user.id} initialHtml={(user as any).handtekening_html}
                voornaam={voornaam} achternaam={achternaam} functie={functie} telefoon={telefoon} email={user.email} />
            </TabsContent>

            <TabsContent value="rol" className="space-y-4 mt-4">
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardHeader><CardTitle className="text-base">Rol & status</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Rol</Label>
                    <Select value={rol} onValueChange={(v) => setRol(v as AppRole)} disabled={!canManage}>
                      <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="adviseur">Energieadviseur</SelectItem>
                        <SelectItem value="installateur">Installateur</SelectItem>
                        <SelectItem value="partner_staff">Medewerker</SelectItem>
                        <SelectItem value="partner_admin">Beheerder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={status} onValueChange={setStatus} disabled={!canManage}>
                      <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="actief">Actief</SelectItem>
                        <SelectItem value="inactief">Inactief</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {canManage && (
                    <Button onClick={() => saveRolStatus.mutate()} disabled={saveRolStatus.isPending} className="rounded-pill gap-2">
                      <Save className="h-4 w-4" /> Opslaan
                    </Button>
                  )}
                </CardContent>
              </Card>
              <PermissieToggles userId={user.id} partnerId={user.partner_id || ""} canEdit={!!canManage} />
            </TabsContent>

            <TabsContent value="stats" className="mt-4">
              <GebruikerStats userId={user.id} partnerId={user.partner_id || ""} />
            </TabsContent>

            <TabsContent value="modules" className="mt-4">
              <UserModuleOverrides
                userId={user.id}
                partnerId={user.partner_id || ""}
                rol={user.rol}
                canEdit={!!canManage}
              />
            </TabsContent>

            <TabsContent value="audit" className="mt-4">
              <AuditTijdlijn targetUserId={user.id} />
            </TabsContent>

            <TabsContent value="afwezigheid" className="mt-4">
              <AfwezigheidEditor userId={user.id} partnerId={user.partner_id || ""} canEdit={!!canManage || isOwn} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base">Snelinfo</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Aangemaakt</span><span>{new Date(user.created_at).toLocaleDateString("nl-NL")}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Laatste login</span>
                <span>{user.last_login_at ? new Date(user.last_login_at).toLocaleDateString("nl-NL") : "—"}</span></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground">2FA</span>
                {(user as any).mfa_enabled ? <Badge className="gap-1 bg-success-light text-success"><ShieldCheck className="h-3 w-3" /> Aan</Badge>
                  : <Badge variant="outline" className="gap-1"><ShieldAlert className="h-3 w-3" /> Uit</Badge>}</div>
              {isUitgenodigd && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-2 text-xs text-amber-800 dark:text-amber-200">
                  Uitnodiging is verzonden, nog niet geactiveerd.
                </div>
              )}
            </CardContent>
          </Card>

          {canManage && !isOwn && (
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader><CardTitle className="text-base">Acties</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start rounded-pill gap-2" onClick={() => sendMagicLink.mutate()}>
                  <KeyRound className="h-4 w-4" /> Wachtwoord-resetlink sturen
                </Button>
                {isUitgenodigd && (
                  <Button variant="outline" size="sm" className="w-full justify-start rounded-pill gap-2" onClick={() => resendInvite.mutate()}>
                    <Mail className="h-4 w-4" /> Uitnodiging opnieuw sturen
                  </Button>
                )}
                <Button variant="outline" size="sm" className="w-full justify-start rounded-pill gap-2"
                  onClick={() => { setStatus(status === "actief" ? "inactief" : "actief"); setTimeout(() => saveRolStatus.mutate(), 0); }}>
                  <Power className="h-4 w-4" /> {status === "actief" ? "Deactiveren" : "Activeren"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default GebruikerDetail;