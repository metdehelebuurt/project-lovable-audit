import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ClipboardCheck, ExternalLink, Link2, Loader2, Sparkles } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useInstallatieSchouw } from "@/hooks/installaties/useInstallatieSchouw";
import SchouwSamenvatting from "./SchouwSamenvatting";
import SchouwKoppelDialog from "./SchouwKoppelDialog";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Installatie } from "./api/installatieApi";

interface Props {
  installatie: Installatie;
}

function getString(o: unknown, key: string): string | null {
  if (o && typeof o === "object" && key in o) {
    const v = (o as Record<string, unknown>)[key];
    if (typeof v === "string") return v;
  }
  return null;
}

const InstallatieSchouwCard = ({ installatie }: Props) => {
  const { data, isLoading } = useInstallatieSchouw(installatie);
  const qc = useQueryClient();
  const [koppelOpen, setKoppelOpen] = useState(false);
  const [fotoIdx, setFotoIdx] = useState<number | null>(null);
  const [bezig, setBezig] = useState(false);

  const schouw = data?.schouw ?? null;
  const bron = data?.bron ?? "geen";
  const schouwId = schouw ? getString(schouw, "id") : null;
  const schouwNummer = schouw ? getString(schouw, "schouw_nummer") : null;
  const status = schouw ? getString(schouw, "status") : null;
  const datum = schouw ? getString(schouw, "geplande_datum") : null;
  const fotos = schouw && Array.isArray((schouw as { fotos?: unknown }).fotos)
    ? (schouw as { fotos: Array<{ url?: string; type?: string; notitie?: string }> }).fotos
    : [];

  const koppelVoorstel = async () => {
    if (!schouwId) return;
    setBezig(true);
    const { error } = await supabase.from("installaties").update({ schouw_id: schouwId }).eq("id", installatie.id);
    setBezig(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Schouw definitief gekoppeld");
    await qc.invalidateQueries({ queryKey: ["installatie"] });
    await qc.invalidateQueries({ queryKey: ["installatie-schouw"] });
    await qc.invalidateQueries({ queryKey: ["installatie-gereedheid"] });
  };

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-primary" /> Schouw
        </CardTitle>
        {schouw && (
          <Button variant="ghost" size="sm" onClick={() => setKoppelOpen(true)} className="gap-1.5 text-xs">
            <Link2 className="h-3.5 w-3.5" /> Wijzigen
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Schouw zoeken…
          </div>
        )}

        {!isLoading && !schouw && (
          <div className="space-y-3">
            <p className="text-muted-foreground">Er is nog geen schouw gekoppeld. Koppel een schouw zodat de monteur en de AI-werkomschrijving alle daksamenstelling, meterkast-info en aandachtspunten kunnen gebruiken.</p>
            <Button onClick={() => setKoppelOpen(true)} className="gap-1.5">
              <Link2 className="h-4 w-4" /> Schouw koppelen
            </Button>
          </div>
        )}

        {!isLoading && schouw && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{schouwNummer ?? "Geen nummer"}</span>
              {status && <Badge variant="outline" className="capitalize">{status}</Badge>}
              {datum && <span className="text-xs text-muted-foreground">{datum}</span>}
              {bron === "voorstel" && (
                <Badge variant="secondary" className="gap-1"><Sparkles className="h-3 w-3" /> Voorgesteld op basis van lead</Badge>
              )}
              {bron === "opdracht" && <Badge variant="secondary">Via opdracht</Badge>}
            </div>

            <SchouwSamenvatting schouw={schouw} onFotoClick={(idx) => setFotoIdx(idx)} />

            <div className="flex flex-wrap gap-2 pt-1">
              {schouwId && (
                <Button variant="outline" size="sm" asChild className="gap-1.5">
                  <Link to={`/schouwen/${schouwId}`}>
                    <ExternalLink className="h-3.5 w-3.5" /> Schouw openen
                  </Link>
                </Button>
              )}
              {bron === "voorstel" && (
                <Button size="sm" onClick={koppelVoorstel} disabled={bezig} className="gap-1.5">
                  <Link2 className="h-3.5 w-3.5" /> Koppelen aan deze installatie
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>

      <SchouwKoppelDialog
        open={koppelOpen}
        onOpenChange={setKoppelOpen}
        installatieId={installatie.id}
        partnerId={installatie.partner_id}
        leadId={installatie.lead_id ?? null}
        klantId={installatie.klant_id ?? null}
        huidigeSchouwId={(installatie as unknown as { schouw_id?: string | null }).schouw_id ?? null}
      />

      <Dialog open={fotoIdx !== null} onOpenChange={(o) => !o && setFotoIdx(null)}>
        <DialogContent className="max-w-3xl p-2">
          {fotoIdx !== null && fotos[fotoIdx]?.url && (
            <img src={fotos[fotoIdx]!.url} alt={fotos[fotoIdx]!.notitie ?? "Schouwfoto"} className="w-full h-auto rounded" />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default InstallatieSchouwCard;