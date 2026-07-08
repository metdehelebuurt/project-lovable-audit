import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import TagsInput, { normaliseerTag } from "@/components/sales/TagsInput";
import { useSalesTags } from "@/hooks/sales/useSalesTags";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  aantal: number;
  bezig: boolean;
  onToevoegen: (tags: string[]) => void;
  onVerwijderen: (tags: string[]) => void;
}

/** Dialog om tags in bulk toe te voegen aan of te verwijderen uit geselecteerde leads. */
export default function BulkTagsDialog({ open, onOpenChange, aantal, bezig, onToevoegen, onVerwijderen }: Props) {
  const [tab, setTab] = useState<"toevoegen" | "verwijderen">("toevoegen");
  const [tags, setTags] = useState<string[]>([]);
  const { data: catalog } = useSalesTags();

  const reset = () => {
    setTab("toevoegen");
    setTags([]);
  };

  const bevestig = () => {
    const norm = tags.map((t) => normaliseerTag(t)).filter((t): t is string => !!t);
    if (norm.length === 0) return;
    if (tab === "toevoegen") onToevoegen(norm);
    else onVerwijderen(norm);
    reset();
  };

  const suggesties = (catalog ?? [])
    .filter((t) => !tags.includes(t.slug))
    .slice(0, 20);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tags voor {aantal} geselecteerde leads</DialogTitle>
          <DialogDescription>
            Voeg tags in bulk toe of verwijder ze. Nieuwe tags worden automatisch aan de catalogus toegevoegd.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "toevoegen" | "verwijderen")}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="toevoegen">Toevoegen</TabsTrigger>
            <TabsTrigger value="verwijderen">Verwijderen</TabsTrigger>
          </TabsList>
          <TabsContent value="toevoegen" className="pt-3 space-y-3">
            <p className="text-sm text-muted-foreground">
              Deze tags worden aan alle geselecteerde leads gehangen zonder bestaande tags te vervangen.
            </p>
            <TagsInput waarde={tags} onWijzig={setTags} placeholder="Bijv. beurs2026, warm-signal" />
          </TabsContent>
          <TabsContent value="verwijderen" className="pt-3 space-y-3">
            <p className="text-sm text-muted-foreground">
              Deze tags worden bij alle geselecteerde leads verwijderd (als ze aanwezig zijn).
            </p>
            <TagsInput waarde={tags} onWijzig={setTags} placeholder="Tag(s) om te verwijderen" />
          </TabsContent>
        </Tabs>

        {suggesties.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Snelkeuze uit catalogus</p>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {suggesties.map((t) => (
                <Badge
                  key={t.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-purple-50 border-purple-200 text-purple-800"
                  onClick={() => setTags((prev) => (prev.includes(t.slug) ? prev : [...prev, t.slug]))}
                >
                  #{t.label}
                  <span className="ml-1 text-[10px] text-muted-foreground">{t.aantal_leads}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={bezig}>
            Annuleren
          </Button>
          <Button onClick={bevestig} disabled={bezig || tags.length === 0}>
            {bezig
              ? "Bezig…"
              : tab === "toevoegen"
                ? `Toevoegen aan ${aantal} leads`
                : `Verwijderen uit ${aantal} leads`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}