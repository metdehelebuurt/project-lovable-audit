import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, X, GripVertical, Megaphone } from "lucide-react";

const DEFAULT_BRONNEN = ["website", "telefoon", "referral", "advertentie", "beurs", "social media", "overig"];

export default function LeadBronnenConfig({ partnerId }: { partnerId: string }) {
  const [bronnen, setBronnen] = useState<string[]>(DEFAULT_BRONNEN);
  const [newBron, setNewBron] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("partners")
      .select("lead_bronnen")
      .eq("id", partnerId)
      .single()
      .then(({ data }) => {
        if (data?.lead_bronnen && Array.isArray(data.lead_bronnen)) {
          setBronnen(data.lead_bronnen as string[]);
        }
        setLoading(false);
      });
  }, [partnerId]);

  const handleAdd = () => {
    const trimmed = newBron.trim().toLowerCase();
    if (!trimmed) return;
    if (bronnen.includes(trimmed)) {
      toast.error("Deze bron bestaat al");
      return;
    }
    setBronnen(prev => [...prev, trimmed]);
    setNewBron("");
  };

  const handleRemove = (bron: string) => {
    setBronnen(prev => prev.filter(b => b !== bron));
  };

  const handleSave = async () => {
    if (bronnen.length === 0) {
      toast.error("Voeg minimaal één leadbron toe");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("partners")
      .update({ lead_bronnen: bronnen } as any)
      .eq("id", partnerId);
    setSaving(false);
    if (error) {
      toast.error("Fout bij opslaan: " + error.message);
      return;
    }
    toast.success("Leadbronnen opgeslagen");
  };

  const handleReset = () => {
    setBronnen(DEFAULT_BRONNEN);
  };

  if (loading) return <p className="text-sm text-muted-foreground">Laden...</p>;

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          Leadbronnen
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Beheer de kanalen waaruit uw leads binnenkomen. Deze bronnen verschijnen bij het aanmaken en bewerken van leads.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new */}
        <div className="flex gap-2">
          <Input
            placeholder="Nieuwe bron toevoegen..."
            value={newBron}
            onChange={e => setNewBron(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            className="rounded-xl"
          />
          <Button onClick={handleAdd} size="sm" className="rounded-pill gap-1.5 shrink-0">
            <Plus className="h-4 w-4" /> Toevoegen
          </Button>
        </div>

        {/* List */}
        <div className="space-y-1.5">
          {bronnen.map((bron) => (
            <div
              key={bron}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 border border-border/50 group"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              <span className="text-sm text-foreground capitalize flex-1">{bron}</span>
              <button
                onClick={() => handleRemove(bron)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {bronnen.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Geen bronnen geconfigureerd
          </p>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button onClick={handleSave} disabled={saving} className="rounded-pill">
            {saving ? "Opslaan..." : "Opslaan"}
          </Button>
          <Button onClick={handleReset} variant="outline" className="rounded-pill" size="sm">
            Standaardwaarden herstellen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
