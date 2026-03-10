import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Logo from "@/components/Logo";
import { toast } from "sonner";
import { Lock } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get("type") === "recovery") {
      setIsRecovery(true);
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Wachtwoorden komen niet overeen");
      return;
    }
    if (password.length < 8) {
      toast.error("Wachtwoord moet minimaal 8 karakters zijn");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error("Kon wachtwoord niet wijzigen", { description: error.message });
    } else {
      toast.success("Wachtwoord succesvol gewijzigd");
      navigate("/dashboard");
    }
    setIsLoading(false);
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md rounded-2xl">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Ongeldige of verlopen reset-link.</p>
            <Button onClick={() => navigate("/login")} className="mt-4 rounded-pill">
              Terug naar inloggen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo className="scale-150" />
        </div>
        <Card className="rounded-2xl shadow-lg border-0 bg-card">
          <CardHeader className="text-center pb-2">
            <h1 className="text-2xl font-semibold">Nieuw wachtwoord instellen</h1>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nieuw wachtwoord</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="pl-10 rounded-xl" placeholder="Minimaal 8 karakters" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Bevestig wachtwoord</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} className="pl-10 rounded-xl" placeholder="Herhaal wachtwoord" />
                </div>
              </div>
              <Button type="submit" className="w-full rounded-pill" disabled={isLoading}>
                {isLoading ? "Even geduld..." : "Wachtwoord wijzigen"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
