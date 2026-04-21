import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Mail, Sparkles } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UitnodigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultRol?: AppRole;
}

const rolLabels: Record<string, string> = {
  partner_admin: "Beheerder",
  backoffice: "Backoffice (financieel & administratie, geen gebruikersbeheer)",
  partner_staff: "Medewerker",
  adviseur: "Energieadviseur",
  installateur: "Installateur",
};

export const UitnodigDialog = ({ open, onOpenChange, defaultRol = "adviseur" }: UitnodigDialogProps) => {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [voornaam, setVoornaam] = useState("");
  const [achternaam, setAchternaam] = useState("");
  const [email, setEmail] = useState("");
  const [telefoon, setTelefoon] = useState("");
  const [functie, setFunctie] = useState("");
  const [rol, setRol] = useState<AppRole>(defaultRol);

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("user-management", {
        body: {
          action: "invite_user",
          email: email.trim(),
          voornaam: voornaam.trim(),
          achternaam: achternaam.trim(),
          telefoon: telefoon.trim() || undefined,
          functie: functie.trim() || undefined,
          rol,
          partner_id: profile?.partner_id,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Uitnodiging verstuurd", {
        description: `Een e-mail met instructies is verzonden naar ${email}`,
      });
      reset();
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error("Uitnodigen mislukt", { description: err.message }),
  });

  const reset = () => {
    setVoornaam(""); setAchternaam(""); setEmail(""); setTelefoon(""); setFunctie(""); setRol(defaultRol);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voornaam.trim() || !achternaam.trim() || !email.trim()) {
      toast.error("Vul alle verplichte velden in");
      return;
    }
    inviteMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Nieuwe medewerker uitnodigen
          </DialogTitle>
          <DialogDescription>
            De ontvanger krijgt een e-mail met een link om zelf een wachtwoord te kiezen. De uitnodiging is 24 uur geldig.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="voornaam">Voornaam *</Label>
              <Input id="voornaam" value={voornaam} onChange={e => setVoornaam(e.target.value)} required className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="achternaam">Achternaam *</Label>
              <Input id="achternaam" value={achternaam} onChange={e => setAchternaam(e.target.value)} required className="mt-1 rounded-xl" />
            </div>
          </div>
          <div>
            <Label htmlFor="email">E-mailadres *</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 rounded-xl" placeholder="naam@bedrijf.nl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="telefoon">Telefoon</Label>
              <Input id="telefoon" value={telefoon} onChange={e => setTelefoon(e.target.value)} className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="functie">Functie</Label>
              <Input id="functie" value={functie} onChange={e => setFunctie(e.target.value)} placeholder="bv. Senior adviseur" className="mt-1 rounded-xl" />
            </div>
          </div>
          <div>
            <Label htmlFor="rol">Rol *</Label>
            <Select value={rol} onValueChange={(v) => setRol(v as AppRole)}>
              <SelectTrigger id="rol" className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="adviseur">{rolLabels.adviseur}</SelectItem>
                <SelectItem value="installateur">{rolLabels.installateur}</SelectItem>
                <SelectItem value="backoffice">{rolLabels.backoffice}</SelectItem>
                <SelectItem value="partner_staff">{rolLabels.partner_staff}</SelectItem>
                <SelectItem value="partner_admin">{rolLabels.partner_admin}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg p-3">
            <Mail className="h-4 w-4 shrink-0 mt-0.5" />
            <p>De medewerker krijgt een uitnodiging per e-mail. Hij/zij kiest zelf een wachtwoord en kan direct aan de slag.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-pill">Annuleren</Button>
            <Button type="submit" className="rounded-pill" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? "Versturen..." : "Uitnodiging versturen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UitnodigDialog;