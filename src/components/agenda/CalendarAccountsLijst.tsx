import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, CheckCircle2, Pencil, Check, X, Unlink, Star } from "lucide-react";
import {
  useCalendarAccounts,
  useSetPrimairCalendar,
  useUpdateCalendarAccount,
  useDisconnectCalendarAccount,
  type CalendarAccount,
} from "@/hooks/agenda/useCalendarAccounts";

const KLEUREN = ["#7c3aed", "#0891b2", "#059669", "#ea580c", "#e11d48", "#0369a1"];

export default function CalendarAccountsLijst() {
  const { data: accounts = [], isLoading } = useCalendarAccounts();
  const setPrimair = useSetPrimairCalendar();
  const update = useUpdateCalendarAccount();
  const disconnect = useDisconnectCalendarAccount();
  const [editId, setEditId] = useState<string | null>(null);
  const [labelDraft, setLabelDraft] = useState("");

  if (isLoading) return null;
  if (accounts.length === 0) return null;

  const startEdit = (a: CalendarAccount) => {
    setEditId(a.id);
    setLabelDraft(a.label ?? "");
  };

  const submit = async (id: string) => {
    await update.mutateAsync({ id, label: labelDraft });
    setEditId(null);
  };

  const bevestig = (a: CalendarAccount) => {
    if (!confirm(`Agenda ${a.google_email} ontkoppelen?`)) return;
    disconnect.mutate(a.id);
  };

  return (
    <div className="space-y-2">
      {accounts.map((a) => (
        <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card px-4 py-3">
          <div
            className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: (a.kleur ?? "#7c3aed") + "22" }}
          >
            <Calendar className="h-4 w-4" style={{ color: a.kleur ?? "#7c3aed" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-foreground truncate">{a.google_email}</span>
              {a.is_primair && (
                <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
                  <Star className="h-3 w-3" /> Primair
                </Badge>
              )}
              {a.laatste_fout && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-200">Foutmelding</Badge>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2">
              {editId === a.id ? (
                <>
                  <Input
                    autoFocus
                    value={labelDraft}
                    onChange={(e) => setLabelDraft(e.target.value)}
                    placeholder="Label (bijv. Werk, Privé)"
                    className="h-7 text-xs rounded-lg max-w-[220px]"
                    onKeyDown={(e) => { if (e.key === "Enter") void submit(a.id); if (e.key === "Escape") setEditId(null); }}
                  />
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => submit(a.id)}>
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditId(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-xs text-muted-foreground truncate">{a.label ?? "Geen label"}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => startEdit(a)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {KLEUREN.map((k) => (
              <button
                key={k}
                aria-label={`Kies kleur ${k}`}
                onClick={() => update.mutate({ id: a.id, kleur: k })}
                className="h-4 w-4 rounded-full border"
                style={{ backgroundColor: k, outline: a.kleur === k ? "2px solid var(--foreground)" : "none" }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {!a.is_primair && (
              <Button variant="outline" size="sm" className="rounded-pill gap-1" onClick={() => setPrimair.mutate(a.id)}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Maak primair
              </Button>
            )}
            <Button variant="ghost" size="sm" className="rounded-pill gap-1 text-destructive hover:text-destructive" onClick={() => bevestig(a)}>
              <Unlink className="h-3.5 w-3.5" /> Ontkoppelen
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}