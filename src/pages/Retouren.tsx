import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import RetourenLijst from "@/components/retouren/RetourenLijst";
import RetourDialog from "@/components/retouren/RetourDialog";

export default function Retouren() {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Retouren</h1>
          <p className="text-muted-foreground">RMA-beheer voor klant- en leverancier-retouren</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nieuwe retour
        </Button>
      </div>
      <RetourenLijst partnerId={profile?.partner_id} emptyText="Nog geen retouren aangemaakt" />
      <RetourDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}