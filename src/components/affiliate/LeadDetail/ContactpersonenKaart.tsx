import { useState } from "react";
import { Users, Phone, Mail, MessageCircle, Linkedin, Star, Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { telLink, whatsappLink } from "@/lib/affiliate/contact";
import {
  useLeadContactpersonen, useDeleteContactpersoon, useSetHoofdcontact,
  type Contactpersoon,
} from "@/hooks/affiliate/useLeadContactpersonen";
import { ContactpersoonDialog } from "./ContactpersoonDialog";

interface Props {
  leadId: string;
}

export function ContactpersonenKaart({ leadId }: Props) {
  const { data = [], isLoading } = useLeadContactpersonen(leadId);
  const del = useDeleteContactpersoon(leadId);
  const setHoofd = useSetHoofdcontact(leadId);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Contactpersoon | null>(null);

  const openNew = () => { setEdit(null); setOpen(true); };
  const openEdit = (c: Contactpersoon) => { setEdit(c); setOpen(true); };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" /> Contactpersonen
          {data.length > 0 && <Badge variant="secondary" className="text-[10px]">{data.length}</Badge>}
        </h3>
        <Button size="sm" variant="outline" onClick={openNew}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Toevoegen
        </Button>
      </div>

      {isLoading && <p className="text-xs text-muted-foreground">Laden…</p>}
      {!isLoading && data.length === 0 && (
        <p className="text-xs text-muted-foreground italic">Nog geen contactpersonen toegevoegd.</p>
      )}

      <div className="space-y-2">
        {data.map((c) => (
          <ContactKaart
            key={c.id}
            c={c}
            onEdit={() => openEdit(c)}
            onDelete={() => del.mutate(c.id)}
            onMaakHoofd={() => setHoofd.mutate(c.id)}
          />
        ))}
      </div>

      <ContactpersoonDialog open={open} onOpenChange={setOpen} leadId={leadId} bestaand={edit} />
    </div>
  );
}

function ContactKaart({
  c, onEdit, onDelete, onMaakHoofd,
}: {
  c: Contactpersoon;
  onEdit: () => void;
  onDelete: () => void;
  onMaakHoofd: () => void;
}) {
  const tel = telLink(c.telefoon_mobiel ?? c.telefoon_kantoor);
  const wa = whatsappLink(c.telefoon_mobiel ?? c.telefoon_kantoor);

  return (
    <div className="rounded-md border bg-background p-3 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm truncate">{c.naam}</span>
            {c.is_hoofdcontact && (
              <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                <Star className="h-2.5 w-2.5 mr-0.5" /> Hoofd
              </Badge>
            )}
          </div>
          {c.functie && <p className="text-xs text-muted-foreground">{c.functie}</p>}
        </div>
        <div className="flex gap-1 shrink-0">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit} aria-label="Bewerken">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" aria-label="Verwijderen">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Contactpersoon verwijderen?</AlertDialogTitle>
                <AlertDialogDescription>
                  {c.naam} wordt definitief verwijderd. Deze actie kan niet ongedaan gemaakt worden.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuleren</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Verwijderen</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 text-xs">
        {tel && (
          <Button asChild size="sm" variant="outline" className="h-7">
            <a href={tel}><Phone className="h-3 w-3 mr-1" /> Bel</a>
          </Button>
        )}
        {wa && (
          <Button asChild size="sm" variant="outline" className="h-7 text-emerald-700 border-emerald-300">
            <a href={wa} target="_blank" rel="noreferrer"><MessageCircle className="h-3 w-3 mr-1" /> WA</a>
          </Button>
        )}
        {c.email && (
          <Button asChild size="sm" variant="outline" className="h-7">
            <a href={`mailto:${c.email}`}><Mail className="h-3 w-3 mr-1" /> Mail</a>
          </Button>
        )}
        {c.linkedin_url && (
          <Button asChild size="sm" variant="outline" className="h-7">
            <a href={c.linkedin_url} target="_blank" rel="noreferrer"><Linkedin className="h-3 w-3 mr-1" /> LinkedIn</a>
          </Button>
        )}
        {!c.is_hoofdcontact && (
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onMaakHoofd}>
            Markeer als hoofd
          </Button>
        )}
      </div>

      {c.notitie && <p className="text-xs text-muted-foreground italic mt-1">{c.notitie}</p>}
    </div>
  );
}