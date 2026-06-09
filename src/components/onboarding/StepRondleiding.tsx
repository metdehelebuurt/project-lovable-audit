import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, ExternalLink, Compass, Users, FileText, ClipboardCheck, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Props { onNext: () => void; onPrev: () => void; }

const ALL_SLIDES = [
  { key: "leads", icon: Users, titel: "Leads & klanten", tekst: "Beheer aanvragen en converteer ze met de Kanban-pijplijn en AI koopsignaal-analyse.", to: "/leads", rollen: ["superadmin","partner_admin","backoffice","partner_staff","adviseur"] },
  { key: "schouw", icon: ClipboardCheck, titel: "Schouwen op locatie", tekst: "Gebruik de wizard om woninginformatie compleet vast te leggen met foto's en video.", to: "/schouwen", rollen: ["superadmin","partner_admin","backoffice","partner_staff","adviseur","installateur"] },
  { key: "offertes", icon: FileText, titel: "Offertes & PDF's", tekst: "Stel snel een Offerte samen met centrale productlogica en digitale ondertekening.", to: "/offertes", rollen: ["superadmin","partner_admin","partner_staff","adviseur"] },
  { key: "planning", icon: Calendar, titel: "Planning", tekst: "Plan schouwen en installaties in de gedeelde agenda, met monteur-toewijzing.", to: "/planning", rollen: ["superadmin","partner_admin","backoffice","partner_staff","adviseur","installateur"] },
];

export const StepRondleiding = ({ onNext, onPrev }: Props) => {
  const { profile } = useAuth();
  const slides = useMemo(
    () => ALL_SLIDES.filter(s => !profile || s.rollen.includes(profile.rol)),
    [profile]
  );
  const [idx, setIdx] = useState(0);
  const slide = slides[idx];
  if (!slide) {
    return (
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground">Geen rondleiding beschikbaar voor jouw rol.</p>
        <div className="flex justify-between">
          <Button variant="ghost" onClick={onPrev} className="rounded-pill gap-2"><ArrowLeft className="h-4 w-4" /> Terug</Button>
          <Button onClick={onNext} className="rounded-pill gap-2">Volgende <ArrowRight className="h-4 w-4" /></Button>
        </div>
      </div>
    );
  }
  const Icon = slide.icon;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Compass className="h-5 w-5 text-primary" /> Korte rondleiding
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Ontdek de belangrijkste modules van het platform.</p>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-primary/5 to-transparent p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold">{slide.titel}</h3>
            <p className="text-sm text-muted-foreground mt-1">{slide.tekst}</p>
            <a href={slide.to} target="_blank" rel="noreferrer"
               className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-3">
              Open module <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-center gap-1.5">
        {slides.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)}
            className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-primary" : "w-1.5 bg-muted"}`}
            aria-label={`Slide ${i + 1}`} />
        ))}
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={() => idx === 0 ? onPrev() : setIdx(idx - 1)} className="rounded-pill gap-2">
          <ArrowLeft className="h-4 w-4" /> Terug
        </Button>
        <Button onClick={() => idx < slides.length - 1 ? setIdx(idx + 1) : onNext()} className="rounded-pill gap-2">
          {idx < slides.length - 1 ? "Volgende" : "Klaar met rondleiding"} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default StepRondleiding;