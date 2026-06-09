import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { useOnboardingState } from "@/components/onboarding/useOnboardingState";
import StepWelkom from "@/components/onboarding/StepWelkom";
import StepProfiel from "@/components/onboarding/StepProfiel";
import StepEmail from "@/components/onboarding/StepEmail";
import StepHandtekening from "@/components/onboarding/StepHandtekening";
import StepVoorkeuren from "@/components/onboarding/StepVoorkeuren";
import StepOrganisatie from "@/components/onboarding/StepOrganisatie";
import StepBeveiliging from "@/components/onboarding/StepBeveiliging";
import StepKlaar from "@/components/onboarding/StepKlaar";
import StepBetaalmethode from "@/components/onboarding/StepBetaalmethode";
import StepRondleiding from "@/components/onboarding/StepRondleiding";
import StepHuisstijl from "@/components/onboarding/StepHuisstijl";
import StepDoelen from "@/components/onboarding/StepDoelen";
import StepTeam from "@/components/onboarding/StepTeam";
import StepAgenda from "@/components/onboarding/StepAgenda";
import StepNummerreeksen from "@/components/onboarding/StepNummerreeksen";
import StepBetalingsvoorwaarden from "@/components/onboarding/StepBetalingsvoorwaarden";

const Onboarding = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const state = useOnboardingState();
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const steps = useMemo(() => {
    const rol = profile?.rol;
    if (rol === "installateur") {
      return ["welkom", "profiel", "voorkeuren", "agenda", "handtekening", "beveiliging", "rondleiding", "klaar"];
    }
    const base: string[] = ["welkom", "profiel", "voorkeuren"];
    if (state.isAdmin) base.push("organisatie", "huisstijl");
    base.push("doelen");
    if (state.isAdmin) base.push("team");
    base.push("email", "handtekening", "agenda");
    if (state.isAdmin) base.push("nummerreeksen", "betalingsvoorwaarden", "betaalmethode");
    base.push("beveiliging", "rondleiding", "klaar");
    return base;
  }, [state.isAdmin, profile?.rol]);

  if (!profile || state.loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Laden…</div>;
  }

  const next = () => setStep(s => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));
  const pct = Math.round(((step + 1) / steps.length) * 100);
  const current = steps[step];

  const skip = async () => { await state.markOvergeslagen(); navigate("/dashboard"); };
  const finish = async () => {
    setFinishing(true);
    await state.markVoltooid();
    navigate("/dashboard");
  };

  const summaryItems = [
    { label: "Persoonlijke gegevens ingevuld", done: !!state.user.voornaam && !!state.user.achternaam },
    { label: "Profielfoto toegevoegd", done: !!state.user.avatar_url },
    { label: "Voorkeuren opgeslagen", done: true },
    ...(state.isAdmin ? [
      { label: "Organisatie-gegevens ingevuld", done: !!state.partner?.bedrijfsnaam },
      { label: "Huisstijl ingesteld", done: !!state.partner?.logo_url },
    ] : []),
    { label: "Doelen gekozen", done: !!state.user.voorkeuren?.doelen?.modules?.length },
    { label: "E-mailaccount gekoppeld", done: state.hasEmailAccount },
    { label: "E-mailhandtekening ingesteld", done: !!state.user.handtekening_html },
    { label: "Agenda gekoppeld", done: state.agendaGekoppeld },
    { label: "Tweestapsverificatie", done: !!state.user.mfa_enabled },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-background">
      <header className="border-b bg-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />
          <Button variant="ghost" size="sm" onClick={skip} className="rounded-pill text-muted-foreground">Later afmaken</Button>
        </div>
        <div className="max-w-3xl mx-auto px-6 pb-3">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-muted-foreground">Stap {step + 1} van {steps.length}</span>
            <span className="text-xs font-medium">{pct}%</span>
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-card border rounded-2xl shadow-sm p-6 sm:p-8">
          {current === "welkom" && <StepWelkom voornaam={state.user.voornaam} onNext={next} />}
          {current === "profiel" && (
            <StepProfiel user={state.user} userId={profile.id} email={profile.email}
              onSave={state.saveUser} onNext={next} onPrev={prev} />
          )}
          {current === "email" && (
            <StepEmail userId={profile.id} partnerId={profile.partner_id || ""} email={profile.email}
              voornaam={state.user.voornaam} hasEmailAccount={state.hasEmailAccount} onNext={next} onPrev={prev} />
          )}
          {current === "handtekening" && (
            <StepHandtekening userId={profile.id} email={profile.email} user={state.user}
              onNext={next} onPrev={prev} onRefresh={state.refresh} />
          )}
          {current === "voorkeuren" && (
            <StepVoorkeuren user={state.user} onSave={state.saveUser} onNext={next} onPrev={prev} />
          )}
          {current === "organisatie" && state.partner && profile.partner_id && (
            <StepOrganisatie partner={state.partner} partnerId={profile.partner_id}
              onSave={state.savePartner} onNext={next} onPrev={prev} />
          )}
          {current === "huisstijl" && state.partner && profile.partner_id && (
            <StepHuisstijl partner={state.partner} partnerId={profile.partner_id}
              onSave={state.savePartner} onNext={next} onPrev={prev} />
          )}
          {current === "doelen" && (
            <StepDoelen
              initial={state.user.voorkeuren?.doelen || { modules: [], volume: 25 }}
              onSave={async (d) => state.saveUser({ voorkeuren: { ...state.user.voorkeuren, doelen: d } })}
              onNext={next} onPrev={prev} />
          )}
          {current === "team" && profile.partner_id && (
            <StepTeam partnerId={profile.partner_id} onNext={next} onPrev={prev} />
          )}
          {current === "agenda" && (
            <StepAgenda onNext={next} onPrev={prev} />
          )}
          {current === "nummerreeksen" && profile.partner_id && (
            <StepNummerreeksen partnerId={profile.partner_id} onNext={next} onPrev={prev} />
          )}
          {current === "betalingsvoorwaarden" && profile.partner_id && (
            <StepBetalingsvoorwaarden partnerId={profile.partner_id} onNext={next} onPrev={prev} />
          )}
          {current === "betaalmethode" && profile.partner_id && (
            <StepBetaalmethode partnerId={profile.partner_id} onNext={next} onPrev={prev} />
          )}
          {current === "beveiliging" && (
            <StepBeveiliging user={state.user} onSave={state.saveUser} onNext={next} onPrev={prev} />
          )}
          {current === "rondleiding" && (
            <StepRondleiding onNext={next} onPrev={prev} />
          )}
          {current === "klaar" && <StepKlaar items={summaryItems} onFinish={finish} finishing={finishing} />}
        </div>
      </main>
    </div>
  );
};

export default Onboarding;