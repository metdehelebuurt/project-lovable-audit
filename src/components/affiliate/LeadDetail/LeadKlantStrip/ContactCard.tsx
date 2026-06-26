import { useState } from "react";
import { User, Phone, Mail, MessageCircle, Linkedin, Pencil, ChevronDown, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { telLink, whatsappLink } from "@/lib/affiliate/contact";
import { useLeadContactpersonen, type Contactpersoon } from "@/hooks/affiliate/useLeadContactpersonen";
import { ContactpersoonDialog } from "../ContactpersoonDialog";
import { cn } from "@/lib/utils";

interface Props {
  leadId: string;
  fallbackEmail?: string | null;
  fallbackTelefoon?: string | null;
}

export function ContactCard({ leadId, fallbackEmail, fallbackTelefoon }: Props) {
  const { data: personen = [] } = useLeadContactpersonen(leadId);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Contactpersoon | null>(null);
  const [uitgeklapt, setUitgeklapt] = useState(false);

  const hoofd = personen.find((p) => p.is_hoofdcontact) ?? personen[0];
  const overig = personen.filter((p) => p.id !== hoofd?.id);

  const naam = hoofd?.naam ?? "Geen hoofdcontact";
  const tel = hoofd?.telefoon_mobiel ?? hoofd?.telefoon_kantoor ?? fallbackTelefoon ?? null;
  const email = hoofd?.email ?? fallbackEmail ?? null;
  const wa = whatsappLink(tel);

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3 min-w-0">
      <Kop
        titel="Contact"
        icon={<User className="h-4 w-4" />}
        kleur="text-blue-600 bg-blue-50"
        action={
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => { setEdit(hoofd ?? null); setOpen(true); }}>
            {hoofd ? <Pencil className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          </Button>
        }
      />

      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-sm truncate">{naam}</p>
          {hoofd?.is_hoofdcontact && (
            <Badge variant="outline" className="h-5 text-[10px] bg-primary/10 text-primary border-primary/30">
              <Star className="h-2.5 w-2.5 mr-0.5" /> Hoofd
            </Badge>
          )}
        </div>
        {hoofd?.functie && <p className="text-xs text-muted-foreground truncate">{hoofd.functie}</p>}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tel ? (
          <ContactChip href={telLink(tel) ?? "#"} icon={Phone} kleur="bg-blue-50 text-blue-700 border-blue-200">{tel}</ContactChip>
        ) : (
          <ContactChip muted icon={Phone}>Geen telefoon</ContactChip>
        )}
        {wa && <ContactChip href={wa} target icon={MessageCircle} kleur="bg-emerald-50 text-emerald-700 border-emerald-200">WhatsApp</ContactChip>}
        {email ? (
          <ContactChip href={`mailto:${email}`} icon={Mail} kleur="bg-purple-50 text-purple-700 border-purple-200">{email}</ContactChip>
        ) : (
          <ContactChip muted icon={Mail}>Geen mail</ContactChip>
        )}
        {hoofd?.linkedin_url && (
          <ContactChip href={hoofd.linkedin_url} target icon={Linkedin} kleur="bg-sky-50 text-sky-700 border-sky-200">LinkedIn</ContactChip>
        )}
      </div>

      {overig.length > 0 && (
        <button
          type="button"
          onClick={() => setUitgeklapt((v) => !v)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", uitgeklapt && "rotate-180")} />
          {overig.length} ander{overig.length === 1 ? "" : "e"} contact{overig.length === 1 ? "" : "en"}
        </button>
      )}

      {uitgeklapt && overig.length > 0 && (
        <ul className="space-y-1.5 pt-1 border-t">
          {overig.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate">
                <span className="font-medium">{p.naam}</span>
                {p.functie && <span className="text-muted-foreground"> · {p.functie}</span>}
              </span>
              <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => { setEdit(p); setOpen(true); }}>
                <Pencil className="h-3 w-3" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ContactpersoonDialog open={open} onOpenChange={setOpen} leadId={leadId} bestaand={edit} />
    </div>
  );
}

function Kop({ titel, icon, kleur, action }: { titel: string; icon: React.ReactNode; kleur: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={cn("inline-flex items-center justify-center h-6 w-6 rounded-md", kleur)}>{icon}</span>
        <h3 className="text-sm font-semibold">{titel}</h3>
      </div>
      {action}
    </div>
  );
}

function ContactChip({
  href, icon: Icon, kleur, target, muted, children,
}: {
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  kleur?: string;
  target?: boolean;
  muted?: boolean;
  children: React.ReactNode;
}) {
  const base = "inline-flex items-center gap-1 h-7 px-2 rounded-md border text-xs max-w-full";
  const inner = (
    <>
      <Icon className="h-3 w-3 shrink-0" />
      <span className="truncate">{children}</span>
    </>
  );
  if (muted) return <span className={cn(base, "bg-muted/40 text-muted-foreground border-dashed")}>{inner}</span>;
  if (!href) return null;
  return (
    <a
      href={href}
      target={target ? "_blank" : undefined}
      rel={target ? "noreferrer" : undefined}
      className={cn(base, "hover:brightness-95 transition", kleur)}
    >
      {inner}
    </a>
  );
}