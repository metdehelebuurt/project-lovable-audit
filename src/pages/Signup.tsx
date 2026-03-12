import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  const navigate = useNavigate();

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

              <p className="text-center text-sm text-muted-foreground">
                Al een account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-primary hover:underline font-medium"
                >
                  Inloggen
                </button>
              </p>
            </form>
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
