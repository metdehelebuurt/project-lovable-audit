import { useEffect, useState, useCallback, type ChangeEvent } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Camera, Check, Loader2, Trash2, Upload, ShieldCheck, ImageIcon } from "lucide-react";

const FUNCTIONS_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/consumer-schouw`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

interface SchouwFoto { url: string; label: string; uploaded_at: string; path?: string }
interface Partner { naam?: string; logo_url?: string | null; logo_url_donker?: string | null; primaire_kleur?: string | null; website?: string | null }
interface SchouwData {
  schouwId: string;
  schouwNummer: string;
  consumentNaam: string | null;
  voltooidOp: string | null;
  partner: Partner | null;
  fotos: SchouwFoto[];
}

const SECTIES: Array<{ key: string; titel: string; hint: string }> = [
  { key: "meterkast", titel: "Meterkast", hint: "Maak één overzichtsfoto en één detailfoto van de hoofdschakelaar / groepenkast." },
  { key: "omvormer_locatie", titel: "Beoogde plek omvormer/batterij", hint: "Foto van de muur of plek waar de omvormer of batterij geplaatst kan worden." },
  { key: "huidige_omvormer", titel: "Huidige omvormer (indien aanwezig)", hint: "Een foto van de huidige omvormer of het typeplaatje." },
  { key: "ac_traject", titel: "AC-traject (kabelroute)", hint: "Foto's van de route waar de kabel langs moet lopen, bijv. zolder of kruipruimte." },
];

async function callApi(token: string, init: RequestInit, action?: string) {
  const url = action ? `${FUNCTIONS_URL}?token=${encodeURIComponent(token)}&action=${action}` : `${FUNCTIONS_URL}?token=${encodeURIComponent(token)}`;
  const res = await fetch(url, {
    ...init,
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, ...(init.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.error ?? `Fout ${res.status}`);
  return data;
}

export default function ConsumerSchouw() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SchouwData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const laad = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const d = await callApi(token, { method: "GET" });
      setData(d as SchouwData);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void laad(); }, [laad]);

  const upload = async (sectie: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !token) return;
    if (file.size > 15 * 1024 * 1024) { toast.error("Bestand is groter dan 15MB"); return; }
    setUploading(sectie);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("categorie", sectie);
      const res = await callApi(token, { method: "POST", body: form }, "upload");
      setData((prev) => prev ? { ...prev, fotos: [...prev.fotos, (res as any).foto] } : prev);
      toast.success("Foto geüpload");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(null);
    }
  };

  const verwijder = async (path?: string) => {
    if (!path || !token) return;
    if (!confirm("Foto verwijderen?")) return;
    try {
      await callApi(token, { method: "POST", body: JSON.stringify({ path }), headers: { "Content-Type": "application/json" } }, "delete");
      setData((prev) => prev ? { ...prev, fotos: prev.fotos.filter((f) => f.path !== path) } : prev);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const versturen = async () => {
    if (!token) return;
    setCompleting(true);
    try {
      const res = await callApi(token, { method: "POST" }, "complete");
      setData((prev) => prev ? { ...prev, voltooidOp: (res as any).voltooidOp ?? new Date().toISOString() } : prev);
      toast.success("Bedankt! Je foto's zijn verzonden.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full rounded-2xl"><CardContent className="py-8 text-center space-y-2">
          <p className="text-base font-semibold">Link is niet (meer) geldig</p>
          <p className="text-sm text-muted-foreground">{error ?? "Controleer de link of vraag een nieuwe aan bij je adviseur."}</p>
        </CardContent></Card>
      </div>
    );
  }

  const partner = data.partner;
  const aantal = data.fotos.length;
  const voltooid = !!data.voltooidOp;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          {partner?.logo_url ? (
            <img src={partner.logo_url} alt={partner.naam ?? "Partner"} className="h-9 w-auto object-contain" />
          ) : (
            <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center text-primary font-semibold">
              {(partner?.naam ?? "M")[0]}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{partner?.naam ?? "Schouw voorbereiden"}</p>
            <p className="text-[11px] text-muted-foreground">Schouw {data.schouwNummer}</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {voltooid ? (
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardContent className="py-10 text-center space-y-3">
              <div className="mx-auto h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center">
                <Check className="h-7 w-7 text-primary" />
              </div>
              <p className="text-lg font-semibold">Bedankt!</p>
              <p className="text-sm text-muted-foreground">
                We hebben je foto's ontvangen. Je adviseur neemt contact met je op zodra de werkvoorbereiding klaar is.
              </p>
              <p className="text-[11px] text-muted-foreground">{aantal} foto{aantal === 1 ? "" : "'s"} aangeleverd</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardContent className="py-5 space-y-2">
                <p className="text-base font-semibold">Help ons je installatie voor te bereiden</p>
                <p className="text-sm text-muted-foreground">
                  Maak van onderstaande onderdelen één of meer foto's. Zo kunnen we de installatie sneller en beter inplannen.
                </p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><ShieldCheck className="h-3 w-3" /> Beveiligde upload via je persoonlijke link</p>
              </CardContent>
            </Card>

            {SECTIES.map((s) => {
              const fotos = data.fotos.filter((f) => f.label === `self:${s.key}`);
              const busy = uploading === s.key;
              return (
                <Card key={s.key} className="rounded-2xl border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-primary" /> {s.titel}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground">{s.hint}</p>
                    {fotos.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {fotos.map((f) => (
                          <div key={f.path ?? f.url} className="relative aspect-square rounded-xl overflow-hidden border bg-muted group">
                            <button type="button" onClick={() => setPreview(f.url)} className="block w-full h-full">
                              <img src={f.url} alt={s.titel} className="w-full h-full object-cover" loading="lazy" />
                            </button>
                            <button
                              type="button"
                              onClick={() => verwijder(f.path)}
                              className="absolute top-1 right-1 h-7 w-7 rounded-full bg-background/90 border flex items-center justify-center opacity-90 hover:opacity-100"
                              aria-label="Verwijder"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label className="block">
                      <input
                        type="file" accept="image/*" capture="environment" className="hidden"
                        onChange={(e) => upload(s.key, e)} disabled={busy}
                      />
                      <span className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-primary text-primary-foreground text-sm font-medium py-3 cursor-pointer hover:bg-primary/90 disabled:opacity-50">
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                        {busy ? "Bezig met uploaden…" : fotos.length > 0 ? "Nog een foto toevoegen" : "Foto maken / kiezen"}
                      </span>
                    </label>
                  </CardContent>
                </Card>
              );
            })}

            <Card className="rounded-2xl border-0 shadow-sm sticky bottom-3">
              <CardContent className="py-4 flex items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">{aantal} foto{aantal === 1 ? "" : "'s"} toegevoegd</div>
                <Button onClick={versturen} disabled={completing || aantal === 0} className="rounded-xl gap-1.5">
                  {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Versturen naar adviseur
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <img src={preview} alt="Voorbeeld" className="max-h-full max-w-full rounded-xl" />
        </div>
      )}
    </div>
  );
}