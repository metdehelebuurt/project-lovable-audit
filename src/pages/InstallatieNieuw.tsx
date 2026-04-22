import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { createInstallatie } from "@/components/installaties/api/installatieApi";
import InstallatieProductenEditor, { type InstallatieProductRegel } from "@/components/installaties/InstallatieProductenEditor";

const InstallatieNieuw = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [params] = useSearchParams();
  const opdrachtId = params.get("opdracht");
  const [monteurs, setMonteurs] = useState<{ id: string; voornaam: string; achternaam: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [producten, setProducten] = useState<InstallatieProductRegel[]>([]);
  const [form, setForm] = useState({
    consument_naam: "",
    klant_email: "",
    klant_telefoon: "",
    werkadres: "",
    werkomschrijving: "",
    installateur_id: "",
    geplande_startdatum: "",
    start_tijd: "",
  });

  useEffect(() => {
    void supabase.from("users").select("id, voornaam, achternaam").eq("rol", "installateur")
      .then(({ data }) => setMonteurs(data ?? []));

    if (opdrachtId) {
      void supabase.from("opdrachten").select("*").eq("id", opdrachtId).single().then(({ data }) => {
        if (data) {
          const regels = Array.isArray((data as Record<string, unknown>).regels)
            ? ((data as Record<string, unknown>).regels as Array<Record<string, unknown>>)
            : [];
          const autoOmschrijving = regels
            .slice(0, 3)
            .map((r) => `${r.aantal ?? 1}× ${r.omschrijving ?? ""}`.trim())
            .filter((s) => s.length > 1)
            .join(" • ");
          setForm((f) => ({
            ...f,
            consument_naam: data.klant_naam ?? "",
            klant_email: data.klant_email ?? "",
            klant_telefoon: data.klant_telefoon ?? "",
            werkadres: data.klant_adres ?? "",
            werkomschrijving: f.werkomschrijving || autoOmschrijving,
          }));
          setProducten(
            regels.map((r) => ({
              omschrijving: String(r.omschrijving ?? ""),
              aantal: Number(r.aantal ?? 1),
              product_id: (r.product_id as string | undefined) ?? null,
            })),
          );
        }
      });
    }
  }, [opdrachtId]);

  const aanmaken = async () => {
    if (!form.consument_naam.trim() || !profile?.partner_id) {
      toast.error("Klantnaam is verplicht");
      return;
    }
    setBusy(true);
    try {
      const inst = await createInstallatie({
        partner_id: profile.partner_id,
        opdracht_id: opdrachtId ?? null,
        consument_naam: form.consument_naam,
        klant_email: form.klant_email || null,
        klant_telefoon: form.klant_telefoon || null,
        werkadres: form.werkadres || null,
        werkomschrijving: form.werkomschrijving || null,
        installateur_id: form.installateur_id || null,
        geplande_startdatum: form.geplande_startdatum || null,
        start_tijd: form.start_tijd || null,
        producten: producten as unknown as never,
        status: form.installateur_id && form.geplande_startdatum ? "gepland" : "concept",
        created_by: user?.id ?? null,
      });
      toast.success("Installatie aangemaakt");
      navigate(`/installaties/${inst.id}`);
    } catch (e: any) {
      toast.error(e.message);
    }
    setBusy(false);
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/installaties")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold">Nieuwe installatie</h1>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Gegevens</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Klantnaam *</Label>
            <Input value={form.consument_naam} onChange={(e) => setForm({ ...form, consument_naam: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>E-mail</Label><Input value={form.klant_email} onChange={(e) => setForm({ ...form, klant_email: e.target.value })} /></div>
            <div><Label>Telefoon</Label><Input value={form.klant_telefoon} onChange={(e) => setForm({ ...form, klant_telefoon: e.target.value })} /></div>
          </div>
          <div>
            <Label>Werkadres</Label>
            <Input value={form.werkadres} onChange={(e) => setForm({ ...form, werkadres: e.target.value })} />
          </div>
          <div>
            <Label>Monteur</Label>
            <Select value={form.installateur_id} onValueChange={(v) => setForm({ ...form, installateur_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecteer monteur (optioneel)" /></SelectTrigger>
              <SelectContent>
                {monteurs.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.voornaam} {m.achternaam}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Startdatum</Label><Input type="date" value={form.geplande_startdatum} onChange={(e) => setForm({ ...form, geplande_startdatum: e.target.value })} /></div>
            <div><Label>Starttijd</Label><Input type="time" value={form.start_tijd} onChange={(e) => setForm({ ...form, start_tijd: e.target.value })} /></div>
          </div>
          <div>
            <Label>Werkomschrijving</Label>
            <Textarea value={form.werkomschrijving} onChange={(e) => setForm({ ...form, werkomschrijving: e.target.value })} rows={3} />
          </div>
          {profile?.partner_id ? (
            <div className="space-y-2">
              <Label>Producten / werkzaamheden</Label>
              <InstallatieProductenEditor
                partnerId={profile.partner_id}
                value={producten}
                onChange={setProducten}
              />
            </div>
          ) : null}
          <Button onClick={aanmaken} disabled={busy}>{busy ? "Opslaan…" : "Installatie aanmaken"}</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallatieNieuw;