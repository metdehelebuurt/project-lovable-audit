import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Mail, Settings, ArrowRight } from "lucide-react";

const items = [
  {
    to: "/affiliates/instellingen/mailtemplates",
    titel: "Mailtemplates",
    omschrijving: "Pas de e-mails aan die je naar leads en klanten verstuurt.",
    icon: Mail,
  },
  {
    to: "/affiliates/instellingen/pijplijn",
    titel: "Pijplijn-configuratie",
    omschrijving: "Beheer labels, kleuren en volgorde van de salesfases.",
    icon: Settings,
  },
];

const AffiliateInstellingen = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Instellingen</h1>
        <p className="text-sm text-muted-foreground">Configureer je sales-module.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((i) => (
          <Link key={i.to} to={i.to} className="block group">
            <Card className="p-5 hover:border-primary/60 transition-colors h-full">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <i.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-semibold">{i.titel}</h2>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{i.omschrijving}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AffiliateInstellingen;