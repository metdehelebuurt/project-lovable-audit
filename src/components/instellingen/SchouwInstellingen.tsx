import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ClipboardList } from "lucide-react";

interface SchouwInstellingenProps {
  partnerId: string;
}

const SchouwInstellingen = ({ partnerId }: SchouwInstellingenProps) => {
  const [delenSchouwen, setDelenSchouwen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("partners")
      .select("adviseurs_delen_schouwen")
      .eq("id", partnerId)
      .single()
      .then(({ data }) => {
        if (data) setDelenSchouwen(data.adviseurs_delen_schouwen ?? false);
        setLoading(false);
      });
  }, [partnerId]);

  const handleToggle = async (checked: boolean) => {
    setSaving(true);
    const { error } = await supabase
      .from("partners")
      .update({ adviseurs_delen_schouwen: checked })
      .eq("id", partnerId);
    setSaving(false);
    if (error) {
      toast.error("Fout bij opslaan: " + error.message);
      return;
    }
    setDelenSchouwen(checked);
    toast.success(checked ? "Adviseurs kunnen nu elkaars schouwen inzien" : "Adviseurs zien alleen hun eigen schouwen");
  };

  if (loading) return null;

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <ClipboardList className="h-5 w-5 text-primary" />
        </div>
        <CardTitle className="text-lg">Schouw instellingen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="delen-schouwen" className="font-medium">
              Adviseurs mogen elkaars schouwen inzien
            </Label>
            <p className="text-sm text-muted-foreground">
              Standaard kunnen adviseurs alleen hun eigen schouwen bekijken. Schakel dit in zodat alle adviseurs binnen uw organisatie elkaars schouwen kunnen inzien.
            </p>
          </div>
          <Switch
            id="delen-schouwen"
            checked={delenSchouwen}
            onCheckedChange={handleToggle}
            disabled={saving}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default SchouwInstellingen;
