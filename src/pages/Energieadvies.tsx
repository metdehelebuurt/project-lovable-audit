import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { initialWizardData } from "@/components/energieadvies/types";
import type { WizardData } from "@/components/energieadvies/types";
import { berekenAdviezen, matchProducten } from "@/components/energieadvies/adviesLogic";
import WizardStepWoning from "@/components/energieadvies/WizardStepWoning";
import WizardStepInstallatie from "@/components/energieadvies/WizardStepInstallatie";
import WizardStepVerbruik from "@/components/energieadvies/WizardStepVerbruik";
import WizardStepWensen from "@/components/energieadvies/WizardStepWensen";
import WizardStepResultaat from "@/components/energieadvies/WizardStepResultaat";

const STAPPEN = [
  { label: "Woning", beschrijving: "Woningsituatie" },
  { label: "Installatie", beschrijving: "Huidige installatie" },
  { label: "Verbruik", beschrijving: "Verbruik & contract" },
  { label: "Wensen", beschrijving: "Wensen & budget" },
  { label: "Resultaat", beschrijving: "Advies & producten" },
];

const Energieadvies = () => {
  const { profile } = useAuth();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>({ ...initialWizardData });

  const isAdviseur = ["superadmin", "partner_admin", "partner_staff", "adviseur"].includes(profile?.rol || "");

  const { data: alleProducten = [] } = useQuery({
    queryKey: ["producten-energieadvies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("producten").select("*").eq("status", "actief").order("naam");
      if (error) throw error;
      return data;
    },
  });

  const updateData = (updates: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const adviezen = useMemo(() => berekenAdviezen(data), [data]);
  const productMatches = useMemo(
    () => matchProducten(alleProducten, data, adviezen),
    [alleProducten, data, adviezen]
  );

  const progress = ((step + 1) / STAPPEN.length) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Energieadvies</h1>
          <p className="text-muted-foreground mt-1">Persoonlijk advies op maat in {STAPPEN.length} stappen</p>
        </div>
        {step > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full gap-1"
            onClick={() => { setStep(0); setData({ ...initialWizardData }); }}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Opnieuw
          </Button>
        )}
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between">
          {STAPPEN.map((s, i) => (
            <button
              key={i}
              onClick={() => i <= step && setStep(i)}
              className={`text-xs font-medium transition-colors ${
                i === step ? "text-primary" : i < step ? "text-foreground cursor-pointer" : "text-muted-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Stappen */}
      {step === 0 && <WizardStepWoning data={data} onChange={updateData} />}
      {step === 1 && <WizardStepInstallatie data={data} onChange={updateData} />}
      {step === 2 && <WizardStepVerbruik data={data} onChange={updateData} />}
      {step === 3 && <WizardStepWensen data={data} onChange={updateData} />}
      {step === 4 && <WizardStepResultaat adviezen={adviezen} producten={productMatches} isAdviseur={isAdviseur} />}

      {/* Navigatie */}
      <div className="flex justify-between pt-2">
        <Button
          variant="outline"
          onClick={() => setStep(s => s - 1)}
          disabled={step === 0}
          className="rounded-full gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Vorige
        </Button>
        {step < STAPPEN.length - 1 ? (
          <Button
            onClick={() => setStep(s => s + 1)}
            className="rounded-full gap-1"
          >
            Volgende <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
};

export default Energieadvies;
