import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Upload, Package, Truck, FileText, Barcode, Loader2, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCreateOntvangst, type OntvangstRegel } from "@/hooks/inkoop/useInkoopOntvangsten";
import { useUpsertSerienummer } from "@/hooks/logistiek/useSerienummers";
import { matchProductOpRegel } from "@/lib/voorraad";

interface ProductOptie {
  id: string;
  naam: string;
  eenheid: string | null;
  merk: string | null;
  model: string | null;
  artikelnummer: string | null;
  ean_code: string | null;
  product_code: string | null;
  is_assemblage: boolean | null;
  heeft_serienummer: boolean | null;
  omvormer_modulair: boolean | null;
  heeft_backup_box: boolean | null;
}

interface WerkRegel extends OntvangstRegel {
  regel_index: number;                // hoort bij originele orderregel
  is_component: boolean;              // uit een assemblage geëxpandeerd
  bundel_omschrijving?: string;       // naam van assemblage
  serienummers: string[];             // 1 SN per stuk (optioneel)
}

const VERVOERDER_OPTIES = ["DHL", "PostNL", "DPD", "UPS", "GLS", "FedEx", "Eigen transport", "Leverancier", "Anders"];

export default function OntvangstRegistreren() {
  const { id: inkooporderId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const partnerId = profile?.partner_id ?? "";
  const upsertSn = useUpsertSerienummer();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const create = useCreateOntvangst({ partnerId, inkooporderId: inkooporderId ?? "" });

  const { data: doc, isLoading: docLoading } = useQuery({
    queryKey: ["inkooporder-voor-ontvangst", inkooporderId],
    enabled: !!inkooporderId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financiele_documenten")
        .select("id, partner_id, documentnummer, regels, opdracht_id, leveringsadres, leverancier_id, gewenste_leverdatum")
        .eq("id", inkooporderId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: opdracht } = useQuery({
    queryKey: ["opdracht-voor-ontvangst", doc?.opdracht_id],
    enabled: !!doc?.opdracht_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("opdrachten")
        .select("id, lead_id, klant_naam, klant_adres, klant_postcode, klant_plaats")
        .eq("id", doc!.opdracht_id!)
        .maybeSingle();
      return data;
    },
  });

  const { data: producten = [] } = useQuery({
    queryKey: ["producten-voor-ontvangst-page", partnerId],
    enabled: !!partnerId,
    queryFn: async () => {
      const { data } = await supabase
        .from("producten")
        .select("id, naam, eenheid, merk, model, artikelnummer, ean_code, product_code, is_assemblage, heeft_serienummer, omvormer_modulair, heeft_backup_box")
        .or(`partner_id.eq.${partnerId},partner_id.is.null`);
      return (data ?? []) as ProductOptie[];
    },
  });

  const { data: componentenMap = {} } = useQuery({
    queryKey: ["componenten-voor-ontvangst", partnerId],
    enabled: !!partnerId && producten.length > 0,
    queryFn: async () => {
      const assemblageIds = producten.filter((p) => p.is_assemblage).map((p) => p.id);
      if (!assemblageIds.length) return {} as Record<string, Array<{ component_id: string; aantal: number }>>;
      const { data } = await supabase
        .from("product_componenten" as any)
        .select("assemblage_id, component_id, aantal")
        .in("assemblage_id", assemblageIds);
      const map: Record<string, Array<{ component_id: string; aantal: number }>> = {};
      (data ?? []).forEach((r: any) => {
        const arr = map[r.assemblage_id] ?? [];
        arr.push({ component_id: r.component_id, aantal: Number(r.aantal || 1) });
        map[r.assemblage_id] = arr;
      });
      return map;
    },
  });

  // Form state
  const [datum, setDatum] = useState(() => new Date().toISOString().slice(0, 10));
  const [pakbonNummer, setPakbonNummer] = useState("");
  const [vervoerder, setVervoerder] = useState("");
  const [tracking, setTracking] = useState("");
  const [chauffeur, setChauffeur] = useState("");
  const [afleverLocatie, setAfleverLocatie] = useState("");
  const [staatZending, setStaatZending] = useState<string>("goed");
  const [opmerking, setOpmerking] = useState("");
  const [pakbonBestand, setPakbonBestand] = useState<File | null>(null);
  const [regels, setRegels] = useState<WerkRegel[]>([]);
  const [busy, setBusy] = useState(false);

  // Prefill afleverlocatie uit opdracht/klant of doc.leveringsadres
  useEffect(() => {
    if (afleverLocatie) return;
    const adres = (doc?.leveringsadres as any)?.formatted
      ?? (opdracht ? [opdracht.klant_naam, opdracht.klant_adres, opdracht.klant_postcode, opdracht.klant_plaats].filter(Boolean).join(", ") : "");
    if (adres) setAfleverLocatie(adres);
  }, [doc, opdracht]);

  // Expand assemblages naar componentregels
  useEffect(() => {
    if (!doc || regels.length > 0 || producten.length === 0) return;
    const orderRegels = (doc.regels as any[]) ?? [];
    const werk: WerkRegel[] = [];
    orderRegels.forEach((r, i) => {
      const productId = r.product_id ?? matchProductOpRegel(r.omschrijving, producten)?.id ?? null;
      const prod = productId ? producten.find((p) => p.id === productId) : undefined;
      const aantalBesteld = Number(r.aantal ?? 0);
      werk.push({
        regel_index: i,
        is_component: false,
        product_id: productId,
        omschrijving: r.omschrijving,
        besteld_aantal: aantalBesteld,
        ontvangen_aantal: aantalBesteld,
        opmerking: null,
        serienummers: [],
      });
      // Als assemblage → voeg componentregels toe
      if (prod?.is_assemblage) {
        const comps = componentenMap[prod.id] ?? [];
        comps.forEach((c) => {
          const comp = producten.find((p) => p.id === c.component_id);
          if (!comp) return;
          const compAantal = c.aantal * aantalBesteld;
          werk.push({
            regel_index: i,
            is_component: true,
            bundel_omschrijving: prod.naam,
            product_id: comp.id,
            omschrijving: `↳ ${comp.naam}`,
            besteld_aantal: compAantal,
            ontvangen_aantal: compAantal,
            opmerking: null,
            serienummers: [],
          });
        });
      }
    });
    setRegels(werk);
  }, [doc, producten, componentenMap]);

  const productVoor = (r: WerkRegel): ProductOptie | undefined =>
    producten.find((p) => p.id === r.product_id);

  const kanSnInvoeren = (p?: ProductOptie) =>
    !!p && (Boolean(p.heeft_serienummer) || Boolean(p.omvormer_modulair) || Boolean(p.heeft_backup_box));

  const updateRegel = (i: number, patch: Partial<WerkRegel>) => {
    setRegels((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };

  const updateSn = (i: number, snIdx: number, value: string) => {
    setRegels((prev) => prev.map((r, idx) => {
      if (idx !== i) return r;
      const sns = [...r.serienummers];
      while (sns.length <= snIdx) sns.push("");
      sns[snIdx] = value;
      return { ...r, serienummers: sns };
    }));
  };

  const uploadPakbon = async (): Promise<string | null> => {
    if (!pakbonBestand || !partnerId) return null;
    const ext = pakbonBestand.name.split(".").pop() || "bin";
    const pad = `${partnerId}/${inkooporderId}/${Date.now()}-pakbon.${ext}`;
    const { error } = await supabase.storage
      .from("inkoop-documenten")
      .upload(pad, pakbonBestand, { upsert: false, contentType: pakbonBestand.type });
    if (error) throw error;
    return pad;
  };

  const koppelAanKlantkaart = async (bestandPad: string): Promise<string | null> => {
    // Alleen als er een opdracht → lead is
    if (!opdracht?.lead_id || !profile?.id) return null;
    const { data, error } = await supabase.from("documenten").insert({
      partner_id: partnerId,
      entity_type: "lead",
      entity_id: opdracht.lead_id,
      naam: pakbonBestand?.name ?? `Pakbon ${doc?.documentnummer ?? ""}`.trim(),
      type: "rapport",
      bestand_url: bestandPad,
      bestand_grootte: pakbonBestand?.size ?? null,
      mime_type: pakbonBestand?.type ?? null,
      geupload_door_id: profile.id,
      beschrijving: `Ontvangstbewijs / pakbon voor inkooporder ${doc?.documentnummer ?? ""}`.trim(),
      tags: ["ontvangst", "pakbon"] as any,
    } as any).select("id").maybeSingle();
    if (error) {
      // niet fataal — pakbon staat wel in bucket + op ontvangst
      console.warn("Kan document niet aan klantkaart koppelen:", error.message);
      return null;
    }
    return data?.id ?? null;
  };

  const opslaan = async () => {
    if (!inkooporderId || !partnerId) return;
    if (regels.length === 0) {
      toast.error("Geen regels om te registreren");
      return;
    }
    try {
      setBusy(true);
      // 1) Pakbon uploaden
      let bestandPad: string | null = null;
      let documentId: string | null = null;
      if (pakbonBestand) {
        bestandPad = await uploadPakbon();
        if (bestandPad) documentId = await koppelAanKlantkaart(bestandPad);
      }

      // 2) Alleen "regel-regels" (niet component-expansies) doorgeven aan voorraadboeking,
      //    zodat de trigger één keer per orderregel de voorraad bijwerkt.
      const orderRegels: OntvangstRegel[] = regels
        .filter((r) => !r.is_component)
        .map((r) => ({
          product_id: r.product_id ?? null,
          omschrijving: r.omschrijving,
          besteld_aantal: r.besteld_aantal,
          ontvangen_aantal: r.ontvangen_aantal,
          opmerking: r.opmerking ?? null,
        }));

      const snPerRegel = regels
        .map((r, idx) => ({
          regel_index: idx,
          product_id: r.product_id,
          serienummers: r.serienummers.filter((s) => s.trim().length > 0),
        }))
        .filter((r) => r.serienummers.length > 0);

      await create.mutateAsync({
        ontvangstdatum: datum,
        ontvangen_door: profile?.id ?? null,
        regels: orderRegels,
        opmerking: opmerking || null,
        pakbon_nummer: pakbonNummer || null,
        vervoerder: vervoerder || null,
        tracking_nummer: tracking || null,
        chauffeur_naam: chauffeur || null,
        aflever_locatie: afleverLocatie || null,
        staat_zending: staatZending || null,
        ontvangst_document_url: bestandPad,
        sn_per_regel: snPerRegel,
        document_ids: documentId ? [documentId] : [],
      });

      // 3) Serienummers boeken op product_serienummers (per stuk)
      for (const r of regels) {
        const p = productVoor(r);
        if (!p || !kanSnInvoeren(p)) continue;
        for (const sn of r.serienummers) {
          const nummer = sn.trim();
          if (!nummer) continue;
          try {
            await upsertSn.mutateAsync({
              partner_id: partnerId,
              product_id: p.id,
              serienummer: nummer,
              status: "voorraad",
              levering_datum: datum,
            } as any);
          } catch {
            /* duplicate SN's stil overslaan */
          }
        }
      }

      toast.success("Ontvangst geregistreerd");
      navigate(`/financieel/${inkooporderId}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Fout bij opslaan");
    } finally {
      setBusy(false);
    }
  };

  if (docLoading) {
    return <div className="p-6"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }
  if (!doc) {
    return <div className="p-6 text-muted-foreground">Inkooporder niet gevonden.</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/financieel/${inkooporderId}`)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Terug
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Ontvangst registreren</h1>
          <p className="text-sm text-muted-foreground">Inkooporder {doc.documentnummer}</p>
        </div>
      </div>

      {/* Logistieke gegevens */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" /> Zending & aflevering
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Ontvangstdatum</Label>
            <Input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Pakbonnummer</Label>
            <Input value={pakbonNummer} onChange={(e) => setPakbonNummer(e.target.value)} placeholder="bijv. PB-2026-1234" />
          </div>
          <div className="space-y-2">
            <Label>Vervoerder</Label>
            <Select value={vervoerder} onValueChange={setVervoerder}>
              <SelectTrigger><SelectValue placeholder="Kies vervoerder" /></SelectTrigger>
              <SelectContent>
                {VERVOERDER_OPTIES.map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tracking-/vrachtbriefnummer</Label>
            <Input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Optioneel" />
          </div>
          <div className="space-y-2">
            <Label>Chauffeur / naam ontvanger extern</Label>
            <Input value={chauffeur} onChange={(e) => setChauffeur(e.target.value)} placeholder="Optioneel" />
          </div>
          <div className="space-y-2">
            <Label>Staat van de zending</Label>
            <Select value={staatZending} onValueChange={setStaatZending}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="goed">Goed</SelectItem>
                <SelectItem value="beschadigd_verpakking">Beschadigde verpakking</SelectItem>
                <SelectItem value="beschadigd_product">Product beschadigd</SelectItem>
                <SelectItem value="deellevering">Deellevering</SelectItem>
                <SelectItem value="onjuist">Onjuiste levering</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-3 space-y-2">
            <Label>Afleverlocatie</Label>
            <Input value={afleverLocatie} onChange={(e) => setAfleverLocatie(e.target.value)} placeholder="Adres / magazijn / bouwlocatie" />
          </div>
        </CardContent>
      </Card>

      {/* Pakbon upload */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Ontvangstbewijs / pakbon
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,application/pdf"
            onChange={(e) => setPakbonBestand(e.target.files?.[0] ?? null)}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" /> Bestand kiezen
            </Button>
            {pakbonBestand ? (
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">{pakbonBestand.name}</Badge>
                <Button size="sm" variant="ghost" onClick={() => setPakbonBestand(null)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">
                Optioneel — foto of PDF van pakbon. Wordt ook zichtbaar op de klantkaart bij documenten.
              </span>
            )}
          </div>
          {!opdracht?.lead_id && pakbonBestand && (
            <p className="text-xs text-muted-foreground">
              Deze inkooporder is niet gekoppeld aan een klantopdracht; het bestand wordt bewaard bij de ontvangst maar niet op een klantkaart.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Regels */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" /> Regels — wat is er werkelijk binnengekomen?
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-64">Omschrijving</TableHead>
                <TableHead className="min-w-56">Product</TableHead>
                <TableHead className="text-right">Besteld</TableHead>
                <TableHead className="text-right w-32">Ontvangen</TableHead>
                <TableHead>Opmerking</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regels.map((r, i) => {
                const p = productVoor(r);
                const snMogelijk = kanSnInvoeren(p);
                const aantal = Math.max(0, Math.floor(Number(r.ontvangen_aantal) || 0));
                return (
                  <Fragment key={`${r.regel_index}-${i}`}>
                    <TableRow className={r.is_component ? "bg-muted/30" : ""}>
                      <TableCell>
                        <div className={r.is_component ? "pl-4 text-sm" : "font-medium"}>{r.omschrijving}</div>
                        {r.is_component && (
                          <div className="pl-4 text-xs text-muted-foreground">Onderdeel van {r.bundel_omschrijving}</div>
                        )}
                        {!r.product_id && !r.is_component && (
                          <div className="text-xs text-warning">Geen product gekoppeld — voorraad wordt niet bijgewerkt</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={r.product_id ?? "geen"}
                          onValueChange={(v) => updateRegel(i, { product_id: v === "geen" ? null : v })}
                        >
                          <SelectTrigger><SelectValue placeholder="Kies product" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="geen">Geen product</SelectItem>
                            {producten.map((pr) => (
                              <SelectItem key={pr.id} value={pr.id}>{pr.naam}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {r.is_component ? <span className="text-xs">{r.besteld_aantal}</span> : r.besteld_aantal}
                      </TableCell>
                      <TableCell>
                        {r.is_component ? (
                          <div className="text-right text-xs text-muted-foreground">{r.ontvangen_aantal}</div>
                        ) : (
                          <Input
                            type="number"
                            step="0.01"
                            value={r.ontvangen_aantal}
                            onChange={(e) => updateRegel(i, { ontvangen_aantal: parseFloat(e.target.value) || 0 })}
                            className="text-right"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          value={r.opmerking ?? ""}
                          onChange={(e) => updateRegel(i, { opmerking: e.target.value })}
                          placeholder="Optioneel"
                        />
                      </TableCell>
                    </TableRow>
                    {snMogelijk && aantal > 0 && (
                      <TableRow className="bg-primary/5">
                        <TableCell colSpan={5} className="py-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs">
                              <Barcode className="h-3 w-3 text-primary" />
                              <Badge variant="outline" className="border-primary/40 text-primary">
                                Serienummers (optioneel)
                              </Badge>
                              <span className="text-muted-foreground">
                                Vul nu al SN's in; ze verschijnen automatisch op oplever- en garantiedocumenten.
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              {Array.from({ length: aantal }).map((_, snIdx) => (
                                <Input
                                  key={snIdx}
                                  value={r.serienummers[snIdx] ?? ""}
                                  onChange={(e) => updateSn(i, snIdx, e.target.value)}
                                  placeholder={`SN stuk #${snIdx + 1}`}
                                />
                              ))}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="pt-6 space-y-2">
          <Label>Algemene opmerking</Label>
          <Textarea
            value={opmerking}
            onChange={(e) => setOpmerking(e.target.value)}
            rows={3}
            placeholder="Bijv. doos beschadigd, deellevering, chauffeur wachtte lang..."
          />
        </CardContent>
      </Card>

      <Separator />

      <div className="flex flex-wrap justify-end gap-2 pb-6">
        <Button variant="outline" onClick={() => navigate(`/financieel/${inkooporderId}`)}>
          Annuleren
        </Button>
        <Button onClick={opslaan} disabled={busy || create.isPending || regels.length === 0}>
          {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
          Ontvangst registreren
        </Button>
      </div>
    </div>
  );
}