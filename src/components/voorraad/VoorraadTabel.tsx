import { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ChevronDown, ChevronRight, Layers } from "lucide-react";
import type { VoorraadProductRow } from "@/hooks/voorraad/useVoorraad";

interface Props {
  rows: VoorraadProductRow[];
}

const VoorraadTabel = ({ rows }: Props) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  if (!rows.length) {
    return <p className="text-sm text-muted-foreground p-4">Geen producten gevonden.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Categorie</TableHead>
          <TableHead className="text-right">Vrij</TableHead>
          <TableHead className="text-right">Gereserveerd</TableHead>
          <TableHead className="text-right">Totaal</TableHead>
          <TableHead className="text-right">Min.</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => {
          const laag = r.min_voorraad > 0 && r.vrij <= r.min_voorraad;
          const isBundel = r.is_assemblage && (r.componenten?.length ?? 0) > 0;
          const isOpen = !!expanded[r.id];
          return (
            <Fragment key={r.id}>
            <TableRow>
              <TableCell>
                <div className="flex items-start gap-1">
                  {isBundel && (
                    <button
                      type="button"
                      onClick={() => setExpanded((p) => ({ ...p, [r.id]: !p[r.id] }))}
                      className="mt-0.5 text-muted-foreground hover:text-foreground"
                      aria-label={isOpen ? "Componenten verbergen" : "Componenten tonen"}
                    >
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  )}
                  <div className="min-w-0">
                    <Link to={`/producten/${r.id}`} className="font-medium hover:underline">
                      {r.naam}
                    </Link>
                    {isBundel && (
                      <Badge variant="outline" className="ml-2 gap-1 text-[10px]">
                        <Layers className="h-3 w-3" /> Bundel
                      </Badge>
                    )}
                {(r.merk || r.model) && (
                  <div className="text-xs text-muted-foreground">
                    {[r.merk, r.model].filter(Boolean).join(" • ")}
                  </div>
                )}
                    {isBundel && r.bottleneck && r.vrij === 0 && (
                      <div className="text-[11px] text-error mt-0.5">
                        Knelpunt: {r.bottleneck.naam} ({r.bottleneck.beschikbaar} vrij, {r.bottleneck.nodig_per_bundel}/bundel nodig)
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-xs capitalize">{r.categorie}</TableCell>
              <TableCell className={`text-right font-medium ${laag ? "text-error" : ""}`}>
                {r.vrij}
                {isBundel && <span className="text-[10px] text-muted-foreground ml-1">bundels</span>}
              </TableCell>
              <TableCell className="text-right text-warning-foreground">{r.gereserveerd}</TableCell>
              <TableCell className="text-right">{r.voorraad}</TableCell>
              <TableCell className="text-right text-xs text-muted-foreground">{r.min_voorraad}</TableCell>
              <TableCell>
                {laag ? (
                  <Badge className="bg-error-light text-error gap-1"><AlertTriangle className="h-3 w-3" /> Lage voorraad</Badge>
                ) : (
                  <Badge variant="outline">OK</Badge>
                )}
              </TableCell>
            </TableRow>
            {isBundel && isOpen && r.componenten && (
              <TableRow className="bg-muted/30">
                <TableCell colSpan={7} className="py-2">
                  <div className="pl-6 text-xs">
                    <div className="font-medium text-muted-foreground mb-1">Componenten en dekking:</div>
                    <ul className="space-y-0.5">
                      {r.componenten.map((c) => {
                        const isBottle = r.bottleneck?.component_id === c.component_id;
                        return (
                          <li key={c.component_id} className="flex items-center gap-2">
                            <span className={isBottle ? "text-error font-medium" : ""}>
                              {c.aantal_per_bundel}× {c.naam}
                            </span>
                            <span className="text-muted-foreground">
                              — {c.vrij} vrij · {c.bundels_dekking} bundels dekking
                            </span>
                            {isBottle && <Badge className="bg-error-light text-error text-[10px]">knelpunt</Badge>}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </TableCell>
              </TableRow>
            )}
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default VoorraadTabel;
