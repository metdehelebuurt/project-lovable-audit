import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ArrowRight } from "lucide-react";
import { useDuplicaten } from "./useDuplicaten";
import { DuplicatenLijstDialog } from "./DuplicatenLijstDialog";

export function DuplicatenKaart() {
  const { data = [], isLoading } = useDuplicaten();
  const [open, setOpen] = useState(false);

  if (isLoading || data.length === 0) return null;

  return (
    <>
      <Card className="rounded-2xl border-0 shadow-sm bg-warning-light/40">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-warning/20 flex items-center justify-center shrink-0">
            <Copy className="h-5 w-5 text-warning-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Mogelijke dubbele leads ({data.length})</p>
            <p className="text-xs text-muted-foreground">
              Controleer of deze leads samengevoegd moeten worden.
            </p>
          </div>
          <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => setOpen(true)}>
            Bekijken <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
      <DuplicatenLijstDialog open={open} onOpenChange={setOpen} />
    </>
  );
}