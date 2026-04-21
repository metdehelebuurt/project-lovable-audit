import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Send, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  email: string;
  voornaam?: string;
}

type Status = "idle" | "sending" | "ok" | "error";

export const EmailTestKnop = ({ email, voornaam }: Props) => {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const test = async () => {
    setStatus("sending");
    setErrorMsg("");
    try {
      const html = `<p>Hallo ${voornaam || ""},</p>
        <p>Dit is een testbericht vanuit de onboarding-wizard van mijnhuis.nu om te bevestigen dat je e-mailkoppeling correct werkt.</p>
        <p>Als je deze e-mail in je inbox ziet, is alles ingesteld. 🎉</p>`;
      const { data, error } = await supabase.functions.invoke("email-api-send", {
        body: { to: email, subject: "Testbericht onboarding — mijnhuis.nu", html_body: html },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message || "Onbekende fout");
      setStatus("ok");
      toast.success("Testbericht verstuurd", { description: `Controleer ${email}` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Versturen mislukt";
      setErrorMsg(msg);
      setStatus("error");
      toast.error("Test mislukt", { description: msg });
    }
  };

  return (
    <div className="space-y-2">
      <Button onClick={test} disabled={status === "sending"} variant="outline" className="rounded-pill gap-2">
        {status === "ok" ? <CheckCircle2 className="h-4 w-4 text-success" /> :
         status === "error" ? <XCircle className="h-4 w-4 text-destructive" /> :
         <Send className="h-4 w-4" />}
        {status === "sending" ? "Versturen…" : status === "ok" ? "Test geslaagd" : "Koppeling testen"}
      </Button>
      {status === "error" && <p className="text-xs text-destructive">{errorMsg}</p>}
      {status === "ok" && <p className="text-xs text-muted-foreground">Controleer je inbox op {email}.</p>}
    </div>
  );
};

export default EmailTestKnop;