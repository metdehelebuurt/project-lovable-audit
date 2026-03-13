import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Logo from "@/components/Logo";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, User, Building2, Phone } from "lucide-react";

const Signup = () => {
  const [form, setForm] = useState({
    bedrijfsnaam: "",
    voornaam: "",
    achternaam: "",
    email: "",
    telefoon: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/dashboard`,
      });
      if (result?.error) {
        toast.error("Google registratie mislukt", { description: String(result.error) });
      }
    } catch (err: any) {
      toast.error("Google registratie mislukt", { description: err.message });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error("Wachtwoorden komen niet overeen");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Wachtwoord moet minimaal 8 karakters zijn");
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase.functions.invoke("trial-signup", {
      body: {
        bedrijfsnaam: form.bedrijfsnaam,
        voornaam: form.voornaam,
        achternaam: form.achternaam,
        email: form.email,
        telefoon: form.telefoon,
        password: form.password,
      },
    });

    if (error || data?.error) {
      toast.error("Aanmelden mislukt", {
        description: data?.error || error?.message || "Probeer het opnieuw.",
      });
      setIsLoading(false);
      return;
    }

    // Auto-login after signup
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (loginError) {
      toast.success("Account aangemaakt!", {
        description: "Je kunt nu inloggen met je gegevens.",
      });
      navigate("/login");
    } else {
      toast.success("Welkom bij mijnhuis.nu!", {
        description: "Je trial account is aangemaakt.",
      });
      navigate("/dashboard");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-8">
          <Logo className="scale-150" />
        </div>

        <Card className="rounded-2xl shadow-lg border-0 bg-card">
          <CardHeader className="text-center pb-2">
            <h1 className="text-2xl font-semibold text-foreground">
              Gratis proefperiode starten
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              30 dagen gratis — geen creditcard nodig
            </p>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleSignup} className="space-y-4">
              {/* Bedrijfsnaam */}
              <div className="space-y-2">
                <Label htmlFor="bedrijfsnaam">Bedrijfsnaam *</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="bedrijfsnaam"
                    placeholder="Jouw installatiebedrijf"
                    value={form.bedrijfsnaam}
                    onChange={update("bedrijfsnaam")}
                    required
                    className="pl-10 rounded-xl"
                  />
                </div>
              </div>

              {/* Naam row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="voornaam">Voornaam *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="voornaam"
                      placeholder="Jan"
                      value={form.voornaam}
                      onChange={update("voornaam")}
                      required
                      className="pl-10 rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="achternaam">Achternaam *</Label>
                  <Input
                    id="achternaam"
                    placeholder="de Vries"
                    value={form.achternaam}
                    onChange={update("achternaam")}
                    required
                    className="rounded-xl"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">E-mailadres *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="jan@bedrijf.nl"
                    value={form.email}
                    onChange={update("email")}
                    required
                    className="pl-10 rounded-xl"
                  />
                </div>
              </div>

              {/* Telefoon */}
              <div className="space-y-2">
                <Label htmlFor="telefoon">Telefoonnummer</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="telefoon"
                    type="tel"
                    placeholder="06-12345678"
                    value={form.telefoon}
                    onChange={update("telefoon")}
                    className="pl-10 rounded-xl"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Wachtwoord *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimaal 8 karakters"
                    value={form.password}
                    onChange={update("password")}
                    required
                    minLength={8}
                    className="pl-10 pr-10 rounded-xl"
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

              {/* Confirm password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Bevestig wachtwoord *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Herhaal wachtwoord"
                    value={form.confirmPassword}
                    onChange={update("confirmPassword")}
                    required
                    minLength={8}
                    className="pl-10 rounded-xl"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full rounded-pill py-3 font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Account aanmaken..." : "Start gratis proefperiode"}
              </Button>
            </form>

            <div className="flex items-center gap-3 my-4">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">of</span>
              <Separator className="flex-1" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full rounded-pill py-3 gap-3 font-medium"
              onClick={handleGoogleSignUp}
              disabled={isGoogleLoading}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {isGoogleLoading ? "Even geduld..." : "Registreren met Google"}
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Al een account?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-primary hover:underline font-medium"
              >
                Inloggen
              </button>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} mijnhuis.nu — Software voor verduurzamingsprofessionals
        </p>
      </div>
    </div>
  );
};

export default Signup;
