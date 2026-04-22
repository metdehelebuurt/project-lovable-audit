import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Send, CheckCircle2 } from "lucide-react";
import KlantBevestigingDialog from "./KlantBevestigingDialog";
import type { Installatie } from "./api/installatieApi";

interface Props {
  installatie: Installatie;
  onChanged: () => void;
}

export default function InstallatieCommunicatieTab({ installatie, onChanged }: Props) {
  const [bevestigingOpen, setBevestigingOpen] = useState(false);
  const verzonden = installatie.bevestiging_verzonden_op;

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> Klantcommunicatie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl border">
            <div>
              <p className="text-sm font-medium">Datumbevestiging naar klant</p>
              <p className="text-xs text-muted-foreground">
                {verzonden
                  ? `Verstuurd op ${new Date(verzonden).toLocaleString("nl-NL")}`
                  : "Nog niet verstuurd"}
              </p>
            </div>
            <Button onClick={() => setBevestigingOpen(true)} className="gap-2" disabled={!installatie.klant_email}>
              {verzonden ? <CheckCircle2 className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              {verzonden ? "Opnieuw verzenden" : "Bevestiging sturen"}
            </Button>
          </div>
          {!installatie.klant_email && (
            <p className="text-xs text-warning-foreground">Geen klant-e-mailadres ingevuld.</p>
          )}
        </CardContent>
      </Card>

      <KlantBevestigingDialog
        open={bevestigingOpen}
        onOpenChange={setBevestigingOpen}
        installatie={installatie}
        onSent={onChanged}
      />
    </div>
  );
}