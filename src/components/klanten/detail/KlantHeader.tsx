import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Mail, Phone, MapPin, Building2, Pencil, CalendarIcon,
  RotateCcw, LifeBuoy, FileText, MoreHorizontal, Camera, Trash2,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { formatDate } from "@/components/detail/DetailComponents";

interface Props {
  klant: any;
  isEditing: boolean;
  onStartEdit: () => void;
  onAfspraak: () => void;
  onRetour: () => void;
  onTicket: () => void;
  onOfferte: () => void;
  onSnelleSchouw: () => void;
  onDelete?: () => void;
  canDelete?: boolean;
  isDeleting?: boolean;
}

/**
 * Header met terug-knop, naam, badge, contact-info en acties.
 * Op mobiel: alleen primaire actie zichtbaar, rest in overflow-menu.
 */
export default function KlantHeader({
  klant, isEditing, onStartEdit, onAfspraak, onRetour, onTicket, onOfferte, onSnelleSchouw,
  onDelete, canDelete = false, isDeleting = false,
}: Props) {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="flex items-start gap-2 sm:gap-3">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/klanten")}
        className="rounded-xl mt-0.5 shrink-0"
        aria-label="Terug naar klanten"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground truncate">
            {klant.voornaam} {klant.achternaam}
          </h1>
          <Badge className="bg-success text-success-foreground hover:bg-success/90">Klant</Badge>
        </div>

        {/* Inline contact info — verborgen op mobiel (zit in contact-card) */}
        <div className="hidden sm:flex items-center gap-x-4 gap-y-1 text-muted-foreground text-sm mt-1 flex-wrap">
          {klant.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{klant.email}</span>}
          {klant.telefoon && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{klant.telefoon}</span>}
          {klant.adres && <span className="flex items-center gap-1 truncate max-w-[28rem]"><MapPin className="h-3.5 w-3.5" />{klant.adres}, {klant.postcode} {klant.plaats}</span>}
          {klant.bedrijfsnaam && <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{klant.bedrijfsnaam}</span>}
        </div>

        <p className="text-xs text-muted-foreground mt-1">Klant sinds {formatDate(klant.created_at)}</p>
      </div>

      {/* Desktop acties */}
      <div className="hidden md:flex items-center gap-2 shrink-0">
        {!isEditing && (
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={onStartEdit}>
            <Pencil className="h-4 w-4" /> Bewerken
          </Button>
        )}
        <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={onAfspraak}>
          <CalendarIcon className="h-4 w-4" /> Afspraak
        </Button>
        <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={onRetour}>
          <RotateCcw className="h-4 w-4" /> Retour
        </Button>
        <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={onTicket}>
          <LifeBuoy className="h-4 w-4" /> Ticket
        </Button>
        <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={onSnelleSchouw}>
          <Camera className="h-4 w-4" /> Snelle schouw
        </Button>
        <Button size="sm" className="rounded-xl gap-1.5" onClick={onOfferte}>
          <FileText className="h-4 w-4" /> Offerte
        </Button>
        {canDelete && onDelete && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-1.5 text-destructive hover:text-destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="h-4 w-4" /> Verwijderen
          </Button>
        )}
      </div>

      {/* Mobiel: primaire actie + overflow */}
      <div className="flex md:hidden items-center gap-1.5 shrink-0">
        <Button size="sm" className="rounded-xl gap-1.5" onClick={onOfferte}>
          <FileText className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">Offerte</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-xl" aria-label="Meer acties">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {!isEditing && (
              <DropdownMenuItem onSelect={onStartEdit}>
                <Pencil className="h-4 w-4 mr-2" /> Bewerken
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={onAfspraak}>
              <CalendarIcon className="h-4 w-4 mr-2" /> Afspraak
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onRetour}>
              <RotateCcw className="h-4 w-4 mr-2" /> Retour
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onTicket}>
              <LifeBuoy className="h-4 w-4 mr-2" /> Ticket
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onSnelleSchouw}>
              <Camera className="h-4 w-4 mr-2" /> Snelle schouw
            </DropdownMenuItem>
            {canDelete && onDelete && (
              <DropdownMenuItem
                onSelect={() => setConfirmOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Verwijderen
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Klant verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je <strong>{klant.voornaam} {klant.achternaam}</strong> definitief wilt verwijderen?
              Deze actie wordt gelogd in het audit-log en kan niet ongedaan gemaakt worden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); onDelete?.(); }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Bezig..." : "Definitief verwijderen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}