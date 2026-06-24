import { useState } from "react";
import { AlertTriangle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAffiliateDuplicaten } from "./useAffiliateDuplicaten";
import { AffiliateDuplicatenLijstDialog } from "./AffiliateDuplicatenLijstDialog";

export function AffiliateDuplicatenBanner() {
  const { data = [], isLoading } = useAffiliateDuplicaten();
  const [open, setOpen] = useState(false);

  if (isLoading || data.length === 0) return null;

  return (
    <>
      <div className="rounded-xl border border-warning/40 bg-warning-light/60 p-4 flex items-center gap-3 flex-wrap">
        <div className="h-9 w-9 rounded-lg bg-warning/20 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-5 w-5 text-warning-foreground" />
        </div>
        <div className="flex-1 min-w-[220px]">
          <p className="text-sm font-medium text-foreground">
            {data.length} mogelijke {data.length === 1 ? "dubbele lead" : "dubbele leads"} gevonden
          </p>
          <p className="text-xs text-muted-foreground">
            Bekijk en kies per paar of je samenvoegt of als aparte leads behoudt.
          </p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)} className="gap-2 rounded-pill">
          <Copy className="h-4 w-4" /> Bekijken
        </Button>
      </div>
      <AffiliateDuplicatenLijstDialog open={open} onOpenChange={setOpen} />
    </>
  );
}