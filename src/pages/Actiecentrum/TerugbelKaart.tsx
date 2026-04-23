import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Lead {
  id: string;
  voornaam: string | null;
  achternaam: string | null;
  telefoon: string | null;
  lead_status: string;
  updated_at: string;
}

const labels: Record<string, string> = {
  terugbellen: "Terugbellen",
  geen_gehoor: "Geen gehoor",
  voicemail: "Voicemail",
};

export default function TerugbelKaart({ items, onChanged }: { items: Lead[]; onChanged: () => void }) {
  const navigate = useNavigate();

  const markeerGesproken = async (id: string) => {
    const { error } = await supabase.from("leads").update({ lead_status: "gesproken" }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Lead bijgewerkt");
    onChanged();
  };

  return (
    <Card className="rounded-2xl border-0 shadow-sm h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> Terugbellen ({items.length})</CardTitle>
      </CardHeader>
      <CardContent className="pt-2 space-y-2 max-h-[60vh] overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">Geen openstaande terugbellers</p>
        ) : items.map((l) => (
          <div key={l.id} className="p-2 rounded-lg border space-y-1">
            <p className="text-sm font-medium">{l.voornaam} {l.achternaam}</p>
            <p className="text-xs text-muted-foreground">{labels[l.lead_status] ?? l.lead_status} {l.telefoon && `· ${l.telefoon}`}</p>
            <div className="flex gap-1 pt-1">
              {l.telefoon && (
                <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                  <a href={`tel:${l.telefoon}`}><Phone className="h-3 w-3 mr-1" /> Bel</a>
                </Button>
              )}
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => markeerGesproken(l.id)}>
                ✓ Gesproken
              </Button>
              <Button size="sm" variant="ghost" className="h-7" onClick={() => navigate(`/leads/${l.id}`)}>
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}