import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Inbox } from "lucide-react";

interface User {
  id: string;
  voornaam: string | null;
  achternaam: string | null;
  email: string;
  rol: string;
  berichten_zichtbaarheid: "alle" | "toegewezen" | "geen";
}

const ZICHTBAARHEID_OPTIES: { value: User["berichten_zichtbaarheid"]; label: string; hint: string }[] = [
  { value: "alle", label: "Alle berichten", hint: "Toegang tot de volledige gedeelde inbox" },
  { value: "toegewezen", label: "Alleen toegewezen", hint: "Enkel berichten van eigen leads, klanten en offertes" },
  { value: "geen", label: "Geen toegang", hint: "Inbox is uitgeschakeld voor deze gebruiker" },
];

const ROL_LABELS: Record<string, string> = {
  superadmin: "Platformbeheerder",
  partner_admin: "Organisatiebeheerder",
  partner_staff: "Medewerker",
  backoffice: "Backoffice",
  adviseur: "Energieadviseur",
  installateur: "Installateur",
  consument: "Consument",
  affiliate: "Affiliate",
};

interface Props {
  partnerId: string;
}

const InboxZichtbaarheidBeheer = ({ partnerId }: Props) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, [partnerId]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("id, voornaam, achternaam, email, rol, berichten_zichtbaarheid")
      .eq("partner_id", partnerId)
      .neq("rol", "consument")
      .order("voornaam", { ascending: true });
    if (error) {
      toast.error("Kan gebruikers niet laden");
    } else {
      setUsers((data ?? []) as User[]);
    }
    setLoading(false);
  };

  const updateZichtbaarheid = async (userId: string, value: User["berichten_zichtbaarheid"]) => {
    setSavingId(userId);
    const { error } = await supabase
      .from("users")
      .update({ berichten_zichtbaarheid: value })
      .eq("id", userId);
    setSavingId(null);
    if (error) {
      toast.error("Bijwerken mislukt");
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, berichten_zichtbaarheid: value } : u)));
    toast.success("Inbox-toegang bijgewerkt");
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Laden...</p>;
  }

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Inbox className="h-5 w-5 text-primary" />
        </div>
        <div>
          <CardTitle className="text-lg">Inbox-zichtbaarheid per gebruiker</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Bepaal welke berichten elke medewerker in de gedeelde inbox kan zien.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">Geen medewerkers gevonden.</p>
        ) : (
          <div className="divide-y divide-border rounded-xl border">
            {users.map((u) => {
              const naam = [u.voornaam, u.achternaam].filter(Boolean).join(" ") || u.email;
              const opt = ZICHTBAARHEID_OPTIES.find((o) => o.value === u.berichten_zichtbaarheid);
              return (
                <div key={u.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{naam}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {ROL_LABELS[u.rol] ?? u.rol} · {u.email}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 sm:items-end">
                    <Select
                      value={u.berichten_zichtbaarheid}
                      onValueChange={(v) => updateZichtbaarheid(u.id, v as User["berichten_zichtbaarheid"])}
                      disabled={savingId === u.id}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ZICHTBAARHEID_OPTIES.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {opt && <p className="text-[11px] text-muted-foreground">{opt.hint}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InboxZichtbaarheidBeheer;