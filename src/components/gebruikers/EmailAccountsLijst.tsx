import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Star, Pencil, Check, X, Unlink, Mail } from "lucide-react";
import {
  useEmailAccounts,
  useSetPrimairEmailAccount,
  useRenameEmailAccount,
  useDisconnectEmailAccount,
  type EmailAccount,
} from "@/hooks/email/useEmailAccounts";

interface Props {
  userId: string;
}

export default function EmailAccountsLijst({ userId }: Props) {
  const { data: accounts = [], isLoading } = useEmailAccounts(userId);
  const setPrimair = useSetPrimairEmailAccount();
  const rename = useRenameEmailAccount();
  const disconnect = useDisconnectEmailAccount();
  const [editId, setEditId] = useState<string | null>(null);
  const [labelDraft, setLabelDraft] = useState("");

  if (isLoading) return null;
  if (accounts.length === 0) return null;

  const startEdit = (a: EmailAccount) => {
    setEditId(a.id);
    setLabelDraft(a.label ?? "");
  };

  const submitEdit = async (id: string) => {
    await rename.mutateAsync({ id, label: labelDraft });
    setEditId(null);
  };

  const bevestigOntkoppel = (a: EmailAccount) => {
    if (!confirm(`Ontkoppel ${a.email_adres}?`)) return;
    disconnect.mutate(a.id);
  };

  return (
    <div className="space-y-2">
      {accounts.map((a) => (
        <div
          key={a.id}
          className="flex flex-wrap items-center gap-3 rounded-xl border bg-card px-4 py-3"
        >
          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Mail className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-foreground truncate">{a.email_adres}</span>
              {a.is_primair && (
                <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
                  <Star className="h-3 w-3" /> Primair
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {a.provider === "google" ? "Gmail" : a.provider === "microsoft" ? "Outlook" : a.provider}
              </Badge>
              {a.needs_reauth && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-200">Opnieuw koppelen</Badge>
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void submitEdit(a.id);
                      if (e.key === "Escape") setEditId(null);
                    }}
                  />
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => submitEdit(a.id)}>
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditId(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-xs text-muted-foreground truncate">
                    {a.label ?? "Geen label"}
                  </span>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => startEdit(a)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {!a.is_primair && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-pill gap-1"
                onClick={() => setPrimair.mutate(a.id)}
                disabled={setPrimair.isPending}
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Maak primair
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="rounded-pill gap-1 text-destructive hover:text-destructive"
              onClick={() => bevestigOntkoppel(a)}
            >
              <Unlink className="h-3.5 w-3.5" /> Ontkoppelen
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}