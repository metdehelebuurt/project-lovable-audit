import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Download, History } from "lucide-react";
import { fetchOpleverPdfVersies, getSignedUrlForVersie, type OpleverPdfVersie, type VersieReden } from "./api/opleverPdfVersies";
import { toast } from "@/hooks/use-toast";

const REDEN_LABEL: Record<string, string> = {
  handmatige_download: "Handmatige download",
  klant_ondertekening: "Klant-ondertekening",
  verzonden_naar_klant: "Verzonden naar klant",
};

const REDEN_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  klant_ondertekening: "default",
  verzonden_naar_klant: "secondary",
  handmatige_download: "outline",
};

interface Props {
  rapportId: string;
  defaultOpen?: boolean;
}

export default function OpleverPdfVersies({ rapportId, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  const { data: versies = [], isLoading } = useQuery({
    queryKey: ["oplever-pdf-versies", rapportId],
    queryFn: () => fetchOpleverPdfVersies(rapportId),
    enabled: !!rapportId,
  });

  const handleDownload = async (versie: OpleverPdfVersie) => {
    const url = await getSignedUrlForVersie(versie.pdf_path);
    if (!url) {
      toast({ title: "Download mislukt", description: "Kon geen download-link genereren.", variant: "destructive" });
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4 text-primary" /> PDF-versiehistorie
            {versies.length > 0 ? (
              <Badge variant="secondary" className="ml-1">{versies.length}</Badge>
            ) : null}
          </CardTitle>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
      </CardHeader>
      {open ? (
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Laden…</p>
          ) : versies.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nog geen versies opgeslagen. Een versie wordt aangemaakt bij downloaden, verzenden of ondertekening.</p>
          ) : (
            <ul className="space-y-2">
              {versies.map((v) => (
                <li
                  key={v.id}
                  className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">v{v.versie}</Badge>
                      {v.reden ? (
                        <Badge variant={REDEN_VARIANT[v.reden] ?? "outline"}>
                          {REDEN_LABEL[v.reden] ?? v.reden}
                        </Badge>
                      ) : null}
                      {v.status_op_moment ? (
                        <span className="text-xs text-muted-foreground">status: {v.status_op_moment}</span>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(v.created_at).toLocaleString("nl-NL")} • {formatSize(v.bestandsgrootte)}
                    </p>
                    <p className="text-[10px] font-mono text-muted-foreground truncate">
                      sha256:{v.pdf_hash.slice(0, 16)}…
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleDownload(v)} className="shrink-0">
                    <Download className="h-3.5 w-3.5 mr-1" /> Download
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      ) : null}
    </Card>
  );
}
