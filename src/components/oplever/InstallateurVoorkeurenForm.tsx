import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MeetapparatuurForm {
  merk: string;
  type: string;
  serienummer: string;
  laatste_kalibratie: string;
}

const LEEG: MeetapparatuurForm = { merk: "", type: "", serienummer: "", laatste_kalibratie: "" };

export default function InstallateurVoorkeurenForm() {
  const { user } = useAuth();
  const [meting, setMeting] = useState<MeetapparatuurForm>(LEEG);
  const [kvk, setKvk] = useState("");
  const [erkenning, setErkenning] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    void (async () => {
      const { data } = await supabase
        .from("installateur_voorkeuren")
        .select("meetapparatuur, kvk_nummer, erkenningsnummer")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        const m = (data.meetapparatuur ?? {}) as Partial<MeetapparatuurForm>;
        setMeting({
          merk: m.merk ?? "",
          type: m.type ?? "",
          serienummer: m.serienummer ?? "",
          laatste_kalibratie: m.laatste_kalibratie ?? "",
        });
        setKvk(data.kvk_nummer ?? "");
        setErkenning(data.erkenningsnummer ?? "");
      }
    })();
  }, [user?.id]);

  const opslaan = async () => {
    if (!user?.id) return;
    setBusy(true);
    const { error } = await supabase.from("installateur_voorkeuren").upsert([{
      user_id: user.id,
      meetapparatuur: meting as unknown as Record<string, string>,
      kvk_nummer: kvk || null,
      erkenningsnummer: erkenning || null,
    }]);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Voorkeuren opgeslagen");
  };

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Opleverrapport-voorkeuren</CardTitle>
        <p className="text-sm text-muted-foreground">
          Deze gegevens worden automatisch ingevuld bij het maken van een nieuw NEN 1010 opleverrapport.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Erkenning</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>KvK-nummer</Label>
              <Input value={kvk} onChange={(e) => setKvk(e.target.value)} placeholder="12345678" />
            </div>
            <div>
              <Label>Erkenningsnummer</Label>
              <Input value={erkenning} onChange={(e) => setErkenning(e.target.value)} placeholder="bv. KIWA EI-NL" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium">Meetapparatuur</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Merk</Label>
              <Input value={meting.merk} onChange={(e) => setMeting({ ...meting, merk: e.target.value })} placeholder="Fluke" />
            </div>
            <div>
              <Label>Type</Label>
              <Input value={meting.type} onChange={(e) => setMeting({ ...meting, type: e.target.value })} placeholder="1664 FC" />
            </div>
            <div>
              <Label>Serienummer</Label>
              <Input value={meting.serienummer} onChange={(e) => setMeting({ ...meting, serienummer: e.target.value })} />
            </div>
            <div>
              <Label>Laatste kalibratiedatum</Label>
              <Input type="date" value={meting.laatste_kalibratie} onChange={(e) => setMeting({ ...meting, laatste_kalibratie: e.target.value })} />
            </div>
          </div>
        </div>

        <Button onClick={opslaan} disabled={busy}>
          {busy ? "Opslaan…" : "Voorkeuren opslaan"}
        </Button>
      </CardContent>
    </Card>
  );
}