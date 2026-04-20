import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import SignaturePad from "@/components/schouwen/SignaturePad";
import { useUpdateServiceBezoek, type ServiceBezoek } from "@/hooks/helpdesk/useServiceBezoeken";
import { toast } from "sonner";

function nuISO() { return new Date().toISOString(); }

export function UrenVerantwoording({ bezoek }: { bezoek: ServiceBezoek }) {
  const [aankomst, setAankomst] = useState(bezoek.aankomst_tijd ?? "");
  const [vertrek, setVertrek] = useState(bezoek.vertrek_tijd ?? "");
  const [werkzaamheden, setWerkzaamheden] = useState(bezoek.werkzaamheden ?? "");
  const [oplossing, setOplossing] = useState(bezoek.oplossing ?? "");
  const [klantNaam, setKlantNaam] = useState(bezoek.klant_naam_handtekening ?? "");
  const [handtekening, setHandtekening] = useState<string | null>(bezoek.handtekening_url);
  const update = useUpdateServiceBezoek();

  const tussenOpslaan = async () => {
    await update.mutateAsync({
      id: bezoek.id,
      aankomst_tijd: aankomst || null,
      vertrek_tijd: vertrek || null,
      werkzaamheden: werkzaamheden || null,
      oplossing: oplossing || null,
    });
  };

  const afronden = async () => {
    if (!oplossing.trim()) { toast.error("Oplossing is verplicht voor afronding"); return; }
    if (!handtekening) { toast.error("Klant moet aftekenen"); return; }
    if (!klantNaam.trim()) { toast.error("Naam klant is verplicht"); return; }
    await update.mutateAsync({
      id: bezoek.id,
      status: "afgerond",
      aankomst_tijd: aankomst || null,
      vertrek_tijd: vertrek || nuISO(),
      werkzaamheden,
      oplossing,
      klant_naam_handtekening: klantNaam,
      handtekening_url: handtekening,
    });
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label>Aankomst</Label>
          <div className="flex gap-2">
            <Input type="datetime-local" value={aankomst ? aankomst.slice(0, 16) : ""} onChange={(e) => setAankomst(e.target.value ? new Date(e.target.value).toISOString() : "")} />
            <Button variant="outline" size="sm" onClick={() => setAankomst(nuISO())}>Nu</Button>
          </div>
        </div>
        <div>
          <Label>Vertrek</Label>
          <div className="flex gap-2">
            <Input type="datetime-local" value={vertrek ? vertrek.slice(0, 16) : ""} onChange={(e) => setVertrek(e.target.value ? new Date(e.target.value).toISOString() : "")} />
            <Button variant="outline" size="sm" onClick={() => setVertrek(nuISO())}>Nu</Button>
          </div>
        </div>
      </div>
      <div>
        <Label>Werkzaamheden</Label>
        <Textarea rows={3} value={werkzaamheden} onChange={(e) => setWerkzaamheden(e.target.value)} placeholder="Wat is er uitgevoerd" />
      </div>
      <div>
        <Label>Oplossing (verplicht)</Label>
        <Textarea rows={3} value={oplossing} onChange={(e) => setOplossing(e.target.value)} placeholder="Wat was de technische oplossing" />
      </div>
      <div>
        <Label>Naam klant</Label>
        <Input value={klantNaam} onChange={(e) => setKlantNaam(e.target.value)} placeholder="Voor- en achternaam" />
      </div>
      <div>
        <Label>Handtekening klant</Label>
        <div className="border rounded-md p-2 bg-card">
          <div className="h-32">
            <SignaturePad value={handtekening} onChange={setHandtekening} />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={tussenOpslaan} disabled={update.isPending}>Tussentijds opslaan</Button>
        <Button onClick={afronden} disabled={update.isPending}>Afronden &amp; aftekenen</Button>
      </div>
    </Card>
  );
}