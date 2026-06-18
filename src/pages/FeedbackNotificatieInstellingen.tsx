import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Bell, Bug, Lightbulb, Mail } from "lucide-react";
import { Link } from "react-router-dom";

interface Voorkeuren {
  email_bug: boolean;
  inapp_bug: boolean;
  email_functieverzoek: boolean;
  inapp_functieverzoek: boolean;
}

const DEFAULT_VOORKEUREN: Voorkeuren = {
  email_bug: true,
  inapp_bug: true,
  email_functieverzoek: true,
  inapp_functieverzoek: true,
};

export default function FeedbackNotificatieInstellingen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [voorkeuren, setVoorkeuren] = useState<Voorkeuren>(DEFAULT_VOORKEUREN);

  const { data, isLoading } = useQuery({
    queryKey: ["feedback_notif_voorkeuren", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback_notificatie_voorkeuren")
        .select("email_bug, inapp_bug, email_functieverzoek, inapp_functieverzoek")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as Voorkeuren | null) ?? DEFAULT_VOORKEUREN;
    },
  });

  useEffect(() => {
    if (data) setVoorkeuren(data);
  }, [data]);

  const opslaanMutation = useMutation({
    mutationFn: async (next: Voorkeuren) => {
      if (!user?.id) throw new Error("Niet ingelogd");
      const { error } = await supabase
        .from("feedback_notificatie_voorkeuren")
        .upsert({ user_id: user.id, ...next }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback_notif_voorkeuren", user?.id] });
      toast.success("Voorkeuren opgeslagen");
    },
    onError: (e: any) => toast.error(e?.message ?? "Opslaan mislukt"),
  });

  const toggle = (key: keyof Voorkeuren) =>
    setVoorkeuren((v) => ({ ...v, [key]: !v[key] }));

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link to="/feedback/admin">
            <ArrowLeft className="h-4 w-4 mr-1" /> Terug naar feedbackbeheer
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Meldingen voor feedback & verzoeken</h1>
        <p className="text-muted-foreground">
          Kies welke meldingen je wilt ontvangen wanneer er een nieuwe bug of een nieuw
          functieverzoek wordt ingediend.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bug className="h-4 w-4 text-destructive" /> Bugmeldingen
          </CardTitle>
          <CardDescription>Wanneer een gebruiker een bug indient.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ToggleRij
            icoon={<Mail className="h-4 w-4 text-muted-foreground" />}
            label="E-mail ontvangen"
            checked={voorkeuren.email_bug}
            onChange={() => toggle("email_bug")}
          />
          <ToggleRij
            icoon={<Bell className="h-4 w-4 text-muted-foreground" />}
            label="In-app melding ontvangen"
            checked={voorkeuren.inapp_bug}
            onChange={() => toggle("inapp_bug")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-4 w-4 text-amber-600" /> Functieverzoeken
          </CardTitle>
          <CardDescription>Wanneer een gebruiker een nieuw verzoek indient.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ToggleRij
            icoon={<Mail className="h-4 w-4 text-muted-foreground" />}
            label="E-mail ontvangen"
            checked={voorkeuren.email_functieverzoek}
            onChange={() => toggle("email_functieverzoek")}
          />
          <ToggleRij
            icoon={<Bell className="h-4 w-4 text-muted-foreground" />}
            label="In-app melding ontvangen"
            checked={voorkeuren.inapp_functieverzoek}
            onChange={() => toggle("inapp_functieverzoek")}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => setVoorkeuren(data ?? DEFAULT_VOORKEUREN)}
          disabled={isLoading || opslaanMutation.isPending}
        >
          Herstellen
        </Button>
        <Button
          onClick={() => opslaanMutation.mutate(voorkeuren)}
          disabled={isLoading || opslaanMutation.isPending}
        >
          {opslaanMutation.isPending ? "Opslaan…" : "Opslaan"}
        </Button>
      </div>
    </div>
  );
}

function ToggleRij({
  icoon,
  label,
  checked,
  onChange,
}: {
  icoon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <span className="flex items-center gap-2 text-sm">
        {icoon} {label}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}