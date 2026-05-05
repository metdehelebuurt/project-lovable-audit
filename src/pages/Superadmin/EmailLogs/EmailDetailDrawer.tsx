import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import type { EmailRow } from "./useEmailLogs";

interface Props {
  row: EmailRow | null;
  onClose: () => void;
}

export function EmailDetailDrawer({ row, onClose }: Props) {
  return (
    <Sheet open={!!row} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        {row && (
          <>
            <SheetHeader>
              <SheetTitle className="text-base">{row.type}</SheetTitle>
            </SheetHeader>
            <dl className="grid grid-cols-3 gap-x-4 gap-y-2 mt-4 text-sm">
              <dt className="text-muted-foreground">Datum</dt>
              <dd className="col-span-2">{new Date(row.datum).toLocaleString("nl-NL")}</dd>
              <dt className="text-muted-foreground">Bron</dt>
              <dd className="col-span-2"><Badge variant="outline">{row.bron}</Badge></dd>
              <dt className="text-muted-foreground">Verzonden door</dt>
              <dd className="col-span-2 break-all">{row.van ?? "—"}</dd>
              <dt className="text-muted-foreground">Ontvanger</dt>
              <dd className="col-span-2 break-all">{row.naar}</dd>
              {row.partner_naam && (<><dt className="text-muted-foreground">Partner</dt><dd className="col-span-2">{row.partner_naam}</dd></>)}
              <dt className="text-muted-foreground">Status</dt>
              <dd className="col-span-2">{row.status}</dd>
              {row.message_id && (<><dt className="text-muted-foreground">Message id</dt><dd className="col-span-2 font-mono text-xs break-all">{row.message_id}</dd></>)}
              {row.error && (<><dt className="text-muted-foreground">Foutmelding</dt><dd className="col-span-2 text-destructive">{row.error}</dd></>)}
            </dl>
            {row.html_preview && (
              <div className="mt-4 border rounded-md overflow-hidden">
                <iframe
                  title="email-preview"
                  srcDoc={row.html_preview}
                  sandbox=""
                  className="w-full h-[500px] bg-white"
                />
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}