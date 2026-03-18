import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Check, Palette } from "lucide-react";
import { templateSecties, defaultTemplateConfig, type TemplateConfig } from "./templates/templateRegistry";

interface OfferteTemplateBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentConfig: TemplateConfig;
  onSave: (config: TemplateConfig) => void;
}

// Mini thumbnail colors for preview representation
const thumbnailColors: Record<string, string> = {
  "hero-dark": "bg-gray-900",
  "hero-split": "bg-gradient-to-r from-gray-900 to-white",
  "hero-minimal": "bg-white border",
  "hero-gradient": "bg-gradient-to-br from-gray-900 to-primary",
  "hero-photo": "bg-gradient-to-b from-primary/60 to-gray-100",
  "product-list": "bg-white border",
  "product-cards": "bg-accent/30 border",
  "product-grid": "bg-accent/20 border",
  "product-spotlight": "bg-white border-l-4 border-l-primary",
  "price-classic": "bg-gray-50 border",
  "price-modern": "bg-accent/30 border",
  "price-compact": "bg-white border-b-2 border-b-primary",
  "price-detailed": "bg-primary/5 border border-primary/20",
  "energy-cards": "bg-accent/30 border",
  "energy-infographic": "bg-gradient-to-r from-accent/20 to-primary/10 border",
  "energy-minimal": "bg-white border",
  "terms-simple": "bg-white border-t-2 border-t-primary",
  "terms-boxed": "bg-accent/10 border border-dashed",
  "terms-sidebar": "bg-gradient-to-r from-accent/30 to-white border",
};

export default function OfferteTemplateBuilder({ open, onOpenChange, currentConfig, onSave }: OfferteTemplateBuilderProps) {
  const [config, setConfig] = useState<TemplateConfig>(currentConfig || defaultTemplateConfig);

  const handleSelect = (sectieId: string, variantId: string) => {
    setConfig(prev => ({ ...prev, [sectieId]: variantId }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Offerte template kiezen
          </DialogTitle>
          <p className="text-sm text-muted-foreground">Kies per sectie het gewenste design. Alle templates worden in jouw huisstijl weergegeven.</p>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-8">
            {templateSecties.map(sectie => (
              <div key={sectie.id}>
                <h3 className="text-sm font-semibold text-foreground mb-3">{sectie.naam}</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                  {sectie.varianten.map(variant => {
                    const isSelected = config[sectie.id as keyof TemplateConfig] === variant.id;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => handleSelect(sectie.id, variant.id)}
                        className={`relative rounded-xl border-2 p-1 transition-all hover:shadow-md ${
                          isSelected
                            ? "border-primary ring-2 ring-primary/20 shadow-md"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        {/* Mini thumbnail */}
                        <div className={`w-full aspect-[3/2] rounded-lg ${thumbnailColors[variant.id] || "bg-muted"} flex items-center justify-center mb-2`}>
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5">
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                          <div className="space-y-1 px-2 w-full">
                            <div className="h-1 bg-foreground/10 rounded-full w-3/4" />
                            <div className="h-1 bg-foreground/10 rounded-full w-1/2" />
                            <div className="h-1 bg-foreground/10 rounded-full w-2/3" />
                          </div>
                        </div>
                        <p className="text-xs font-medium text-foreground truncate">{variant.naam}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{variant.beschrijving}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {Object.entries(config).map(([key, val]) => (
              <Badge key={key} variant="secondary" className="text-xs">
                {templateSecties.find(s => s.id === key)?.naam}: {templateSecties.find(s => s.id === key)?.varianten.find(v => v.id === val)?.naam}
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-pill">Annuleren</Button>
            <Button onClick={() => { onSave(config); onOpenChange(false); }} className="rounded-pill">Opslaan</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
