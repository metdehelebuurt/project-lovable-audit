import { useMemo, useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Pencil, Save, Download, Plus, Sun, Loader2, Info } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useZonnepaneelProducten, useDaklayoutOpslag, uploadSnapshot } from "../useDaklayout";
import { berekenAutoLayout } from "./PaneelLayoutEngine";
import MapCanvas from "./MapCanvas";
import PaneelProductPicker from "./PaneelProductPicker";
import DakvlakPanel from "./DakvlakPanel";
import { exportDaklayoutPdf } from "./exportDaklayoutPdf";
import type { Dakvlak, LatLng, Paneel, PaneelProduct } from "../types";

interface Props {
  initialAdres?: string;
  initialPostcode?: string;
  initialPlaats?: string;
  schouwId?: string | null;
  leadId?: string | null;
  onOpgeslagen?: (id: string) => void;
}

const DISCLAIMER =
  "Deze daklayout is een visuele schatting op basis van satellietbeelden en kan afwijken van de werkelijke daksituatie. Definitieve plaatsing wordt bepaald tijdens de schouw.";

function nieuwDakvlak(polygon: LatLng[], index: number): Dakvlak {
  return {
    id: `dv-${Date.now()}-${index}`,
    naam: `Dakvlak ${index + 1}`,
    polygon,
    orientatieDeg: 180,
    hellingshoekDeg: 35,
    modus: "portret",
    margeMm: 300,
  };
}

const DaklayoutEditor = ({
  initialAdres = "",
  initialPostcode = "",
  initialPlaats = "",
  schouwId = null,
  leadId = null,
  onOpgeslagen,
}: Props) => {
  const { producten, loading: prodLoading } = useZonnepaneelProducten();
  const { opslaan, saving } = useDaklayoutOpslag();

  const [naam, setNaam] = useState("Daklayout");
  const [adres, setAdres] = useState(initialAdres);
  const [postcode, setPostcode] = useState(initialPostcode);
  const [plaats, setPlaats] = useState(initialPlaats);
  const [product, setProduct] = useState<PaneelProduct | null>(null);
  const [dakvlakken, setDakvlakken] = useState<Dakvlak[]>([]);
  const [panelen, setPanelen] = useState<Paneel[]>([]);
  const [tekenModus, setTekenModus] = useState<"polygoon" | "geen">("geen");
  const [geselecteerdDakvlakId, setGeselecteerdDakvlakId] = useState<string | null>(null);
  const [exporteren, setExporteren] = useState(false);
  const mapElRef = useRef<HTMLElement | null>(null);

  const volledigAdres = useMemo(
    () => [adres, postcode, plaats].filter(Boolean).join(", "),
    [adres, postcode, plaats],
  );

  const handlePolygoon = useCallback((poly: LatLng[]) => {
    setDakvlakken((prev) => {
      const nieuw = nieuwDakvlak(poly, prev.length);
      setGeselecteerdDakvlakId(nieuw.id);
      return [...prev, nieuw];
    });
    setTekenModus("geen");
  }, []);

  const updateDakvlak = (id: string, patch: Partial<Dakvlak>) => {
    setDakvlakken((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const verwijderDakvlak = (id: string) => {
    setDakvlakken((prev) => prev.filter((d) => d.id !== id));
    setPanelen((prev) => prev.filter((p) => p.dakvlakId !== id));
    if (geselecteerdDakvlakId === id) setGeselecteerdDakvlakId(null);
  };

  const autoVul = (id: string) => {
    const dv = dakvlakken.find((d) => d.id === id);
    if (!dv) return;
    if (!product) {
      toast({ title: "Geen paneel gekozen", description: "Kies eerst een paneel uit de catalogus.", variant: "destructive" });
      return;
    }
    const nieuw = berekenAutoLayout({
      dakvlak: dv,
      paneelBreedteMm: product.breedteMm,
      paneelLengteMm: product.lengteMm,
    });
    setPanelen((prev) => [...prev.filter((p) => p.dakvlakId !== id), ...nieuw]);
    toast({ title: `${nieuw.length} panelen geplaatst` });
  };

  const leegmaken = (id: string) => {
    setPanelen((prev) => prev.filter((p) => p.dakvlakId !== id));
  };

  const handlePaneelToevoegen = (center: LatLng) => {
    if (!geselecteerdDakvlakId) return;
    const dv = dakvlakken.find((d) => d.id === geselecteerdDakvlakId);
    if (!dv) return;
    const nieuw: Paneel = {
      id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      dakvlakId: dv.id,
      center,
      rotatieDeg: dv.orientatieDeg,
      status: "handmatig",
    };
    setPanelen((prev) => [...prev, nieuw]);
  };

  const handlePaneelVerwijderen = (id: string) => {
    setPanelen((prev) => prev.filter((p) => p.id !== id));
  };

  const totaalWp = panelen.length * (product?.wp ?? 0);

  const aantalPerDakvlak = (id: string) => panelen.filter((p) => p.dakvlakId === id).length;

  const handleOpslaan = async () => {
    if (dakvlakken.length === 0) {
      toast({ title: "Geen dakvlakken", description: "Teken eerst een dakvlak.", variant: "destructive" });
      return;
    }
    const opgeslagen = await opslaan({
      naam,
      adres: adres || null,
      postcode: postcode || null,
      plaats: plaats || null,
      lat: null,
      lng: null,
      product,
      dakvlakken,
      panelen,
      schouwId,
      leadId,
    });
    if (opgeslagen) {
      // Optioneel: snapshot uploaden
      if (mapElRef.current) {
        try {
          const pdfBlob = await exportDaklayoutPdf({
            mapEl: mapElRef.current,
            naam,
            adres: volledigAdres,
            product,
            dakvlakken,
            panelen,
          });
          await uploadSnapshot(opgeslagen.partner_id, opgeslagen.id, pdfBlob);
        } catch {
          /* snapshot is best-effort */
        }
      }
      onOpgeslagen?.(opgeslagen.id);
    }
  };

  const handlePdf = async () => {
    if (!mapElRef.current) return;
    setExporteren(true);
    try {
      const blob = await exportDaklayoutPdf({
        mapEl: mapElRef.current,
        naam,
        adres: volledigAdres,
        product,
        dakvlakken,
        panelen,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${naam.replace(/[^\w-]+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast({ title: "PDF mislukt", description: (e as Error).message, variant: "destructive" });
    }
    setExporteren(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
      <div className="space-y-3">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-3 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs">Adres</Label>
                <Input value={adres} onChange={(e) => setAdres(e.target.value)} placeholder="Straat en huisnummer" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Postcode / plaats</Label>
                <div className="flex gap-2">
                  <Input value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="1234 AB" className="w-24" />
                  <Input value={plaats} onChange={(e) => setPlaats(e.target.value)} placeholder="Plaats" />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={tekenModus === "polygoon" ? "default" : "outline"}
                size="sm"
                onClick={() => setTekenModus((m) => (m === "polygoon" ? "geen" : "polygoon"))}
              >
                <Pencil className="h-4 w-4 mr-1.5" />
                {tekenModus === "polygoon" ? "Bezig met tekenen..." : "Dakvlak tekenen"}
              </Button>
              <Badge variant="secondary" className="gap-1">
                <Sun className="h-3 w-3" />
                {panelen.length} panelen · {totaalWp.toLocaleString("nl-NL")} Wp
              </Badge>
              <div className="ml-auto flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePdf} disabled={exporteren}>
                  {exporteren ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Download className="h-4 w-4 mr-1.5" />}
                  PDF
                </Button>
                <Button size="sm" onClick={handleOpslaan} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
                  Opslaan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <MapCanvas
          centerAdres={volledigAdres}
          dakvlakken={dakvlakken}
          panelen={panelen}
          paneelBreedteMm={product?.breedteMm ?? 1134}
          paneelLengteMm={product?.lengteMm ?? 1722}
          tekenModus={tekenModus}
          geselecteerdDakvlakId={geselecteerdDakvlakId}
          onPolygoonGetekend={handlePolygoon}
          onDakvlakSelect={setGeselecteerdDakvlakId}
          onPaneelToevoegen={handlePaneelToevoegen}
          onPaneelVerwijderen={handlePaneelVerwijderen}
          onMapReady={(el) => {
            mapElRef.current = el;
          }}
        />

        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg p-2">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{DISCLAIMER}</span>
        </div>
      </div>

      <div className="space-y-3">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-3 space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Naam</Label>
              <Input value={naam} onChange={(e) => setNaam(e.target.value)} />
            </div>
            <PaneelProductPicker
              producten={producten}
              loading={prodLoading}
              geselecteerd={product}
              onChange={setProduct}
            />
          </CardContent>
        </Card>

        <Separator />

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Dakvlakken ({dakvlakken.length})</h3>
          <Button variant="ghost" size="sm" onClick={() => setTekenModus("polygoon")}>
            <Plus className="h-4 w-4 mr-1" /> Nieuw
          </Button>
        </div>

        {dakvlakken.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            Nog geen dakvlakken. Klik op "Dakvlak tekenen" en teken een polygoon op de kaart.
          </p>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {dakvlakken.map((dv, i) => (
              <DakvlakPanel
                key={dv.id}
                index={i}
                dakvlak={dv}
                aantalPanelen={aantalPerDakvlak(dv.id)}
                geselecteerd={dv.id === geselecteerdDakvlakId}
                onSelect={() => setGeselecteerdDakvlakId(dv.id)}
                onChange={(patch) => updateDakvlak(dv.id, patch)}
                onAutoVul={() => autoVul(dv.id)}
                onLeegmaken={() => leegmaken(dv.id)}
                onVerwijder={() => verwijderDakvlak(dv.id)}
              />
            ))}
          </div>
        )}

        {geselecteerdDakvlakId && (
          <p className="text-xs text-muted-foreground bg-primary/10 p-2 rounded-md">
            Klik op de kaart om een paneel toe te voegen op het geselecteerde dakvlak. Klik op een paneel om het te verwijderen.
          </p>
        )}
      </div>
    </div>
  );
};

export default DaklayoutEditor;