import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { StickyNote, Trash2, Lock, Globe } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchInstallatieNotities, addInstallatieNotitie, deleteInstallatieNotitie,
} from "./api/installatieApi";

interface Props {
  installatieId: string;
  partnerId: string;
}

interface Notitie {
  id: string;
  inhoud: string;
  intern: boolean;
  auteur_id: string | null;
  created_at: string;
}

export default function InstallatieNotitiesTab({ installatieId, partnerId }: Props) {
  const { user } = useAuth();
  const [notities, setNotities] = useState<Notitie[]>([]);
  const [nieuweInhoud, setNieuweInhoud] = useState("");
  const [intern, setIntern] = useState(true);
  const [busy, setBusy] = useState(false);

  const laden = async () => {
    const data = await fetchInstallatieNotities(installatieId);
    setNotities(data as Notitie[]);
  };

  useEffect(() => { void laden(); }, [installatieId]);

  const toevoegen = async () => {
    if (!nieuweInhoud.trim() || !user?.id) return;
    setBusy(true);
    try {
      await addInstallatieNotitie({
        installatie_id: installatieId,
        partner_id: partnerId,
        auteur_id: user.id,
        inhoud: nieuweInhoud.trim(),
        intern,
      });
      setNieuweInhoud("");
      await laden();
      toast.success("Notitie toegevoegd");
    } catch (e: any) {
      toast.error(e.message);
    }
    setBusy(false);
  };

  const verwijderen = async (id: string) => {
    if (!confirm("Notitie verwijderen?")) return;
    try {
      await deleteInstallatieNotitie(id);
      await laden();
      toast.success("Verwijderd");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><StickyNote className="h-4 w-4 text-primary" /> Nieuwe notitie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea value={nieuweInhoud} onChange={(e) => setNieuweInhoud(e.target.value)} rows={3} placeholder="Schrijf een notitie..." />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch id="intern" checked={intern} onCheckedChange={setIntern} />
              <Label htmlFor="intern" className="cursor-pointer flex items-center gap-1.5 text-sm">
                {intern ? <><Lock className="h-3.5 w-3.5" /> Intern</> : <><Globe className="h-3.5 w-3.5" /> Zichtbaar voor klant</>}
              </Label>
            </div>
            <Button onClick={toevoegen} disabled={busy || !nieuweInhoud.trim()}>
              {busy ? "Opslaan…" : "Toevoegen"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {notities.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Nog geen notities</p>
      ) : notities.map((n) => (
        <Card key={n.id} className="rounded-2xl border-0 shadow-sm">
          <CardContent className="py-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {n.intern ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                <span>{n.intern ? "Intern" : "Klant zichtbaar"}</span>
                <span>•</span>
                <span>{new Date(n.created_at).toLocaleString("nl-NL")}</span>
              </div>
              {n.auteur_id === user?.id && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => verwijderen(n.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              )}
            </div>
            <p className="text-sm whitespace-pre-wrap">{n.inhoud}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}