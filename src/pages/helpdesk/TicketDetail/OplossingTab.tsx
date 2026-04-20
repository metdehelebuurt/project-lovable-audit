import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useUpdateTicket } from "@/hooks/helpdesk/useTickets";
import type { HelpdeskTicket } from "@/hooks/helpdesk/useTickets";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function OplossingTab({ ticket }: { ticket: HelpdeskTicket }) {
  const [oplossing, setOplossing] = useState(ticket.oplossing ?? "");
  const [bezig, setBezig] = useState(false);
  const update = useUpdateTicket();
  const { user } = useAuth();

  const opslaan = async (sluiten: boolean) => {
    await update.mutateAsync({
      id: ticket.id,
      oplossing: oplossing || null,
      ...(sluiten ? { status: "opgelost", opgelost_op: new Date().toISOString() } : {}),
    });
    if (sluiten && user) {
      setBezig(true);
      try {
        const { error } = await supabase.functions.invoke("helpdesk-ai-genereer-kbartikel", {
          body: { ticket_id: ticket.id, partner_id: ticket.partner_id, user_id: user.id },
        });
        if (error) throw error;
        toast.success("Concept-artikel toegevoegd aan kennisbank");
      } catch (e) {
        toast.error(`KB-artikel mislukt: ${(e as Error).message}`);
      } finally {
        setBezig(false);
      }
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h2 className="font-semibold">Oplossing</h2>
        <p className="text-sm text-muted-foreground">Verplicht voordat een ticket op opgelost gezet wordt. AI gebruikt dit om de kennisbank uit te breiden.</p>
      </div>
      <Textarea rows={8} value={oplossing} onChange={(e) => setOplossing(e.target.value)} placeholder="Beschrijf wat het probleem was en hoe het opgelost is" />
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => opslaan(false)} disabled={update.isPending || bezig}>Tussentijds opslaan</Button>
        <Button onClick={() => opslaan(true)} disabled={update.isPending || bezig || !oplossing.trim()}>
          <Sparkles className="h-4 w-4 mr-2" />
          Opgelost &amp; KB genereren
        </Button>
      </div>
    </Card>
  );
}