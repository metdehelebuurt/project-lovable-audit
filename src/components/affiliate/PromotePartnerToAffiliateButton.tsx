import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Handshake, UserMinus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Props {
  partnerId: string;
  partnerNaam: string;
  isAffiliate: boolean;
  size?: "sm" | "default";
  variant?: "outline" | "default" | "ghost";
}

export function PromotePartnerToAffiliateButton({
  partnerId, partnerNaam, isAffiliate, size = "sm", variant = "outline",
}: Props) {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const mutate = useMutation({
    mutationFn: async () => {
      const action = isAffiliate ? "revoke_partner_affiliate" : "promote_partner_to_affiliate";
      const { data, error } = await supabase.functions.invoke("user-management", {
        body: { action, partner_id: partnerId },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partners"] });
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["all-affiliates"] });
      toast.success(isAffiliate ? "Partner-affiliate ingetrokken" : `${partnerNaam} is nu affiliate`);
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (profile?.rol !== "superadmin") return null;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size={size} variant={variant} onClick={(e) => e.stopPropagation()}>
          {isAffiliate ? (
            <><UserMinus className="h-4 w-4 mr-2" />Affiliate intrekken</>
          ) : (
            <><Handshake className="h-4 w-4 mr-2" />Maak affiliate</>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isAffiliate ? "Affiliate-status intrekken?" : `${partnerNaam} promoveren tot affiliate?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isAffiliate
              ? "De partner verliest de affiliate-status. Gekoppelde affiliate-gebruikers krijgen weer rol partner_admin en hun affiliate-link wordt gedeactiveerd. Bestaande referrals en commissies blijven behouden."
              : "De partner wordt gemarkeerd als affiliate. De partner_admin (of eerste actieve gebruiker) krijgt rol affiliate naast partner-toegang en er wordt automatisch een affiliate-link aangemaakt."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuleren</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); mutate.mutate(); }}
            disabled={mutate.isPending}
          >
            Bevestigen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}