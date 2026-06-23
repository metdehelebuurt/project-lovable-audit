import { useState } from "react";
import Papa from "papaparse";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, FileUp, Info, Upload } from "lucide-react";
import { autoMapKolommen, rijNaarLead, SALES_VELDEN, GROEP_LABEL, type SalesVeld, type VeldGroep } from "@/lib/sales/kolomMapping";
import { SALES_FASES, FASE_LABEL, type SalesFase } from "@/lib/sales/faseLabels";
import { useAffiliateGebruikers } from "@/hooks/sales/useDoorzetten";
import { useCsvImport, type Bestemming } from "@/hooks/sales/useCsvImport";

export default function SalesImport() {
  const [bestand, setBestand] = useState<File | null>(null);
  const [kolommen, setKolommen] = useState<string[]>([]);
  const [rijen, setRijen] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, SalesVeld | null>>({});
  const [bestemming, setBestemming] = useState<Bestemming>("platform");
  const [affiliateId, setAffiliateId] = useState<string>("");
  const [fase, setFase] = useState<SalesFase>("koud");
  const [resultaat, setResultaat] = useState<{ aangemaakt: number; geskipped: number } | null>(null);

  const { data: affiliates } = useAffiliateGebruikers();
  const importer = useCsvImport();

  const onFile = (file: File) => {
    setBestand(file);
    setResultaat(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const data = res.data as Record<string, string>[];
        const kols = res.meta.fields ?? Object.keys(data[0] ?? {});
        setKolommen(kols);
        setRijen(data);
        setMapping(autoMapKolommen(kols));
      },
    });
  };

  const importeren = async () => {
    const transformed = rijen.map((r) => rijNaarLead(r, mapping));
    const res = await importer.mutateAsync({
      rijen: transformed,
      bestemming,
      affiliate_id: bestemming === "affiliate" ? affiliateId : null,
      fase,
      bestandsnaam: bestand?.name ?? "csv-upload",
      kolom_mapping: Object.fromEntries(
        Object.entries(mapping).filter(([, v]) => v).map(([k, v]) => [k, v as string]),
      ),
    });
    setResultaat({ aangemaakt: res.aangemaakt, geskipped: res.geskipped });
  };

  const aantalGemapt = Object.values(mapping).filter(Boolean).length;
  const kanImporteren =
    rijen.length > 0 &&
    aantalGemapt > 0 &&
    (bestemming !== "affiliate" || !!affiliateId) &&
    !importer.isPending;

  return (
    <div className="space-y-4 max-w-4xl">
      <Card className="p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">1. Upload CSV-bestand</h2>
          <p className="text-sm text-muted-foreground">Eerste rij wordt als kolomkop gelezen. Komma- of puntkomma-gescheiden.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-md border bg-background hover:bg-accent cursor-pointer">
            <FileUp className="h-4 w-4" />
            <span>Kies bestand</span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
          </label>
          {bestand && <span className="text-sm text-muted-foreground">{bestand.name} · {rijen.length} rijen</span>}
        </div>
      </Card>

      {kolommen.length > 0 && (
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">2. Kolommen koppelen</h2>
            <p className="text-sm text-muted-foreground">
              {aantalGemapt} van de {kolommen.length} kolommen automatisch herkend. Pas waar nodig aan.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Let op: <span className="font-medium">Bedrijfsnaam</span> en <span className="font-medium">Contactpersoon</span> zijn aparte velden. Eén bedrijf kan meerdere contactpersonen hebben — koppel een persoonsnaam dus nooit aan Bedrijfsnaam.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {kolommen.map((k) => (
              <div key={k} className="flex items-center gap-2">
                <div className="flex-1 text-sm truncate">
                  <span className="font-medium">{k}</span>
                  <span className="text-muted-foreground"> — voorbeeld: {rijen[0]?.[k] ?? "—"}</span>
                </div>
                <Select
                  value={mapping[k] ?? "__niet__"}
                  onValueChange={(v) => setMapping({ ...mapping, [k]: v === "__niet__" ? null : (v as SalesVeld) })}
                >
                  <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__niet__">— Niet importeren —</SelectItem>
                    {(["bedrijf", "contactpersoon", "overig"] as VeldGroep[]).map((groep) => (
                      <div key={groep}>
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {GROEP_LABEL[groep]}
                        </div>
                        {SALES_VELDEN.filter((v) => v.groep === groep).map((v) => (
                          <SelectItem key={v.key} value={v.key}>{v.label}</SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </Card>
      )}

      {kolommen.length > 0 && (
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">3. Bestemming kiezen</h2>
          <RadioGroup value={bestemming} onValueChange={(v) => setBestemming(v as Bestemming)}>
            <div className="flex items-start gap-2">
              <RadioGroupItem value="platform" id="best-platform" className="mt-1" />
              <Label htmlFor="best-platform" className="font-normal">
                <span className="font-medium">Sales-pipeline (bij platform)</span>
                <p className="text-xs text-muted-foreground">Leads blijven bij jou tot je ze doorzet.</p>
              </Label>
            </div>
            <div className="flex items-start gap-2">
              <RadioGroupItem value="pool" id="best-pool" className="mt-1" />
              <Label htmlFor="best-pool" className="font-normal">
                <span className="font-medium">Direct in affiliate-pool</span>
                <p className="text-xs text-muted-foreground">Alle affiliates kunnen claimen.</p>
              </Label>
            </div>
            <div className="flex items-start gap-2">
              <RadioGroupItem value="affiliate" id="best-affiliate" className="mt-1" />
              <Label htmlFor="best-affiliate" className="font-normal">
                <span className="font-medium">Direct toewijzen aan affiliate</span>
              </Label>
            </div>
          </RadioGroup>
          {bestemming === "affiliate" && (
            <div>
              <Label>Kies affiliate</Label>
              <Select value={affiliateId} onValueChange={setAffiliateId}>
                <SelectTrigger><SelectValue placeholder="Kies affiliate" /></SelectTrigger>
                <SelectContent>
                  {(affiliates ?? []).map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.naam} — {a.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>Startfase</Label>
            <Select value={fase} onValueChange={(v) => setFase(v as SalesFase)}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SALES_FASES.map((f) => <SelectItem key={f} value={f}>{FASE_LABEL[f]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </Card>
      )}

      {kolommen.length > 0 && (
        <Card className="p-6 space-y-3">
          <h2 className="text-lg font-semibold">4. Importeren</h2>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Leads met een e-mail die al in het systeem voorkomt worden automatisch overgeslagen.
            </AlertDescription>
          </Alert>
          <Button onClick={importeren} disabled={!kanImporteren} className="gap-2">
            <Upload className="h-4 w-4" />
            {importer.isPending ? "Bezig…" : `Importeer ${rijen.length} rijen`}
          </Button>
          {resultaat && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                {resultaat.aangemaakt} leads aangemaakt, {resultaat.geskipped} overgeslagen (duplicaten of validatiefouten).
              </AlertDescription>
            </Alert>
          )}
        </Card>
      )}
    </div>
  );
}