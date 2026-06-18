import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Copy, Check, ExternalLink, Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  schouwId: string;
  token: string;
  isSelfService: boolean;
  voltooidOp: string | null;
  aantalSelfServiceFotos: number;
  onChanged?: () => void;
}

export default function SelfServiceLinkCard({ schouwId, token, isSelfService, voltooidOp, aantalSelfServiceFotos, onChanged }: Props) {
  const url = `${window.location.origin}/public/schouw/${token}`;
  const [copied, setCopied] = useState(false);
  const [toggling, setToggling] = useState(false);

  const kopieer = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link gekopieerd");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Kopiëren mislukt");
    }
  };

  const wissel = async (next: boolean) => {
    setToggling(true);
    const { error } = await supabase.from("schouwen").update({ is_self_service: next }).eq("id", schouwId);
    setToggling(false);
    if (error) toast.error(error.message);
    else { toast.success(next ? "Self-service ingeschakeld" : "Self-service uitgeschakeld"); onChanged?.(); }
  };

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Camera className="h-4 w-4 text-primary" /> Consumentenschouw (self-service)
        </CardTitle>
        {voltooidOp ? (
          <Badge className="bg-success-light text-success border-0">Voltooid</Badge>
        ) : isSelfService ? (
          <Badge variant="secondary">Actief</Badge>
        ) : (
          <Badge variant="outline">Uit</Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Deel deze unieke link met de consument. Zij kunnen mobiel foto's maken van meterkast, omvormerlocatie en AC-traject.
        </p>

        <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
          <Label htmlFor="self-toggle" className="text-sm">Self-service inschakelen</Label>
          <Switch id="self-toggle" checked={isSelfService} disabled={toggling} onCheckedChange={wissel} />
        </div>

        <div className="flex gap-2">
          <Input value={url} readOnly className="rounded-xl font-mono text-xs" />
          <Button onClick={kopieer} variant="outline" className="rounded-xl gap-1.5 shrink-0">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Gekopieerd" : "Kopieer"}
          </Button>
          <Button asChild variant="ghost" size="icon" className="rounded-xl shrink-0">
            <a href={url} target="_blank" rel="noreferrer" aria-label="Open"><ExternalLink className="h-4 w-4" /></a>
          </Button>
        </div>

        {voltooidOp ? (
          <div className="rounded-xl bg-success-light/50 px-3 py-2 text-sm text-success">
            ✓ Consument leverde {aantalSelfServiceFotos} foto{aantalSelfServiceFotos === 1 ? "" : "'s"} aan op{" "}
            {new Date(voltooidOp).toLocaleString("nl-NL")}.
          </div>
        ) : aantalSelfServiceFotos > 0 ? (
          <div className="rounded-xl bg-primary/10 px-3 py-2 text-xs text-primary flex items-center gap-1.5">
            <Loader2 className="h-3 w-3" /> Consument heeft {aantalSelfServiceFotos} foto{aantalSelfServiceFotos === 1 ? "" : "'s"} geüpload (nog niet verstuurd).
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}