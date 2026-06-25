import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Handshake, UserMinus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface Props {
  userId: string;
  currentRol: AppRole;
  /** Extra (additieve) rollen op deze gebruiker. */
  extraRollen?: AppRole[];
  size?: "sm" | "default";
  variant?: "outline" | "default" | "ghost";
}

const PARTNER_ROLLEN: AppRole[] = [
  "partner_admin", "partner_staff", "backoffice", "adviseur", "installateur",
];

export function PromoteToAffiliateButton({
  userId, currentRol, extraRollen = [], size = "sm", variant = "outline",
}: Props) {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const isPureAffiliate = currentRol === "affiliate";
  const heeftPartnerRol = PARTNER_ROLLEN.includes(currentRol);
  const heeftExtraAffiliate = extraRollen.includes("affiliate");

  // Hybride flow voor gebruikers met een partner-rol; rolwissel-flow voor anderen.
  const modus: "hybride" | "rolwissel" = heeftPartnerRol ? "hybride" : "rolwissel";
  const isActief = modus === "hybride" ? heeftExtraAffiliate : isPureAffiliate;

  const mutate = useMutation({
    mutationFn: async () => {
      const action = modus === "hybride"
        ? (isActief ? "remove_affiliate_role" : "add_affiliate_role")
        : (isActief ? "revoke_affiliate" : "promote_to_affiliate");
      const { data, error } = await supabase.functions.invoke("user-management", {
        body: { action, user_id: userId },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["gebruiker"] });
      qc.invalidateQueries({ queryKey: ["all-affiliates"] });
      toast.success(
        modus === "hybride"
          ? (isActief ? "Affiliate-module verwijderd" : "Affiliate-module toegevoegd")
          : (isActief ? "Affiliate-rol ingetrokken" : "Gepromoveerd naar affiliate"),
      );
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (profile?.rol !== "superadmin") return null;

  const label = modus === "hybride"
    ? (isActief
        ? <><UserMinus className="h-4 w-4 mr-2" />Affiliate-module verwijderen</>
        : <><Handshake className="h-4 w-4 mr-2" />Affiliate-module toevoegen</>)
    : (isActief
        ? <><UserMinus className="h-4 w-4 mr-2" />Affiliate-rol intrekken</>
        : <><Handshake className="h-4 w-4 mr-2" />Maak affiliate</>);

  const titel = modus === "hybride"
    ? (isActief ? "Affiliate-module verwijderen?" : "Affiliate-module toevoegen?")
    : (isActief ? "Affiliate-rol intrekken?" : "Promoveren tot affiliate?");

  const beschrijving = modus === "hybride"
    ? (isActief
        ? "De affiliate-modules verdwijnen uit de navigatie van deze gebruiker. Zijn huidige rol, partnerkoppeling en data blijven volledig behouden. Bestaande affiliate-link wordt gedeactiveerd."
        : "De gebruiker krijgt naast zijn huidige rol toegang tot het affiliate-CRM en krijgt automatisch een affiliate-link. Zijn primaire rol, partnerkoppeling en bestaande data blijven volledig intact.")
    : (isActief
        ? "De gebruiker krijgt rol 'medewerker' en verliest toegang tot het affiliate-portaal. Bestaande referrals en commissies blijven behouden."
        : "De gebruiker krijgt rol affiliate, wordt losgekoppeld van een eventuele partner en krijgt automatisch een affiliate-link en toegang tot het sales-CRM.");

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size={size} variant={variant}>
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titel}</AlertDialogTitle>
          <AlertDialogDescription>{beschrijving}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuleren</AlertDialogCancel>
          <AlertDialogAction onClick={(e) => { e.preventDefault(); mutate.mutate(); }} disabled={mutate.isPending}>
            Bevestigen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}