import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import LeadSearchInput from "@/components/shared/LeadSearchInput";

type SchouwCategorie = Database["public"]["Enums"]["schouw_categorie"];

const categorieLabels: Record<SchouwCategorie, string> = {
  zonnepanelen: "Zonnepanelen", warmtepomp: "Warmtepomp",
  isolatie_dak: "Isolatie dak", isolatie_muur: "Isolatie muur",
  isolatie_vloer: "Isolatie vloer", hr_glas: "HR++ glas",
  ventilatie: "Ventilatie", thuisbatterij: "Thuisbatterij",
};

const SchouwNieuw = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    lead_id: searchParams.get("lead_id") || "",
    categorie: "zonnepanelen" as SchouwCategorie,
    geplande_datum: "",
    consument_naam: searchParams.get("klant_naam") || "",
    klant_email: searchParams.get("klant_email") || "",
    notities: "",
  });

  const opdrachtId = searchParams.get("opdracht_id");

  const { data: leads = [] } = useQuery({
    queryKey: ["leads-for-schouw"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("id, voornaam, achternaam, email");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const schouwNummer = `SCH-${new Date().getFullYear()}-${Math.floor(Math.random() * 9999).toString().padStart(4, "0")}`;
      const record: any = {
        lead_id: form.lead_id,
        categorie: form.categorie,
        geplande_datum: form.geplande_datum,
        consument_naam: form.consument_naam || null,
        klant_email: form.klant_email || null,
        notities: form.notities || null,
        partner_id: profile?.partner_id,
        adviseur_id: profile?.id,
        schouw_nummer: schouwNummer,
      };
      const { data, error } = await supabase.from("schouwen").insert(record).select("id").single();
      if (error) throw error;

      // Link to opdracht if applicable
      if (opdrachtId && data?.id) {
        await supabase.from("opdrachten" as any).update({ schouw_id: data.id, status: "schouw_gepland" }).eq("id", opdrachtId);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schouwen"] });
      queryClient.invalidateQueries({ queryKey: ["opdrachten"] });
      toast.success("Schouw ingepland");
      navigate("/schouwen");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleLeadSelect = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    setForm(p => ({
      ...p, lead_id: leadId,
      consument_naam: lead ? `${lead.voornaam} ${lead.achternaam}` : p.consument_naam,
      klant_email: lead?.email || p.klant_email,
    }));
  };

  const canSave = form.lead_id && form.geplande_datum;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">Schouw inplannen</h1>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader><CardTitle>Basisgegevens</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Lead *</Label>
            <Select value={form.lead_id} onValueChange={handleLeadSelect}>
              <SelectTrigger><SelectValue placeholder="Selecteer lead" /></SelectTrigger>
              <SelectContent>
                {leads.map(l => (
                  <SelectItem key={l.id} value={l.id}>{l.voornaam} {l.achternaam} — {l.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Categorie *</Label>
            <Select value={form.categorie} onValueChange={v => setForm(p => ({ ...p, categorie: v as SchouwCategorie }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(categorieLabels) as SchouwCategorie[]).map(c => (
                  <SelectItem key={c} value={c}>{categorieLabels[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Geplande datum *</Label>
            <Input type="date" value={form.geplande_datum} onChange={e => setForm(p => ({ ...p, geplande_datum: e.target.value }))} />
          </div>
          <div>
            <Label>Klantnaam</Label>
            <Input value={form.consument_naam} onChange={e => setForm(p => ({ ...p, consument_naam: e.target.value }))} />
          </div>
          <div>
            <Label>E-mail</Label>
            <Input value={form.klant_email} onChange={e => setForm(p => ({ ...p, klant_email: e.target.value }))} />
          </div>
          <div>
            <Label>Notities</Label>
            <Textarea value={form.notities} onChange={e => setForm(p => ({ ...p, notities: e.target.value }))} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>Annuleren</Button>
        <Button onClick={() => saveMutation.mutate()} disabled={!canSave || saveMutation.isPending} className="gap-2">
          <Save className="h-4 w-4" /> Inplannen
        </Button>
      </div>
    </div>
  );
};

export default SchouwNieuw;
