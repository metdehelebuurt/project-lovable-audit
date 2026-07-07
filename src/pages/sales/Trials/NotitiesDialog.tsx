import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  partnerId: string | null;
  partnerNaam: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Notitie {
  id: string;
  inhoud: string;
  created_at: string;
  user: { voornaam: string | null; achternaam: string | null; email: string | null } | null;
  klant: { voornaam: string | null; achternaam: string | null; bedrijfsnaam: string | null } | null;
}

export default function NotitiesDialog({ partnerId, partnerNaam, open, onOpenChange }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["partner-klant-notities", partnerId],
    enabled: open && !!partnerId,
    queryFn: async (): Promise<Notitie[]> => {
      const { data, error } = await supabase
        .from("klant_notities")
        .select(
          "id, inhoud, created_at, user:user_id(voornaam, achternaam, email), klant:klant_id(voornaam, achternaam, bedrijfsnaam)",
        )
        .eq("partner_id", partnerId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as Notitie[];
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Aantekeningen — {partnerNaam ?? "Partner"}</DialogTitle>
          <DialogDescription>
            Alleen-lezen inzage in aantekeningen die de partner over klanten heeft vastgelegd.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Laden…</p>
          ) : (data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Geen aantekeningen gevonden.
            </p>
          ) : (
            <ul className="space-y-3">
              {data!.map((n) => {
                const klant = n.klant
                  ? [n.klant.voornaam, n.klant.achternaam].filter(Boolean).join(" ") ||
                    n.klant.bedrijfsnaam
                  : null;
                const auteur = n.user
                  ? [n.user.voornaam, n.user.achternaam].filter(Boolean).join(" ") || n.user.email
                  : "Onbekend";
                return (
                  <li key={n.id} className="rounded-lg border p-3">
                    <div className="text-[11px] text-muted-foreground flex justify-between gap-2">
                      <span>
                        {auteur}
                        {klant ? ` · over ${klant}` : ""}
                      </span>
                      <span>{new Date(n.created_at).toLocaleString("nl-NL")}</span>
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{n.inhoud}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}