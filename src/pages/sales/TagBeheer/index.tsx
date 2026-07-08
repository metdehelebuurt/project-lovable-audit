import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Search, ExternalLink } from "lucide-react";
import {
  useSalesTags,
  useCreateSalesTag,
  useRenameSalesTag,
  useDeleteSalesTag,
  type SalesTag,
} from "@/hooks/sales/useSalesTags";
import { normaliseerTag } from "@/components/sales/TagsInput";

export default function TagBeheer() {
  const navigate = useNavigate();
  const { data: tags, isLoading } = useSalesTags();
  const create = useCreateSalesTag();
  const rename = useRenameSalesTag();
  const del = useDeleteSalesTag();

  const [zoek, setZoek] = useState("");
  const [nieuw, setNieuw] = useState("");
  const [hernoem, setHernoem] = useState<SalesTag | null>(null);
  const [hernoemNaam, setHernoemNaam] = useState("");
  const [verwijder, setVerwijder] = useState<SalesTag | null>(null);
  const [ookVanLeads, setOokVanLeads] = useState(true);

  const gefilterd = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    if (!q) return tags ?? [];
    return (tags ?? []).filter((t) => t.label.toLowerCase().includes(q));
  }, [tags, zoek]);

  const maakAan = () => {
    const n = normaliseerTag(nieuw);
    if (!n) return;
    create.mutate({ label: n }, { onSuccess: () => setNieuw("") });
  };

  const bevestigHernoem = () => {
    if (!hernoem) return;
    const n = normaliseerTag(hernoemNaam);
    if (!n) return;
    rename.mutate(
      { oud: hernoem.slug, nieuw: n },
      { onSuccess: () => setHernoem(null) },
    );
  };

  const bevestigVerwijder = () => {
    if (!verwijder) return;
    del.mutate(
      { slug: verwijder.slug, ookVanLeads },
      {
        onSuccess: () => {
          setVerwijder(null);
          setOokVanLeads(true);
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tags aanmaken</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Input
            value={nieuw}
            onChange={(e) => setNieuw(e.target.value)}
            placeholder="Nieuwe tag (bijv. beurs2026)"
            className="max-w-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") maakAan();
            }}
          />
          <Button onClick={maakAan} disabled={!nieuw.trim() || create.isPending} className="gap-1">
            <Plus className="h-4 w-4" /> Toevoegen
          </Button>
          <p className="text-xs text-muted-foreground w-full">
            Tags worden opgeslagen in kleine letters. Ze verschijnen als snelkeuze bij imports, in bulkacties en op leaddetails.
          </p>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            placeholder="Zoek tag…"
            className="pl-8"
          />
        </div>
        <span className="text-sm text-muted-foreground">{gefilterd.length} tags</span>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tag</TableHead>
              <TableHead className="w-28 text-right">Leads</TableHead>
              <TableHead className="w-72 text-right">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  Laden…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && gefilterd.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  Nog geen tags gevonden.
                </TableCell>
              </TableRow>
            )}
            {gefilterd.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="cursor-pointer border-purple-300 text-purple-800 bg-purple-50 hover:bg-purple-100"
                    onClick={() => navigate(`/sales?tab=leads&tag=${encodeURIComponent(t.slug)}`)}
                    title={`Toon ${t.aantal_leads} leads met tag`}
                  >
                    #{t.label}
                  </Badge>
                  {t.omschrijving && (
                    <div className="mt-1 text-xs text-muted-foreground">{t.omschrijving}</div>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">{t.aantal_leads}</TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => navigate(`/sales?tab=leads&tag=${encodeURIComponent(t.slug)}`)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Bekijk leads
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => {
                        setHernoem(t);
                        setHernoemNaam(t.label);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" /> Hernoem
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive gap-1"
                      onClick={() => setVerwijder(t)}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Verwijder
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!hernoem} onOpenChange={(o) => !o && setHernoem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tag hernoemen</DialogTitle>
            <DialogDescription>
              De nieuwe naam wordt bij alle leads met de oude tag automatisch bijgewerkt.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nieuwe naam</Label>
            <Input
              value={hernoemNaam}
              onChange={(e) => setHernoemNaam(e.target.value)}
              placeholder="Nieuwe tagnaam"
            />
            {hernoem && (
              <p className="text-xs text-muted-foreground">
                Wordt toegepast op {hernoem.aantal_leads} lead{hernoem.aantal_leads === 1 ? "" : "s"}.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setHernoem(null)}>
              Annuleren
            </Button>
            <Button
              onClick={bevestigHernoem}
              disabled={
                rename.isPending ||
                !hernoemNaam.trim() ||
                normaliseerTag(hernoemNaam) === hernoem?.slug
              }
            >
              {rename.isPending ? "Bezig…" : "Hernoem"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!verwijder} onOpenChange={(o) => !o && setVerwijder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tag verwijderen</DialogTitle>
            <DialogDescription>
              Verwijdert de tag uit de catalogus. Kies of hij ook bij bestaande leads moet worden verwijderd.
            </DialogDescription>
          </DialogHeader>
          {verwijder && (
            <div className="space-y-3">
              <div className="rounded-md border p-3 bg-muted/40 text-sm">
                Tag: <span className="font-medium">#{verwijder.label}</span>
                <span className="text-muted-foreground"> — {verwijder.aantal_leads} lead
                  {verwijder.aantal_leads === 1 ? "" : "s"}</span>
              </div>
              <label className="flex items-start gap-2 text-sm">
                <Checkbox
                  checked={ookVanLeads}
                  onCheckedChange={(v) => setOokVanLeads(!!v)}
                  className="mt-0.5"
                />
                <span>
                  Ook verwijderen van alle {verwijder.aantal_leads} lead
                  {verwijder.aantal_leads === 1 ? "" : "s"} die deze tag hebben.
                </span>
              </label>
              {!ookVanLeads && (
                <p className="text-xs text-muted-foreground">
                  De tag blijft dan als losse waarde op de leads staan, maar verdwijnt uit de catalogus en snelkeuzes.
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setVerwijder(null)}>
              Annuleren
            </Button>
            <Button variant="destructive" onClick={bevestigVerwijder} disabled={del.isPending}>
              {del.isPending ? "Bezig…" : "Verwijder tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}