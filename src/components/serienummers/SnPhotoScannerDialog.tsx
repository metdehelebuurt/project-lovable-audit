import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Loader2, Check, X, AlertTriangle, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Kandidaat {
  serienummer: string;
  confidence: number;
  type?: string | null;
  merk?: string | null;
  model?: string | null;
  label?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  hint?: string | null;
  /** Bestaande SN's om duplicaten te markeren */
  bestaandeSns?: string[];
  /**
   * Wordt aangeroepen met alle bevestigde (aangevinkte + geverifieerde) serienummers.
   * De caller is verantwoordelijk voor de daadwerkelijke opslag.
   */
  onBevestig: (bevestigd: Array<{ serienummer: string; type?: string | null }>) => Promise<void> | void;
}

const MAX_SIZE = 6 * 1024 * 1024; // 6MB

/**
 * Optische serienummer-herkenning met verplichte dubbele controle:
 * 1. Gebruiker maakt/upload foto → AI leest kandidaten.
 * 2. Elk kandidaat serienummer moet handmatig worden aangevinkt EN geverifieerd
 *    voordat het wordt bevestigd. Lage-confidence velden krijgen een waarschuwing.
 */
const SnPhotoScannerDialog = ({ open, onOpenChange, hint, bestaandeSns = [], onBevestig }: Props) => {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [kandidaten, setKandidaten] = useState<Kandidaat[]>([]);
  const [bevestigd, setBevestigd] = useState<Record<number, boolean>>({});
  const [waardes, setWaardes] = useState<Record<number, string>>({});
  const [opmerking, setOpmerking] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setImageDataUrl(null);
    setKandidaten([]);
    setBevestigd({});
    setWaardes({});
    setOpmerking(null);
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Alleen afbeeldingen worden ondersteund");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Bestand te groot (max 6MB)");
      return;
    }
    setBusy(true);
    setKandidaten([]);
    setBevestigd({});
    setWaardes({});
    setOpmerking(null);
    try {
      const dataUrl = await downscaleAndEncode(file);
      setImageDataUrl(dataUrl);
      const { data, error } = await supabase.functions.invoke("sn-scan-photo", {
        body: { image: dataUrl, hint: hint ?? null },
      });
      if (error) throw error;
      const list: Kandidaat[] = (data as any)?.kandidaten ?? [];
      setKandidaten(list);
      setOpmerking((data as any)?.opmerking ?? null);
      const w: Record<number, string> = {};
      list.forEach((k, i) => (w[i] = k.serienummer));
      setWaardes(w);
      if (list.length === 0) {
        toast.error("Geen serienummers herkend. Probeer een duidelijkere foto (dichterbij, meer licht).");
      } else {
        toast.success(`${list.length} serienummer(s) herkend — controleer en bevestig.`);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Scan mislukt");
    } finally {
      setBusy(false);
    }
  };

  const isDuplicaat = (sn: string) =>
    bestaandeSns.some((b) => b.trim().toUpperCase() === sn.trim().toUpperCase());

  const teBevestigen = kandidaten
    .map((k, i) => ({ ...k, idx: i, waarde: waardes[i] ?? k.serienummer }))
    .filter((k) => bevestigd[k.idx] && k.waarde.trim().length > 0);

  const handleBevestig = async () => {
    if (teBevestigen.length === 0) {
      toast.error("Vink minstens één serienummer aan om te bevestigen");
      return;
    }
    const duplicaten = teBevestigen.filter((k) => isDuplicaat(k.waarde));
    if (duplicaten.length > 0) {
      toast.error(`Duplicaat: ${duplicaten.map((d) => d.waarde).join(", ")} bestaat al.`);
      return;
    }
    setSaving(true);
    try {
      await onBevestig(
        teBevestigen.map((k) => ({ serienummer: k.waarde.trim(), type: k.type ?? null })),
      );
      reset();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Opslaan mislukt");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" /> Serienummer scannen via foto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!imageDataUrl && (
            <div className="border-2 border-dashed rounded-xl p-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Maak een foto van het typeplaatje / label. Zorg voor duidelijk licht en houd de camera stil.
                De AI leest het serienummer — jij bevestigt.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button type="button" onClick={() => cameraRef.current?.click()} disabled={busy}>
                  <Camera className="h-4 w-4 mr-1" /> Camera
                </Button>
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={busy}>
                  <ImagePlus className="h-4 w-4 mr-1" /> Kies foto
                </Button>
              </div>
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </div>
          )}

          {imageDataUrl && (
            <div className="space-y-3">
              <div className="relative rounded-lg overflow-hidden bg-muted max-h-60 flex items-center justify-center">
                <img src={imageDataUrl} alt="Gescande label" className="max-h-60 object-contain" />
                {busy && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" /> AI leest het label…
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={reset} disabled={busy || saving}>
                  <X className="h-4 w-4 mr-1" /> Andere foto
                </Button>
              </div>
            </div>
          )}

          {kandidaten.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Controleer elk serienummer en vink aan om te bevestigen
              </div>
              {kandidaten.map((k, i) => {
                const waarde = waardes[i] ?? k.serienummer;
                const lowConf = k.confidence < 0.75;
                const dup = isDuplicaat(waarde);
                const gewijzigd = waarde.trim() !== k.serienummer.trim();
                return (
                  <div
                    key={i}
                    className={`rounded-lg border p-3 space-y-2 ${
                      bevestigd[i] ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={!!bevestigd[i]}
                        onChange={(e) => setBevestigd((p) => ({ ...p, [i]: e.target.checked }))}
                        className="h-4 w-4 accent-primary"
                        aria-label={`Bevestig ${waarde}`}
                      />
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          {k.label ?? "Serienummer"}
                          {k.type ? ` · ${k.type.replace("_", " ")}` : ""}
                          {k.merk ? ` · ${k.merk}` : ""}
                          {k.model ? ` ${k.model}` : ""}
                        </Label>
                        <Input
                          value={waarde}
                          onChange={(e) => setWaardes((p) => ({ ...p, [i]: e.target.value }))}
                          className="font-mono"
                        />
                      </div>
                      <div className="text-xs shrink-0 text-right">
                        <div
                          className={`font-medium ${
                            k.confidence >= 0.85
                              ? "text-success"
                              : k.confidence >= 0.6
                              ? "text-warning-foreground"
                              : "text-destructive"
                          }`}
                        >
                          {Math.round(k.confidence * 100)}%
                        </div>
                        <div className="text-muted-foreground">zeker</div>
                      </div>
                    </div>
                    {lowConf && (
                      <p className="text-xs text-warning-foreground flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Lage betrouwbaarheid — controleer extra zorgvuldig.
                      </p>
                    )}
                    {dup && (
                      <p className="text-xs text-destructive">
                        Dit serienummer is al geregistreerd.
                      </p>
                    )}
                    {gewijzigd && (
                      <p className="text-xs text-muted-foreground">
                        Handmatig aangepast (was: <span className="font-mono">{k.serienummer}</span>)
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {opmerking && kandidaten.length === 0 && !busy && imageDataUrl && (
            <p className="text-sm text-muted-foreground italic">{opmerking}</p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Annuleren
          </Button>
          <Button
            type="button"
            onClick={handleBevestig}
            disabled={teBevestigen.length === 0 || saving || busy}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Opslaan…
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-1" /> Bevestig {teBevestigen.length} serienummer
                {teBevestigen.length === 1 ? "" : "s"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Downscale naar max 1600px lange zijde en encodeer als JPEG data URL,
 * zodat de payload naar de AI klein blijft en de leesbaarheid hoog.
 */
async function downscaleAndEncode(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const maxSide = 1600;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas niet beschikbaar");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.88);
}

export default SnPhotoScannerDialog;