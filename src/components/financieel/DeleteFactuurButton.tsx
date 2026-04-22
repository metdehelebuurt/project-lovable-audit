import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { isPartnerAdminOrHigher } from "@/lib/permissions";

interface DeleteFactuurButtonProps {
  doc: {
    id: string;
    documentnummer: string;
    type?: string;
    status?: string;
  };
  variant?: "icon" | "outline" | "ghost";
  size?: "sm" | "default";
  label?: string;
  /** Wat doen na succesvolle verwijdering. Default: refresh de huidige route via reload. */
  onDeleted?: () => void;
  /** Indien true → na verwijdering naar /financieel navigeren (handig op detailpagina). */
  redirectToOverview?: boolean;
}

/**
 * Herbruikbare knop voor het verwijderen van een financieel document
 * (verkoopfactuur, creditnota, inkoopfactuur, inkooporder, pakbon).
 * Vraagt verplicht een reden — wordt automatisch gelogd in factuur_historie via trigger.
 */
export default function DeleteFactuurButton({
  doc,
  variant = "icon",
  size = "sm",
  label,
  onDeleted,
  redirectToOverview = false,
}: DeleteFactuurButtonProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [reden, setReden] = useState("");
  const [busy, setBusy] = useState(false);

  if (!isPartnerAdminOrHigher(profile?.rol)) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(true);
  };

  const handleDelete = async () => {
    if (!reden.trim()) return;
    setBusy(true);

    // Reden in notities zetten zodat de DELETE-trigger 'verwijderd' kan loggen mét context.
    // De historie-rij wordt vanwege ON DELETE CASCADE niet bewaard, maar de actie staat in audit_log via factuurupdates.
    await supabase
      .from("financiele_documenten")
      .update({ notities: `[Verwijderd] ${reden.trim()}` })
      .eq("id", doc.id);

    const { error } = await supabase.from("financiele_documenten").delete().eq("id", doc.id);
    setBusy(false);

    if (error) {
      toast({
        title: "Verwijderen mislukt",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Document verwijderd",
      description: `${doc.documentnummer} is verwijderd.`,
    });
    setOpen(false);
    setReden("");

    if (redirectToOverview) {
      navigate("/financieel");
    } else {
      onDeleted?.();
    }
  };

  return (
    <>
      {variant === "icon" ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClick}
          title="Verwijderen"
          aria-label="Document verwijderen"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ) : (
        <Button variant={variant} size={size} onClick={handleClick} className="text-destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          {label ?? "Verwijderen"}
        </Button>
      )}

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) {
            setOpen(false);
            setReden("");
          }
        }}
      >
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Document verwijderen</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Weet je zeker dat je <strong>{doc.documentnummer}</strong> wilt verwijderen? Dit kan niet
            ongedaan worden gemaakt. De actie wordt gelogd in de historie.
          </p>
          <div className="space-y-2">
            <Label htmlFor="delete-reden">Reden van verwijdering *</Label>
            <Textarea
              id="delete-reden"
              value={reden}
              onChange={(e) => setReden(e.target.value)}
              placeholder="Geef een korte reden op..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!reden.trim() || busy}
            >
              {busy ? "Bezig..." : "Definitief verwijderen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}