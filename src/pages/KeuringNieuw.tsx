import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { KeuringType } from "@/components/keuringen/types";

type KlantOption = { id: string; label: string; adres: string | null; postcode: string | null; plaats: string | null };
type InstallatieOption = { id: string; label: string };

export default function KeuringNieuw() {
  const nav = useNavigate();
  const { profile } = useAuth();
  const [params] = useSearchParams();
  const partnerId = profile?.partner_id;

  const [type, setType] = useState<KeuringType>("zonnepanelen");
  const [klantId, setKlantId] = useState<string | null>(params.get("klant_id"));
  const [installatieId, setInstallatieId] = useState<string | null>(params.get("installatie_id"));
  const [object, setObject] = useState("");
  const [adres, setAdres] = useState("");
  const [postcode, setPostcode] = useState("");
  const [plaats, setPlaats] = useState("");
  const [geplandeDatum, setGeplandeDatum] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [opmerking, setOpmerking] = useState("");
  const [saving, setSaving] = useState(false);

  const [klanten, setKlanten] = useState<KlantOption[]>([]);
  const [installaties, setInstallaties] = useState<InstallatieOption[]>([]);

  useEffect(() => {
    if (!partnerId) return;
    void (async () => {
      const { data } = await supabase
        .from("klanten")
        .select("id, voornaam, achternaam, bedrijfsnaam, adres, postcode, plaats")
        .eq("partner_id", partnerId)
        .order("achternaam", { ascending: true })
        .limit(500);
      setKlanten((data ?? []).map((k: any) => ({
        id: k.id,
        label: k.bedrijfsnaam || `${k.voornaam ?? ""} ${k.achternaam ?? ""}`.trim() || "Onbekend",
        adres: k.adres, postcode: k.postcode, plaats: k.plaats,
      })));
    })();
  }, [partnerId]);

  useEffect(() => {
    if (!klantId) { setInstallaties([]); return; }
    void (async () => {
      const { data } = await supabase
        .from("installaties")
        .select("id, werkadres, opleverdatum")
        .eq("klant_id", klantId)
        .order("created_at", { ascending: false });
      setInstallaties((data ?? []).map((i: any) => ({
        id: i.id,
        label: `${i.werkadres ?? "Installatie"}${i.opleverdatum ? ` · ${new Date(i.opleverdatum).toLocaleDateString("nl-NL")}` : ""}`,
      })));
    })();
  }, [klantId]);

  // Auto-vul adres uit klant
  useEffect(() => {
    const k = klanten.find((x) => x.id === klantId);
    if (!k) return;
    if (!adres) setAdres(k.adres ?? "");
    if (!postcode) setPostcode(k.postcode ?? "");
    if (!plaats) setPlaats(k.plaats ?? "");
  }, [klantId, klanten]); // eslint-disable-line react-hooks/exhaustive-deps

  const canSave = useMemo(() => !!partnerId && !!geplandeDatum && (!!klantId || object.trim().length > 0), [partnerId, geplandeDatum, klantId, object]);

  const handleSave = async () => {
    if (!partnerId) return;
    setSaving(true);
    try {
      // Insert keuring
      const { data: keuring, error: insErr } = await supabase
        .from("keuringen" as any)
        .insert({
          partner_id: partnerId,
          type,
          status: "gepland",
          klant_id: klantId,
          installatie_id: installatieId,
          object_omschrijving: object || null,
          locatie_adres: adres || null,
          locatie_postcode: postcode || null,
          locatie_plaats: plaats || null,
          geplande_datum: geplandeDatum,
          aanbevelingen: opmerking || null,
          created_by: profile?.id,
        })
        .select("id, type, partner_id")
        .single();
      if (insErr || !keuring) throw insErr ?? new Error("Aanmaken mislukt");

      // Laad checklist-template (default voor type, of fallback combi → beide)
      const types: KeuringType[] = type === "combi" ? ["zonnepanelen", "thuisbatterij"] : [type];
      const { data: templates } = await supabase
        .from("keuring_templates" as any)
        .select("type, structuur, is_default")
        .eq("partner_id", partnerId)
        .in("type", types as any);
      const used = (templates ?? []).filter((t: any) => t.is_default);
      const finalTemplates = used.length > 0 ? used : (templates ?? []);

      type StructItem = { label: string; norm_referentie?: string | null; blokkerend?: boolean };
      type StructGroup = { categorie: string; items: StructItem[] };
      const checklistRows: Array<Record<string, unknown>> = [];
      let order = 0;
      for (const tpl of finalTemplates as unknown as Array<{ structuur: StructGroup[] }>) {
        for (const grp of (tpl.structuur ?? [])) {
          for (const it of (grp.items ?? [])) {
            checklistRows.push({
              keuring_id: (keuring as any).id,
              partner_id: partnerId,
              categorie: grp.categorie,
              label: it.label,
              norm_referentie: it.norm_referentie ?? null,
              blokkerend: !!it.blokkerend,
              volgorde: order++,
            });
          }
        }
      }
      if (checklistRows.length > 0) {
        const { error: clErr } = await supabase.from("keuring_checklist_items" as any).insert(checklistRows);
        if (clErr) console.warn("Checklist-seed mislukt:", clErr.message);
      }

      toast.success("Keuring aangemaakt");
      nav(`/keuringen/${(keuring as any).id}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Aanmaken mislukt");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => nav("/keuringen")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Terug
        </Button>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" /> Nieuwe keuring inplannen
        </h1>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Basisgegevens</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Type keuring</Label>
              <Select value={type} onValueChange={(v) => setType(v as KeuringType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="zonnepanelen">Zonnepanelen (Scope 12 / NEN 1010)</SelectItem>
                  <SelectItem value="thuisbatterij">Thuisbatterij (NEN 3140 / IEC 62619)</SelectItem>
                  <SelectItem value="combi">Combi (PV + batterij)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Geplande datum</Label>
              <Input type="date" value={geplandeDatum} onChange={(e) => setGeplandeDatum(e.target.value)} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Klant (optioneel)</Label>
              <Select value={klantId ?? "none"} onValueChange={(v) => setKlantId(v === "none" ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Geen klant — los object" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Geen klant (los object)</SelectItem>
                  {klanten.map((k) => <SelectItem key={k.id} value={k.id}>{k.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Installatie (optioneel)</Label>
              <Select value={installatieId ?? "none"} onValueChange={(v) => setInstallatieId(v === "none" ? null : v)} disabled={!klantId}>
                <SelectTrigger><SelectValue placeholder={klantId ? "Kies installatie..." : "Eerst klant kiezen"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Geen specifieke installatie</SelectItem>
                  {installaties.map((i) => <SelectItem key={i.id} value={i.id}>{i.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Object-omschrijving (bij los object)</Label>
            <Input value={object} onChange={(e) => setObject(e.target.value)} placeholder="Bijv. 'PV-installatie 12 panelen Plat dak — De Vries'" />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label>Adres</Label>
              <Input value={adres} onChange={(e) => setAdres(e.target.value)} />
            </div>
            <div>
              <Label>Postcode</Label>
              <Input value={postcode} onChange={(e) => setPostcode(e.target.value)} />
            </div>
            <div className="md:col-span-3">
              <Label>Plaats</Label>
              <Input value={plaats} onChange={(e) => setPlaats(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Interne notitie (optioneel)</Label>
            <Textarea rows={3} value={opmerking} onChange={(e) => setOpmerking(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => nav("/keuringen")}>Annuleren</Button>
            <Button onClick={handleSave} disabled={!canSave || saving}>{saving ? "Opslaan..." : "Keuring aanmaken"}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}