import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Bericht {
  id: string;
  onderwerp: string;
  van: string;
  datum: string;
  klant_id: string | null;
  lead_id: string | null;
}

export default function BerichtenKaart({ items }: { items: Bericht[] }) {
  const navigate = useNavigate();
  return (
    <Card className="rounded-2xl border-0 shadow-sm h-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Berichten ({items.length})</CardTitle>
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/berichten")}>Alles</Button>
      </CardHeader>
      <CardContent className="pt-2 space-y-2 max-h-[60vh] overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">Geen ongelezen berichten</p>
        ) : items.map((m) => (
          <button key={m.id} onClick={() => navigate(m.lead_id ? `/leads/${m.lead_id}` : m.klant_id ? `/klanten/${m.klant_id}` : "/berichten")} className="w-full text-left p-2 rounded-lg hover:bg-muted/40">
            <p className="text-sm font-medium line-clamp-1">{m.onderwerp || "(geen onderwerp)"}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">{m.van}</p>
            <p className="text-[10px] text-muted-foreground">{new Date(m.datum).toLocaleString("nl-NL")}</p>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}