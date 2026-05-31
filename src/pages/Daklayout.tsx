import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun } from "lucide-react";
import DaklayoutEditor from "@/components/daklayout/DaklayoutEditor";

const Daklayout = () => {
  const [params] = useSearchParams();
  const adres = params.get("adres") || "";
  const postcode = params.get("postcode") || "";
  const plaats = params.get("plaats") || "";
  const schouwId = params.get("schouw_id");
  const leadId = params.get("lead_id");

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-4">
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-amber-500" />
            Daklayout — Zonnepanelen intekenen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Voer een adres in, teken één of meerdere dakvlakken op de satellietfoto en plaats zonnepanelen automatisch of handmatig. Sla het resultaat op en exporteer naar PDF.
          </p>
        </CardContent>
      </Card>

      <DaklayoutEditor
        initialAdres={adres}
        initialPostcode={postcode}
        initialPlaats={plaats}
        schouwId={schouwId}
        leadId={leadId}
      />
    </div>
  );
};

export default Daklayout;