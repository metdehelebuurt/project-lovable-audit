import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Wrench, Upload, Loader2, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { buildHandleidingUrl, type HandleidingType } from "@/lib/productHandleidingen";
import { vriendelijkeUploadFout } from "@/lib/storageErrors";

interface Props {
  productId: string;
  installatieUrl: string | null;
  installatieNaam: string | null;
  gebruikerUrl: string | null;
  gebruikerNaam: string | null;
  onChanged?: () => void;
}

const MAX_BYTES = 20 * 1024 * 1024;

function formatTimestampFromPath(path: string | null): string | null {
  if (!path) return null;
  const m = path.match(/-(\d{10,})\.pdf$/);
  if (!m) return null;
  const ts = Number(m[1]);
  if (!Number.isFinite(ts)) return null;
  return new Date(ts).toLocaleDateString("nl-NL");
}

export default function ProductHandleidingenSection({
  productId,
  installatieUrl,
  installatieNaam,
  gebruikerUrl,
  gebruikerNaam,
  onChanged,
}: Props) {
  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" /> Handleidingen
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UploadSlot
          productId={productId}
          type="installatie"
          icon={<Wrench className="h-4 w-4" />}
          titel="Installatiehandleiding"
          beschrijving="Beschikbaar voor de monteur in de installatiedetail-pagina en mobiel werkscherm."
          huidigeUrl={installatieUrl}
          huidigeNaam={installatieNaam}
          uploadDatum={formatTimestampFromPath(installatieUrl)}
          onChanged={onChanged}
        />
        <UploadSlot
          productId={productId}
          type="gebruiker"
          icon={<BookOpen className="h-4 w-4" />}
          titel="Gebruikershandleiding"
          beschrijving="Wordt automatisch meegestuurd met het opleverrapport en is zichtbaar in het klantportaal."
          huidigeUrl={gebruikerUrl}
          huidigeNaam={gebruikerNaam}
          uploadDatum={formatTimestampFromPath(gebruikerUrl)}
          onChanged={onChanged}
        />
      </CardContent>
    </Card>
  );
}

interface SlotProps {
  productId: string;
  type: HandleidingType;
  icon: React.ReactNode;
  titel: string;
  beschrijving: string;
  huidigeUrl: string | null;
  huidigeNaam: string | null;
  uploadDatum: string | null;
  onChanged?: () => void;
}

function UploadSlot({ productId, type, icon, titel, beschrijving, huidigeUrl, huidigeNaam, uploadDatum, onChanged }: SlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const verwerkBestand = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Alleen PDF-bestanden zijn toegestaan");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Maximaal 20 MB per bestand");
      return;
    }
    setBusy(true);
    try {
      const ts = Date.now();
      const path = `handleidingen/${productId}/${type}-${ts}.pdf`;
      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: true, contentType: "application/pdf" });
      if (upErr) throw upErr;

      const updateVeld = type === "installatie"
        ? { installatie_handleiding_url: path, installatie_handleiding_naam: file.name }
        : { gebruiker_handleiding_url: path, gebruiker_handleiding_naam: file.name };
      const { error: dbErr } = await supabase.from("producten").update(updateVeld).eq("id", productId);
      if (dbErr) throw dbErr;

      toast.success("Handleiding geüpload");
      onChanged?.();
    } catch (err) {
      toast.error("Upload mislukt", { description: vriendelijkeUploadFout(err) });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const verwijderen = async () => {
    if (!huidigeUrl) return;
    if (!window.confirm("Handleiding verwijderen?")) return;
    setBusy(true);
    try {
      // Probeer storage-bestand op te ruimen (best-effort)
      if (!huidigeUrl.startsWith("http")) {
        await supabase.storage.from("product-images").remove([huidigeUrl]);
      }
      const updateVeld = type === "installatie"
        ? { installatie_handleiding_url: null, installatie_handleiding_naam: null }
        : { gebruiker_handleiding_url: null, gebruiker_handleiding_naam: null };
      const { error } = await supabase.from("producten").update(updateVeld).eq("id", productId);
      if (error) throw error;
      toast.success("Handleiding verwijderd");
      onChanged?.();
    } catch (err) {
      toast.error("Verwijderen mislukt", { description: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) verwerkBestand(file);
  };

  const publicUrl = huidigeUrl ? buildHandleidingUrl(huidigeUrl) : null;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-primary">{icon}</span>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{titel}</p>
            {huidigeUrl ? (
              <Badge variant="outline" className="mt-1 text-xs">Geüpload{uploadDatum ? ` • ${uploadDatum}` : ""}</Badge>
            ) : (
              <Badge variant="outline" className="mt-1 text-xs text-muted-foreground">Nog niet geüpload</Badge>
            )}
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{beschrijving}</p>

      {huidigeUrl ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm bg-muted/40 rounded-lg p-2 min-w-0">
            <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="truncate flex-1">{huidigeNaam ?? "handleiding.pdf"}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {publicUrl ? (
              <Button variant="outline" size="sm" asChild className="gap-1.5">
                <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" /> Bekijken
                </a>
              </Button>
            ) : null}
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => inputRef.current?.click()} disabled={busy}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Vervangen
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={verwijderen} disabled={busy}>
              <Trash2 className="h-3.5 w-3.5" /> Verwijderen
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          disabled={busy}
          className={`w-full rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          } ${busy ? "opacity-50" : ""}`}
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
          ) : (
            <>
              <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">Sleep PDF hier of klik om te uploaden</p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">Maximaal 20 MB</p>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) verwerkBestand(f); }}
      />
    </div>
  );
}