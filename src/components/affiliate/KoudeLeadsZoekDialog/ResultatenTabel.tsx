import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ExtractedLead } from "./types";

interface Props {
  leads: ExtractedLead[];
  selectie: Set<number>;
  setSelectie: (s: Set<number>) => void;
}

export function ResultatenTabel({ leads, selectie, setSelectie }: Props) {
  const [duplicaten, setDuplicaten] = useState<Set<number>>(new Set());

  const emails = useMemo(
    () => leads.map((l) => l.email?.toLowerCase()).filter(Boolean) as string[],
    [leads],
  );
  const telefoons = useMemo(
    () => leads.map((l) => l.telefoon?.replace(/\D/g, "")).filter(Boolean) as string[],
    [leads],
  );

  useEffect(() => {
    let active = true;
    if (emails.length === 0 && telefoons.length === 0) return;
    (async () => {
      const filters: string[] = [];
      if (emails.length) filters.push(`email.in.(${emails.map((e) => `"${e}"`).join(",")})`);
      if (telefoons.length) filters.push(`telefoon.in.(${telefoons.map((t) => `"${t}"`).join(",")})`);
      const { data } = await supabase
        .from("affiliate_leads")
        .select("email, telefoon")
        .or(filters.join(","));
      if (!active || !data) return;
      const dupEmails = new Set(data.map((d) => d.email?.toLowerCase()).filter(Boolean));
      const dupTel = new Set(data.map((d) => d.telefoon?.replace(/\D/g, "")).filter(Boolean));
      const dups = new Set<number>();
      leads.forEach((l, i) => {
        if ((l.email && dupEmails.has(l.email.toLowerCase())) ||
            (l.telefoon && dupTel.has(l.telefoon.replace(/\D/g, "")))) {
          dups.add(i);
        }
      });
      setDuplicaten(dups);
    })();
    return () => { active = false; };
  }, [leads, emails, telefoons]);

  const toggle = (i: number) => {
    const n = new Set(selectie);
    n.has(i) ? n.delete(i) : n.add(i);
    setSelectie(n);
  };

  const toggleAll = () => {
    const selectable = leads.map((_, i) => i).filter((i) => !duplicaten.has(i));
    if (selectable.every((i) => selectie.has(i))) {
      setSelectie(new Set());
    } else {
      setSelectie(new Set(selectable));
    }
  };

  if (leads.length === 0) {
    return (
      <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
        Geen bedrijven gevonden. Probeer een andere zoekopdracht of bron.
      </div>
    );
  }

  return (
    <div className="border rounded-xl overflow-x-auto max-h-[420px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={leads.length > 0 && selectie.size === leads.length - duplicaten.size && selectie.size > 0}
                onCheckedChange={toggleAll}
              />
            </TableHead>
            <TableHead>Bedrijf</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Plaats</TableHead>
            <TableHead>Branche</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((l, i) => {
            const isDup = duplicaten.has(i);
            return (
              <TableRow key={i} className={isDup ? "opacity-60" : ""}>
                <TableCell>
                  <Checkbox
                    checked={selectie.has(i)}
                    onCheckedChange={() => toggle(i)}
                    disabled={isDup}
                  />
                </TableCell>
                <TableCell>
                  <div className="font-medium">{l.bedrijfsnaam}</div>
                  {l.website && (
                    <a href={l.website} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                      {l.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                  {l.fragment && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{l.fragment}</div>}
                </TableCell>
                <TableCell className="text-sm">
                  {l.email && <div>{l.email}</div>}
                  {l.telefoon && <div className="text-muted-foreground">{l.telefoon}</div>}
                  {!l.email && !l.telefoon && <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-sm">{l.plaats ?? "—"}</TableCell>
                <TableCell>{l.branche ? <Badge variant="outline">{l.branche}</Badge> : "—"}</TableCell>
                <TableCell>
                  {isDup ? (
                    <Badge variant="outline" className="text-amber-800 border-amber-300">Bestaat al</Badge>
                  ) : (
                    <Badge variant="outline" className="text-emerald-700 border-emerald-300">Nieuw</Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}