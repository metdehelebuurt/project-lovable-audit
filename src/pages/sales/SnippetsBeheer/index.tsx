import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, FileText, Mail, MessageCircle, Smartphone } from "lucide-react";
import { useSnippets, useUpsertSnippet, useDeleteSnippet, type SalesSnippet } from "@/hooks/sales/useSnippets";
import { TEMPERATUREN, TEMP_LABEL, TEMP_COLOR, type Temperatuur } from "@/lib/sales/temperatuur";

const KANALEN = ["email", "whatsapp", "sms"] as const;
const KANAAL_ICON = { email: Mail, whatsapp: MessageCircle, sms: Smartphone };

export default function SnippetsBeheer() {
  const { data: snippets, isLoading } = useSnippets();
  const upsert = useUpsertSnippet();
  const del = useDeleteSnippet();
  const [bewerk, setBewerk] = useState<SalesSnippet | null>(null);

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <div>
            <h2 className="text-lg font-semibold">Snippets</h2>
            <p className="text-sm text-muted-foreground">
              Korte teksten per kanaal en temperatuur. Variabelen: <code>{"{{bedrijfsnaam}}"}</code>, <code>{"{{contactpersoon}}"}</code>, <code>{"{{eigen_naam}}"}</code>.
            </p>
          </div>
        </div>
        <Button onClick={() => setBewerk({ id: "", eigenaar_id: "", kanaal: "email", temperatuur: null, titel: "", onderwerp: "", body: "", volgorde: 100, actief: true, created_at: "", updated_at: "" } as SalesSnippet)} className="gap-1">
          <Plus className="h-4 w-4" /> Nieuw snippet
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(snippets ?? []).map((s) => {
          const Icon = KANAAL_ICON[s.kanaal as keyof typeof KANAAL_ICON] ?? FileText;
          return (
            <Card key={s.id} className="p-3 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{s.titel}</span>
                  {s.temperatuur && (
                    <Badge variant="outline" className={TEMP_COLOR[s.temperatuur as Temperatuur]}>
                      {TEMP_LABEL[s.temperatuur as Temperatuur]}
                    </Badge>
                  )}
                  {!s.actief && <Badge variant="outline">Inactief</Badge>}
                </div>
              </div>
              {s.onderwerp && <div className="text-xs text-muted-foreground">{s.onderwerp}</div>}
              <p className="text-xs whitespace-pre-wrap line-clamp-3">{s.body}</p>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setBewerk(s)}>Bewerken</Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => confirm("Verwijderen?") && del.mutate(s.id)}>Verwijderen</Button>
              </div>
            </Card>
          );
        })}
        {(snippets ?? []).length === 0 && (
          <Card className="p-6 text-center text-sm text-muted-foreground md:col-span-2">
            Nog geen snippets. Voeg een snippet toe om deze beschikbaar te maken in het lead-detailscherm.
          </Card>
        )}
      </div>

      {bewerk && (
        <SnippetEditor
          snippet={bewerk}
          onClose={() => setBewerk(null)}
          onSave={(s) => upsert.mutate(s, { onSuccess: () => setBewerk(null) })}
        />
      )}
    </div>
  );
}

function SnippetEditor({ snippet, onClose, onSave }: { snippet: SalesSnippet; onClose: () => void; onSave: (s: Partial<SalesSnippet>) => void }) {
  const [s, setS] = useState(snippet);
  return (
    <Card className="p-4 fixed inset-x-4 bottom-4 top-4 z-50 overflow-y-auto md:inset-x-auto md:right-4 md:w-[480px] shadow-2xl">
      <h3 className="font-semibold mb-3">{snippet.id ? "Snippet bewerken" : "Nieuwe snippet"}</h3>
      <div className="space-y-3">
        <div>
          <Label>Titel</Label>
          <Input value={s.titel} onChange={(e) => setS({ ...s, titel: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Kanaal</Label>
            <Select value={s.kanaal} onValueChange={(v) => setS({ ...s, kanaal: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{KANALEN.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Temperatuur</Label>
            <Select value={s.temperatuur ?? "alle"} onValueChange={(v) => setS({ ...s, temperatuur: v === "alle" ? null : (v as Temperatuur) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle</SelectItem>
                {TEMPERATUREN.map((t) => <SelectItem key={t} value={t}>{TEMP_LABEL[t]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        {s.kanaal === "email" && (
          <div>
            <Label>Onderwerp</Label>
            <Input value={s.onderwerp ?? ""} onChange={(e) => setS({ ...s, onderwerp: e.target.value })} placeholder="Bijv. Korte vraag over {{bedrijfsnaam}}" />
          </div>
        )}
        <div>
          <Label>Body</Label>
          <Textarea rows={8} value={s.body} onChange={(e) => setS({ ...s, body: e.target.value })} placeholder="Hoi {{contactpersoon}}, …" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-3 border-t mt-3">
        <Button variant="ghost" onClick={onClose}>Annuleren</Button>
        <Button onClick={() => onSave(snippet.id ? s : { ...s, id: undefined })}>Opslaan</Button>
      </div>
    </Card>
  );
}