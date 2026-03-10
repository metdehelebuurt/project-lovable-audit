import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Logo from "@/components/Logo";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const { signIn, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);
    if (error) {
      toast.error("Inloggen mislukt", {
        description: "Controleer je e-mailadres en wachtwoord.",
      });
    } else {
      toast.success("Succesvol ingelogd");
      navigate("/dashboard");
    }
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Vul je e-mailadres in");
      return;
    }
    setIsLoading(true);
    const { error } = await resetPassword(email);
    if (error) {
      toast.error("Kon geen reset-email versturen", { description: error.message });
    } else {
      toast.success("Reset-email verstuurd", {
        description: "Controleer je inbox voor de wachtwoord reset link.",
      });
      setIsForgotPassword(false);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo className="scale-150" />
        </div>

        <Card className="rounded-2xl shadow-lg border-0 bg-card">
          <CardHeader className="text-center pb-2">
            <h1 className="text-2xl font-semibold text-foreground">
              {isForgotPassword ? "Wachtwoord herstellen" : "Inloggen"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isForgotPassword
                ? "Vul je e-mailadres in om een reset-link te ontvangen."
                : "Welkom terug bij mijnhuis.nu"}
            </p>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={isForgotPassword ? handleForgotPassword : handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mailadres</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="naam@voorbeeld.nl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 rounded-xl border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {!isForgotPassword && (
                <div className="space-y-2">
                  <Label htmlFor="password">Wachtwoord</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="pl-10 pr-10 rounded-xl border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full rounded-pill py-3 font-medium"
                disabled={isLoading}
              >
                {isLoading
                  ? "Even geduld..."
                  : isForgotPassword
                    ? "Verstuur reset-link"
                    : "Inloggen"}
              </Button>

              <button
                type="button"
                onClick={() => setIsForgotPassword(!isForgotPassword)}
                className="w-full text-sm text-primary hover:underline"
              >
                {isForgotPassword ? "Terug naar inloggen" : "Wachtwoord vergeten?"}
              </button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} mijnhuis.nu — Duurzame woningverbeteringen
        </p>
      </div>
    </div>
  );
};

export default Login;
