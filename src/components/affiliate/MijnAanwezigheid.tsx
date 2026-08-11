import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarCheck, Trash2 } from "lucide-react";
import {
  useMijnAfwezigheid,
  useVoegMijnAfwezigheidToe,
  useVerwijderMijnAfwezigheid,
} from "@/hooks/affiliate/useMijnAfwezigheid";

/** Zelfservice: affiliate legt eigen afwezigheid vast voor de aanwezigheidsagenda. */
export function MijnAanwezigheid() {
  const { data: items = [], isLoading } = useMijnAfwezigheid();
  const voegToe = useVoegMijnAfwezigheidToe();
  const verwijder = useVerwijderMijnAfwezigheid();
  const [van, setVan] = useState("");
  const [tot, setTot] = useState("");
  const [reden, setReden] = useState("");

  const opslaan = () => {
    if (!van || !tot) return;
    voegToe.mutate({ van, tot, reden }, { onSuccess: () => { setVan(""); setTot(""); setReden(""); } });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarCheck className="h-4 w-4" /> Mijn aanwezigheid
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Geef door wanneer je niet beschikbaar bent. Sales ziet dit in de aanwezigheidsagenda.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
          <div>
            <Label className="text-xs" htmlFor="mijn-afw-van">Van</Label>
            <Input id="mijn-afw-van" type="date" value={van} onChange={(e) => setVan(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs" htmlFor="mijn-afw-tot">Tot</Label>
            <Input id="mijn-afw-tot" type="date" value={tot} onChange={(e) => setTot(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs" htmlFor="mijn-afw-reden">Reden</Label>
            <Input id="mijn-afw-reden" value={reden} onChange={(e) => setReden(e.target.value)} placeholder="Vakantie" />
          </div>
          <Button onClick={opslaan} disabled={!van || !tot || voegToe.isPending}>Toevoegen</Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Laden…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Geen afwezigheid gepland.</p>
        ) : (
          <div className="space-y-2">
            {items.map((i) => (
              <div key={i.id} className="flex items-center justify-between border rounded-md px-3 py-2 text-sm">
                <span>{i.van} t/m {i.tot}{i.reden ? ` · ${i.reden}` : ""}</span>
                <Button size="sm" variant="ghost" aria-label="Verwijderen" onClick={() => verwijder.mutate(i.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
