import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ArrowLeft, ArrowRight, Loader2, Plus, Trash2, Building2, Search, Truck, Save, Send, Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useInkoopInstellingen } from "@/hooks/inkoop/useInkoopInstellingen";
import { ProductSearchInput, type ProductHit } from "@/components/financieel/ProductSearchInput";
import { toast } from "sonner";

type Leverancier = {
  id: string;
  naam: string;
  email: string | null;
  contactpersoon: string | null;
  adres: string | null;
  postcode: string | null;
  plaats: string | null;
};

type Regel = {
  product_id: string | null;
  omschrijving: string;
  aantal: number;
  eenheid: string;
  prijs: number;
  btw_percentage: number;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n || 0);

const emptyRegel = (): Regel => ({
  product_id: null,
  omschrijving: "",
  aantal: 1,
  eenheid: "stuks",
  prijs: 0,
  btw_percentage: 21,
});

function regelTotaal(r: Regel) {
  return Math.round(r.aantal * r.prijs * 100) / 100;
}

// ---------- Stap 1: leverancier kiezen ----------
function StapLeverancier({
  partnerId,
  gekozen,
  onPick,
  onNext,
}: {
  partnerId: string;
  gekozen: Leverancier | null;
  onPick: (l: Leverancier) => void;
  onNext: () => void;
}) {
  const [zoekterm, setZoekterm] = useState("");
  const [hits, setHits] = useState<Leverancier[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const t = setTimeout(async () => {
      let q = supabase
        .from("leveranciers")
        .select("id, naam, email, contactpersoon, adres, postcode, plaats")
        .eq("partner_id", partnerId)
        .order("naam")
        .limit(25);
      if (zoekterm.trim()) {
        q = q.or(`naam.ilike.%${zoekterm}%,contactpersoon.ilike.%${zoekterm}%`);
      }
      const { data } = await q;
      if (!active) return;
      setHits((data ?? []) as Leverancier[]);
      setLoading(false);
    }, 200);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [zoekterm, partnerId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Building2 className="h-5 w-5" /> Stap 1 — Kies leverancier
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={zoekterm}
            onChange={(e) => setZoekterm(e.target.value)}
            placeholder="Zoek op naam of contactpersoon..."
            className="pl-8"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : hits.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center space-y-2">
            <p>Geen leveranciers gevonden.</p>
            <Button asChild variant="outline" size="sm">
              <Link to="/leveranciers">Leverancier toevoegen</Link>
            </Button>
          </div>
        ) : (
          <div className="border rounded-md divide-y max-h-[420px] overflow-auto">
            {hits.map((l) => {
              const aktief = gekozen?.id === l.id;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => onPick(l)}
                  className={`w-full text-left p-3 hover:bg-muted transition-colors ${
                    aktief ? "bg-primary/10" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{l.naam}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {l.contactpersoon || "—"} • {l.email || "geen e-mail"}
                      </div>
                    </div>
                    {aktief && <Badge>Geselecteerd</Badge>}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex justify-between pt-2">
          <Button asChild variant="outline">
            <Link to="/inkoop">
              <ArrowLeft className="h-4 w-4 mr-2" /> Terug naar inkoop
            </Link>
          </Button>
          <Button disabled={!gekozen} onClick={onNext}>
            Volgende <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Stap 2: regels ----------
function RegelRow({
  index,
  regel,
  partnerId,
  leverancierId,
  onChange,
  onRemove,
}: {
  index: number;
  regel: Regel;
  partnerId: string;
  leverancierId: string;
  onChange: (patch: Partial<Regel>) => void;
  onRemove: () => void;
}) {
  const [suggestie, setSuggestie] = useState<{ prijs: number; eenheid: string | null } | null>(null);

  // Prijs-suggestie ophalen voor leverancier+product combinatie
  useEffect(() => {
    if (!regel.product_id) {
      setSuggestie(null);
      return;
    }
    let active = true;
    void supabase
      .from("leverancier_artikelen")
      .select("inkoopprijs, producten(eenheid)")
      .eq("partner_id", partnerId)
      .eq("leverancier_id", leverancierId)
      .eq("product_id", regel.product_id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active || !data) return;
        setSuggestie({
          prijs: Number((data as any).inkoopprijs ?? 0),
          eenheid: ((data as any).producten?.eenheid ?? null) as string | null,
        });
      });
    return () => {
      active = false;
    };
  }, [regel.product_id, leverancierId, partnerId]);

  const passToePrijs = () => {
    if (suggestie) onChange({ prijs: suggestie.prijs });
  };

  return (
    <TableRow>
      <TableCell className="w-12 text-muted-foreground">{index + 1}</TableCell>
      <TableCell>
        <ProductSearchInput
          value={regel.omschrijving}
          onChangeText={(t) => onChange({ omschrijving: t })}
          onPickProduct={(p: ProductHit) =>
            onChange({
              product_id: p.id,
              omschrijving: p.naam,
            })
          }
          placeholder="Zoek product of typ vrij..."
        />
        {suggestie && Math.abs(suggestie.prijs - regel.prijs) > 0.001 && (
          <button
            type="button"
            onClick={passToePrijs}
            className="text-xs text-primary inline-flex items-center gap-1 mt-1 hover:underline"
          >
            <Sparkles className="h-3 w-3" />
            Suggestie: {fmt(suggestie.prijs)} per {suggestie.eenheid ?? "eenheid"} — toepassen
          </button>
        )}
      </TableCell>
      <TableCell className="w-24">
        <Input
          type="number"
          min={0}
          step="0.01"
          value={regel.aantal}
          onChange={(e) => onChange({ aantal: Number(e.target.value) || 0 })}
        />
      </TableCell>
      <TableCell className="w-24">
        <Input
          value={regel.eenheid}
          onChange={(e) => onChange({ eenheid: e.target.value })}
          placeholder="stuks"
        />
      </TableCell>
      <TableCell className="w-32">
        <Input
          type="number"
          min={0}
          step="0.01"
          value={regel.prijs}
          onChange={(e) => onChange({ prijs: Number(e.target.value) || 0 })}
        />
      </TableCell>
      <TableCell className="w-20">
        <Input
          type="number"
          min={0}
          max={100}
          value={regel.btw_percentage}
          onChange={(e) => onChange({ btw_percentage: Number(e.target.value) || 0 })}
        />
      </TableCell>
      <TableCell className="w-28 text-right font-medium">{fmt(regelTotaal(regel))}</TableCell>
      <TableCell className="w-12">
        <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Regel verwijderen">
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function StapRegels({
  partnerId,
  leverancier,
  regels,
  setRegels,
  onBack,
  onNext,
}: {
  partnerId: string;
  leverancier: Leverancier;
  regels: Regel[];
  setRegels: (r: Regel[]) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const subtotaal = regels.reduce((s, r) => s + regelTotaal(r), 0);
  const btw = regels.reduce(
    (s, r) => s + (regelTotaal(r) * (r.btw_percentage || 0)) / 100,
    0,
  );
  const totaal = subtotaal + btw;

  const update = (i: number, patch: Partial<Regel>) => {
    const next = regels.slice();
    next[i] = { ...next[i], ...patch };
    setRegels(next);
  };
  const addRegel = () => setRegels([...regels, emptyRegel()]);
  const removeRegel = (i: number) => {
    if (regels.length === 1) {
      setRegels([emptyRegel()]);
      return;
    }
    setRegels(regels.filter((_, idx) => idx !== i));
  };

  const heeftGeldigeRegel = regels.some((r) => r.omschrijving.trim() && r.aantal > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Plus className="h-5 w-5" /> Stap 2 — Bestelregels
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            voor {leverancier.naam}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Product / omschrijving</TableHead>
                <TableHead>Aantal</TableHead>
                <TableHead>Eenheid</TableHead>
                <TableHead>Prijs</TableHead>
                <TableHead>BTW%</TableHead>
                <TableHead className="text-right">Totaal</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regels.map((r, i) => (
                <RegelRow
                  key={i}
                  index={i}
                  regel={r}
                  partnerId={partnerId}
                  leverancierId={leverancier.id}
                  onChange={(patch) => update(i, patch)}
                  onRemove={() => removeRegel(i)}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        <Button variant="outline" size="sm" onClick={addRegel}>
          <Plus className="h-4 w-4 mr-2" /> Regel toevoegen
        </Button>

        <div className="flex flex-col items-end gap-1 text-sm border-t pt-3">
          <div>Subtotaal: <span className="font-medium">{fmt(subtotaal)}</span></div>
          <div>BTW: <span className="font-medium">{fmt(btw)}</span></div>
          <div className="text-base">Totaal: <span className="font-bold">{fmt(totaal)}</span></div>
        </div>

        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Terug
          </Button>
          <Button disabled={!heeftGeldigeRegel} onClick={onNext}>
            Volgende <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Stap 3: bevestigen ----------
function StapBevestigen({
  partnerId,
  userId,
  leverancier,
  regels,
  onBack,
}: {
  partnerId: string;
  userId: string;
  leverancier: Leverancier;
  regels: Regel[];
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const { data: instellingen } = useInkoopInstellingen(partnerId);

  const defaultAdres = instellingen?.leveringsadres ?? null;

  const [gewensteLeverdatum, setGewensteLeverdatum] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [adresStraat, setAdresStraat] = useState(defaultAdres?.straat ?? "");
  const [adresPostcode, setAdresPostcode] = useState(defaultAdres?.postcode ?? "");
  const [adresPlaats, setAdresPlaats] = useState(defaultAdres?.plaats ?? "");
  const [referentie, setReferentie] = useState("");
  const [interneNotities, setInterneNotities] = useState("");
  const [opmerkingen, setOpmerkingen] = useState("");
  const [betalingstermijn, setBetalingstermijn] = useState<number>(
    instellingen?.standaard_betalingstermijn_dagen ?? 30,
  );
  const [saving, setSaving] = useState(false);

  // Sync defaults zodra instellingen binnen zijn
  useEffect(() => {
    if (!instellingen) return;
    if (defaultAdres) {
      setAdresStraat((v) => v || defaultAdres.straat || "");
      setAdresPostcode((v) => v || defaultAdres.postcode || "");
      setAdresPlaats((v) => v || defaultAdres.plaats || "");
    }
    setBetalingstermijn(instellingen.standaard_betalingstermijn_dagen ?? 30);
  }, [instellingen, defaultAdres]);

  const subtotaal = regels.reduce((s, r) => s + regelTotaal(r), 0);
  const btw = regels.reduce(
    (s, r) => s + (regelTotaal(r) * (r.btw_percentage || 0)) / 100,
    0,
  );
  const totaal = subtotaal + btw;

  const goedkeuringNodig = useMemo(() => {
    if (!instellingen) return false;
    if (instellingen.goedkeuring_modus === "altijd") return true;
    if (instellingen.goedkeuring_modus === "drempel") {
      return totaal >= Number(instellingen.goedkeuring_drempel_bedrag || 0);
    }
    return false;
  }, [instellingen, totaal]);

  const opslaan = async (modus: "concept" | "goedkeuring") => {
    if (saving) return;
    setSaving(true);
    try {
      const { data: numData, error: numErr } = await supabase.rpc(
        "generate_financieel_documentnummer",
        { _partner_id: partnerId, _type: "inkooporder" as any },
      );
      if (numErr) throw numErr;
      const documentnummer = numData as string;

      const regelsPayload = regels
        .filter((r) => r.omschrijving.trim() && r.aantal > 0)
        .map((r) => ({
          product_id: r.product_id,
          omschrijving: r.omschrijving,
          aantal: r.aantal,
          eenheid: r.eenheid,
          prijs: r.prijs,
          btw_percentage: r.btw_percentage,
          totaal: regelTotaal(r),
        }));

      const status = modus === "goedkeuring" ? "wacht_goedkeuring" : "concept";

      const leveringsadres =
        adresStraat || adresPostcode || adresPlaats
          ? { straat: adresStraat, postcode: adresPostcode, plaats: adresPlaats, land: "NL" }
          : null;

      const { data: doc, error } = await supabase
        .from("financiele_documenten")
        .insert({
          partner_id: partnerId,
          type: "inkooporder",
          factuur_subtype: "regulier",
          status: status as any,
          documentnummer,
          created_by: userId,
          leverancier_id: leverancier.id,
          factuurdatum: new Date().toISOString().slice(0, 10),
          gewenste_leverdatum: gewensteLeverdatum || null,
          regels: regelsPayload as any,
          subtotaal,
          btw_bedrag: btw,
          totaal_bedrag: totaal,
          betalingstermijn_dagen: betalingstermijn,
          leverancier_referentie: referentie || null,
          notities: opmerkingen || null,
          interne_notities: interneNotities || null,
          leveringsadres: leveringsadres as any,
        })
        .select("id")
        .single();
      if (error) throw error;

      toast.success(
        modus === "goedkeuring"
          ? "Inkooporder ingediend ter goedkeuring"
          : "Inkooporder als concept opgeslagen",
      );
      navigate(`/financieel/${doc.id}`);
    } catch (e: any) {
      toast.error(e?.message || "Opslaan mislukt");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Truck className="h-5 w-5" /> Stap 3 — Levering & bevestigen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Gewenste leverdatum</Label>
            <Input
              type="date"
              value={gewensteLeverdatum}
              onChange={(e) => setGewensteLeverdatum(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Betalingstermijn (dagen)</Label>
            <Input
              type="number"
              min={0}
              value={betalingstermijn}
              onChange={(e) => setBetalingstermijn(Number(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label>Eigen referentie / inkoopnummer</Label>
            <Input
              value={referentie}
              onChange={(e) => setReferentie(e.target.value)}
              placeholder="bijv. PO-2026-0123"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Leveringsadres</Label>
          <div className="grid md:grid-cols-3 gap-2">
            <Input
              value={adresStraat}
              onChange={(e) => setAdresStraat(e.target.value)}
              placeholder="Straat + huisnr"
              className="md:col-span-3"
            />
            <Input
              value={adresPostcode}
              onChange={(e) => setAdresPostcode(e.target.value)}
              placeholder="Postcode"
            />
            <Input
              value={adresPlaats}
              onChange={(e) => setAdresPlaats(e.target.value)}
              placeholder="Plaats"
              className="md:col-span-2"
            />
          </div>
          {!defaultAdres && (
            <p className="text-xs text-muted-foreground">
              Tip: stel een standaard leveringsadres in via Instellingen → Inkoop, dan vult deze
              wizard die automatisch in.
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Opmerkingen voor leverancier</Label>
            <Textarea
              value={opmerkingen}
              onChange={(e) => setOpmerkingen(e.target.value)}
              rows={3}
              placeholder="Komt op de PDF — vraag naar pakbon, e.d."
            />
          </div>
          <div className="space-y-2">
            <Label>Interne notities</Label>
            <Textarea
              value={interneNotities}
              onChange={(e) => setInterneNotities(e.target.value)}
              rows={3}
              placeholder="Niet zichtbaar voor leverancier"
            />
          </div>
        </div>

        <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1">
          <div className="flex justify-between"><span>Leverancier</span><span className="font-medium">{leverancier.naam}</span></div>
          <div className="flex justify-between"><span>Subtotaal</span><span>{fmt(subtotaal)}</span></div>
          <div className="flex justify-between"><span>BTW</span><span>{fmt(btw)}</span></div>
          <div className="flex justify-between text-base"><span className="font-medium">Totaal</span><span className="font-bold">{fmt(totaal)}</span></div>
          {goedkeuringNodig && (
            <div className="text-warning mt-2">
              Volgens je inkoop-instellingen is goedkeuring vereist voor deze order.
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-between gap-2 pt-2">
          <Button variant="outline" onClick={onBack} disabled={saving}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Terug
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => opslaan("concept")} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Opslaan als concept
            </Button>
            {goedkeuringNodig ? (
              <Button onClick={() => opslaan("goedkeuring")} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Indienen ter goedkeuring
              </Button>
            ) : (
              <Button onClick={() => opslaan("concept")} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Opslaan & openen voor verzenden
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Hoofdpagina ----------
export default function InkoopNieuw() {
  const { profile, user } = useAuth();
  const partnerId = profile?.partner_id;
  const userId = user?.id;
  const [stap, setStap] = useState<1 | 2 | 3>(1);
  const [leverancier, setLeverancier] = useState<Leverancier | null>(null);
  const [regels, setRegels] = useState<Regel[]>([emptyRegel()]);

  if (!partnerId || !userId) {
    return <div className="p-6 text-muted-foreground">Geen organisatie gekoppeld aan dit account.</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nieuwe inkooporder</h1>
          <p className="text-muted-foreground text-sm">
            Drie stappen: leverancier → regels → leveren & bevestigen.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          {[1, 2, 3].map((n) => (
            <Badge key={n} variant={stap === n ? "default" : "outline"}>
              {n}. {n === 1 ? "Leverancier" : n === 2 ? "Regels" : "Bevestigen"}
            </Badge>
          ))}
        </div>
      </div>

      {stap === 1 && (
        <StapLeverancier
          partnerId={partnerId}
          gekozen={leverancier}
          onPick={setLeverancier}
          onNext={() => setStap(2)}
        />
      )}
      {stap === 2 && leverancier && (
        <StapRegels
          partnerId={partnerId}
          leverancier={leverancier}
          regels={regels}
          setRegels={setRegels}
          onBack={() => setStap(1)}
          onNext={() => setStap(3)}
        />
      )}
      {stap === 3 && leverancier && (
        <StapBevestigen
          partnerId={partnerId}
          userId={userId}
          leverancier={leverancier}
          regels={regels}
          onBack={() => setStap(2)}
        />
      )}
    </div>
  );
}
