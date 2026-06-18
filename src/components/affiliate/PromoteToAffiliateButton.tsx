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
  size?: "sm" | "default";
  variant?: "outline" | "default" | "ghost";
}

export function PromoteToAffiliateButton({ userId, currentRol, size = "sm", variant = "outline" }: Props) {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const isAffiliate = currentRol === "affiliate";

  const mutate = useMutation({
    mutationFn: async () => {
      const action = isAffiliate ? "revoke_affiliate" : "promote_to_affiliate";
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
      toast.success(isAffiliate ? "Affiliate-rol ingetrokken" : "Gepromoveerd naar affiliate");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (profile?.rol !== "superadmin") return null;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size={size} variant={variant}>
          {isAffiliate ? <><UserMinus className="h-4 w-4 mr-2" />Affiliate-rol intrekken</> : <><Handshake className="h-4 w-4 mr-2" />Maak affiliate</>}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{isAffiliate ? "Affiliate-rol intrekken?" : "Promoveren tot affiliate?"}</AlertDialogTitle>
          <AlertDialogDescription>
            {isAffiliate
              ? "De gebruiker krijgt rol 'medewerker' en verliest toegang tot het affiliate-portaal. Bestaande referrals en commissies blijven behouden."
              : "De gebruiker krijgt rol affiliate, wordt losgekoppeld van een eventuele partner en krijgt automatisch een affiliate-link en toegang tot het sales-CRM."}
          </AlertDialogDescription>
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