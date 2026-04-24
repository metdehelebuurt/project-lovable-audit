import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Mail, Phone, MapPin, Building2, Pencil, Save, Loader2, ChevronDown, ChevronUp, User,
} from "lucide-react";
import EmailAddressList from "@/components/email/EmailAddressList";
import { formatDateTime } from "@/components/detail/DetailComponents";

interface Props {
  klant: any;
  isEditing: boolean;
  editForm: any;
  setEditForm: (updater: (p: any) => any) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  isSaving: boolean;
}

/**
 * Contactgegevens-card met collapsible body op mobiel.
 * Op desktop altijd zichtbaar; op mobiel inklapbaar om ruimte te sparen.
 */
export default function KlantContactCard({
  klant, isEditing, editForm, setEditForm,
  onStartEdit, onCancelEdit, onSave, isSaving,
}: Props) {
  const [openMobile, setOpenMobile] = useState(false);

  const adresStr = klant.adres
    ? `${klant.adres}, ${klant.postcode || ""} ${klant.plaats || ""}`.trim()
    : null;

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpenMobile((v) => !v)}
        className="md:cursor-default w-full flex items-center justify-between gap-2 px-6 pt-5 pb-3 md:pointer-events-none"
        aria-expanded={openMobile}
      >
        <span className="text-base font-semibold flex items-center gap-2">
          <User className="h-4 w-4 text-primary" /> Contactgegevens
        </span>
        <span className="flex items-center gap-1">
          {!isEditing && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onStartEdit(); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onStartEdit(); } }}
              className="md:pointer-events-auto pointer-events-auto inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs hover:bg-muted/50 cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5" /> Bewerken
            </span>
          )}
          <span className="md:hidden text-muted-foreground">
            {openMobile ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </span>
      </button>

      {/* Body */}
      <CardContent className={`${openMobile ? "block" : "hidden"} md:block`}>
        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Voornaam *</Label>
                <Input value={editForm.voornaam || ""}
                  onChange={(e) => setEditForm((p) => ({ ...p, voornaam: e.target.value }))}
                  className="rounded-xl" />
              </div>
              <div>
                <Label className="text-xs">Achternaam *</Label>
                <Input value={editForm.achternaam || ""}
                  onChange={(e) => setEditForm((p) => ({ ...p, achternaam: e.target.value }))}
                  className="rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <EmailAddressList
                  primary={editForm.email || ""}
                  onPrimaryChange={(v) => setEditForm((p) => ({ ...p, email: v }))}
                  extras={editForm.extra_emails || []}
                  onExtrasChange={(v) => setEditForm((p) => ({ ...p, extra_emails: v }))}
                />
              </div>
              <div>
                <Label className="text-xs">Telefoon</Label>
                <Input value={editForm.telefoon || ""}
                  onChange={(e) => setEditForm((p) => ({ ...p, telefoon: e.target.value }))}
                  className="rounded-xl" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Bedrijfsnaam</Label>
              <Input value={editForm.bedrijfsnaam || ""}
                onChange={(e) => setEditForm((p) => ({ ...p, bedrijfsnaam: e.target.value }))}
                className="rounded-xl" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Label className="text-xs">Adres</Label>
                <Input value={editForm.adres || ""}
                  onChange={(e) => setEditForm((p) => ({ ...p, adres: e.target.value }))}
                  className="rounded-xl" />
              </div>
              <div>
                <Label className="text-xs">Postcode</Label>
                <Input value={editForm.postcode || ""}
                  onChange={(e) => setEditForm((p) => ({ ...p, postcode: e.target.value }))}
                  className="rounded-xl" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Plaats</Label>
              <Input value={editForm.plaats || ""}
                onChange={(e) => setEditForm((p) => ({ ...p, plaats: e.target.value }))}
                className="rounded-xl" />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" size="sm" className="rounded-xl" onClick={onCancelEdit}>
                Annuleren
              </Button>
              <Button size="sm" className="rounded-xl gap-1.5" onClick={onSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Opslaan
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <ContactItem icon={Mail} label="E-mail" value={klant.email} href={klant.email ? `mailto:${klant.email}` : undefined} />
            <ContactItem icon={Phone} label="Telefoon" value={klant.telefoon} href={klant.telefoon ? `tel:${klant.telefoon}` : undefined} />
            <ContactItem icon={MapPin} label="Adres" value={adresStr} />
            <ContactItem icon={Building2} label="Bedrijf" value={klant.bedrijfsnaam} />
            <Separator className="my-2" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-muted-foreground">
              <span>Klant sinds: {formatDateTime(klant.created_at)}</span>
              <span>Laatst gewijzigd: {formatDateTime(klant.updated_at)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ContactItem({
  icon: Icon, label, value, href,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
  href?: string;
}) {
  const content = (
    <div className="flex items-center gap-3 text-sm">
      <div className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate">
          {value || <span className="text-muted-foreground italic">—</span>}
        </p>
      </div>
    </div>
  );
  if (href && value) {
    return (
      <a href={href} className="block rounded-lg -mx-2 px-2 py-1 hover:bg-muted/40 transition-colors">
        {content}
      </a>
    );
  }
  return <div className="-mx-2 px-2 py-1">{content}</div>;
}