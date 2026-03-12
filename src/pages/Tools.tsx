import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Battery, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const tools = [
  {
    title: "Energieadvies",
    description: "Uitgebreide wizard voor het opstellen van een energieadvies op basis van woningsituatie, verbruik en wensen.",
    icon: Zap,
    path: "/tools/energieadvies",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    title: "Thuisbatterij Selector",
    description: "Selecteer de ideale thuisbatterij op basis van zonnepanelen, verbruik, contract en klantvoorkeuren.",
    icon: Battery,
    path: "/tools/thuisbatterij",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
];

const Tools = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Adviestools</h1>
        <p className="text-muted-foreground mt-1">Gebruik deze tools om klanten het beste advies te geven</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map(tool => (
          <Card
            key={tool.path}
            className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => navigate(tool.path)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${tool.bgColor}`}>
                  <tool.icon className={`h-6 w-6 ${tool.color}`} />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{tool.title}</CardTitle>
                  <CardDescription className="mt-1">{tool.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="rounded-pill gap-2 group-hover:text-primary transition-colors">
                Openen <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Tools;
